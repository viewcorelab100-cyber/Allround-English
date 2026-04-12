# vimeo-error-and-inapp-detection Design Document

> **Summary**: Vimeo 재생 에러 분류·로깅 + 카카오톡 인앱 차단 + 강제 로그아웃 버그 수정의 코드 레벨 상세 설계
>
> **Project**: Allround-English
> **Author**: CTO (AI)
> **Date**: 2026-04-12
> **Status**: Draft (PM 5개 항목 승인 완료)
> **Planning Doc**: [vimeo-error-and-inapp-detection.plan.md](../../01-plan/features/vimeo-error-and-inapp-detection.plan.md)
> **관련 메모**: `project_student_playback_issue.md` (이서윤 학생 케이스)

---

## 1. Overview

### 1.1 Design Goals

1. Vimeo 재생 에러를 6종으로 분류하고 학생 카피는 4종으로 단순화
2. 카카오톡/네이버/인스타/페이스북/라인 인앱 브라우저 감지 + 외부 브라우저 유도
3. `playback_errors` 테이블에 모든 재생 에러 자동 적재
4. `auth.js`의 device_info 충돌로 인한 강제 로그아웃 버그 제거

### 1.2 Design Principles

- **학생 부담 0**: 학생 화면은 단 4종 메시지만, 모든 기술 정보는 백그라운드 로깅
- **원장님 부담 최소**: 행동 동사 4개("다른 브라우저", "다시 올려", "열어", "안 열려요")만 외우면 끝
- **PM 디버깅 5초**: 학생 이름만 알면 Supabase에서 즉시 원인 확인
- **롤백 가능**: 모든 PR이 단독 revert 가능, DB 변경은 데이터 손실 0
- **점진 적용**: 인앱 차단은 첫 1주일 "노란 띠 경고"만, 1주일 후 차단 모드 전환

---

## 2. Architecture

### 2.1 변경 대상 컴포넌트

```
┌──────────────────────────────────────────────────────────────────┐
│                      클라이언트 진입 흐름                          │
│                                                                    │
│  사용자 → auth.html / course-detail.html / lesson.html           │
│              │                                                     │
│              ▼                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ js/inapp-detect.js  ★ 신규                                  │  │
│  │  - detectInAppBrowser() → KAKAOTALK/NAVER/FB/IG/LINE        │  │
│  │  - showInAppWarning() (Phase 1: 노란 띠)                    │  │
│  │  - redirectToExternalBrowser() (Phase 2: 차단 모드)         │  │
│  └────────────────────────────────────────────────────────────┘  │
│              │                                                     │
│              ▼                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ js/auth.js  ★ 수정 (라인 32-40)                              │  │
│  │  - getDeviceInfo() 에 카톡/네이버/인스타/FB/라인 분기 추가  │  │
│  │  - device_info 충돌로 인한 강제 로그아웃 차단                │  │
│  └────────────────────────────────────────────────────────────┘  │
│              │                                                     │
│              ▼                                                     │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │ js/vimeo-custom-player.js  ★ 수정 (라인 152-156)            │  │
│  │  - error 핸들러 분기 → ERROR_MAP[error.name]                │  │
│  │  - showError(copy) ← 학생용 4종 카피                        │  │
│  │  - logPlaybackError() → playback_errors 테이블 insert       │  │
│  └────────────────────────────────────────────────────────────┘  │
│              │                                                     │
└──────────────┼─────────────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                       Supabase                                     │
│                                                                    │
│  ★ 신규 테이블: playback_errors                                    │
│    - user_id, lesson_id, course_id                                │
│    - error_name, error_message, error_method                      │
│    - ua, is_kakao_inapp, is_inapp, page_url                       │
│    - occurred_at                                                  │
│  ★ RLS: 본인 + admin만 조회, 본인만 insert                        │
└──────────────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow (변경 후)

```
[학생이 영상 재생 시도]
  │
  ▼
