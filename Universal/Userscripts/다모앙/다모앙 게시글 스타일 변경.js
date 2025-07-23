// ==UserScript==
// @name        다모앙 게시글 스타일 변경
// @namespace   Violentmonkey Scripts
// @match       *://damoang.net/*
// @grant       none
// @version     2025.07240
// @author      Hyeongmin Kim
// @description 9/13/2024, 3:13:33 PM
// @updateURL   https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EA%B2%8C%EC%8B%9C%EA%B8%80%20%EC%8A%A4%ED%83%80%EC%9D%BC%20%EB%B3%80%EA%B2%BD.js
// @downloadURL https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EA%B2%8C%EC%8B%9C%EA%B8%80%20%EC%8A%A4%ED%83%80%EC%9D%BC%20%EB%B3%80%EA%B2%BD.js
// ==/UserScript==

const schWordElements = document.querySelectorAll('.sch_word');
const userOnlyElements = document.querySelectorAll('em.border.rounded.p-1.me-1');
const uniqueElements = document.querySelectorAll('.sv_name.text-truncate');
const yourPostsElements = document.querySelectorAll('.list-group-item.da-link-block.writter-bg');
const emptyCommentElements = document.querySelectorAll('.btn.btn-basic');
const membersInfo = document.querySelectorAll('.sv_member.sideview.sideview--member.d-flex.align-items-center.gap-1');
const memberLeaveBtn = document.querySelectorAll('.bi.bi-box-arrow-right.fs-3');
const linkBlocks = document.querySelectorAll('.da-link-block');
const reportedlinkBlocks = document.querySelectorAll('.da-link-block.subject-ellipsis');
const reportedcommentBlocks = document.querySelectorAll('.na-convert');
const newElements = document.querySelectorAll('.na-icon.na-new');
const hotElements = document.querySelectorAll('.na-icon.na-hot');

schWordElements.forEach(element => {
  element.style.backgroundColor = 'yellow';
  element.style.color = 'black';
});

newElements.forEach(element => {
    element.style.display = 'none';
});

hotElements.forEach(element => {
    element.style.display = 'none';
});

linkBlocks.forEach(element => {
  if(!element.classList.contains('list-group-item') && !element.classList.contains('fw-normal')) {
    const fwNormalElements = element.querySelectorAll('.fw-normal');
    fwNormalElements.forEach(el => el.style.display = 'none');

    element.title = element.innerText.trim();

    fwNormalElements.forEach(el => el.style.display = '');
  }
});

reportedlinkBlocks.forEach(element => {
  const boldTag = element.querySelector('b');

  if (boldTag && boldTag.textContent.includes("🚨신고 누적")) {
    element.addEventListener('click', (event) => {
      const userConfirmed = confirm("🚨신고 누적된 항목 \"" + element.textContent.trim().replace('🚨신고 누적 ', '') + "\" 을 열람하려고 합니다.\n계속하시겠습니까?");

      if(!userConfirmed) event.preventDefault();
    });
  };
});

reportedcommentBlocks.forEach(element => {
  const boldTag = element.querySelector('b');
  const rawData = element.textContent.trim().replace('🚨신고 누적 ', '');

  if(boldTag && boldTag.textContent.includes("🚨신고 누적")) {
    element.textContent = '[🚨신고 누적된 댓글입니다. 내용을 보시려면 여기를 클릭하세요]';

    element.addEventListener('click', (event) => {
    event.preventDefault();
    alert(rawData);
    });
  }
});

emptyCommentElements.forEach(element => {
  if(element.getAttribute('title') === '공백문자') {
    const buttonElement = element.querySelector('.bi');
    if(buttonElement) buttonElement.textContent = '␣';
  }
});

memberLeaveBtn.forEach(element => {
  const grandparentElement = element.parentElement?.parentElement;

  if (grandparentElement && grandparentElement.classList.contains('col-3')) {
    grandparentElement.remove();
    element.insertAdjacentHTML('afterend', '<br>');
  }
});

uniqueElements.forEach(element => {
  if (element.textContent.trim() === 'SDK') {
    element.style.color = 'orange';
  }
});

yourPostsElements.forEach(listItem => {
  const svNameElement = listItem.querySelector('.sv_name.text-truncate');
  if (svNameElement) svNameElement.textContent = '<< YOU >>';
});

membersInfo.forEach(member => {
  const xpIcon = member.querySelector('.xp-icon');

  if (xpIcon && parseInt(navigator.maxTouchPoints) === 0) {
    if (xpIcon.getAttribute('data-member-level')) {
      const memberLevel = xpIcon.getAttribute('data-member-level');
      member.setAttribute('title', member.getAttribute('title').replace(' 자기소개', '님 Lv.' + memberLevel));
      if(memberLevel < 5) {
        xpIcon.style.display = 'unset';
        xpIcon.style.color = 'red';
        xpIcon.innerHTML = memberLevel;
      } else if(memberLevel < 10) {
        xpIcon.style.display = 'unset';
        xpIcon.style.color = 'orange';
        xpIcon.innerHTML = memberLevel;
      }
    } else if(xpIcon.getAttribute('data-member-level-icon') === 'special') {
      member.setAttribute('title', member.getAttribute('title').replace('자기소개', '광고주님'));
    }
  } else if(xpIcon && parseInt(navigator.maxTouchPoints) > 0) {
    if (xpIcon.getAttribute('data-member-level')) {
      const memberLevel = xpIcon.getAttribute('data-member-level');
      xpIcon.style.display = 'unset';
      xpIcon.style.color = parseInt(memberLevel) < 5 ? 'red' : parseInt(memberLevel) < 10 ? 'orange' : 'green';
      xpIcon.innerHTML = memberLevel;
    }
  }
});

document.querySelectorAll('select#bo_sfl option').forEach(option => {
  if (option.value === 'wr_name,1') {
    option.textContent = '작성자(이름)';
  } else if (option.value === 'wr_name,0') {
    option.textContent = '작성자(ID)';
  }
});
