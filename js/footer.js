// Global Footer Component
// Updated to match new design (외주-올라운드)

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
    footer.className = 'bg-white w-full clear-both font-sans';
    footer.style.cssText = 'position: relative; left: 0; right: 0; width: 100vw; margin-left: 0; padding: 37px 0;';

    footer.innerHTML = `
        <div class="w-full">
            <!-- Desktop -->
            <div class="hidden md:block">
                <div class="flex items-start whitespace-nowrap">
                    <div class="flex-shrink-0 text-right" style="width: 21.77vw; padding-right: 3.75vw;">
                        <p class="text-[#3E3A3A] font-bold text-[15px] leading-[15px] tracking-[-0.3px]">올라운드원격학원</p>
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-[#3E3A3A] font-normal text-[14px] leading-[1.55] tracking-[-0.015em]">
                            학원설립·운영등록번호 : 제15256호 온라인원격학원 신고기관명 : 서울특별시 강남교육지원청
                            사업자등록번호 : 560-94-02154
                            통신판매업신고 : 2026-서울강남-00399
                        </p>
                        <p class="text-[#3E3A3A] font-normal text-[14px] leading-[1.55] tracking-[-0.015em]">
                            대표 원장 : 개인정보보호책임자 : 배은영
                            E-mail : contact@allroundedu.co.kr
                            고객센터 : 0507-1339-3828
                            주소 : 서울 강남구 대치동 943-29 3층 3138호
                        </p>
                    </div>
                    <div class="flex-shrink-0 flex items-end gap-5" style="padding-right: 7vw;">
                        <div class="flex items-center text-[#4e4e4e] text-[12px] tracking-[-0.04em]">
                            <a href="terms.html" class="hover:opacity-60 transition-opacity">[이용 약관]</a>
                            <a href="refund.html" class="hover:opacity-60 transition-opacity">[환불 정책]</a>
                            <a href="privacy.html" class="hover:opacity-60 transition-opacity">[개인정보 처리 방침]</a>
                        </div>
                        <div class="flex items-center gap-2">
                            <a href="#" class="block w-[42px] h-[42px] hover:opacity-70 transition-opacity pointer-events-none opacity-40" aria-label="Instagram">
                                <img src="img/insta.png" alt="Instagram" class="w-full h-full object-contain">
                            </a>
                            <a href="https://blog.naver.com/silvy_english" target="_blank" rel="noopener" class="block w-[42px] h-[42px] hover:opacity-70 transition-opacity" aria-label="Blog">
                                <img src="img/blog.png" alt="Blog" class="w-full h-full object-contain">
                            </a>
                            <a href="#" class="block w-[42px] h-[42px] hover:opacity-70 transition-opacity pointer-events-none opacity-40" aria-label="Youtube">
                                <img src="img/youtube.png" alt="Youtube" class="w-full h-full object-contain">
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Mobile -->
            <div class="md:hidden px-4 py-1">
                <div class="flex items-center justify-between">
                    <p class="text-[#3E3A3A] font-bold text-[11px]">올라운드원격학원</p>
                    <div class="flex items-center gap-1.5 text-[#8B95A1] text-[10px]">
                        <a href="terms.html" class="hover:text-[#2F2725]">이용약관</a>
                        <span>|</span>
                        <a href="refund.html" class="hover:text-[#2F2725]">환불정책</a>
                        <span>|</span>
                        <a href="privacy.html" class="hover:text-[#2F2725]">개인정보</a>
                    </div>
                </div>
                <p class="text-[#8B95A1] text-[9px] mt-1 leading-relaxed">사업자등록번호 560-94-02154 | 통신판매업 2026-서울강남-00399 | 대표 배은영 | 고객센터 0507-1339-3828</p>
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
