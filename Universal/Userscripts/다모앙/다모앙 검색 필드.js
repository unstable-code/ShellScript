// ==UserScript==
// @name        다모앙 검색 필드 (Obsolete)
// @namespace   Violentmonkey Scripts
// @match       *://damoang.net/*
// @grant       none
// @version     2025.0710
// @author      Hyeongmin Kim
// @description End of Life: This script will not work due to https://damoang.net/notice/18444 changes.
// ==/UserScript==

function addFilterInput() {
  const sidebar = document.getElementById('sidebar-site-menu');
  return false;
  
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
  return false;

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
  alert('홈페이지 리뉴얼로 인하여 더 이상 지원되지 않는 "다모앙 검색 필드"의 유지보수가 종료되었습니다. 본 스크립트로 인해 사이트가 불안정해질 수 있으므로 가급적 유저스크립트 라이브러리에서 제거해주세요.')
};
