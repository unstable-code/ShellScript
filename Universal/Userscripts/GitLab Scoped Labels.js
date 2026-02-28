// ==UserScript==
// @name         GitLab Scoped Label Styler (Seamless Native Look)
// @namespace    http://tampermonkey.net/
// @version      2026.02243
// @match        *://gitlab.*/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20Scoped%20Labels.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitLab%20Scoped%20Labels.js
// ==/UserScript==

(function() {
    'use strict';

    function syncLabelStyle() {
        const labelTexts = document.querySelectorAll('.gl-label-text:not([data-styled="true"])');

        // 1. 기준이 될 일반 라벨의 스타일을 미리 파악합니다.
        const referenceLabel = document.querySelector('.gl-label:not([data-qa-label-name*="::"])');
        let refHeight = '22px'; // 기본값
        if (referenceLabel) {
            refHeight = getComputedStyle(referenceLabel).height;
        }

        labelTexts.forEach(label => {
            const text = label.textContent.trim();
            if (!text.includes('::')) return;

            const parts = text.split('::');
            const parent = label.closest('.gl-label');

            // 색상 추출
            let color = label.style.backgroundColor;
            if (!color && parent) {
                color = getComputedStyle(parent).getPropertyValue('--label-background-color').trim();
            }
            if (!color || color === 'rgba(0, 0, 0, 0)') {
                color = getComputedStyle(label).backgroundColor;
            }

            // 2. 부모(.gl-label-text) 스타일 수정
            // 기존 높이를 유지하면서 내부를 flex로 꽉 채웁니다.
            label.style.display = 'inline-flex';
            label.style.alignItems = 'stretch';
            label.style.height = refHeight; // 기준 라벨과 높이 강제 통일
            label.style.padding = '0';
            label.style.backgroundColor = 'transparent';
            label.style.border = 'none';
            label.style.verticalAlign = 'bottom'; // 주변 라벨과의 Baseline 정렬
            label.dataset.styled = 'true';

            // 3. 내부 HTML 구성 (박스 모델 간섭 최소화)
            label.innerHTML = `
                <span style="
                    background-color: ${color};
                    color: #fff;
                    padding: 0 7px;
                    display: flex;
                    align-items: center;
                    border-radius: 12px 0 0 12px;
                    font-size: 12px;
                    line-height: 1;
                ">${parts[0]}</span>
                <span style="
                    background-color: #111;
                    color: #fff;
                    padding: 0 12px 0 6px;
                    display: flex;
                    align-items: center;
                    border-radius: 0 12px 12px 0;
                    font-size: 12px;
                    line-height: 1;
                    box-shadow: inset 0 0 0 1px ${color};
                ">${parts[1]}</span>
            `;
        });
    }

    syncLabelStyle();
    const observer = new MutationObserver(syncLabelStyle);
    observer.observe(document.body, { childList: true, subtree: true });
})();
