// ==UserScript==
// @name         GitLab 관리자 페이지 스타일 수정
// @namespace    http://tampermonkey.net/
// @version      2026.02095
// @description  GitLab 관리자 페이지 스타일 수정
// @match        *://*gitlab*/admin/users*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20Bot%20%EC%88%A8%EA%B9%80.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20Bot%20%EC%88%A8%EA%B9%80.js
// ==/UserScript==

(function() {
    'use strict';

    const expiryMap = {
        'gitlab.pixelboost.synology.me': 180,
        'gitlab.gggames.synology.me': 90
    };

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

    function highlightRecentActivity() {
        const now = new Date();
        document.querySelectorAll('tr[data-testid="user-row-content"]').forEach(tr => {
            const lastSpan = tr.querySelector('td[data-label="Last activity"] span');
            if (!lastSpan) return;

            const text = lastSpan.textContent.trim();
            if (text === 'Never') return; // Never는 다른 스크립트에서 처리

            const lastDate = new Date(text);
            if (isNaN(lastDate)) return; // 파싱 실패 시 무시

            const s = Math.floor((now - lastDate) / 1000);
            if (s < 60) {
                lastSpan.textContent = 'Just now';
            } else if (s < 3600) {
                lastSpan.textContent = `${Math.floor(s / 60)} minutes ago`
            } else if (s < 86400) {
                lastSpan.textContent = `${Math.floor(s / 3600)} hours ago`
            } else if (s < 604800) {
                lastSpan.textContent = `${Math.floor(s / 86400)} days ago`
            } else if (s < 2592000) {
                lastSpan.textContent = `${Math.floor(s / 604800)} weeks ago`
            } else {
                lastSpan.textContent = `${Math.floor(s / 2592000)} months ago`
            }

            // 1. 만료일 및 D-Day 계산
            const expiryDays = expiryMap[window.location.hostname] || 180;
            const expDate = new Date(lastDate.getTime() + (expiryDays * 24 * 60 * 60 * 1000));
            const dDay = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24)); // 남은 일수

            // 2. 날짜 포맷팅 (YYYY-MM-DD)
            const formattedExpDate = expDate.toISOString().split('T')[0];

            // 3. 툴팁 문구 및 스타일 결정
            let tooltipMsg = `Expiration Date: ${formattedExpDate}`;
            if (dDay > 0) {
                tooltipMsg += ` (D-${dDay})`;
            } else if (dDay === 0) {
                tooltipMsg += ` (D-Day!)`;
            } else {
                tooltipMsg = `⚠️ Expired: ${formattedExpDate} (${Math.abs(dDay)} days ago)`;
            }

            lastSpan.title = tooltipMsg; // 툴팁 적용
            lastSpan.style.cursor = 'help';

            const diffDays = (now - lastDate) / (1000 * 60 * 60 * 24);
            // 1. 색상 결정을 위한 기준점 계산 (상대적 비율)
            const warningThreshold = expiryDays * 0.83; // 약 83% 지점 (180일 중 150일, 90일 중 75일)
            const dangerThreshold = expiryDays * 0.5;   // 50% 지점 (180일 중 90일, 90일 중 45일)

            let color = '';

            if (diffDays > expiryDays) {
                color = 'red'; // 만료됨 (무조건 레드)
            } else if (diffDays > warningThreshold) {
                color = 'orange'; // 만료 임박 (약 1~2개월 남음)
            } else if (diffDays > dangerThreshold) {
                color = 'yellow'; // 주의 (절반 지남)
            } else if (diffDays > 30) {
                color = 'darkgreen'; // 한 달 경과
            } else if (diffDays > 7) {
                color = 'green'; // 일주일 경과
            } else {
                color = 'lime'; // 최근 활동
            }

            // 2. 일괄 스타일 적용
            lastSpan.style.color = color;
            lastSpan.closest('td').style.color = color;
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
    insertCurrentDate();

    // 동적 로딩 대응
    const observer = new MutationObserver(() => {
        hideBotRows();
        highlightZeros();
        highlightNever();
        highlightRecentActivity();
        insertCurrentDate();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();

