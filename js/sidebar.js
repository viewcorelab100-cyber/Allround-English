// Global Sidebar Component
// Injects consistent sidebar nav + mobile menu across all pages
// Active page is determined by data-active-page attribute on <body> or <main>

(function() {
    // 온라인 강의 카테고리 목록 (변경 시 여기만 수정)
    const onlineCategories = [
        { label: '정규 강의', href: 'courses.html' },
        { label: '내신 강의', href: 'courses.html?category=내신 강의' },
        { label: '외고·국제고', href: 'courses.html?category=외고·국제고' },
        { label: '과고·영재고', href: 'courses.html?category=과고·영재고' }
    ];

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

    // 사이드바 카테고리 링크 생성
    function buildCategoryLinks(active) {
        return onlineCategories.map(cat => {
            const isActive = active === cat.label;
            const cls = isActive
                ? 'sidebar-link block text-[#2F2725] font-bold text-[18px]'
                : 'sidebar-link block text-[#9FA0A0] text-[18px]';
            return `<a href="${cat.href}" class="${cls}">${cat.label}</a>`;
        }).join('\n');
    }

    // 데스크탑 사이드바 HTML 생성
    function buildDesktopSidebar(activePage) {
        const isAbout = activePage === 'about';
        const isClass = ['firstee', 'original', 'strategy'].includes(activePage);
        const isCourses = activePage === 'courses' || onlineCategories.some(c => c.label === activePage);

        const aboutCls = isAbout
            ? 'sidebar-link block text-[#2F2725] font-bold text-[22px] leading-tight'
            : 'sidebar-link block text-[#9FA0A0] font-semibold text-[22px] leading-tight';

        const classTitleCls = isClass
            ? 'text-[#2F2725] font-bold text-[22px] leading-tight mb-2'
            : 'text-[#9FA0A0] font-semibold text-[22px] leading-tight mb-2';

        const onlineTitleCls = isCourses
            ? 'text-[#2F2725] font-bold text-[22px] leading-tight'
            : 'text-[#2F2725] font-semibold text-[22px] leading-tight';

        const classLinks = classPages.map(p => {
            const isActiveClass = activePage === p.key;
            const cls = isActiveClass
                ? 'sidebar-link block text-[#2F2725] font-bold text-[18px]'
                : 'sidebar-link block text-[#9FA0A0] text-[18px]';
            return `<a href="${p.href}" class="${cls}">${p.label}</a>`;
        }).join('\n');

        const categoryLinks = buildCategoryLinks(isCourses ? activePage : '');

        return `
        <nav class="text-right space-y-5">
            <div>
                <a href="about.html" class="${aboutCls}">학원 소개</a>
            </div>
            <div>
                <p class="${classTitleCls}">수업 안내</p>
                <div class="space-y-1">
                    ${classLinks}
                </div>
            </div>
            <div>
                <div class="flex items-center justify-end gap-2 mb-2">
                    <img src="asset/main/온라인강의 아이콘.png" alt="" class="h-5 w-auto">
                    <span class="${onlineTitleCls}">온라인 강의</span>
                </div>
                <div class="space-y-1">
                    ${categoryLinks}
                </div>
            </div>
            <div>
                <p class="text-[#2F2725] font-semibold text-[22px] leading-tight mb-2">학원 소식</p>
                <div class="space-y-1">
                    <a href="#" class="sidebar-link block text-[#9FA0A0] text-[18px]">Instagram</a>
                    <a href="#" class="sidebar-link block text-[#9FA0A0] text-[18px]">Youtube</a>
                    <a href="#" class="sidebar-link block text-[#9FA0A0] text-[18px]">Blog</a>
                </div>
            </div>
            <div>
                <a href="#" class="sidebar-link block text-[#2F2725] font-semibold text-[22px] leading-tight">상담 예약</a>
            </div>
            <div>
                <a href="#" class="sidebar-link block text-[#2F2725] font-semibold text-[22px] leading-tight">강사 채용</a>
            </div>
        </nav>`;
    }

    // 모바일 메뉴 HTML 생성
    function buildMobileMenu() {
        const catLinks = onlineCategories.map(cat =>
            `<a href="${cat.href}" class="block text-[#9FA0A0] text-sm">${cat.label}</a>`
        ).join('\n');

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
            <div>
                <p class="text-[#2F2725] font-medium text-lg mb-2">온라인 강의</p>
                <div class="pl-4 space-y-2">
                    ${catLinks}
                </div>
            </div>
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
