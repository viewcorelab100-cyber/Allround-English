# Plan: Vimeo 에러 분류 + 카카오톡 인앱 차단 + 재생 에러 자동 로깅

> 학생 → 원장님 → PM 핑퐁 루프 차단을 위한 4축 개선 작업

작성일: 2026-04-12
담당: CTO (Claude) / 승인: PM
관련 메모: `project_student_playback_issue.md` (이서윤 학생 firstee 재생 불가 케이스)

---

## 1. Background (왜 이 작업이 필요한가)

### 1-1. 현재 문제

학생이 강의 영상을 못 보면 다음 루프가 발생함:

```
학생 → 원장님 → PM → CTO(Claude) → PM → 원장님 → 학생
```

매번 이 핑퐁이 도는 이유:
1. **에러 종류를 구분하지 않음** — `js/vimeo-custom-player.js:152-156` 에서 모든 Vimeo 에러를 `"영상을 불러올 수 없습니다. 관리자에게 문의해주세요."` 단일 메시지로 처리
2. **에러를 서버에 로깅하지 않음** — `console.error`만 찍어서 학생 브라우저에만 남고 사라짐
3. **카카오톡 인앱 브라우저를 감지하지 않음** — 학생이 카톡에서 링크를 누르면 자동재생/HLS/세션이 실패하지만 안내가 없음
4. **세션 device_info가 카톡과 진짜 Chrome을 구분 못 함** — `js/auth.js:74-76` 의 같은 device_info 중복 제거 로직 때문에 한쪽이 강제 로그아웃됨

### 1-2. 데이터로 확인된 사실

- `docs/01-plan/features/sentry-bugfix.plan.md` 의 무시 대상 5건 중 **2건이 Vimeo 관련**:
  - `JAVASCRIPT-A: UnsupportedError: Fullscreen` (Mobile Safari)
  - `JAVASCRIPT-8: TypeError: r.name.includes` (Vimeo 플레이어 내부)
- 즉, 에러는 발생하고 있으나 **분류 불가능 → 무시 처리** 상태로 누적 중
- `project_student_playback_issue.md` 에서 이서윤 학생 케이스의 원인을 좁히기 위해 **PM이 학생에게 4지선다 증상 확인**을 해야만 하는 상황 (= 로깅 부재의 직접 비용)

### 1-3. 영향 추정

| 가설 | 근거 |
|---|---|
| 학생 문의의 50~70%가 카톡 인앱 환경 문제 | 1명한테만 발생하는 케이스 = 환경 의존 = 인앱/광고차단/Wi-Fi |
| 강제 로그아웃 버그가 진행 중 | `auth.js:74-76` 코드와 카톡 인앱이 같은 device_info "Android (Chrome)" 으로 잡히는 사실로부터 연역 가능 |
| 1번/2번(Privacy/Password) 에러는 실제로는 거의 0% | 학원 운영 패턴상 비밀번호/도메인 화이트리스트 설정 빈도 낮음 |

---

## 2. Goals

1. **학생 문의 핑퐁 루프 차단** — 학생이 자가 해결 가능한 케이스(카톡 인앱)는 사전에 차단
2. **원장님 → PM 전달의 정확도 상승** — 학생 메시지에 행동 동사 포함 ("영상 다시 올려 달래요")
3. **PM 디버깅 비용 제로화** — 모든 재생 에러를 Supabase에 자동 적재 → 학생 이름만 알면 5초 내 원인 파악
4. **강제 로그아웃 버그 제거** — 카톡 인앱과 외부 브라우저가 동시 사용 가능하도록

---

## 3. Scope (4개 작업)

### Work A — `js/auth.js` 카카오톡 식별자 추가 (5분 작업)

**파일**: `js/auth.js:32-40`

**현재 코드**:
```js
if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
    browser = 'Chrome';
} else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
}
// ...
```