[inapp-detect.js: 인앱 감지?]
  │
  ├─ YES (카톡/네이버/IG/FB/라인)
  │    └─ Phase 1 (첫 1주일): 노란 띠 경고만 표시 (계속 재생 가능)
  │    └─ Phase 2 (이후): 안내 오버레이 + 외부 브라우저 유도 + "그래도 계속 보기"
  │
  └─ NO
       └─ Vimeo 플레이어 정상 진행
            │
            ▼
       [Vimeo 'error' 이벤트 발생?]
           │
           ├─ YES
           │    ├─ ERROR_MAP[error.name] 으로 카피·로그 분류
           │    ├─ showError(copy) → 학생 화면에 4종 중 하나 표시
           │    └─ logPlaybackError() → Supabase insert (백그라운드)
           │
           └─ NO → 정상 재생
```

---

## 3. Data Model

### 3.1 신규 테이블: `playback_errors`

```sql
-- ============================================================
-- Migration: create-playback-errors-table.sql
-- Purpose: Vimeo 재생 에러 자동 로깅
-- ============================================================

CREATE TABLE IF NOT EXISTS public.playback_errors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id       UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    course_id       UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    -- 에러 분류
    error_name      TEXT NOT NULL,        -- PrivacyError, PasswordError, NotFoundError, NotPlayableError, UnsupportedError, RangeError, TypeError, Unknown
    error_message   TEXT,                  -- Vimeo 원본 메시지
    error_method    TEXT,                  -- Vimeo SDK 호출 메서드 (있을 때)
    -- 환경 정보
    ua              TEXT NOT NULL,         -- navigator.userAgent
    is_kakao_inapp  BOOLEAN DEFAULT false,
    is_inapp        BOOLEAN DEFAULT false, -- 카톡 외 인앱 포함
    inapp_type      TEXT,                  -- 'kakao' | 'naver' | 'instagram' | 'facebook' | 'line' | null
    page_url        TEXT,                  -- 발생 페이지 URL
    -- 메타
    occurred_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 조회 성능 인덱스
CREATE INDEX idx_playback_errors_user_id ON public.playback_errors(user_id);
CREATE INDEX idx_playback_errors_occurred_at ON public.playback_errors(occurred_at DESC);
CREATE INDEX idx_playback_errors_error_name ON public.playback_errors(error_name);
CREATE INDEX idx_playback_errors_lesson_id ON public.playback_errors(lesson_id) WHERE lesson_id IS NOT NULL;

-- RLS 활성화
ALTER TABLE public.playback_errors ENABLE ROW LEVEL SECURITY;

-- 정책 1: 본인은 자기 에러만 조회 가능
CREATE POLICY "playback_errors_select_own"
    ON public.playback_errors
    FOR SELECT
    USING (auth.uid() = user_id);

-- 정책 2: 관리자는 모든 에러 조회 가능
CREATE POLICY "playback_errors_select_admin"
    ON public.playback_errors
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- 정책 3: 본인만 insert (자기 에러를 자기 계정으로)
CREATE POLICY "playback_errors_insert_own"
    ON public.playback_errors
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- 정책 4: 비로그인 사용자도 insert 가능 (user_id NULL)
CREATE POLICY "playback_errors_insert_anon"
    ON public.playback_errors
    FOR INSERT
    WITH CHECK (auth.uid() IS NULL AND user_id IS NULL);
