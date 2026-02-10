// ==UserScript==
// @name           GitHub Short SHA Copier
// @namespace      http://tampermonkey.net/
// @version        2026.02110
// @description    깃허브 복사 버튼 클릭 시 8자리 해시로 변경
// @author         You
// @match          https://github.com/*
// @grant          none
// @updateURL      https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitHub%20Short%20SHA%20Copier.js
// @downloadURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/GitHub%20Short%20SHA%20Copier.js
// ==/UserScript==

(function() {
    'use strict';

    // 브라우저의 기본 클립보드 쓰기 기능을 저장해둡니다.
    const originalWriteText = navigator.clipboard.writeText;

    // 클립보드 쓰기 기능을 가로채서 수정합니다.
    navigator.clipboard.writeText = function(text) {
        // 40자리 해시인지 확인 (정규식)
        if (typeof text === 'string' && text.length === 40 && /^[a-f0-9]{40}$/.test(text)) {
            const shortSha = text.substring(0, 7);
            console.log("Original SHA:", text, "-> Shortened to:", shortSha);
            return originalWriteText.call(navigator.clipboard, shortSha);
        }

        // 해시가 아니면 원래 텍스트 그대로 복사
        return originalWriteText.call(navigator.clipboard, text);
    };
})();