**수정 코드**:
```js
if (/KAKAOTALK/i.test(ua)) {
    browser = 'KakaoTalk 인앱';
} else if (/NAVER\(inapp/i.test(ua)) {
    browser = 'Naver 인앱';
} else if (/Instagram/i.test(ua)) {
    browser = 'Instagram 인앱';
} else if (/FB_IAB|FBAN/i.test(ua)) {
    browser = 'Facebook 인앱';
} else if (/Line\//i.test(ua)) {
    browser = 'Line 인앱';
} else if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
    browser = 'Chrome';
} else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
    browser = 'Safari';
}
// ...
```

**효과**: 카톡 인앱 ↔ 진짜 Chrome 세션이 별도 device_info로 잡혀, 한쪽이 강제 로그아웃되지 않음.

**부작용**: 거의 없음. device_info 문자열만 변경되며 기존 데이터 호환성 깨지지 않음.

---

### Work B — `js/inapp-detect.js` 신규 + 강의/인증 페이지 로드 (반나절)

**신규 파일**: `js/inapp-detect.js`

**기능**:
- 카카오톡, 네이버, 인스타, 페이스북, 라인 인앱 감지
- 안드로이드: `intent://...#Intent;scheme=https;package=com.android.chrome;end` 로 Chrome 자동 호출
- iOS: 안내 오버레이 표시 (메뉴 위치 그림 + 텍스트)
- "그래도 계속 보기" 옵션 제공 (학생 선택권 존중)

**로드 위치**:
- `course-detail.html` (강의 진입 시점)
- `lesson.html` (수업 재생 시점)
- `auth.html` (로그인 시점, OAuth 콜백 실패 방지)

**iOS 안내 오버레이 카피 (확정)**:
```
카카오톡에서는 영상이 잘 안 나와요

다음 순서대로 해주세요:
1) 화면 오른쪽 위에 점 세 개(⋯) 누르기
2) "다른 브라우저로 열기" 누르기
3) Safari 또는 Chrome으로 다시 열어주세요

[그래도 계속 보기] [닫기]
```

---

### Work C — `js/vimeo-custom-player.js` 에러 분기 + 4종 메시지 (반나절)

**파일**: `js/vimeo-custom-player.js:152-156`

**현재 코드** (단일 메시지):
```js
this.player.on('error', (error) => {
    console.error('Vimeo Player Error:', error);
    this.loadingIndicator.classList.add('hidden');
    this.showError('영상을 불러올 수 없습니다. 관리자에게 문의해주세요.');
});
```

**수정 후 분기 로직** (학생 카피는 4종, 내부 분류는 6종):

| 내부 분류 (`error.name`) | 학생 화면 메시지 (4종) | 자동 로깅 |
|---|---|---|
| `NotFoundError` | **B 카피**: "영상이 사라졌어요 — 원장님께 '영상 다시 올려 달래요'라고 말해주세요" | `error_name=NotFound` |
| (강의 권한 없음, course-detail에서 처리) | **C 카피**: "아직 이 강의를 들을 수 없어요 — 원장님께 '강의 열어 달래요'라고 말해주세요" | (course-detail에서 별도 처리) |
| `NotPlayableError` + 카톡 인앱 | **A 카피** (인앱 안내, inapp-detect.js에서 사전 차단) | `error_name=NotPlayable, is_kakao_inapp=true` |
| `PrivacyError` | **D 카피**: "영상이 안 열려요 — 새로고침해 보고, 그래도 안 되면 원장님께 '○○ 강의 영상이 안 열려요'라고 말해주세요" | `error_name=Privacy` |
| `PasswordError` | **D 카피** (동일) | `error_name=Password` |
| `NotPlayableError` (데스크톱) | **D 카피** (동일) | `error_name=NotPlayable, is_kakao_inapp=false` |
| 그 외 / Unknown | **D 카피** (동일) | `error_name=<원본>` 또는 `Unknown` |

**디자인 톤** (CTO 권고, PM 검수 포인트):
- 빨간 ❌ 아이콘 ❌ → 살짝 슬픈 표정의 단색 SVG (회색 1.5px stroke)
- 배경: 부드러운 회색 (`#F5F5F5` 또는 surface 색상)
- 폰트: Pretendard Variable (글로벌 CLAUDE.md 기준)
- 학생이 패닉하지 않도록 "큰일났다" 톤 회피

---

### Work D — Supabase `playback_errors` 테이블 + 자동 로깅 (반나절)

