// ==UserScript==
// @name         다모앙 게시글 이미지 뷰어 활성화
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  특정 클래스 내의 이미지를 클릭하면 새 탭에서 원본 이미지를 엽니다.
// @author       unstable-code
// @match        *://damoang.net/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    document.addEventListener('click', function(e) {
        const img = e.target.closest('.se-component.se-image-container img');

        if (img && img.src) {
            e.preventDefault();
            e.stopPropagation();

            window.open(img.src, '_blank');
        }
    }, true);

    const style = document.createElement('style');
    style.innerHTML = '.se-component.se-image-container img { cursor: pointer !important; }';
    document.head.appendChild(style);
})();
