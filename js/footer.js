// Global Footer Component
// This script injects the global footer into the page
// Design: 심플 1줄 푸터 (MAIN.jpg 기준)

/**
 * KB 에스크로 인증마크 팝업 열기
 */
function openKBEscrowPopup() {
    window.open(
        '',
        'KB_AUTHMARK',
        'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no'
    );

    const form = document.querySelector('form[name="KB_AUTHMARK_FORM"]');
    if (form) {
        form.action = 'https://okbfex.kbstar.com/quics';
        form.target = 'KB_AUTHMARK';
        form.submit();
    }
}

function loadGlobalFooter() {
    if (document.getElementById('allround-footer')) return;

    const footer = document.createElement('footer');
    footer.id = 'allround-footer';
    footer.className = 'bg-white w-full clear-both font-sans border-t border-gray-200';
    footer.style.cssText = 'position: relative; left: 0; right: 0; width: 100vw; margin-left: 0;';

    footer.innerHTML = `
        <div class="w-full py-5">
            <!-- Desktop: 2줄 레이아웃 (Figma 좌표 기준) -->
            <div class="hidden md:block">
                <!-- Row 1: 올라운드원격학원 + 사업자정보 1줄 -->
                <div class="flex items-center whitespace-nowrap">
                    <div class="flex-shrink-0 text-right" style="width: 21.77vw; padding-right: 3.75vw;">
                        <p class="text-[#3E3A39] font-bold text-[15px] leading-[15px] tracking-[-0.3px]">올라운드원격학원</p>
                    </div>
                    <p class="text-[#3E3A39] font-light text-[14px] leading-[20px] tracking-[-0.14px]">
                        학원설립·운영등록번호 : 제15256호 올라운드원격학원&nbsp;&nbsp;신고기관명 : 서울특별시 강남교육지원청&nbsp;&nbsp;사업자등록번호 : 560-94-02154&nbsp;&nbsp;통신판매업신고 : 2026-서울강남-00399
                    </p>
                </div>
                <!-- Row 2: 사업자정보 2줄 + 약관링크 + SNS -->
                <div class="flex items-center whitespace-nowrap">
                    <div class="flex-shrink-0" style="width: 21.77vw;"></div>
                    <p class="flex-1 min-w-0 text-[#3E3A39] font-light text-[14px] leading-[20px] tracking-[-0.14px]">
                        대표 원장<span class="font-normal text-[#2F2725]"> · </span>개인정보보호책임자 : 배은영&nbsp;&nbsp;E-mail : contact@allroundedu.co.kr&nbsp;&nbsp;고객센터 : 0507-1339-3823&nbsp;&nbsp;주소 : 서울 강남구 대치동 943-29 3층 3138호
                    </p>
                    <div class="flex-shrink-0 flex items-center gap-4" style="padding-right: 7vw;">
                        <div class="flex items-center gap-3 text-[#3E3A39] font-normal text-[14px] leading-[14px] tracking-[-0.21px]">
                            <a href="terms.html" class="hover:text-[#2F2725] transition-colors">[이용 약관]</a>
                            <a href="refund.html" class="hover:text-[#2F2725] transition-colors">[환불 정책]</a>
                            <a href="privacy.html" class="hover:text-[#2F2725] transition-colors">[개인정보 처리 방침]</a>
                        </div>
                        <div class="flex items-center gap-1.5 ml-2">
                            <a href="#" class="block w-[38px] h-[38px] hover:opacity-70 transition-opacity" aria-label="Instagram">
                                <img src="asset/main/인스타그램.png" alt="Instagram" class="w-full h-full object-contain">
                            </a>
                            <a href="#" class="block w-[38px] h-[38px] hover:opacity-70 transition-opacity" aria-label="Blog">
                                <img src="asset/main/블로그.png" alt="Blog" class="w-full h-full object-contain">
                            </a>
                            <a href="#" class="block w-[38px] h-[38px] hover:opacity-70 transition-opacity" aria-label="Youtube">
                                <img src="asset/main/유투브.png" alt="Youtube" class="w-full h-full object-contain">
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile: 스택 레이아웃 -->
            <div class="md:hidden space-y-3 px-4">
                <p class="text-[#3E3A39] font-bold text-[15px] tracking-[-0.3px]">올라운드원격학원</p>
                <div class="text-[#3E3A39] font-light text-[12px] leading-relaxed space-y-0.5">
                    <p>학원설립·운영등록번호 : 제15256호 올라운드원격학원</p>
                    <p>신고기관명 : 서울특별시 강남교육지원청</p>
                    <p>사업자등록번호 : 560-94-02154 | 통신판매업신고 : 2026-서울강남-00399</p>
                    <p>대표 원장 · 개인정보보호책임자 : 배은영</p>
                    <p>E-mail : contact@allroundedu.co.kr | 고객센터 : 0507-1339-3823</p>
                    <p>주소 : 서울 강남구 대치동 943-29 3층 3138호</p>
                </div>
                <div class="flex items-center justify-between pt-2">
                    <div class="flex items-center gap-2 text-[#3E3A39] text-[11px]">
                        <a href="terms.html" class="hover:text-[#2F2725]">[이용 약관]</a>
                        <a href="refund.html" class="hover:text-[#2F2725]">[환불 정책]</a>
                        <a href="privacy.html" class="hover:text-[#2F2725]">[개인정보 처리 방침]</a>
                    </div>
                    <div class="flex items-center gap-1.5">
                        <a href="#" class="block w-[30px] h-[30px] hover:opacity-70 transition-opacity" aria-label="Instagram">
                            <img src="asset/main/인스타그램.png" alt="Instagram" class="w-full h-full object-contain">
                        </a>
                        <a href="#" class="block w-[30px] h-[30px] hover:opacity-70 transition-opacity" aria-label="Blog">
                            <img src="asset/main/블로그.png" alt="Blog" class="w-full h-full object-contain">
                        </a>
                        <a href="#" class="block w-[30px] h-[30px] hover:opacity-70 transition-opacity" aria-label="Youtube">
                            <img src="asset/main/유투브.png" alt="Youtube" class="w-full h-full object-contain">
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Remove existing footers
    const existingFooters = document.querySelectorAll('footer');
    existingFooters.forEach(f => f.remove());

    document.body.appendChild(footer);

    // KB 에스크로 숨겨진 폼
    if (!document.querySelector('form[name="KB_AUTHMARK_FORM"]')) {
        const escrowForm = document.createElement('form');
        escrowForm.name = 'KB_AUTHMARK_FORM';
        escrowForm.method = 'get';
        escrowForm.style.display = 'none';
        escrowForm.innerHTML = `
            <input type="hidden" name="page" value="C021590">
            <input type="hidden" name="cc" value="b034066:b035526">
            <input type="hidden" name="mHValue" value="b71eeaaa968d2df8a876249cd03bd7e1">
        `;
        document.body.appendChild(escrowForm);
    }

    // Admin page sidebar handling
    const sidebar = document.querySelector('aside.fixed');
    if (sidebar) {
        footer.style.position = 'relative';
        footer.style.marginLeft = '0';
        footer.style.width = '100vw';
        const flexParent = document.querySelector('body > div.flex');
        if (flexParent) {
            document.body.style.display = 'flex';
            document.body.style.flexDirection = 'column';
        }
    }
}

// Auto-load when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGlobalFooter);
} else {
    loadGlobalFooter();
}