**DB 마이그레이션 SQL 초안**:

```sql
-- 마이그레이션: create-playback-errors-table.sql
CREATE TABLE IF NOT EXISTS public.playback_errors (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    lesson_id   UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
    course_id   UUID REFERENCES public.courses(id) ON DELETE SET NULL,
    error_name      TEXT NOT NULL,        -- PrivacyError, PasswordError, NotFoundError, NotPlayableError, Unknown
    error_message   TEXT,                  -- Vimeo 원본 메시지
    error_method    TEXT,                  -- Vimeo SDK 호출 메서드 (있을 때)
    ua              TEXT,                  -- navigator.userAgent
    is_kakao_inapp  BOOLEAN DEFAULT false,
    is_inapp        BOOLEAN DEFAULT false, -- 카톡 외 인앱 포함
    page_url        TEXT,                  -- 발생 URL
    occurred_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_playback_errors_user_id ON public.playback_errors(user_id);
CREATE INDEX idx_playback_errors_occurred_at ON public.playback_errors(occurred_at DESC);
CREATE INDEX idx_playback_errors_error_name ON public.playback_errors(error_name);

-- RLS
ALTER TABLE public.playback_errors ENABLE ROW LEVEL SECURITY;

-- 본인 + 관리자만 조회 가능
CREATE POLICY "playback_errors_select_own_or_admin" ON public.playback_errors
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
              AND profiles.role = 'admin'
        )
    );

-- 본인만 insert 가능 (학생 자신의 에러)
CREATE POLICY "playback_errors_insert_own" ON public.playback_errors
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
```

**JS 호출 위치**: `js/vimeo-custom-player.js` 에러 핸들러 안에서 `await window.supabase.from('playback_errors').insert({...})`

**관리자 조회 UI** (선택 — Phase 2로 미룸): `admin.html` 에 "재생 에러 로그" 탭 추가하여 PM이 직접 볼 수 있게. 본 Plan에서는 **DB 적재까지만**, 관리자 UI는 별도 작업.

---

## 4. Out of Scope (이번 작업에서 다루지 않는 것)

- Sentry ↔ playback_errors 연동 (Sentry는 그대로 두되, 별도 로깅 라인을 추가)
- 관리자 페이지에 재생 에러 로그 UI (Phase 2)
- Vimeo 외 영상 플랫폼 지원 (현재 Vimeo만 지원, 영구 정책)
- 학생에게 자동 알림톡으로 "영상이 복구됐어요" 통보 (Phase 2)
- iOS/안드로이드 카톡 인앱 안내 카드의 디자인 시안 (퍼블리싱 단계에서 결정)

---

## 5. 학생 메시지 카피 (확정 — 4종)

| # | 상황 | 화면 큰 글씨 | 화면 작은 글씨 |
|---|---|---|---|
| **A** | 카톡/인앱 사전 차단 | **카카오톡에서는 영상이 잘 안 나와요** | 👉 위쪽 점 세 개(⋯) → "다른 브라우저로 열기" 를 눌러주세요 |
| **B** | NotFoundError | **영상이 사라졌어요** | 원장님께 "**영상 다시 올려 달래요**"라고 말해주세요 |
| **C** | 비공개 강의 권한 없음 | **아직 이 강의를 들을 수 없어요** | 원장님께 "**강의 열어 달래요**"라고 말해주세요 |
| **D** | 그 외 모든 에러 | **영상이 안 열려요** | 1) 새로고침 한 번 해보세요<br>2) 그래도 안 되면 원장님께 "**○○ 강의 영상이 안 열려요**"라고 말해주세요 |

**원장님이 외울 동사 (4개)**: 다른 브라우저, 다시 올려, 열어, 안 열려요

---

## 6. 작업 순서 + PR 단위

