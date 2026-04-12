/**
 * inapp-detect.js
 *
 * 카카오톡 등 인앱 브라우저 감지 + 외부 브라우저 유도
 *
 * Phase 1 (현재): 'warn' 모드 — 노란 띠 경고만 표시, 학생은 자유 진행
 * Phase 2 (1주일 후 데이터 보고 전환): 'block' 모드 — 외부 브라우저 자동 호출
 *
 * 모드 전환 방법: window.INAPP_MODE = 'block' 으로 변경
 *
 * 관련 문서:
 *   - docs/01-plan/features/vimeo-error-and-inapp-detection.plan.md
 *   - docs/02-design/features/vimeo-error-and-inapp-detection.design.md
 */

(function () {
    'use strict';

    /**
     * 인앱 브라우저 감지
     * @returns {{isInApp:boolean, type:string|null, isKakao:boolean, ua:string}}
     */
    function detectInAppBrowser() {
        var ua = navigator.userAgent;
        var type = null;

        // false positive 방지 (CTO 코드 분석 H-3 반영):
        //  - 네이버 웨일(Whale) 정식 브라우저 제외
        //  - Line 은 버전 숫자 동반하는 패턴만 (AirLine, RedLine 등 오탐 방지)
        //  - Instagram 도 버전 숫자 동반 패턴
        if (/KAKAOTALK/i.test(ua)) type = 'kakao';
        else if (/NAVER\(inapp/i.test(ua) && !/Whale\//i.test(ua)) type = 'naver';
        else if (/\bInstagram\s[\d.]+/i.test(ua)) type = 'instagram';
        else if (/FB_IAB|FBAN|FBAV/i.test(ua)) type = 'facebook';
        else if (/\bLine\/[\d.]+/i.test(ua)) type = 'line';

        return {
            isInApp: type !== null,
            type: type,
            isKakao: type === 'kakao',
            ua: ua
        };
    }

    /**
     * iOS / 안드로이드 / 데스크톱 판별
     */
    function getMobileOS() {
        var ua = navigator.userAgent;
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
        if (/Android/.test(ua)) return 'android';
        return 'desktop';
    }

    /**
     * 인앱 브랜드별 한국어 표시 이름
     */
    function getInAppDisplayName(type) {
        var names = {
            kakao: '카카오톡',
            naver: '네이버 앱',
            instagram: '인스타그램',
            facebook: '페이스북',
            line: '라인'
        };
        return names[type] || '인앱';
    }

    /**
     * Phase 1: 노란 띠 경고 (학생은 그대로 사용 가능)
     * DOM API 사용 — innerHTML 회피로 XSS 방어선 강화 (H-1/H-2)
     */
    function showInAppWarning(detection) {
        if (!detection.isInApp) return;
        if (document.getElementById('inapp-warning-banner')) return;

        var name = getInAppDisplayName(detection.type);

        var banner = document.createElement('div');
        banner.id = 'inapp-warning-banner';
        Object.assign(banner.style, {
            position: 'fixed',
            top: '0',
            left: '0',
            right: '0',
            zIndex: '9999',
            background: '#FEF3C7',
            color: '#78350F',
            padding: '12px 16px',
            fontSize: '14px',
            textAlign: 'center',
            borderBottom: '1px solid #FCD34D',
            fontFamily: "'Pretendard Variable',Pretendard,sans-serif",
            lineHeight: '1.5',
            letterSpacing: '-0.02em'
        });

        var strong = document.createElement('strong');
        strong.textContent = '알림 ';
        banner.appendChild(strong);
        banner.appendChild(document.createTextNode(name + '에서는 영상이 잘 안 나올 수 있어요. '));

        var closeBtn = document.createElement('button');
        closeBtn.textContent = '닫기';
        Object.assign(closeBtn.style, {
            marginLeft: '8px',
            background: 'transparent',
            border: 'none',
            color: '#78350F',
            textDecoration: 'underline',
            cursor: 'pointer',
            fontSize: '14px',
            fontFamily: 'inherit'
        });
        closeBtn.onclick = function () {
            banner.remove();
        };
        banner.appendChild(closeBtn);

        document.body.appendChild(banner);
    }

    /**
     * Phase 2: 차단 모드 — 안드로이드는 intent://, iOS는 안내 오버레이
     *
     * 안전 패턴 (CTO 코드 분석 C-2 반영):
     *   - URL hash(#) 제거 — intent URI 자체가 # 이후를 fragment로 파싱
     *   - S.browser_fallback_url 추가 — Chrome 미설치 안드로이드에서 안전 폴백
     *   - 원본 URL은 fallback에 encodeURIComponent로 보존
     */
    function redirectToExternalBrowser(detection) {
        if (!detection.isInApp) return;

        var os = getMobileOS();
        var currentUrl = window.location.href;

        if (os === 'android') {
            var urlObj;
            try { urlObj = new URL(currentUrl); } catch (e) { return; }
            // intent URI 본체에는 hash 제외 (intent fragment와 충돌)
            var cleanUrl = urlObj.host + urlObj.pathname + urlObj.search;
            // hash까지 보존하려면 fallback url로 (Chrome 미설치 시 폴백)
            var fallback = encodeURIComponent(currentUrl);
            location.href = 'intent://' + cleanUrl
                + '#Intent;scheme=https;package=com.android.chrome'
                + ';S.browser_fallback_url=' + fallback
                + ';end';
            return;
        }

        if (os === 'ios') {
            showIosOverlay(detection);
        }
    }

    /**
     * iOS 안내 오버레이 (확정 카피)
     * DOM API 사용 — innerHTML 회피 (H-1/H-2)
     */
    function showIosOverlay(detection) {
        if (document.getElementById('inapp-ios-overlay')) return;

        var name = getInAppDisplayName(detection.type);

        var overlay = document.createElement('div');
        overlay.id = 'inapp-ios-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: '0', left: '0', right: '0', bottom: '0',
            zIndex: '10000',
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            fontFamily: "'Pretendard Variable',Pretendard,sans-serif"
        });

        var card = document.createElement('div');
        Object.assign(card.style, {
            background: '#fff',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '340px',
            textAlign: 'center',
            letterSpacing: '-0.02em'
        });

        // 제목
        var title = document.createElement('p');
        Object.assign(title.style, {
            fontSize: '20px', fontWeight: '700', color: '#2F2725',
            margin: '0 0 12px 0', lineHeight: '1.4'
        });
        title.appendChild(document.createTextNode(name + '에서는 영상이'));
        title.appendChild(document.createElement('br'));
        title.appendChild(document.createTextNode('잘 안 나와요'));
        card.appendChild(title);

        // 본문
        var body = document.createElement('p');
        Object.assign(body.style, {
            fontSize: '14px', color: '#8B95A1',
            margin: '0 0 20px 0', lineHeight: '1.7'
        });
        var lines = [
            '1) 화면 오른쪽 위에 점 세 개(⋯) 누르기',
            '2) "다른 브라우저로 열기" 누르기',
            '3) Safari로 다시 열어주세요'
        ];
        lines.forEach(function (line, i) {
            body.appendChild(document.createTextNode(line));
            if (i < lines.length - 1) body.appendChild(document.createElement('br'));
        });
        card.appendChild(body);

        // 계속 버튼
        var continueBtn = document.createElement('button');
        continueBtn.textContent = '그래도 계속 보기';
        Object.assign(continueBtn.style, {
            width: '100%', padding: '14px',
            background: '#2F2725', color: '#fff',
            border: 'none', borderRadius: '16px',
            fontSize: '15px', fontWeight: '600',
            cursor: 'pointer', marginBottom: '8px',
            fontFamily: 'inherit'
        });
        continueBtn.onclick = function () {
            overlay.remove();
            try { sessionStorage.setItem('inapp_dismissed', '1'); } catch (e) {}
        };
        card.appendChild(continueBtn);

        // 닫기 버튼
        var closeBtn = document.createElement('button');
        closeBtn.textContent = '닫기';
        Object.assign(closeBtn.style, {
            width: '100%', padding: '10px',
            background: 'transparent', color: '#8B95A1',
            border: 'none', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'inherit'
        });
        closeBtn.onclick = function () { overlay.remove(); };
        card.appendChild(closeBtn);

        overlay.appendChild(card);
        document.body.appendChild(overlay);
    }

    /**
     * 진입점 — 페이지 로드 시 자동 호출
     */
    function initInAppDetect() {
        var detection = detectInAppBrowser();
        if (!detection.isInApp) return;

        var MODE = window.INAPP_MODE || 'warn'; // 'warn' | 'block'

        if (MODE === 'warn') {
            showInAppWarning(detection);
        } else if (MODE === 'block') {
            var dismissed = false;
            try { dismissed = sessionStorage.getItem('inapp_dismissed') === '1'; } catch (e) {}
            if (!dismissed) {
                redirectToExternalBrowser(detection);
            }
        }
    }

    // 전역 노출 (vimeo-custom-player.js 등에서 사용)
    window.detectInAppBrowser = detectInAppBrowser;
    window.getMobileOS = getMobileOS;

    // 자동 초기화
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initInAppDetect);
    } else {
        initInAppDetect();
    }
})();
