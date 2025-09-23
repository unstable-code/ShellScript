// ==UserScript==
// @name         Hide Bot Rows
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  tr 안에 Bot 배지가 있으면 해당 유저 행을 숨김
// @match        *://*gitlab*/admin/users*
// @grant        none
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

    // 처음 로드 시 실행
    hideBotRows();

    // 동적 로딩 대응
    const observer = new MutationObserver(hideBotRows);
    observer.observe(document.body, { childList: true, subtree: true });
})();

