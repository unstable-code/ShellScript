// ==UserScript==
// @name        라프텔 줄거리 확장
// @namespace   Violentmonkey Scripts
// @match       *://laftel.net/*
// @grant       none
// @version     2025.09290
// @author      Hyeongmin Kim
// @description 2/1/2025, 10:55:01 PM
// @updateURL   https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%9D%BC%ED%94%84%ED%85%94%20%EC%A4%84%EA%B1%B0%EB%A6%AC%20%ED%99%95%EC%9E%A5.js
// @downloadURL https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%9D%BC%ED%94%84%ED%85%94%20%EC%A4%84%EA%B1%B0%EB%A6%AC%20%ED%99%95%EC%9E%A5.js
// ==/UserScript==

const observer = new MutationObserver(() => {
  document.querySelectorAll('*').forEach(el => {
    const style = getComputedStyle(el);
    if (style.webkitLineClamp !== 'none') {   // 기본값은 'none'
      el.style.setProperty('-webkit-line-clamp', 'unset', 'important');
      el.style.setProperty('display', 'block', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('-webkit-box-orient', 'unset', 'important');
    }
  });

  document.querySelectorAll('.dMMyar').forEach(span => {
    if (span.textContent.includes('방영중') && !span.dataset.colored) {
      span.style.fontWeight = 'bold';
      span.style.color = 'red';
      span.dataset.colored = 'true';
    }
  });
});

observer.observe(document.body, { childList: true, subtree: true });

