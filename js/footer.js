// Global Footer Component v2
// 새 디자인(외주-올라운드) 클래스 기반, page-shell.css와 연동

function openKBEscrowPopup() {
    window.open('', 'KB_AUTHMARK', 'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no');
    var form = document.querySelector('form[name="KB_AUTHMARK_FORM"]');
    if (form) { form.action = 'https://okbfex.kbstar.com/quics'; form.target = 'KB_AUTHMARK'; form.submit(); }
}

function loadGlobalFooter() {
    if (document.getElementById('shell-footer')) return;

    // 기존 footer 제거
    document.querySelectorAll('footer').forEach(function(f) { f.remove(); });

    var footer = document.createElement('footer');
    footer.id = 'shell-footer';
    footer.className = 'shell-footer';

    footer.innerHTML =
        '<div class="shell-footer-inner">' +
        '  <div class="shell-footer-left">' +
        '    <strong>올라운드원격학원</strong>' +
        '  </div>' +
        '  <div class="shell-footer-wrap">' +
        '    <div class="shell-footer-center">' +
        '      <p>' +
        '        학원설립·운영등록번호 : 제15256호 온라인원격학원 ' +
        '        <br class="br-pc-none">신고기관명 : 서울특별시 강남교육지원청' +
        '        <br class="br-pc-none">사업자등록번호 : 560-94-02154' +
        '        <br class="br-pc-none">통신판매업신고 : 2026-서울강남-00399' +
        '      </p>' +
        '      <p>' +
        '        대표 원장 : 개인정보보호책임자 : 배은영' +
        '        <br class="br-pc-none">E-mail : contact@allroundedu.co.kr' +
        '        <br class="br-pc-none">고객센터 : 0507-1339-3828' +
        '        <br class="br-pc-none">주소 : 서울 강남구 대치동 943-29 3층 3138호' +
        '      </p>' +
        '    </div>' +
        '    <div class="shell-footer-right">' +
        '      <div class="shell-footer-links">' +
        '        <a href="terms.html">[이용 약관]</a>' +
        '        <a href="refund.html">[환불 정책]</a>' +
        '        <a href="privacy.html">[개인정보 처리 방침]</a>' +
        '      </div>' +
        '      <div class="shell-footer-sns">' +
        '        <a href="#"><img src="img/insta.png" alt="instagram"></a>' +
        '        <a href="https://blog.naver.com/silvy_english" target="_blank" rel="noopener"><img src="img/blog.png" alt="blog"></a>' +
        '        <a href="#"><img src="img/youtube.png" alt="youtube"></a>' +
        '      </div>' +
        '    </div>' +
        '  </div>' +
        '</div>';

    // br-pc-none 스타일 주입
    if (!document.getElementById('shell-footer-style')) {
        var style = document.createElement('style');
        style.id = 'shell-footer-style';
        style.textContent = 'br.br-pc-none{display:none}@media(max-width:768px){br.br-pc-none{display:block}}';
        document.head.appendChild(style);
    }

    document.body.appendChild(footer);

    // KB 에스크로 폼
    if (!document.querySelector('form[name="KB_AUTHMARK_FORM"]')) {
        var form = document.createElement('form');
        form.name = 'KB_AUTHMARK_FORM';
        form.method = 'get';
        form.style.display = 'none';
        form.innerHTML = '<input type="hidden" name="page" value="C021590"><input type="hidden" name="cc" value="b034066:b035526"><input type="hidden" name="mHValue" value="b71eeaaa968d2df8a876249cd03bd7e1">';
        document.body.appendChild(form);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadGlobalFooter);
} else {
    loadGlobalFooter();
}
