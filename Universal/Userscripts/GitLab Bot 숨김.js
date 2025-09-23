// ==UserScript==
// @name         Hide Bot Rows
// @namespace    http://tampermonkey.net/
// @version      2025.09231
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
        // Project count 체크
        document.querySelectorAll('div[data-testid^="user-project-count"]').forEach(div => {
            const value = parseInt(div.textContent.trim());
            if (value === 0) {
                div.style.color = 'red';
            }
        });

        // Group count 체크
        document.querySelectorAll('div[data-testid^="user-group-count"]').forEach(div => {
            let value = div.textContent.trim();
            value = parseInt(value); // span 안 값도 같이 가져옴
            if (value === 0) {
                div.style.color = 'red';
            }
        });
    }


    // 처음 로드 시 실행
    hideBotRows();
    highlightZeros();

    // 동적 로딩 대응
    const observer = new MutationObserver(hideBotRows);
    observer.observe(document.body, { childList: true, subtree: true });
})();

