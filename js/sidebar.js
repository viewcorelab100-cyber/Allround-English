// Global Sidebar Component v2
// 새 디자인(외주-올라운드) 클래스 기반, page-shell.css와 연동
// 기능 페이지(auth, mypage 등)에서 사이드바 + 모바일 메뉴 주입

(function() {

    function getActivePage() {
        var body = document.body;
        var main = document.querySelector('main');
        return (body && body.dataset.activePage) || (main && main.dataset.activePage) || '';
    }

    // 사이드바 메뉴 HTML 생성 (데스크탑 + 모바일 공용)
    function buildMenuHTML(activePage) {
        var isClass = ['firstee', 'original', 'strategy'].includes(activePage);
        var isCourses = ['courses', 'online-class', 'course-detail', 'payment', 'payment-success', 'payment-fail'].includes(activePage);

        var classItems = [
            { label: 'ALLROUND firstee', href: 'firstee.html', key: 'firstee' },
            { label: 'ALLROUND original', href: 'original.html', key: 'original' },
            { label: 'ALLROUND strategy', href: 'strategy.html', key: 'strategy' }
        ];

        var classLinks = classItems.map(function(p) {
            var cls = activePage === p.key ? ' style="color:#2f2725;font-weight:600;"' : '';
            return '<a href="' + p.href + '"' + cls + '><span class="font-style">' + p.label + '</span></a>';
        }).join('\n');

        var classOpen = isClass ? ' is-open' : '';
        var onlineActive = isCourses ? ' style="font-weight:700;"' : '';

        return '' +
            '<div class="menu-group">\n' +
            '  <a href="philosophy.html" class="menu-title"' + (activePage === 'philosophy' ? ' style="font-weight:700;"' : '') + '>학원 소개</a>\n' +
            '</div>\n' +
            '<div class="menu-group' + classOpen + '">\n' +
            '  <a href="#" class="menu-title"' + (isClass ? ' style="font-weight:700;"' : '') + '>수업 안내</a>\n' +
            '  <div class="menu-sub">\n' +
            '    ' + classLinks + '\n' +
            '  </div>\n' +
            '</div>\n' +
            '<div class="menu-group">\n' +
            '  <a href="online-class.html" class="menu-title menu-title-icon"' + onlineActive + '>\n' +
            '    <img src="img/icon-video.png" alt="">\n' +
            '    <span>온라인 강의</span>\n' +
            '  </a>\n' +
            '</div>\n' +
            '<div class="menu-group">\n' +
            '  <a href="#" class="menu-title">학원 소식</a>\n' +
            '  <div class="menu-sub">\n' +
            '    <span class="menu-sub-text">Instagram</span>\n' +
            '    <span class="menu-sub-text">Youtube</span>\n' +
            '    <a href="https://blog.naver.com/silvy_english" target="_blank" rel="noopener">Blog</a>\n' +
            '  </div>\n' +
            '</div>\n' +
            '<div class="menu-group">\n' +
            '  <a href="https://pf.kakao.com/_KMbxon" target="_blank" rel="noopener" class="menu-title">상담 예약</a>\n' +
            '  <span class="menu-title menu-title-disabled">강사 채용</span>\n' +
            '</div>';
    }

    // 아코디언 로직 바인딩 (jQuery 없이)
    function bindAccordion() {
        var titles = document.querySelectorAll('.shell-left-bar .menu-title, .shell-left-bar .menu-title-disabled');
        titles.forEach(function(title) {
            if (title.classList.contains('menu-title-disabled')) return;
            title.addEventListener('click', function(e) {
                var group = this.closest('.menu-group');
                if (!group) return;
                var sub = group.querySelector('.menu-sub');
                if (!sub) return;
                var href = this.getAttribute('href');
                if (!href || href === '#') e.preventDefault();
                group.classList.toggle('is-open');
            });
        });
    }

    // 모바일 메뉴 토글 바인딩
    function bindMobileMenu() {
        // 햄버거 버튼 (헤더)
        var menuBtn = document.querySelector('.shell-header-right .menu-btn');
        if (menuBtn) {
            menuBtn.addEventListener('click', function(e) {
                e.preventDefault();
                if (window.innerWidth <= 768) {
                    document.body.classList.add('menu-open');
                }
            });
        }

        // 닫기 버튼 + 오버레이
        var closeBtn = document.querySelector('.shell-menu-close');
        var overlay = document.querySelector('.shell-menu-overlay');

        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                document.body.classList.remove('menu-open');
            });
        }
        if (overlay) {
            overlay.addEventListener('click', function() {
                document.body.classList.remove('menu-open');
            });
        }

        // 리사이즈 시 메뉴 닫기
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768) {
                document.body.classList.remove('menu-open');
            }
        });
    }

    // 사이드바 주입
    function injectSidebar() {
        var activePage = getActivePage();

        // shell-left-bar 내 left-menu에 주입
        var leftMenu = document.querySelector('.shell-left-bar .left-menu');
        if (leftMenu) {
            leftMenu.innerHTML = buildMenuHTML(activePage);
        }

        bindAccordion();
        bindMobileMenu();
    }

    // DOM 준비 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSidebar);
    } else {
        injectSidebar();
    }

})();
