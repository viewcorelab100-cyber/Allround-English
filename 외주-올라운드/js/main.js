$(function () {
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
    });