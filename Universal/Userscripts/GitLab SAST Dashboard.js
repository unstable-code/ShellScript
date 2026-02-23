// ==UserScript==
// @name         GitLab SAST Dashboard (Seamless Native Look)
// @namespace    http://tampermonkey.net/
// @version      2026.02240
// @match        *://gitlab.*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20SAST%20Dashboard.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20SAST%20Dashboard.js
// ==/UserScript==

(function() {
    'use strict';

    let cachedData = null;
    let currentFilter = 'ALL';
    let isVisible = false;

    function parseMarkdown(text) {
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
        
        // 상위 컨테이너 수직 정렬 강제
        const parentFlex = document.querySelector('[data-testid="widget-extension-top-level"]');

        if (!reportsContainer || !summaryWrapper || !actionContainer || !parentFlex) return;

        parentFlex.style.alignItems = 'center'; // 전체 수직 중앙 정렬

        const stats = {
            all: cachedData.vulnerabilities.length,
            high: cachedData.vulnerabilities.filter(v => v.severity === 'High').length,
            medium: cachedData.vulnerabilities.filter(v => v.severity === 'Medium').length
        };

        // 1. 텍스트 얼라인 보정
        if (!summaryWrapper.querySelector('.sast-summary-text')) {
            summaryWrapper.innerHTML = `
                <div class="gl-flex gl-flex-col sast-summary-text" style="justify-content: center; height: 32px;">
                    <div style="font-weight: 600; color: var(--gl-text-color); line-height: 1.1; font-size: 14px;">Security Analysis Report</div>
                    <div style="font-size: 12px; margin-top: 2px; line-height: 1.1; color: var(--gl-text-color-subtle);">
                        Found <span class="sast-high-count" style="color: var(--gl-text-color-danger); font-weight: bold;">${stats.high} high</span>, 
                        <span class="sast-medium-count" style="color: var(--gl-text-color-warning); font-weight: bold;">${stats.medium} medium</span> vulnerabilities
                    </div>
                </div>
            `;
        } else {
            summaryWrapper.querySelector('.sast-high-count').innerText = `${stats.high} high`;
            summaryWrapper.querySelector('.sast-medium-count').innerText = `${stats.medium} medium`;
        }

        // 2. 우측 버튼 얼라인 보정
        if (!document.getElementById('sast-toggle-wrapper')) {
            const btnWrapper = document.createElement('div');
            btnWrapper.id = 'sast-toggle-wrapper';
            // gl-h-6와 align-items-center로 정밀 정렬
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
            btnWrapper.onclick = (e) => {
                isVisible = !isVisible;
                const svg = btnWrapper.querySelector('.sast-chevron');
                svg.style.transform = isVisible ? 'rotate(180deg)' : 'rotate(0deg)';
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
                const accentColor = v.severity === 'High' ? 'var(--gl-text-color-danger)' : 'var(--gl-text-color-warning)';
                item.style = `border: 1px solid var(--gl-border-color-subtle); border-left: 4px solid ${accentColor}; background-color: var(--gl-background-color-default); margin: 0 16px 4px 16px; border-radius: 4px;`;
                item.innerHTML = `
                    <summary style="padding: 6px 12px; cursor: pointer; outline: none; display: flex; align-items: center; list-style: none;">
                        <span class="chevron" style="display:inline-block; width:12px; font-size:10px; transition: transform 0.2s; color:var(--gl-text-color-subtle);">▶</span>
                        <span style="font-weight: 800; color: ${accentColor}; font-size: 10px; margin-right: 10px; width: 45px;">${v.severity.toUpperCase()}</span>
                        <span style="font-size: 13px; color: var(--gl-text-color); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${v.name}</span>
                    </summary>
                    <div style="padding: 10px 12px 12px 34px; border-top: 1px solid var(--gl-border-color-subtle); background: var(--gl-background-color-section);">
                        <div style="font-size: 12px; color: var(--gl-text-color-subtle); line-height: 1.6;">${parseMarkdown(v.description)}</div>
                        <div style="margin-top: 8px; font-size: 11px; color: var(--gl-text-color-secondary); font-family: monospace; border-top: 1px solid var(--gl-border-color-subtle); padding-top: 6px;">
                            <strong>Location:</strong> ${v.location.file}:${v.location.start_line}
                        </div>
                    </div>`;
                listBody.appendChild(item);
            });
        }
    }

    function updateFilters(container, stats) {
        container.innerHTML = '';
        ['ALL', 'High', 'Medium'].forEach(type => {
            const count = type === 'ALL' ? stats.all : stats[type.toLowerCase()];
            const btn = document.createElement('button');
            btn.innerHTML = `${type} <span style="opacity:0.8;">${count}</span>`;
            const activeColor = type === 'High' ? 'var(--gl-text-color-danger)' : (type === 'Medium' ? 'var(--gl-text-color-warning)' : 'var(--gl-text-color-subtle)');
            btn.style = `padding: 2px 10px; border-radius: 4px; border: 1px solid var(--gl-border-color); font-size: 11px; font-weight: 600; cursor: pointer; background: ${currentFilter === type ? activeColor : 'var(--gl-background-color-default)'}; color: ${currentFilter === type ? 'white' : activeColor};`;
            btn.onclick = (e) => { 
                currentFilter = type; 
                const reportsContainer = document.querySelector('[data-testid="reports-widgets-container"]');
                updateFilters(container, stats);
                renderList(reportsContainer, stats);
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

    setInterval(fetchSastData, 2000);
})();
