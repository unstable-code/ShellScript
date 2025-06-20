// ==UserScript==
// @name        다모앙 검색 필드 (Deprecated)
// @namespace   Violentmonkey Scripts
// @match       *://damoang.net/*
// @grant       none
// @version     2025.06200
// @author      Hyeongmin Kim
// @description 9/19/2024, 8:59:55 PM. This script will not work due to https://damoang.net/notice/18444 changes.
// @updateURL   https://raw.githubusercontent.com/unstable-code/ShellScript/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EA%B2%80%EC%83%89%20%ED%95%84%EB%93%9C.js
// @downloadURL https://raw.githubusercontent.com/unstable-code/ShellScript/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EA%B2%80%EC%83%89%20%ED%95%84%EB%93%9C.js
// ==/UserScript==

function addFilterInput() {
  const sidebar = document.getElementById('sidebar-site-menu');
  if(!sidebar) return false;
  
  var input = document.createElement('input');
  input.type = 'text';
  input.inputMode = 'search';
  input.id = 'filter-input';
  input.placeholder = '게시판/카테고리 검색...';
  input.style.margin = '10px 5px';
  input.style.padding = '4px';
  input.style.width = '200px';
  input.style.borderRadius = "10px";
  input.onkeyup = filterNavLinks;

  sidebar.insertBefore(input, sidebar.firstChild);
}

function filterNavLinks() {
  const sidebarElement = document.getElementById('sidebar-sub-13');
  if(!sidebarElement) return false;

  var input = document.getElementById('filter-input');
  var filter = input.value.toLowerCase().trim();
  var navLinks = document.getElementsByClassName('nav-link');

  if(filter.length > 0 && !sidebarElement.classList.contains('show')) {
    if (sidebarElement) sidebarElement.classList.add('show');
  } else {
    if (sidebarElement) sidebarElement.classList.remove('show');
  }

  for (var i = 0; i < navLinks.length; i++) {
    var link = navLinks[i];
    if(filter.length === 0) {
      link.style.display = '';
      link.style.color = '';
    } else if (link.textContent.toLowerCase().indexOf(filter) > -1) {
      link.style.display = '';
      link.style.color = 'orange';
    } else {
      link.style.display = 'none';
      link.style.color = '';
    }
  }
}

window.onload = function() {
  alert('"다모앙 검색 필드" 이(가) deprecated 되었습니다.')
  addFilterInput();
};
