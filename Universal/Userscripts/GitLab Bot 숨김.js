// ==UserScript==
// @name         GitLab 관리자 페이지 스타일 수정
// @namespace    http://tampermonkey.net/
// @version      2025.09236
// @description  GitLab 관리자 페이지 스타일 수정
// @match        *://*gitlab*/admin/users*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20Bot%20%EC%88%A8%EA%B9%80.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20Bot%20%EC%88%A8%EA%B9%80.js
// ==/UserScript==

(function() {
    'use strict';

    function hideBotRows() {
        document.querySelectorAll('tr[data-testid="user-row-content"]').forEach(tr => {
            // tr 내부에 Bot 배지가 있는지 확인
            const botBadge = tr.querySelector('div.gl-p-1 span.badge');
            if (botBadge && botBadge.textContent.trim() === 'Bot') {
                tr.style.display = 'none';
            }
        });
    }

    function highlightZeros() {
        // Project count
        document.querySelectorAll('div[data-testid^="user-project-count"]').forEach(div => {
            const value = parseInt(div.textContent.replace(/\s+/g, ''));
            if (value === 0) {
                div.style.color = 'red';
            }
        });

        // Group count
        document.querySelectorAll('div[data-testid^="user-group-count"]').forEach(div => {
            // span 안 값도 포함
            const value = parseInt(div.textContent.replace(/\s+/g, ''));
            if (value === 0) {
                // div와 span 둘 다 색상 적용
                div.style.color = 'red';
                const span = div.querySelector('span');
                if (span) span.style.color = 'red';
            }
        });
    }

    function highlightNever() {
        // 모든 Last activity td 선택
        document.querySelectorAll('td[data-label="Last activity"]').forEach(td => {
            const span = td.querySelector('span');
            if (span && span.textContent.trim() === 'Never') {
                // td와 span 모두 주황색 적용
                td.style.color = 'orange';
                span.style.color = 'orange';
            }
        });
    }

    function highlightRows() {
        document.querySelectorAll('tr[data-testid="user-row-content"]').forEach(tr => {
            const created = tr.querySelector('td[data-label="Created on"] span');
            const last = tr.querySelector('td[data-label="Last activity"] span');

            if (created && last && created.textContent.trim() === last.textContent.trim()) {
                last.style.color = 'yellow';
                last.closest('td').style.color = 'yellow';
            }
        });
    }

    function highlightRecentActivity() {
        const now = new Date();
        document.querySelectorAll('tr[data-testid="user-row-content"]').forEach(tr => {
            const lastSpan = tr.querySelector('td[data-label="Last activity"] span');
            if (!lastSpan) return;

            const text = lastSpan.textContent.trim();
            if (text === 'Never') return; // Never는 다른 스크립트에서 처리

            const lastDate = new Date(text);
            if (isNaN(lastDate)) return; // 파싱 실패 시 무시

            const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
            if (diffDays <= 7) {
                lastSpan.style.color = 'green';
                lastSpan.closest('td').style.color = 'green';
            }
        });
    }

    // 처음 로드 시 실행
    hideBotRows();
    highlightZeros();
    highlightNever();
    highlightRows();
    highlightRecentActivity();

    // 동적 로딩 대응
    const observer = new MutationObserver(() => {
        hideBotRows();
        highlightZeros();
        highlightNever();
        highlightRows();
        highlightRecentActivity();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();