```

**설계 결정 사항**:
- `lesson_id`/`course_id`는 NULL 허용 (강의 진입 전 에러도 적재 가능)
- `user_id` NULL 허용 (비로그인 상태 에러도 적재)
- `inapp_type` 분리: 카톡 외 인앱별 분포 측정 가능
- `occurred_at DESC` 인덱스: 최신 에러 조회 빈번 예상

---

## 4. 상세 설계 — Work A: auth.js 카톡 식별자

### 4.1 변경 위치

**파일**: `js/auth.js`
**함수**: `getDeviceInfo()` (line 13~43)

### 4.2 현재 코드 (line 32-40)

```js
// 브라우저 감지
if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
    browser = 'Chrome';
} else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
} else if (/Firefox/.test(ua)) {
    browser = 'Firefox';
} else if (/Edge|Edg/.test(ua)) {
    browser = 'Edge';
}
```

### 4.3 변경 코드

```js
// 브라우저 감지 (인앱 브라우저 우선 — Chrome/Safari 검사보다 먼저)
if (/KAKAOTALK/i.test(ua)) {
    browser = 'KakaoTalk 인앱';
} else if (/NAVER\(inapp/i.test(ua)) {
    browser = 'Naver 인앱';
} else if (/Instagram/i.test(ua)) {
    browser = 'Instagram 인앱';
} else if (/FB_IAB|FBAN|FBAV/i.test(ua)) {
    browser = 'Facebook 인앱';
} else if (/Line\//i.test(ua)) {
    browser = 'Line 인앱';
} else if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
    browser = 'Chrome';
} else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
} else if (/Firefox/.test(ua)) {
    browser = 'Firefox';
} else if (/Edge|Edg/.test(ua)) {
    browser = 'Edge';
}
```

### 4.4 영향 범위

- `saveSessionId()` (line 46) 의 `currentDeviceInfo` 값이 변경됨
- `activeSessions.filter()` (line 74-76) 의 중복 제거 로직이 카톡 인앱과 진짜 Chrome을 별도 device로 인식
- 기존 DB의 `profiles.active_sessions` 데이터는 영향받지 않음 (문자열 단순 변경)

### 4.5 테스트 시나리오

| 환경 | 기존 device_info | 변경 후 device_info |
|---|---|---|
| 안드로이드 카톡 인앱 | Android (Chrome) | Android (KakaoTalk 인앱) |
| 안드로이드 진짜 Chrome | Android (Chrome) | Android (Chrome) |
| iPhone 카톡 인앱 | iPhone (Safari) | iPhone (KakaoTalk 인앱) |
| iPhone 진짜 Safari | iPhone (Safari) | iPhone (Safari) |

→ 카톡 인앱과 외부 브라우저가 별도 슬롯을 차지. 강제 로그아웃 발생 안 함.

---

## 5. 상세 설계 — Work B: js/inapp-detect.js (신규)

### 5.1 신규 파일 구조

**파일**: `js/inapp-detect.js` (신규)

### 5.2 핵심 함수

```js
/**
 * 인앱 브라우저 감지 결과
 * @returns {Object} { isInApp, type, isKakao, ua }
 */
function detectInAppBrowser() {
    const ua = navigator.userAgent;
    let type = null;

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
 * iOS / 안드로이드 판별
 */
function getMobileOS() {
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
}

/**
 * Phase 1 (첫 1주일): 노란 띠 경고 표시
 */
function showInAppWarning(detection) {
    if (!detection.isInApp) return;

    const banner = document.createElement('div');
    banner.id = 'inapp-warning-banner';
    banner.innerHTML = `
        <div style="position:fixed;top:0;left:0;right:0;z-index:9999;background:#FEF3C7;color:#78350F;padding:12px 16px;font-size:14px;text-align:center;border-bottom:1px solid #FCD34D;">
            <strong>알림</strong> 카카오톡 등 인앱 브라우저에서는 영상이 잘 안 나올 수 있어요.
            <button onclick="document.getElementById('inapp-warning-banner').remove()" style="margin-left:8px;background:transparent;border:none;color:#78350F;text-decoration:underline;cursor:pointer;">닫기</button>
        </div>
    `;
    document.body.appendChild(banner);
}

/**
 * Phase 2 (1주일 후): 차단 모드 — 외부 브라우저 유도
 * 안드로이드: intent:// 자동 호출
 * iOS: 안내 오버레이
 */
function redirectToExternalBrowser(detection) {
    if (!detection.isInApp) return;

    const os = getMobileOS();
    const currentUrl = window.location.href;

    if (os === 'android') {
        // Chrome 자동 호출
        const cleanUrl = currentUrl.replace(/^https?:\/\//, '');
        location.href = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end`;
        return;
    }

    if (os === 'ios') {
        // iOS는 자동 리다이렉트 불가 → 안내 오버레이
        showIosOverlay();
    }
}

/**
 * iOS용 안내 오버레이 (확정 카피)
 */
function showIosOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'inapp-ios-overlay';
    overlay.innerHTML = `
        <div style="position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;padding:20px;">
            <div style="background:#fff;border-radius:20px;padding:24px;max-width:340px;text-align:center;">
                <p style="font-size:20px;font-weight:700;color:#2F2725;margin-bottom:12px;">카카오톡에서는 영상이<br/>잘 안 나와요</p>
                <p style="font-size:14px;color:#8B95A1;margin-bottom:20px;line-height:1.7;">
                    1) 화면 오른쪽 위에 점 세 개(⋯) 누르기<br/>
                    2) "다른 브라우저로 열기" 누르기<br/>
                    3) Safari로 다시 열어주세요
                </p>
                <button id="inapp-overlay-continue" style="width:100%;padding:14px;background:#2F2725;color:#fff;border:none;border-radius:16px;font-size:15px;font-weight:600;cursor:pointer;margin-bottom:8px;">그래도 계속 보기</button>
                <button id="inapp-overlay-close" style="width:100%;padding:10px;background:transparent;color:#8B95A1;border:none;font-size:13px;cursor:pointer;">닫기</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('inapp-overlay-continue').onclick = () => {
        overlay.remove();
        sessionStorage.setItem('inapp_dismissed', '1');
    };
    document.getElementById('inapp-overlay-close').onclick = () => overlay.remove();
}

