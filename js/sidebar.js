// Global Sidebar Component - Shared across all pages
// Active page is determined by data-active-page on <body>

(function() {
    // 수업 안내 목록
    const classPages = [
        { label: 'firstee', href: 'firstee.html', key: 'firstee' },
        { label: 'original', href: 'original.html', key: 'original' },
        { label: 'strategy', href: 'strategy.html', key: 'strategy' }
    ];

    // 현재 활성 페이지 감지
    function getActivePage() {
        const body = document.body;
        const main = document.querySelector('main');
        return (body && body.dataset.activePage) || (main && main.dataset.activePage) || '';
    }

    // 데스크탑 사이드바 HTML 생성
    function buildDesktopSidebar(activePage) {
        const isCourses = ['courses', 'course-detail', 'payment', 'payment-success', 'payment-fail'].includes(activePage);

        // 비활성 스타일: 회색 + 클릭 불가
        const disabledMainCls = 'block text-[#C5C5C5] font-medium text-[22px] leading-[22px] tracking-[-0.22px] pointer-events-none';
        const disabledSubCls = 'block text-[#D5D5D5] font-normal text-[18px] leading-[40px] tracking-[-0.18px] pointer-events-none';

        // 온라인 강의: 활성 스타일
        const onlineTitleCls = isCourses
            ? 'text-[#2F2725] font-bold text-[22px] leading-[22px]'
            : 'text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]';

        const classLinks = classPages.map(p => {
            return `<span class="${disabledSubCls}"><img src="logo.png" alt="ALLROUND" class="inline-block h-[0.8em] w-auto mr-1" style="filter: brightness(0); opacity: 0.3; transform: translateY(-0.1em);"><span style="font-family: 'Libre Bodoni', serif;">${p.label}</span></span>`;
        }).join('\n');

        return `
        <nav class="text-right">
            <div>
                <span class="${disabledMainCls}">학원 소개</span>
            </div>
            <div style="margin-top:39px;">
                <p class="${disabledMainCls} mb-2">수업 안내</p>
                <div class="sidebar-submenu sidebar-submenu-hidden" style="margin-top:15px;">
                    ${classLinks}
                </div>
            </div>
            <div style="margin-top:71px;">
                <a href="courses.html" class="sidebar-link flex items-center justify-end gap-2">
                    <img src="asset/main/온라인강의 아이콘.png" alt="" class="h-5 w-auto">
                    <span class="${onlineTitleCls}">온라인 강의</span>
                </a>
            </div>
            <div style="margin-top:76px;">
                <p class="${disabledMainCls}">학원 소식</p>
            </div>
            <div style="margin-top:72px;">
                <span class="${disabledMainCls}">상담 예약</span>
            </div>
            <div style="margin-top:40px;">
                <span class="${disabledMainCls}">강사 채용</span>
            </div>
        </nav>`;
    }

    // 모바일 메뉴 HTML 생성
    function buildMobileMenu() {
        const disabledCls = 'block text-[#C5C5C5] font-medium text-lg mb-2 pointer-events-none';
        const disabledSubCls = 'block text-[#D5D5D5] text-sm pointer-events-none';
        return `
        <nav class="space-y-6">
            <div><span class="${disabledCls}">학원 소개</span></div>
            <div>
                <p class="${disabledCls}">수업 안내</p>
                <div class="pl-4 space-y-2">
                    <span class="${disabledSubCls}"><img src="logo.png" alt="ALLROUND" class="inline-block h-[0.8em] w-auto mr-1" style="filter: brightness(0); opacity: 0.3; transform: translateY(-0.1em);"><span style="font-family: 'Libre Bodoni', serif;">firstee</span></span>
                    <span class="${disabledSubCls}"><img src="logo.png" alt="ALLROUND" class="inline-block h-[0.8em] w-auto mr-1" style="filter: brightness(0); opacity: 0.3; transform: translateY(-0.1em);"><span style="font-family: 'Libre Bodoni', serif;">original</span></span>
                    <span class="${disabledSubCls}"><img src="logo.png" alt="ALLROUND" class="inline-block h-[0.8em] w-auto mr-1" style="filter: brightness(0); opacity: 0.3; transform: translateY(-0.1em);"><span style="font-family: 'Libre Bodoni', serif;">strategy</span></span>
                </div>
            </div>
            <div><a href="courses.html" class="block text-[#2F2725] font-medium text-lg mb-2">온라인 강의</a></div>
            <div>
                <span class="${disabledCls}">학원 소식</span>
            </div>
            <div><span class="block text-[#C5C5C5] font-medium text-lg pointer-events-none">상담 예약</span></div>
            <div><span class="block text-[#C5C5C5] font-medium text-lg pointer-events-none">강사 채용</span></div>
            <div class="pt-6 mt-6 border-t border-gray-200">
                <div id="mobile-auth-buttons" class="space-y-3">
                    <a href="auth.html" class="block w-full py-3 text-center text-[#2F2725] font-semibold text-[15px] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">Login</a>
                    <a href="auth.html?mode=signup" class="block w-full py-3 text-center bg-[#2F2725] text-white font-semibold text-[15px] rounded-xl hover:bg-[#1a1716] transition-colors">Sign up</a>
                </div>
                <div id="mobile-user-menu" class="hidden space-y-3">
                    <a href="mypage.html" class="block w-full py-3 text-center text-[#2F2725] font-semibold text-[15px] border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">My Page</a>
                    <button onclick="signOut()" class="block w-full py-3 text-center text-[#8B95A1] font-medium text-[15px] hover:text-[#2F2725] transition-colors">Logout</button>
                </div>
            </div>
        </nav>`;
    }

    // 사이드바 호버 스타일 주입
    function injectStyles() {
        if (document.getElementById('sidebar-hover-styles')) return;
        const style = document.createElement('style');
        style.id = 'sidebar-hover-styles';
        style.textContent = `
            .sidebar-submenu {
                overflow: hidden;
                max-height: 200px;
                opacity: 1;
                transition: max-height 0.3s ease, opacity 0.2s ease, margin 0.3s ease;
            }
            .sidebar-submenu-hidden {
                max-height: 0;
                opacity: 0;
                margin-top: 0 !important;
            }
            .sidebar-group:hover .sidebar-submenu-hidden {
                max-height: 200px;
                opacity: 1;
            }
            .sidebar-group-class:hover .sidebar-submenu-hidden {
                margin-top: 15px !important;
            }
            .sidebar-group-news:hover .sidebar-submenu-hidden {
                margin-top: 20px !important;
            }
        `;
        document.head.appendChild(style);
    }

    // 사이드바 주입
    function injectSidebar() {
        injectStyles();
        const activePage = getActivePage();

        // 데스크탑 사이드바
        const aside = document.querySelector('aside nav');
        if (aside) {
            aside.outerHTML = buildDesktopSidebar(activePage);
        }

        // 모바일 메뉴
        const mobileNav = document.querySelector('#mobile-menu .mobile-menu-panel nav');
        if (mobileNav) {
            mobileNav.outerHTML = buildMobileMenu();
        }
    }

    // DOM 준비 후 실행
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', injectSidebar);
    } else {
        injectSidebar();
    }
})();
