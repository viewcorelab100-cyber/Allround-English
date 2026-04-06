$(function () {
      // 모바일 메뉴 토글
      $('.menu-btn').on('click', function (e) {
        if (window.innerWidth <= 768) {
          e.preventDefault();
          $('body').addClass('menu-open');
        }
      });

      $('.menu-close, .menu-overlay').on('click', function () {
        $('body').removeClass('menu-open');
      });

      $(window).on('resize', function () {
        if (window.innerWidth > 768) {
          $('body').removeClass('menu-open');
        }
      });

      // 아코디언: 현재 페이지에 is-active가 있는 메뉴 그룹 기본 열림
      $('.menu-group').each(function () {
        if ($(this).find('.is-active').length > 0) {
          $(this).addClass('is-open');
        }
      });

      // 아코디언: menu-sub가 있는 menu-title 클릭 시 토글
      $('.menu-title').on('click', function (e) {
        var $group = $(this).closest('.menu-group');
        var $sub = $group.find('.menu-sub');
        if ($sub.length === 0) return; // 하위 메뉴 없으면 무시

        // 실제 링크가 있는 경우(href가 #이 아닌 경우) 아코디언만 토글하고 이동은 막지 않음
        var href = $(this).attr('href');
        if (!href || href === '#') {
          e.preventDefault();
        }

        $group.toggleClass('is-open');
      });
    });