/**
 * 진입점 — 페이지 로드 시 자동 호출
 */
function initInAppDetect() {
    const detection = detectInAppBrowser();
    if (!detection.isInApp) return;

    // Phase 1 / Phase 2 모드 분기 (전역 상수로 제어)
    const MODE = window.INAPP_MODE || 'warn'; // 'warn' | 'block'

    if (MODE === 'warn') {
        showInAppWarning(detection);
    } else if (MODE === 'block') {
        if (sessionStorage.getItem('inapp_dismissed') !== '1') {
            redirectToExternalBrowser(detection);
        }
    }
}

// 자동 초기화
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInAppDetect);
} else {
    initInAppDetect();
}
```

### 5.3 페이지 로드 위치

다음 3개 페이지의 `<head>` 또는 `</body>` 직전에 추가:

| 파일 | 위치 | 사유 |
|---|---|---|
| `auth.html` | `<head>` 또는 `<script>` 첫 줄 | OAuth 콜백 실패 방지 (인앱에서 네이버 로그인 막힘) |
| `course-detail.html` | `<head>` 또는 `<script>` 첫 줄 | 강의 진입 전 사전 차단 |
| `lesson.html` | `<head>` 또는 `<script>` 첫 줄 | 영상 재생 진입 전 마지막 차단 |

```html
<script src="js/inapp-detect.js"></script>
```

### 5.4 Phase 1 → Phase 2 전환 절차

**Phase 1 (첫 1주일)**:
- `js/inapp-detect.js` 상단에 `window.INAPP_MODE = 'warn'` (또는 미설정)
- 노란 띠 경고만 표시, 학생은 자유 진행
- `playback_errors` 테이블에서 인앱 환경에서 발생한 에러 비율 측정

**전환 게이트** (1주일 후 PM 검토):
- [ ] 인앱 환경 에러 비율이 의미 있는 수준인가? (≥ 20%)
- [ ] false positive 보고 0건인가?
- [ ] 학생 불만 없었는가?

**Phase 2 (전환 후)**:
- `js/inapp-detect.js` 상단을 `window.INAPP_MODE = 'block'` 으로 변경
- 안드로이드는 intent:// 자동 호출, iOS는 안내 오버레이
- "그래도 계속 보기" 옵션 유지

---

## 6. 상세 설계 — Work C: vimeo-custom-player.js 에러 분기

### 6.1 변경 위치

**파일**: `js/vimeo-custom-player.js`
**함수**: `createPlayer()` 의 error 핸들러 (line 152-156)

### 6.2 ERROR_MAP 카탈로그

```js
/**
 * Vimeo error.name → 학생 카피 + 로깅 분류
 *
 * 학생 카피는 4종 (A/B/C/D), 내부 분류는 6종+
 * Vimeo Player SDK 공식 error.name 목록:
 *   - PrivacyError, PasswordError, NotFoundError, RangeError,
 *     UnsupportedError, TypeError, InvalidTrackLanguageError, ...
 */
const VIMEO_ERROR_MAP = {
    'PrivacyError': {
        copy: 'D',
        logName: 'PrivacyError'
    },
    'PasswordError': {
        copy: 'D',
        logName: 'PasswordError'
    },
    'NotFoundError': {
        copy: 'B',
        logName: 'NotFoundError'
    },
    'UnsupportedError': {
        copy: 'D',
        logName: 'UnsupportedError'
    },
    'RangeError': {
        copy: 'IGNORE', // 자동 0초 리셋, 메시지 표시 안 함
        logName: 'RangeError'
    },
    'TypeError': {
        copy: 'D',
        logName: 'TypeError'
    }
    // 그 외 전부 → 'D' + logName='Unknown'
};

