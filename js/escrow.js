/**
 * KB 에스크로 인증마크 기능
 * 통신판매업 인증을 위한 KB 에스크로 팝업 처리
 */

/**
 * KB 에스크로 인증마크 팝업 열기
 */
function openKBEscrowPopup() {
    // 1. 팝업창 열기
    window.open(
        '',
        'KB_AUTHMARK',
        'height=604, width=648, status=yes, toolbar=no, menubar=no, location=no'
    );

    // 2. 폼 전송
    const form = document.querySelector('form[name="KB_AUTHMARK_FORM"]');
    if (form) {
        form.action = 'https://okbfex.kbstar.com/quics';
        form.target = 'KB_AUTHMARK';
        form.submit();
    }
}

