// page-shell-menu.js
// menu.js의 순수 JS 버전 (jQuery 불필요)
// 기능 페이지(auth, mypage 등)에서 사용

document.addEventListener('DOMContentLoaded', function () {
  // 모바일 메뉴 열기
  var menuBtn = document.querySelector('.menu-btn');
  if (menuBtn) {
    menuBtn.addEventListener('click', function (e) {
      if (window.innerWidth <= 768) {
        e.preventDefault();
        document.body.classList.add('menu-open');
      }
    });
  }

  // 모바일 메뉴 닫기
  var menuClose = document.querySelector('.menu-close');
  if (menuClose) {
    menuClose.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
    });
  }

  var menuOverlay = document.querySelector('.menu-overlay');
  if (menuOverlay) {
    menuOverlay.addEventListener('click', function () {
      document.body.classList.remove('menu-open');
    });
  }

  // 리사이즈 시 모바일 메뉴 닫기
  window.addEventListener('resize', function () {
    if (window.innerWidth > 768) {
      document.body.classList.remove('menu-open');
    }
  });

  // 아코디언: 현재 페이지에 is-active가 있는 메뉴 그룹 기본 열림
  document.querySelectorAll('.menu-group').forEach(function (group) {
    if (group.querySelector('.is-active')) {
      group.classList.add('is-open');
    }
  });

  // 아코디언: menu-sub가 있는 menu-title 클릭 시 토글
  document.querySelectorAll('.menu-title').forEach(function (title) {
    title.addEventListener('click', function (e) {
      var group = this.closest('.menu-group');
      if (!group) return;
      var sub = group.querySelector('.menu-sub');
      if (!sub) return; // 하위 메뉴 없으면 링크 이동 허용

      var href = this.getAttribute('href');
      if (!href || href === '#') {
        e.preventDefault();
      }

      group.classList.toggle('is-open');
    });
  });
});