/**
 * 학생 카피 4종
 */
const COPY_TEMPLATES = {
    'B': {
        title: '영상이 사라졌어요',
        body: '원장님께 "<strong>영상 다시 올려 달래요</strong>"라고 말해주세요'
    },
    'C': {
        title: '아직 이 강의를 들을 수 없어요',
        body: '원장님께 "<strong>강의 열어 달래요</strong>"라고 말해주세요'
    },
    'D': {
        title: '영상이 안 열려요',
        body: '1) 새로고침 한 번 해보세요<br/>2) 그래도 안 되면 원장님께 "<strong>OO 강의 영상이 안 열려요</strong>"라고 말해주세요'
    }
    // 'A'는 inapp-detect.js에서 사전 처리 — Vimeo 핸들러에서는 사용 안 함
};
```

### 6.3 변경 후 error 핸들러

```js
// 에러 핸들링 (line 152-156 교체)
this.player.on('error', async (error) => {
    console.error('Vimeo Player Error:', error);
    this.loadingIndicator.classList.add('hidden');

    // 1. 에러 분류
    const mapping = VIMEO_ERROR_MAP[error.name] || { copy: 'D', logName: 'Unknown' };

    // 2. 학생 화면 표시 (RangeError는 무시)
    if (mapping.copy !== 'IGNORE') {
        const template = COPY_TEMPLATES[mapping.copy];
        this.showError(template);
    }

    // 3. 백그라운드 로깅 (실패해도 학생 화면에 영향 없음)
    try {
        await logPlaybackError({
            error_name: mapping.logName,
            error_message: error.message || '',
            error_method: error.method || '',
            lesson_id: window.currentLessonId || null,
            course_id: window.currentCourseId || null
        });
    } catch (logErr) {
        console.error('Failed to log playback error:', logErr);
    }
});
```

### 6.4 `showError()` 함수 개편

기존 `showError(message)` 시그니처를 `showError(template)` 로 변경.

```js
showError(template) {
    // template = { title: '...', body: '...' }
    this.videoWrapper.innerHTML = `
        <div class="aspect-video flex items-center justify-center bg-[#F5F5F5]">
            <div class="text-center text-[#2F2725] p-6 max-w-[340px]">
                <svg class="w-12 h-12 mx-auto mb-4 text-[#8B95A1]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
                </svg>
                <p class="text-[20px] font-bold mb-3">${template.title}</p>
                <p class="text-[14px] text-[#8B95A1] leading-[1.7]">${template.body}</p>
            </div>
        </div>
    `;
    if (this.controlsBar) {
        this.controlsBar.style.display = 'none';
    }
}
```

**디자인 원칙** (글로벌 CLAUDE.md 기준 반영):
- 배경: `#F5F5F5` (부드러운 회색)
- 아이콘: 단색 SVG stroke 1.5px, `#8B95A1` (Secondary)
- 제목: 20px Bold, `#2F2725` (Primary)
- 본문: 14px Regular, `#8B95A1`, line-height 1.7
- 빨간색·X 아이콘 회피 → 학생 패닉 방지

### 6.5 `logPlaybackError()` 함수 (신규)

```js
/**
 * Supabase playback_errors 테이블에 에러 적재
 * vimeo-custom-player.js 또는 별도 파일에 정의
 */
async function logPlaybackError(errorData) {
    if (!window.supabase) return;

    try {
        const user = (await window.supabase.auth.getUser()).data.user;

        // 인앱 감지 (inapp-detect.js의 함수 재사용)
        const detection = (typeof detectInAppBrowser === 'function')
            ? detectInAppBrowser()
            : { isInApp: false, type: null, isKakao: false };

        await window.supabase.from('playback_errors').insert({
            user_id: user?.id || null,
            lesson_id: errorData.lesson_id || null,
            course_id: errorData.course_id || null,
            error_name: errorData.error_name,
            error_message: errorData.error_message || '',
            error_method: errorData.error_method || '',
            ua: navigator.userAgent,
            is_kakao_inapp: detection.isKakao,
            is_inapp: detection.isInApp,
            inapp_type: detection.type,
            page_url: window.location.href
        });
    } catch (e) {
        // 로깅 실패는 silent (학생 경험 영향 없음)
        console.error('logPlaybackError failed:', e);
    }
}
```

