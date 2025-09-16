// ==UserScript==
// @name         AWS S3 영구 삭제 자동 입력
// @namespace    http://tampermonkey.net/
// @version      2025.09161
// @description  placeholder가 "영구 삭제"이면 value에 자동 입력
// @match        https://*.console.aws.amazon.com/s3/buckets/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/AWS%20S3%20%EC%98%81%EA%B5%AC%EC%82%AD%EC%A0%9C%20%EC%9E%90%EB%8F%99%20%EB%8F%99%EC%9D%98.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/AWS%20S3%20%EC%98%81%EA%B5%AC%EC%82%AD%EC%A0%9C%20%EC%9E%90%EB%8F%99%20%EB%8F%99%EC%9D%98.js
// ==/UserScript==

(function() {
    'use strict';

    // value 설정 + 이벤트 발생 함수
    function setValueAndTrigger(input) {
        if (input.placeholder === "영구 삭제" && input.value !== "영구 삭제") {
            input.value = "영구 삭제";

            // React/SPA에서 인식시키기 위해 이벤트 강제 발생
            input.dispatchEvent(new Event('input', { bubbles: true }));
            input.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    // 페이지 로드 시 이미 존재하는 input 처리
    document.querySelectorAll('input').forEach(setValueAndTrigger);

    // 동적으로 생성되는 input 감지
    const observer = new MutationObserver(mutations => {
        for (const mutation of mutations) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => {
                    if (node.nodeType === Node.ELEMENT_NODE) {
                        // 새로 추가된 input 처리
                        if (node.tagName === 'INPUT') setValueAndTrigger(node);
                        // 하위에 있는 input 처리
                        node.querySelectorAll?.('input').forEach(setValueAndTrigger);
                    }
                });
            }
        }
    });

    observer.observe(document.body, { childList: true, subtree: true });
})();