| 순서 | 작업 | 작업량 | 위험도 | PR | 검수 게이트 |
|---|---|---|---|---|---|
| 1 | Work A: auth.js 카톡 식별자 | 5분 | 거의 0 | PR #1 | PM 코드 한 줄 확인 |
| 2 | Work D: playback_errors 테이블 + 로깅 | 반나절 | 낮 | PR #2 | Supabase 마이그레이션 검토 |
| 3 | Work C: Vimeo 에러 분기 + 4종 카피 | 반나절 | 낮 | PR #3 | 학생 화면 카피 PM 최종 검수 |
| 4 | Work B: inapp-detect.js + 페이지 로드 | 반나절 | **중** | PR #4 | **학생 동선 변경 — PM 검수 필수** |

**왜 이 순서인가**:
- ① 가장 부작용 없는 작업부터 (강제 로그아웃 버그 즉시 차단)
- ② 로깅을 먼저 깔아서, ③ 메시지 분기 작업의 효과를 즉시 측정 가능
- ④ 학생 동선이 가장 크게 바뀌는 작업이므로 마지막 + 단독 PR + 디자인 검수

---

## 7. 위험 관리 (롤백 시나리오)

| 작업 | 롤백 방법 | 데이터 손실 |
|---|---|---|
| Work A | Git revert 1줄 | 없음 |
| Work D | `DROP TABLE playback_errors` + JS revert | 누적된 로그만 손실 (학생 영향 없음) |
| Work C | Git revert | 없음 (UI만 원복) |
| Work B | Git revert + 페이지에서 `<script>` 태그 제거 | 없음 |

**가장 큰 위험**: Work B에서 인앱 감지 false positive가 발생해 진짜 Chrome 사용자도 차단되는 경우. 대응:
- "그래도 계속 보기" 버튼 필수 제공
- 첫 출시 시 1주일은 차단 대신 **상단 노란 띠 경고만** 표시 → 데이터 수집 후 차단 모드 전환

---

## 8. 검수 게이트 (PM 승인 포인트)

**Plan 단계 (현재)**: 본 문서 전체 승인 → Do 단계 진입 가능

**Do 단계 PR별**:
- PR #1 (Work A): 코드 1블록 리뷰 → 머지
- PR #2 (Work D): SQL 마이그레이션 + RLS 정책 리뷰 → Supabase 적용 → JS 머지
- PR #3 (Work C): **학생 카피 4종 최종 확인** + 디자인 시안 (살짝 슬픈 톤) 확인 → 머지
- PR #4 (Work B): **iOS/안드로이드 안내 카드 시안** + "그래도 계속 보기" 동작 확인 → 머지

**Check 단계**:
- 1주일 후 `playback_errors` 테이블 조회 → 에러 분포 확인
- 학생 문의 건수 변화 측정 (원장님께 비공식 인터뷰)

---

## 9. 성공 지표

| 지표 | 현재 (추정) | 목표 (1개월 후) |
|---|---|---|
| 학생 → 원장님 → PM 핑퐁 1회 평균 시간 | 1~2일 | 0 (PM이 DB 직접 조회) |
| 카톡 인앱 관련 문의 비율 | 50~70% (추정) | < 10% |
| Vimeo 에러 분류 가능 비율 | 0% | 100% |
| 강제 로그아웃 보고 건수 | 미상 | 0건 |

---

## 10. PM 확인 사항 (Plan 승인 전 답변 부탁)

1. ✅ **학생 카피 4종**(A/B/C/D) 그대로 진행해도 되나요?
2. ✅ **원장님 행동 동사 4개**("다른 브라우저", "다시 올려", "열어", "안 열려요") 그대로 가도 되나요?
3. ⚠️ **Work B 인앱 차단의 첫 1주일을 "노란 띠 경고만" 모드로 운영**하는 방안 동의하시나요? (false positive 리스크 완화)
4. ⚠️ **Work D playback_errors 관리자 UI를 Phase 2로 분리**해도 되나요? (이번에는 DB 적재까지만)
5. ⚠️ 디자인 톤(살짝 슬픈 SVG + 회색 배경) 결정을 **PR #3 단계에서 시안 보고 확정**해도 되나요?

---

## 11. 다음 단계

본 Plan 승인 시:
1. `docs/02-design/features/vimeo-error-and-inapp-detection.design.md` 작성 (코드 레벨 상세 설계)
2. PR #1 (Work A) 부터 순차 진행
3. 각 PR마다 위 검수 게이트 통과 후 머지
