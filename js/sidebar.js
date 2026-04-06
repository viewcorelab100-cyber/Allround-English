// Global Sidebar Component - Shared across all pages
// Updated to match new design (외주-올라운드)
// Active page is determined by data-active-page on <body>

(function() {
    // 현재 활성 페이지 감지
    function getActivePage() {
        const body = document.body;
        const main = document.querySelector('main');
        return (body && body.dataset.activePage) || (main && main.dataset.activePage) || '';
    }

    // 데스크탑 사이드바 HTML 생성
    function buildDesktopSidebar(activePage) {
        const isCourses = ['courses', 'online-class', 'course-detail', 'payment', 'payment-success', 'payment-fail'].includes(activePage);
        const isClass = ['firstee', 'original', 'strategy'].includes(activePage);

        const activeMainCls = 'block text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px] hover:opacity-60 transition-opacity';
        const inactiveMainCls = 'block text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px] hover:opacity-60 transition-opacity';
        const disabledMainCls = 'block text-[#d0d0d0] font-medium text-[22px] leading-[22px] tracking-[-0.22px] pointer-events-none';
        const subActiveCls = 'block text-[#2F2725] font-semibold text-[18px] leading-[18px] tracking-[-0.02em] hover:opacity-60 transition-opacity';
        const subInactiveCls = 'block text-[#9fa0a0] font-normal text-[18px] leading-[18px] tracking-[-0.02em] hover:opacity-60 transition-opacity';
        const disabledSubCls = 'block text-[#d0d0d0] font-normal text-[18px] leading-[18px] tracking-[-0.02em] pointer-events-none';

        const classPages = [
            { label: 'ALLROUND firstee', href: 'firstee.html', key: 'firstee' },
            { label: 'ALLROUND original', href: 'original.html', key: 'original' },
            { label: 'ALLROUND strategy', href: 'strategy.html', key: 'strategy' }
        ];

        const classLinks = classPages.map(p => {
            const cls = activePage === p.key ? subActiveCls : subInactiveCls;
            return `<a href="${p.href}" class="${cls}" style="font-family: 'cabrito-didone-normal', serif;">${p.label}</a>`;
        }).join('\n');

        const classSubmenuOpen = isClass ? '' : ' sidebar-submenu-hidden';

        return `
        <nav class="text-right">
            <div>
                <a href="philosophy.html" class="${activePage === 'philosophy' ? activeMainCls : inactiveMainCls}">학원 소개</a>
            </div>
            <div style="margin-top:39px;" class="sidebar-group sidebar-group-class">
                <p class="${isClass ? activeMainCls : inactiveMainCls}" style="cursor:pointer;" onclick="this.parentElement.classList.toggle('is-open')">수업 안내</p>
                <div class="sidebar-submenu${classSubmenuOpen}" style="margin-top:15px; display:flex; flex-direction:column; gap:25px; align-items:flex-end;">
                    ${classLinks}
                </div>
            </div>
            <div style="margin-top:43px;">
                <a href="online-class.html" class="sidebar-link flex items-center justify-end gap-[7px]">
                    <img src="img/icon-video.png" alt="" class="h-5 w-auto">
                    <span class="${isCourses ? 'text-[#2F2725] font-bold text-[22px] leading-[22px]' : 'text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]'} hover:opacity-60 transition-opacity">온라인 강의</span>
                </a>
            </div>
            <div style="margin-top:43px;" class="sidebar-group sidebar-group-news">
                <p class="${inactiveMainCls}" style="cursor:pointer;" onclick="this.parentElement.classList.toggle('is-open')">학원 소식</p>
                <div class="sidebar-submenu sidebar-submenu-hidden" style="margin-top:15px; display:flex; flex-direction:column; gap:25px; align-items:flex-end;">
                    <span class="${disabledSubCls}">Instagram</span>
                    <span class="${disabledSubCls}">Youtube</span>
                    <a href="https://blog.naver.com/silvy_english" target="_blank" rel="noopener" class="${subInactiveCls}">Blog</a>
                </div>
            </div>
            <div style="margin-top:43px;">
                <a href="https://pf.kakao.com/_KMbxon" target="_blank" rel="noopener" class="${inactiveMainCls}">상담 예약</a>
            </div>
            <div style="margin-top:43px;">
                <span class="${disabledMainCls}">강사 채용</span>
            </div>
        </nav>`;
    }

    // 모바일 메뉴 HTML 생성
    function buildMobileMenu() {
        const menuCls = 'block text-[#2F2725] font-medium text-[24px] leading-[1.2] tracking-[-0.01em]';
        const subCls = 'block text-[#9fa0a0] font-normal text-[18px] leading-[18px] tracking-[-0.02em]';
        const disabledSubCls = 'block text-[#d0d0d0] font-normal text-[18px] leading-[18px] tracking-[-0.02em] pointer-events-none';
        const disabledCls = 'block text-[#d0d0d0] font-medium text-[24px] leading-[1.2] tracking-[-0.01em] pointer-events-none';

        return `
        <nav class="space-y-8">
            <div><a href="philosophy.html" class="${menuCls}">학원 소개</a></div>
            <div>
                <p class="${menuCls}" style="cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">수업 안내</p>
                <div class="mt-4 space-y-3.5 hidden">
                    <a href="firstee.html" class="${subCls}" style="font-family: 'cabrito-didone-normal', serif;">ALLROUND firstee</a>
                    <a href="original.html" class="${subCls}" style="font-family: 'cabrito-didone-normal', serif;">ALLROUND original</a>
                    <a href="strategy.html" class="${subCls}" style="font-family: 'cabrito-didone-normal', serif;">ALLROUND strategy</a>
                </div>
            </div>
            <div>
                <a href="online-class.html" class="${menuCls} flex items-center gap-[7px]">
                    <img src="img/icon-video.png" alt="" class="h-5 w-auto">
                    <span>온라인 강의</span>
                </a>
            </div>
            <div>
                <p class="${menuCls}" style="cursor:pointer;" onclick="this.nextElementSibling.classList.toggle('hidden')">학원 소식</p>
                <div class="mt-4 space-y-3.5 hidden">
                    <span class="${disabledSubCls}">Instagram</span>
                    <span class="${disabledSubCls}">Youtube</span>
                    <a href="https://blog.naver.com/silvy_english" target="_blank" rel="noopener" class="${subCls}">Blog</a>
                </div>
            </div>
            <div><a href="https://pf.kakao.com/_KMbxon" target="_blank" rel="noopener" class="${menuCls}">상담 예약</a></div>
            <div><span class="${disabledCls}">강사 채용</span></div>
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

    // 사이드바 호버/아코디언 스타일 주입
    function injectStyles() {
        if (document.getElementById('sidebar-hover-styles')) return;
        const style = document.createElement('style');
        style.id = 'sidebar-hover-styles';
        style.textContent = `
            .sidebar-submenu {
                overflow: hidden;
                max-height: 300px;
                opacity: 1;
                transition: max-height 0.35s ease, opacity 0.25s ease, margin 0.35s ease;
            }
            .sidebar-submenu-hidden {
                max-height: 0;
                opacity: 0;
                margin-top: 0 !important;
            }
            .sidebar-group:hover .sidebar-submenu-hidden,
            .sidebar-group.is-open .sidebar-submenu-hidden {
                max-height: 300px;
                opacity: 1;
                margin-top: 15px !important;
            }
            .sidebar-group-news:hover .sidebar-submenu-hidden,
            .sidebar-group-news.is-open .sidebar-submenu-hidden {
                margin-top: 15px !important;
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