### 6.6 lesson.html에서 currentLessonId/currentCourseId 노출

`logPlaybackError` 가 사용할 컨텍스트를 `window` 전역에 노출.

**파일**: `lesson.html` (현재 line 864 부근)

```js
// lesson 데이터 로드 직후 추가
window.currentLessonId = lesson.id;
window.currentCourseId = lesson.course_id;
```

---

## 7. 상세 설계 — Work D: Supabase 마이그레이션 + 적용

### 7.1 마이그레이션 파일

**파일**: `supabase/migrations/202604120001_create_playback_errors.sql` (신규)

→ §3.1 의 SQL 그대로 사용

### 7.2 적용 절차

1. PR #2에서 마이그레이션 SQL 파일 추가
2. Supabase Dashboard SQL Editor에서 수동 실행 (또는 CLI: `npx supabase db push`)
3. RLS 정책 4개 활성화 확인
4. 테스트 insert 1건 → 본인 조회 가능, 타 사용자 조회 차단 확인
5. JS 코드 (Work C) 머지

### 7.3 데이터 보존 정책 (Phase 2 작업으로 분리)

- 90일 이상 된 레코드 자동 삭제 cron (Phase 2)
- 익명화 정책 (Phase 2)

본 작업에서는 **무제한 보존**. 양이 폭증하면 Phase 2에서 정책 추가.

---

## 8. 비공개 강의 권한 메시지 (카피 C)

### 8.1 변경 위치

**파일**: `course-detail.html` (line 522-539)

### 8.2 현재 카피

```html
<p class="text-2xl mb-4 text-[#2F2725] font-bold">비공개 강의입니다</p>
<p class="text-[15px] text-[#8B95A1] mb-6">이 강의는 관리자가 승인한 사용자만 접근할 수 있습니다.</p>
<p class="text-[13px] text-[#C5C5C5] mb-8">접근 권한이 필요하시다면 관리자에게 문의해주세요.</p>
```

### 8.3 변경 후 카피 (C 통일)

```html
<p class="text-[20px] mb-3 text-[#2F2725] font-bold">아직 이 강의를 들을 수 없어요</p>
<p class="text-[14px] text-[#8B95A1] mb-8 leading-[1.7]">원장님께 "<strong>강의 열어 달래요</strong>"라고 말해주세요</p>
```

→ "비공개 강의입니다" 같은 어려운 단어 제거, 행동 동사 포함.

---

## 9. 테스트 시나리오

### 9.1 단위 테스트 (수동)

| # | 시나리오 | 예상 결과 |
|---|---|---|
| T1 | 안드로이드 카톡 인앱에서 강의 페이지 진입 (Phase 1) | 노란 띠 경고 표시, 재생 가능 |
| T2 | 안드로이드 카톡 인앱에서 강의 페이지 진입 (Phase 2) | intent:// 호출되어 Chrome으로 자동 전환 |
| T3 | iOS 카톡 인앱에서 진입 (Phase 2) | 안내 오버레이 표시, "그래도 계속 보기" 작동 |
| T4 | 진짜 Chrome/Safari에서 진입 | 인앱 감지 안 됨, 정상 진행 |
| T5 | Vimeo 영상 ID 잘못된 lesson 진입 | "영상이 사라졌어요" (B 카피) + DB에 NotFoundError 적재 |
| T6 | Vimeo 영상 비밀번호 설정된 lesson 진입 | "영상이 안 열려요" (D 카피) + DB에 PasswordError 적재 |
| T7 | 비공개 강의에 권한 없는 학생 진입 | "아직 이 강의를 들을 수 없어요" (C 카피) |
| T8 | 정상 영상 재생 | 에러 메시지 없음, DB에 레코드 없음 |
| T9 | 카톡 인앱에서 로그인 → 진짜 Chrome에서 로그인 | 둘 다 활성 세션 유지 (강제 로그아웃 없음) |
| T10 | playback_errors 본인 조회 | 자기 행만 보임 |
| T11 | playback_errors admin 조회 | 모든 행 보임 |
| T12 | playback_errors 타 사용자 조회 | 0행 (RLS 차단) |

