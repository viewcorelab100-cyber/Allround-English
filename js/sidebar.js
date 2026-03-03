// Global Sidebar Component - Shared across all pages
// Active page is determined by data-active-page on <body>

(function() {
    // 수업 안내 목록
    const classPages = [
        { label: 'ALLROUND firstee', href: 'firstee.html', key: 'firstee' },
        { label: 'ALLROUND original', href: 'original.html', key: 'original' },
        { label: 'ALLROUND strategy', href: 'strategy.html', key: 'strategy' }
    ];

    // 현재 활성 페이지 감지
    function getActivePage() {
        const body = document.body;
        const main = document.querySelector('main');
        return (body && body.dataset.activePage) || (main && main.dataset.activePage) || '';
    }

    // 데스크탑 사이드바 HTML 생성
    function buildDesktopSidebar(activePage) {
        const isAbout = activePage === 'about';
        const isClass = ['firstee', 'original', 'strategy'].includes(activePage);
        const isCourses = activePage === 'courses';

        const aboutCls = isAbout
            ? 'sidebar-link block text-[#2F2725] font-bold text-[22px] leading-[22px]'
            : 'sidebar-link block text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]';

        const classTitleCls = isClass
            ? 'text-[#2F2725] font-bold text-[22px] leading-[22px] mb-2'
            : 'text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px] mb-2';

        const onlineTitleCls = isCourses
            ? 'text-[#2F2725] font-bold text-[22px] leading-[22px]'
            : 'text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]';

        const classLinks = classPages.map(p => {
            const isActiveClass = activePage === p.key;
            const cls = isActiveClass
                ? 'sidebar-link block text-[#2F2725] font-bold text-[18px] leading-[40px] tracking-[-0.18px]'
                : 'sidebar-link block text-[#9FA0A0] font-normal text-[18px] leading-[40px] tracking-[-0.18px]';
            return `<a href="${p.href}" class="${cls}">${p.label}</a>`;
        }).join('\n');

        return `
        <nav class="text-right">
            <div>
                <a href="about.html" class="${aboutCls}">학원 소개</a>
            </div>
            <div style="margin-top:39px;">
                <p class="${classTitleCls}">수업 안내</p>
                <div style="margin-top:15px;">
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
                <p class="text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]">학원 소식</p>
                <div style="margin-top:20px;">
                    <a href="#" class="sidebar-link block text-[#9FA0A0] font-normal text-[18px] leading-[40px] tracking-[-0.18px]">Instagram</a>
                    <a href="#" class="sidebar-link block text-[#9FA0A0] font-normal text-[18px] leading-[40px] tracking-[-0.18px]">Youtube</a>
                    <a href="#" class="sidebar-link block text-[#9FA0A0] font-normal text-[18px] leading-[40px] tracking-[-0.18px]">Blog</a>
                </div>
            </div>
            <div style="margin-top:72px;">
                <a href="#" class="sidebar-link block text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]">상담 예약</a>
            </div>
            <div style="margin-top:40px;">
                <a href="#" class="sidebar-link block text-[#2F2725] font-medium text-[22px] leading-[22px] tracking-[-0.22px]">강사 채용</a>
            </div>
        </nav>`;
    }

    // 모바일 메뉴 HTML 생성
    function buildMobileMenu() {
        return `
        <nav class="space-y-6">
            <div><a href="about.html" class="block text-[#2F2725] font-medium text-lg mb-2">학원 소개</a></div>
            <div>
                <p class="text-[#2F2725] font-medium text-lg mb-2">수업 안내</p>
                <div class="pl-4 space-y-2">
                    <a href="firstee.html" class="block text-[#9FA0A0] text-sm">ALLROUND firstee</a>
                    <a href="original.html" class="block text-[#9FA0A0] text-sm">ALLROUND original</a>
                    <a href="strategy.html" class="block text-[#9FA0A0] text-sm">ALLROUND strategy</a>
                </div>
            </div>
            <div><a href="courses.html" class="block text-[#2F2725] font-medium text-lg mb-2">온라인 강의</a></div>
            <div>
                <p class="text-[#2F2725] font-medium text-lg mb-2">학원 소식</p>
                <div class="pl-4 space-y-2">
                    <a href="#" class="block text-[#9FA0A0] text-sm">Instagram</a>
                    <a href="#" class="block text-[#9FA0A0] text-sm">Youtube</a>
                    <a href="#" class="block text-[#9FA0A0] text-sm">Blog</a>
                </div>
            </div>
            <div><a href="#" class="block text-[#2F2725] font-medium text-lg">상담 예약</a></div>
            <div><a href="#" class="block text-[#2F2725] font-medium text-lg">강사 채용</a></div>
        </nav>`;
    }

    // 사이드바 주입
    function injectSidebar() {
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
