// ==UserScript==
// @name         GitLab SAST Dashboard (Seamless Native Look)
// @namespace    http://tampermonkey.net/
// @version      2026.02280
// @match        *://gitlab.*/*/merge_requests/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20SAST%20Dashboard.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20SAST%20Dashboard.js
// ==/UserScript==

(function() {
    'use strict';

    let cachedData = null;
    let currentFilter = 'ALL';
    let isVisible = false;

    // Severity별 색상 정의
    const SEVERITY_CONFIG = {
        'Critical': { color: '#ae1800', bg: 'rgba(174, 24, 0, 0.1)' },
        'High': { color: 'var(--gl-text-color-danger)', bg: 'rgba(221, 43, 16, 0.1)' },
        'Medium': { color: 'var(--gl-text-color-warning)', bg: 'rgba(191, 103, 0, 0.1)' },
        'Low': { color: 'var(--gl-text-color-info)', bg: 'rgba(16, 126, 221, 0.1)' },
        'ALL': { color: 'var(--gl-text-color-subtle)', bg: 'transparent' }
    };

    function parseMarkdown(text) {
        if (!text) return "";
        return text
            .replace(/```([\s\S]*?)```/g, '<pre style="background:var(--gl-background-color-subtle); color:var(--gl-text-color-subtle); padding:10px; border-radius:4px; margin:8px 0; font-family:monospace; font-size:12px; border: 1px solid var(--gl-border-color-subtle); overflow-x: auto;"><code>$1</code></pre>')
            .replace(/`([^`]+)`/g, '<code style="background:var(--gl-background-color-alpha-dark); color:var(--gl-text-color-danger); padding:1px 4px; border-radius:3px; font-family:monospace; font-size:12px;">$1</code>')
            .replace(/\n/g, '<br>');
    }

    function renderUI() {
        if (!cachedData) return;

        const reportsContainer = document.querySelector('[data-testid="reports-widgets-container"]');
        const summaryWrapper = document.querySelector('[data-testid="widget-extension-top-level-summary"]');
        const actionContainer = document.querySelector('[data-testid="widget-extension-top-level"] .gl-flex');
        const parentFlex = document.querySelector('[data-testid="widget-extension-top-level"]');

        if (!reportsContainer || !summaryWrapper || !actionContainer || !parentFlex) return;

        parentFlex.style.alignItems = 'center';

        const stats = {
            all: cachedData.vulnerabilities.length,
            critical: cachedData.vulnerabilities.filter(v => v.severity === 'Critical').length,
            high: cachedData.vulnerabilities.filter(v => v.severity === 'High').length,
            medium: cachedData.vulnerabilities.filter(v => v.severity === 'Medium').length
        };

        if (!summaryWrapper.querySelector('.sast-summary-text')) {
            summaryWrapper.innerHTML = `
                <div class="gl-flex gl-flex-col sast-summary-text" style="justify-content: center; height: 32px;">
                    <div style="font-weight: 600; color: var(--gl-text-color); line-height: 1.1; font-size: 14px;">Security Analysis Report</div>
                    <div style="font-size: 12px; margin-top: 2px; line-height: 1.1; color: var(--gl-text-color-subtle);">
                        Found <span class="sast-crit-count" style="color: ${SEVERITY_CONFIG.Critical.color}; font-weight: bold;">${stats.critical} crit</span>,
                        <span class="sast-high-count" style="color: ${SEVERITY_CONFIG.High.color}; font-weight: bold;">${stats.high} high</span>,
                        <span class="sast-medium-count" style="color: ${SEVERITY_CONFIG.Medium.color}; font-weight: bold;">${stats.medium} med</span>
                    </div>
                </div>
            `;
        } else {
            summaryWrapper.querySelector('.sast-crit-count').innerText = `${stats.critical} crit`;
            summaryWrapper.querySelector('.sast-high-count').innerText = `${stats.high} high`;
            summaryWrapper.querySelector('.sast-medium-count').innerText = `${stats.medium} med`;
        }

        if (!document.getElementById('sast-toggle-wrapper')) {
            const btnWrapper = document.createElement('div');
            btnWrapper.id = 'sast-toggle-wrapper';
            btnWrapper.className = 'gl-border-l gl-ml-3 gl-h-6 gl-border-l-section gl-pl-3 gl-flex gl-items-center';
            btnWrapper.style.alignSelf = 'center';

            btnWrapper.innerHTML = `
                <button class="btn btn-icon gl-button btn-default btn-sm btn-default-tertiary" type="button" style="height: 24px; width: 24px; padding: 0; display: flex; align-items: center; justify-content: center;">
                    <span class="gl-button-text" style="display: flex;">
                        <svg width="16" height="16" viewBox="0 0 16 16" class="sast-chevron" style="transition: transform 0.2s;">
                            <path d="M4 6L8 10L12 6" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </span>
                </button>
            `;
            btnWrapper.onclick = () => {
                isVisible = !isVisible;
                btnWrapper.querySelector('.sast-chevron').style.transform = isVisible ? 'rotate(180deg)' : 'rotate(0deg)';
                renderList(reportsContainer, stats);
            };
            actionContainer.appendChild(btnWrapper);
        }

        renderList(reportsContainer, stats);
    }

    function renderList(reportsContainer, stats) {
        let wrapper = document.getElementById('custom-sast-results');
        if (!isVisible) {
            if (wrapper) wrapper.style.display = 'none';
            return;
        }

        if (!wrapper) {
            wrapper = document.createElement('div');
            wrapper.id = 'custom-sast-results';
            wrapper.style = `margin: 0; padding: 12px 0; background: var(--gl-background-color-section); border: 1px solid var(--gl-border-color); border-top: none; border-bottom-left-radius: 4px; border-bottom-right-radius: 4px;`;
            reportsContainer.after(wrapper);
        }

        wrapper.style.display = 'block';

        let listBody = wrapper.querySelector('.sast-list-body');
        if (!listBody) {
            const filterContainer = document.createElement('div');
            filterContainer.className = 'sast-filter-container';
            filterContainer.style = "display: flex; gap: 6px; margin-bottom: 12px; padding: 0 16px;";
            wrapper.appendChild(filterContainer);
            updateFilters(filterContainer, stats);

            listBody = document.createElement('div');
            listBody.className = 'sast-list-body';
            wrapper.appendChild(listBody);
        }

        const filterKey = `${currentFilter}-${stats.all}`;
        if (listBody.dataset.filterKey !== filterKey) {
            listBody.dataset.filterKey = filterKey;
            listBody.innerHTML = '';
            const filtered = cachedData.vulnerabilities.filter(v => currentFilter === 'ALL' || v.severity === currentFilter);

            filtered.forEach(v => {
                const item = document.createElement('details');
                item.className = 'custom-sast-item';
                const config = SEVERITY_CONFIG[v.severity] || SEVERITY_CONFIG['Medium'];

                item.style = `border: 1px solid var(--gl-border-color-subtle); border-left: 4px solid ${config.color}; background-color: var(--gl-background-color-default); margin: 0 16px 4px 16px; border-radius: 4px; overflow: hidden;`;
                item.innerHTML = `
                    <summary style="padding: 8px 12px; cursor: pointer; outline: none; display: flex; align-items: center; list-style: none; gap: 10px;">
                        <span class="chevron" style="font-size: 10px; color: var(--gl-text-color-subtle); transition: transform 0.2s;">▶</span>
                        <span style="background-color: ${config.bg}; color: ${config.color}; font-size: 10px; font-weight: bold; padding: 1px 6px; border-radius: 10px; text-transform: uppercase; border: 1px solid ${config.color}44; min-width: 65px; text-align: center;">
                            ${v.severity}
                        </span>
                        <div style="flex: 1; display: flex; flex-direction: column; min-width: 0; gap: 2px;">
                            <div style="font-size: 13px; font-weight: 600; color: var(--gl-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${v.name}
                            </div>
                            <div style="font-size: 11px; color: var(--gl-text-color-subtle); font-family: monospace; opacity: 0.8;">
                                ${v.location.file}:${v.location.start_line}
                            </div>
                        </div>
                    </summary>
                    <div style="padding: 12px 12px 12px 40px; border-top: 1px solid var(--gl-border-color-subtle); background: var(--gl-background-color-section);">
                        <div style="font-size: 12px; color: var(--gl-text-color-subtle); line-height: 1.6;">
                            ${parseMarkdown(v.description)}
                        </div>
                    </div>
                `;
                listBody.appendChild(item);
            });
        }
    }

    function updateFilters(container, stats) {
        container.innerHTML = '';
        ['ALL', 'Critical', 'High', 'Medium'].forEach(type => {
            const count = type === 'ALL' ? stats.all : stats[type.toLowerCase()] || 0;
            const btn = document.createElement('button');
            const config = SEVERITY_CONFIG[type];

            btn.innerHTML = `${type} <span style="opacity:0.8;">${count}</span>`;
            const isActive = currentFilter === type;

            btn.style = `padding: 2px 10px; border-radius: 4px; border: 1px solid var(--gl-border-color); font-size: 11px; font-weight: 600; cursor: pointer; 
                         background: ${isActive ? config.color : 'var(--gl-background-color-default)'}; 
                         color: ${isActive ? 'white' : config.color};`;

            btn.onclick = () => {
                currentFilter = type;
                updateFilters(container, stats);
                renderList(document.querySelector('[data-testid="reports-widgets-container"]'), stats);
            };
            container.appendChild(btn);
        });
    }

    function fetchSastData() {
        const sastLink = document.querySelector('a[href*="file_type=sast"]');
        if (sastLink && !cachedData) {
            fetch(sastLink.href).then(res => res.json()).then(data => {
                cachedData = data;
                renderUI();
            });
        } else if (cachedData) {
            renderUI();
        }
    }

    const style = document.createElement('style');
    style.innerHTML = `.custom-sast-item summary::-webkit-details-marker { display:none; } .custom-sast-item[open] .chevron { transform: rotate(90deg); }`;
    document.head.appendChild(style);

    function initSastDashboard() {
        const reportsContainer = document.querySelector('[data-testid="reports-widgets-container"]');
        const sastLink = document.querySelector('a[href*="file_type=sast"]');

        if (reportsContainer && sastLink && !cachedData) {
            fetch(sastLink.href)
                .then(res => res.json())
                .then(data => {
                    cachedData = data;
                    renderUI();
                    observer.disconnect();
                })
                .catch(err => console.error("SAST Data fetch failed:", err));
        }
    }

    const observer = new MutationObserver((mutations) => {
        initSastDashboard();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    initSastDashboard();
})();

