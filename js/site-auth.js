// 테스트 배포용 사이트 접근 제어
// 주의: 이것은 완벽한 보안이 아닌 테스트용 간단한 보호입니다.
// 실제 프로덕션에서는 서버 사이드 인증을 사용하세요.

(function() {
    'use strict';
    
    // 설정 (실제 배포 시 변경하세요)
    const SITE_PASSWORD = 'AllroundView2025!'; // 테스트 배포용 비밀번호
    const SESSION_KEY = 'allround_site_auth';
    const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24시간
    
    // 인증이 필요없는 페이지 목록
    const PUBLIC_PAGES = [
        'site-login.html',
        '/site-login.html',
        '/site-login'
    ];
    
    // 현재 페이지가 공개 페이지인지 확인
    function isPublicPage() {
        const currentPath = window.location.pathname;
        return PUBLIC_PAGES.some(page => currentPath.endsWith(page));
    }
    
    // 세션 확인
    function checkSession() {
        const sessionData = localStorage.getItem(SESSION_KEY);
        
        if (!sessionData) return false;
        
        try {
            const session = JSON.parse(sessionData);
            const now = Date.now();
            
            // 세션이 유효한지 확인
            if (session.expires && session.expires > now && session.authenticated) {
                return true;
            }
        } catch (e) {
            console.error('Session parse error:', e);
        }
        
        // 유효하지 않은 세션 제거
        localStorage.removeItem(SESSION_KEY);
        return false;
    }
    
    // 세션 생성
    function createSession() {
        const session = {
            authenticated: true,
            timestamp: Date.now(),
            expires: Date.now() + SESSION_DURATION
        };
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    }
    
    // 세션 제거
    function clearSession() {
        localStorage.removeItem(SESSION_KEY);
    }
    
    // 비밀번호 확인
    function verifyPassword(password) {
        return password === SITE_PASSWORD;
    }
    
    // 로그인 페이지로 리다이렉트
    function redirectToLogin() {
        const currentUrl = encodeURIComponent(window.location.href);
        window.location.href = `site-login.html?redirect=${currentUrl}`;
    }
    
    // 페이지 로드 시 인증 확인
    function initAuth() {
        // 공개 페이지면 체크 안 함
        if (isPublicPage()) {
            return;
        }
        
        // 세션 확인
        if (!checkSession()) {
            redirectToLogin();
        }
    }
    
    // 전역 함수로 노출 (로그인 페이지에서 사용)
    window.siteAuth = {
        verify: verifyPassword,
        createSession: createSession,
        clearSession: clearSession,
        checkSession: checkSession
    };
    
    // 페이지 로드 시 실행
    initAuth();
})();

