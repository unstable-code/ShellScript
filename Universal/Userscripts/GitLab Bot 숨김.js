// ==UserScript==
// @name         GitLab 관리자 페이지 스타일 수정
// @namespace    http://tampermonkey.net/
// @version      2026.02090
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
            // 1. span.badge 또는 .gl-badge 클래스를 가진 요소를 모두 찾습니다.
            const badges = tr.querySelectorAll('span.badge, .gl-badge, .gl-badge-content');

            let isBot = false;
            badges.forEach(badge => {
                // 텍스트에 'Bot'이 포함되어 있는지 확인 (대소문자 구분 없이 검색하면 더 안전함)
                if (badge.textContent.includes('Bot')) {
                    isBot = true;
                }
            });

            if (isBot) {
                tr.style.setProperty('display', 'none', 'important'); // !important 추가로 스타일 우선순위 확보
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
                td.style.color = 'red';
                span.style.color = 'red';
            }
        });
    }

    function highlightRows() {
        document.querySelectorAll('tr[data-testid="user-row-content"]').forEach(tr => {
            const created = tr.querySelector('td[data-label="Created on"] span');
            const last = tr.querySelector('td[data-label="Last activity"] span');

            if (created && last && created.textContent.trim() === last.textContent.trim()) {
                last.style.color = 'purple';
                last.closest('td').style.color = 'purple';
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
            if (diffDays <= 3) {
                lastSpan.style.color = 'lime';
                lastSpan.closest('td').style.color = 'lime';
            } else if (diffDays <= 7) {
                lastSpan.style.color = 'green';
                lastSpan.closest('td').style.color = 'green';
            } else if (diffDays <= 30) {
                lastSpan.style.color = 'darkgreen';
                lastSpan.closest('td').style.color = 'darkgreen';
            } else if (diffDays <= 90) {
                lastSpan.style.color = 'yellow';
                lastSpan.closest('td').style.color = 'yellow';
            } else {
                lastSpan.style.color = 'orange';
                lastSpan.closest('td').style.color = 'orange';
            }
        });
    }

    function insertCurrentDate() {
        const th = document.querySelector('th[aria-label="Settings"] div');
        if (!th) return;

        const now = new Date();
        const formatted = now.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });

        if (th.textContent.trim() === formatted) return;

        th.textContent = formatted;
        th.style.fontWeight = 'bold';
        th.style.textAlign = 'center';
    }

    // 처음 로드 시 실행
    hideBotRows();
    highlightZeros();
    highlightNever();
    highlightRecentActivity();
    highlightRows();
    insertCurrentDate();

    // 동적 로딩 대응
    const observer = new MutationObserver(() => {
        hideBotRows();
        highlightZeros();
        highlightNever();
        highlightRecentActivity();
        highlightRows();
        insertCurrentDate();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();