### 9.2 회귀 테스트

- 기존 정상 학생의 강의 진입/재생 동선 확인 (PR마다)
- `profiles.active_sessions` 데이터 호환성 확인 (Work A)
- Vimeo 정상 재생 시 어떤 에러도 적재되지 않는지 (Work D)

---

## 10. 파일별 변경 요약

| 파일 | 작업 | 변경 종류 | 추정 라인 변경 |
|---|---|---|---|
| `js/auth.js` | Work A | 수정 (line 32-40) | +10 / -2 |
| `js/inapp-detect.js` | Work B | **신규** | +180 |
| `auth.html` | Work B | script 태그 추가 | +1 |
| `course-detail.html` | Work B + 카피 C | script 태그 + 카피 수정 (line 530-532) | +1, ~5 |
| `lesson.html` | Work B + window 전역 노출 | script 태그 + 2줄 추가 | +1, +2 |
| `js/vimeo-custom-player.js` | Work C | error 핸들러 + showError + logPlaybackError | +60 / -8 |
| `supabase/migrations/202604120001_create_playback_errors.sql` | Work D | **신규** | +60 |

총 **7개 파일** 변경, 그중 **2개 신규**.

---

## 11. PR 단위 상세

### PR #1: Work A — auth.js 카톡 식별자 (즉시 머지 가능)

- `js/auth.js` (line 32-40 교체)
- 단독 PR
- 코드 리뷰만 통과하면 머지

### PR #2: Work D — playback_errors 테이블 + 로깅

- `supabase/migrations/202604120001_create_playback_errors.sql` (신규)
- `js/vimeo-custom-player.js` 에 `logPlaybackError()` 함수만 추가 (호출은 PR #3에서)
- DB 마이그레이션 적용 후 머지

### PR #3: Work C — Vimeo 에러 분기 + 4종 카피 + course-detail 카피

- `js/vimeo-custom-player.js` error 핸들러 + showError 개편 + ERROR_MAP/COPY_TEMPLATES
- `course-detail.html` 카피 C 적용 (line 530-532)
- `lesson.html` 에 `window.currentLessonId/currentCourseId` 노출
- **PM 카피 + 디자인 시안 검수 게이트**

### PR #4: Work B — inapp-detect.js + 페이지 로드 (Phase 1: warn 모드)

- `js/inapp-detect.js` 신규
- `auth.html` / `course-detail.html` / `lesson.html` 에 script 태그 추가
- `INAPP_MODE = 'warn'` 으로 출시
- **PM 동선 + 시안 검수 게이트**

### PR #5 (1주일 후): Phase 2 전환

- `js/inapp-detect.js` 의 `INAPP_MODE` 를 `'block'` 으로 변경
- 한 줄 변경 PR
- PM 데이터 검토 게이트

---

## 12. Open Questions (Design 단계 PM 확인)

본 Design 문서에서 추가로 확정할 사항이 없을 경우, 바로 PR #1 작업 시작합니다.

다음 항목은 **PR 단계 검수 게이트에서 결정**:
- 디자인 톤(살짝 슬픈 SVG + 회색 배경)의 정확한 픽셀/색상은 PR #3 시안에서 확정
- 안드로이드 intent:// 의 정확한 URL 인코딩 처리는 PR #4 구현 시 확인
- 1주일 → Phase 2 전환의 정확한 날짜는 PR #4 머지일 + 7일

---

## 13. 다음 단계

본 Design 승인 시:
1. PR #1 (Work A) 작업 시작 — `js/auth.js` 한 블록 수정
2. 머지 후 PR #2 (Work D) — DB 마이그레이션 + logPlaybackError 함수
3. 머지 후 PR #3 (Work C) — Vimeo 에러 분기 + 카피 + 디자인
4. 머지 후 PR #4 (Work B) — 인앱 감지 (Phase 1: warn)
5. 1주일 후 PR #5 — Phase 2 전환
6. Analyze 단계: gap-detector / playback_errors 데이터 분석
7. Report 단계: PDCA 완료 보고서
