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

        if (/KAKAOTALK/i.test(ua)) type = 'kakao';
        else if (/NAVER\(inapp/i.test(ua)) type = 'naver';
        else if (/Instagram/i.test(ua)) type = 'instagram';
        else if (/FB_IAB|FBAN|FBAV/i.test(ua)) type = 'facebook';
        else if (/Line\//i.test(ua)) type = 'line';

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
     */
    function showInAppWarning(detection) {
        if (!detection.isInApp) return;
        if (document.getElementById('inapp-warning-banner')) return;

        var name = getInAppDisplayName(detection.type);
        var banner = document.createElement('div');
        banner.id = 'inapp-warning-banner';
        banner.innerHTML =
            '<div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#FEF3C7;color:#78350F;padding:12px 16px;font-size:14px;text-align:center;border-bottom:1px solid #FCD34D;font-family:\'Pretendard Variable\',Pretendard,sans-serif;line-height:1.5;">' +
            '<strong>알림</strong> ' + name + '에서는 영상이 잘 안 나올 수 있어요.' +
            ' <button id="inapp-warning-close" style="margin-left:8px;background:transparent;border:none;color:#78350F;text-decoration:underline;cursor:pointer;font-size:14px;font-family:inherit;">닫기</button>' +
            '</div>';
        document.body.appendChild(banner);

        document.getElementById('inapp-warning-close').onclick = function () {
            banner.remove();
        };
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
     */
    function showIosOverlay(detection) {
        if (document.getElementById('inapp-ios-overlay')) return;

        var name = getInAppDisplayName(detection.type);
        var overlay = document.createElement('div');
        overlay.id = 'inapp-ios-overlay';
        overlay.innerHTML =
            '<div style="position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;font-family:\'Pretendard Variable\',Pretendard,sans-serif;">' +
            '<div style="background:#fff;border-radius:20px;padding:24px;max-width:340px;text-align:center;letter-spacing:-0.02em;">' +
            '<p style="font-size:20px;font-weight:700;color:#2F2725;margin:0 0 12px 0;line-height:1.4;">' + name + '에서는 영상이<br/>잘 안 나와요</p>' +
            '<p style="font-size:14px;color:#8B95A1;margin:0 0 20px 0;line-height:1.7;">' +
            '1) 화면 오른쪽 위에 점 세 개(⋯) 누르기<br/>' +
            '2) "다른 브라우저로 열기" 누르기<br/>' +
            '3) Safari로 다시 열어주세요' +
            '</p>' +
            '<button id="inapp-overlay-continue" style="width:100%;padding:14px;background:#2F2725;color:#fff;border:none;border-radius:16px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px;font-family:inherit;">그래도 계속 보기</button>' +
            '<button id="inapp-overlay-close" style="width:100%;padding:10px;background:transparent;color:#8B95A1;border:none;font-size:13px;cursor:pointer;font-family:inherit;">닫기</button>' +
            '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        document.getElementById('inapp-overlay-continue').onclick = function () {
            overlay.remove();
            try { sessionStorage.setItem('inapp_dismissed', '1'); } catch (e) {}
        };
        document.getElementById('inapp-overlay-close').onclick = function () {
            overlay.remove();
        };
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
