// ==UserScript==
// @name        다모앙 게시글 스타일 변경
// @namespace   Violentmonkey Scripts
// @match       *://damoang.net/*
// @grant       none
// @version     2025.07210
// @author      Hyeongmin Kim
// @description 9/13/2024, 3:13:33 PM
// @updateURL   https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EA%B2%8C%EC%8B%9C%EA%B8%80%20%EC%8A%A4%ED%83%80%EC%9D%BC%20%EB%B3%80%EA%B2%BD.js
// @downloadURL https://raw.githubusercontent.com/unstable-code/ShellScript/refs/heads/master/Universal/Userscripts/%EB%8B%A4%EB%AA%A8%EC%95%99/%EB%8B%A4%EB%AA%A8%EC%95%99%20%EA%B2%8C%EC%8B%9C%EA%B8%80%20%EC%8A%A4%ED%83%80%EC%9D%BC%20%EB%B3%80%EA%B2%BD.js
// ==/UserScript==

const schWordElements = document.querySelectorAll('.sch_word');
const userOnlyElements = document.querySelectorAll('em.border.rounded.p-1.me-1');
const commentParentElements = document.querySelectorAll('.d-flex.align-items-center.border-top.bg-secondary-subtle.py-1.px-3.small');
const uniqueElements = document.querySelectorAll('.sv_name.text-truncate');
const yourPostsElements = document.querySelectorAll('.list-group-item.da-link-block.writter-bg');
const emptyCommentElements = document.querySelectorAll('.btn.btn-basic');
const membersInfo = document.querySelectorAll('.sv_member.sideview.sideview--member.d-flex.align-items-center.gap-1');
const contentsCount = document.querySelectorAll('.me-auto.order-0.d-none.d-sm-block');
const memberLeaveBtn = document.querySelectorAll('.bi.bi-box-arrow-right.fs-3');
const linkBlocks = document.querySelectorAll('.da-link-block');
const reportedlinkBlocks = document.querySelectorAll('.da-link-block.subject-ellipsis');
const reportedcommentBlocks = document.querySelectorAll('.na-convert');
const newElements = document.querySelectorAll('.na-icon.na-new');
const hotElements = document.querySelectorAll('.na-icon.na-hot');
const disciplines = document.querySelectorAll('.wr-period.text-nowrap.order-5.order-md-2');

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

disciplines.forEach(element => {
  if (element.textContent.trim().startsWith("주의")) {
    element.textContent = "경고";
  }

  if (element.textContent.trim() === "경고") {
    element.style.color = "orange";
  } else if (element.textContent.trim() === "영구") {
    element.style.color = "magenta";
  } else {
    element.style.color = "red";
  }
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
    if(buttonElement) buttonElement.textContent = '빈';
  }
});

memberLeaveBtn.forEach(element => {
  const grandparentElement = element.parentElement?.parentElement;

  if (grandparentElement && grandparentElement.classList.contains('col-3')) {
    grandparentElement.remove();
    element.insertAdjacentHTML('afterend', '<br>');
  }
});

commentParentElements.forEach(element => {
  const target = element.querySelector('.sv_name.text-truncate');
  target.textContent = target.textContent + ' 🎤';
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

contentsCount.forEach(element => {
  const boldElement = element.querySelector('b');

  if (boldElement) {
    let number = rawData = parseFloat(boldElement.innerText.replace(/,/g, ''));

    if (rawData >= 1_000_000_000) {
      boldElement.title = number.toLocaleString(navigator.language);
      number = (number / 1_000_000_000).toFixed(1) + 'b';
    } else if (rawData >= 1_000_000) {
      boldElement.title = number.toLocaleString(navigator.language);
      number = (number / 1_000_000).toFixed(1) + 'm';
    } else if (rawData >= 1000) {
      boldElement.title = number.toLocaleString(navigator.language);
      number = (number / 1000).toFixed(1) + 'k';
    } else {
      number = number.toString();
    }
    boldElement.innerText = number;
  }
});

document.querySelectorAll('[id^="c_"]').forEach(element => {
  const numericValue = parseInt(getComputedStyle(element).marginLeft.match(/[\d]+/)[0] / 16, 10);
  const target = element.querySelector('.d-flex.align-items-center.border-top.bg-body-tertiary.py-1.px-3');

  if (target && numericValue === 1) {
    target.style.setProperty('background-color', 'rgba(255, 0, 0, 0.25)', 'important');
  } else if (target && numericValue === 2) {
    target.style.setProperty('background-color', 'rgba(255, 165, 0, 0.25)', 'important');
  } else if (target && numericValue === 3) {
    target.style.setProperty('background-color', 'rgba(255, 255, 0, 0.25)', 'important');
  } else if (target && numericValue === 4) {
    target.style.setProperty('background-color', 'rgba(0, 128, 0, 0.25)', 'important');
  } else if (target && numericValue === 5) {
    target.style.setProperty('background-color', 'rgba(0, 0, 255, 0.25)', 'important');
  } else if (target && numericValue === 6) {
    target.style.setProperty('background-color', 'rgba(75, 0, 130, 0.25)', 'important');
  } else if (target && numericValue === 7) {
    target.style.setProperty('background-color', 'rgba(238, 130, 238, 0.25)', 'important');
  }
});

document.querySelectorAll('select#bo_sfl option').forEach(option => {
  if (option.value === 'wr_name,1') {
    option.textContent = '작성자(이름)';
  } else if (option.value === 'wr_name,0') {
    option.textContent = '작성자(ID)';
  }
});

document.querySelectorAll('.wr-date').forEach(dateBlock => {
  const fullText = dateBlock.childNodes;

  fullText.forEach(node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim();
      const parts = text.split(' ');
      if (parts.length === 2 && /^\d{4}\.\d{2}\.\d{2}$/.test(parts[0]) && /^\d{2}:\d{2}$/.test(parts[1])) {
        node.textContent = parts[0];
      }
    }
  });
});

