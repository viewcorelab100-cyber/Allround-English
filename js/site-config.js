// js/site-config.js
// 공개/공유 페이지 전역 설정 스크립트
//   1) 유튜브 링크: 코드 상수(YOUTUBE_URL) — admin 편집 불가 (INV-8, R-B4.1)
//   2) 강사채용 탭: site_settings(key='recruit') 기반 on/off + 링크 주입 (R-B3.2, R-B3.3, R-T3.2, R-T3.3, R-U2.1)
// INV-6: href/class/target 속성만 변경. 레이아웃/CSS 구조는 절대 건드리지 않는다.
// 15개 라이브 페이지 + js/footer.js 공통 로드. window.supabase(js/supabase-config.js)가 먼저 로드되어 있어야 함.

(function () {
    // INV-8: 유튜브 URL은 코드 상수. DB(site_settings)에서 읽지 않는다.
    var YOUTUBE_URL = 'https://www.youtube.com/@allround_edu';

    // INV-5: http/https 스킴만 허용. javascript: 등 위험 스킴은 차단하고 대상 요소를 비활성 상태로 둔다.
    function isSafeUrl(url) {
        return typeof url === 'string' && /^https?:\/\//i.test(url);
    }

    // [data-youtube-link] 요소(nav span 또는 footer anchor)를 유튜브 링크로 활성화
    function wireYoutubeLinks() {
        var els = document.querySelectorAll('[data-youtube-link]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            if (el.tagName === 'A') {
                el.setAttribute('href', YOUTUBE_URL);
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            } else {
                el.style.cursor = 'pointer';
                el.setAttribute('role', 'link');
                (function (targetUrl) {
                    el.addEventListener('click', function () {
                        window.open(targetUrl, '_blank', 'noopener');
                    });
                })(YOUTUBE_URL);
            }
        }
    }

    // [data-recruit-tab] 요소를 강사채용 링크로 활성화 (enabled && 유효 URL일 때만)
    function applyRecruitState(enabled, url) {
        if (!enabled || !isSafeUrl(url)) {
            // 비활성/무효 → 기존 회색 비활성 상태(menu-title-disabled) 그대로 둠
            return;
        }
        var els = document.querySelectorAll('[data-recruit-tab]');
        for (var i = 0; i < els.length; i++) {
            var el = els[i];
            // 기존 비활성 표시 클래스 제거 (프로젝트 스타일: style.css .menu-title-disabled)
            el.classList.remove('menu-title-disabled', 'text-[#C5C5C5]', 'pointer-events-none');
            el.style.cursor = 'pointer';
            if (el.tagName === 'A') {
                el.setAttribute('href', url);
                el.setAttribute('target', '_blank');
                el.setAttribute('rel', 'noopener noreferrer');
            } else {
                el.setAttribute('role', 'link');
                (function (targetUrl) {
                    el.addEventListener('click', function () {
                        window.open(targetUrl, '_blank', 'noopener');
                    });
                })(url);
            }
        }
    }

    async function wireRecruitTab() {
        try {
            var res = await window.supabase
                .from('site_settings')
                .select('value')
                .eq('key', 'recruit')
                .single();

            if (res.error || !res.data || !res.data.value) {
                console.warn('site-config: recruit 설정을 불러오지 못했습니다. 기본(비활성) 상태를 유지합니다.', res.error);
                return;
            }

            var value = res.data.value;
            applyRecruitState(value.enabled === true, value.url);
        } catch (e) {
            console.warn('site-config: recruit 설정 조회 중 예외가 발생했습니다. 기본(비활성) 상태를 유지합니다.', e);
        }
    }

    function init() {
        wireYoutubeLinks();

        // window.supabase가 아직 초기화되지 않았을 수 있으므로 잠시 재시도
        var attempts = 0;
        (function tryRecruit() {
            if (window.supabase && typeof window.supabase.from === 'function') {
                wireRecruitTab();
            } else if (attempts < 40) {
                attempts++;
                setTimeout(tryRecruit, 50);
            } else {
                console.warn('site-config: window.supabase 초기화 대기 시간 초과. 강사채용 탭은 기본(비활성) 상태를 유지합니다.');
            }
        })();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
