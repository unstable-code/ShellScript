// ==UserScript==
// @name         Hide Bot Rows
// @namespace    http://tampermonkey.net/
// @version      2025.09234
// @description  tr 안에 Bot 배지가 있으면 해당 유저 행을 숨김
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

    // 처음 로드 시 실행
    hideBotRows();
    highlightZeros();
    highlightNever();

    // 동적 로딩 대응
    const observer = new MutationObserver(() => {
        hideBotRows();
        highlightZeros();
        highlightNever();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();

