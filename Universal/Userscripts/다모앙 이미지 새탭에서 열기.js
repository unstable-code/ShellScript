// ==UserScript==
// @name         다모앙 게시글 이미지 뷰어 활성화
// @namespace    http://tampermonkey.net/
// @version      2026.02221
// @description  특정 클래스 내의 이미지를 클릭하면 새 탭에서 원본 이미지를 엽니다.
// @author       unstable-code
// @match        *://damoang.net/*
// @grant        none
// @updateURL    https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EC%9D%B4%EB%AF%B8%EC%A7%80%20%EC%83%88%ED%83%AD%EC%97%90%EC%84%9C%20%EC%97%B4%EA%B8%B0.js
// @downloadURL  https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EC%9D%B4%EB%AF%B8%EC%A7%80%20%EC%83%88%ED%83%AD%EC%97%90%EC%84%9C%20%EC%97%B4%EA%B8%B0.js
// ==/UserScript==

(function() {
    'use strict';

    const targetSelector = '.se-component.se-image-container img, img.img-fluid';

    document.addEventListener('click', function(e) {
        const img = e.target.closest(targetSelector);

        if (img && img.src) {
            e.preventDefault();
            e.stopPropagation();

            window.open(img.src, '_blank');
        }
    }, true);

    const style = document.createElement('style');
    style.innerHTML = `${targetSelector} { cursor: pointer !important; }`;
    document.head.appendChild(style);
})();
