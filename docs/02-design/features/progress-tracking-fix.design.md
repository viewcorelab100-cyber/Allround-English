# progress-tracking-fix Design Document

> **Summary**: 진도율 미반영 문제의 근본적 해결 — 알고리즘, 저장 안정성, DB 정합성
>
> **Project**: Allround-English
> **Author**: CTO (AI)
> **Date**: 2026-04-01
> **Status**: Draft
> **Planning Doc**: [progress-tracking-fix.plan.md](../../01-plan/features/progress-tracking-fix.plan.md)

---

## 1. Overview

### 1.1 Design Goals

1. 정상 재생 시 진도가 100% 반영되도록 건너뛰기 방지 알고리즘 개선
2. 모바일/탭 전환 시에도 진도 유실 없는 저장 메커니즘 구축
3. DB 레벨에서 중복 레코드 방지
4. 기존 피해 학생 데이터 수동 보정 수단 확보

### 1.2 Design Principles

- 기존 건너뛰기 방지 기능은 유지 (앞으로 점프 차단)
- 클라이언트 코드 변경 최소화 (lesson.html 내 알고리즘 부분만 교체)
- 기존 학생 데이터 무손실

---

## 2. Architecture

### 2.1 변경 대상 컴포넌트

```
┌─────────────────────────────────────────────────────────┐
│                    lesson.html                           │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │ Vimeo timeupdate │  │ Native Video timeupdate      │ │
│  │ (line 970~974)   │  │ (line 1107~1111)             │ │
│  │ ★ 알고리즘 교체   │  │ ★ 알고리즘 교체              │ │
│  └────────┬─────────┘  └─────────────┬────────────────┘ │
│           │                          │                   │
│  ┌────────▼──────────────────────────▼────────────────┐ │
│  │ saveVimeoProgress() / saveNativeProgress()         │ │
│  │ ★ 저장 트리거 추가 (visibilitychange, pagehide)    │ │
│  │ ★ 저장 주기 30s → 15s                              │ │
│  └────────────────────────┬───────────────────────────┘ │
└───────────────────────────┼─────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                    js/progress.js                         │
│  ┌────────────────────────────────────────────────────┐  │
│  │ updateLessonProgress()                             │  │
│  │ ★ upsert 패턴 전환 (ON CONFLICT)                   │  │
│  │ ★ 재시도 로직 추가 (max 3회)                        │  │
│  └────────────────────────┬───────────────────────────┘  │
└───────────────────────────┼──────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────┐
│                  Supabase DB                              │
│  lesson_progress 테이블                                   │
│  ★ UNIQUE(user_id, lesson_id) 제약조건 추가               │
│  ★ 기존 중복 데이터 정리 마이그레이션                      │
└──────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────┐
│                    admin.html                              │
│  showCourseData() (line 5502~5652)                        │
│  ★ 각 셀 클릭 시 진도 수동 보정 기능 추가                  │
└──────────────────────────────────────────────────────────┘
```

### 2.2 Data Flow (변경 후)

```
영상 재생 (timeupdate)
  → 개선된 건너뛰기 방지 알고리즘 (gap 15초 허용)
  → maxWatchedTime 업데이트
  → 저장 트리거 (15초 interval / pause / ended / visibilitychange / pagehide)
  → updateLessonProgress() [upsert + 재시도]
  → Supabase lesson_progress [UNIQUE 보장]
```

---

## 3. Data Model

### 3.1 lesson_progress 테이블 변경

**현재 상태**: `(user_id, lesson_id)` 조합에 unique 제약조건 없음 → 중복 행 가능

**변경 후**:
```sql
-- Step 1: 중복 데이터 정리 (최고 watched_seconds 행만 보존)
DELETE FROM lesson_progress
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, lesson_id) id
  FROM lesson_progress
  ORDER BY user_id, lesson_id, watched_seconds DESC, updated_at DESC
);

-- Step 2: Unique 제약조건 추가
ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_user_lesson_unique
UNIQUE (user_id, lesson_id);
```

### 3.2 기존 스키마 (변경 없음)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK → profiles.id |
| lesson_id | UUID | FK → lessons.id |
| watched_seconds | FLOAT | 누적 시청 시간 (초) |
| total_seconds | FLOAT | 영상 총 길이 (초) |
| progress_percent | INT | 진도율 (%) |
| is_completed | BOOLEAN | 완료 여부 (watched >= total * 0.95) |
| last_position | FLOAT | 마지막 재생 위치 (초) |
| created_at | TIMESTAMPTZ | 생성일 |
| updated_at | TIMESTAMPTZ | 수정일 |

---

## 4. 상세 설계

### 4.1 FR-01: 건너뛰기 방지 알고리즘 개선

**파일**: `lesson.html` (Vimeo: ~line 970, Native: ~line 1107)

**현재 코드** (두 곳 동일):
```js
const timeDiff = currentTime - lastPlaybackTime;
if (timeDiff > 0 && timeDiff < 5 && currentTime > maxWatchedTime && currentTime <= maxWatchedTime + 5) {
    maxWatchedTime = currentTime;
}
```

**변경 코드**:
```js
const timeDiff = currentTime - lastPlaybackTime;

// 정상 재생 판정: 시간이 전진하고, 과도한 점프가 아님
const isNormalPlayback = timeDiff > 0 && timeDiff < 15;

// maxWatchedTime 근처에서 재생 중이면 진도 전진 허용
const isNearWatchedFront = currentTime <= maxWatchedTime + 15;

if (isNormalPlayback && isNearWatchedFront && currentTime > maxWatchedTime) {
    maxWatchedTime = currentTime;
}
```

**변경 근거**:
- `timeDiff < 5` → `timeDiff < 15`: Vimeo 버퍼링/탭전환 후 복귀 시 5~10초 gap 커버
- `maxWatchedTime + 5` → `maxWatchedTime + 15`: 동일 이유
- 15초 이상 앞으로 점프 = 여전히 건너뛰기로 판정하여 차단
- 뒤로 이동(timeDiff < 0) = 복습이므로 무시 (기존과 동일)

### 4.2 FR-02: 저장 트리거 추가

**파일**: `lesson.html`

**추가 위치**: Vimeo 플레이어 설정 영역 (~line 1005 이후), Native 비디오 설정 영역 (~line 1138 이후)

**추가 코드** (공통으로 1번만 등록):
```js
// 모바일 대응: 탭 전환/앱 전환 시 진도 저장
document.addEventListener('visibilitychange', function() {
    if (document.visibilityState === 'hidden') {
        if (vimeoPlayer || customVimeoPlayer) {
            saveVimeoProgress();
        } else if (videoElement) {
            saveNativeProgress();
        }
    }
});

// Safari/iOS 대응: pagehide는 beforeunload보다 신뢰성 높음
window.addEventListener('pagehide', function() {
    if (vimeoPlayer || customVimeoPlayer) {
        saveVimeoProgress();
    } else if (videoElement) {
        saveNativeProgress();
    }
});
```

**기존 beforeunload 유지**: fallback으로 그대로 둠 (제거하지 않음)

### 4.3 FR-03: DB Unique Constraint + 중복 정리

**파일**: 신규 SQL 파일 `fix-progress-duplicates.sql`

```sql
-- 1. 중복 확인 (dry run)
SELECT user_id, lesson_id, COUNT(*) as cnt
FROM lesson_progress
GROUP BY user_id, lesson_id
HAVING COUNT(*) > 1;

-- 2. 중복 정리 (최고 watched_seconds 행만 보존)
DELETE FROM lesson_progress
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id, lesson_id) id
  FROM lesson_progress
  ORDER BY user_id, lesson_id, watched_seconds DESC, updated_at DESC
);

-- 3. Unique 제약조건 추가
ALTER TABLE lesson_progress
ADD CONSTRAINT lesson_progress_user_lesson_unique
UNIQUE (user_id, lesson_id);
```

### 4.4 FR-04: progress.js upsert 전환 + 재시도

**파일**: `js/progress.js`

**updateLessonProgress() 변경**:

```js
async function updateLessonProgress(userId, lessonId, progressData, retryCount = 0) {
    const MAX_RETRIES = 3;

    try {
        const progressRecord = {
            user_id: userId,
            lesson_id: lessonId,
            watched_seconds: progressData.watchedSeconds,
            total_seconds: progressData.totalSeconds,
            progress_percent: progressData.totalSeconds > 0
                ? Math.round((progressData.watchedSeconds / progressData.totalSeconds) * 100) : 0,
            is_completed: progressData.totalSeconds > 0
                && progressData.watchedSeconds >= progressData.totalSeconds * 0.95,
            last_position: progressData.lastPosition,
            updated_at: new Date().toISOString()
        };

        // 기존 레코드 확인
        const { data: rows, error: fetchError } = await window.supabase
            .from('lesson_progress')
            .select('id, watched_seconds')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .limit(1);

        if (fetchError) throw fetchError;

        const existing = rows && rows.length > 0 ? rows[0] : null;
        let result;

        if (existing) {
            if (progressData.watchedSeconds > existing.watched_seconds) {
                // 더 높은 진도 → 전체 업데이트
                const { data, error } = await window.supabase
                    .from('lesson_progress')
                    .update(progressRecord)
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                // last_position만 갱신
                const { data, error } = await window.supabase
                    .from('lesson_progress')
                    .update({
                        last_position: progressData.lastPosition,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }
        } else {
            // 신규 삽입
            progressRecord.created_at = new Date().toISOString();
            const { data, error } = await window.supabase
                .from('lesson_progress')
                .insert(progressRecord)
                .select()
                .single();

            // unique constraint 충돌 시 → update로 전환
            if (error && error.code === '23505') {
                return updateLessonProgress(userId, lessonId, progressData, retryCount);
            }
            if (error) throw error;
            result = data;
        }

        return { success: true, data: result };
    } catch (error) {
        // 재시도 (exponential backoff)
        if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 500; // 500ms, 1s, 2s
            await new Promise(r => setTimeout(r, delay));
            return updateLessonProgress(userId, lessonId, progressData, retryCount + 1);
        }
        console.error('Update progress error (max retries reached):', error);
        return { success: false, error: error.message };
    }
}
```

### 4.5 FR-05: 관리자 진도 수동 보정 UI

**파일**: `admin.html` — `showCourseData()` 함수 내 테이블 셀

**현재**: 진도 셀은 읽기 전용 (`✓`, `X%`, `—` 표시)

**변경**: 각 진도 셀 클릭 시 보정 팝업

```
┌─────────────────────────────────┐
│  진도 보정                       │
│  학생: 홍길동                    │
│  레슨: 3강 - Present Perfect    │
│  ─────────────────────────────  │
│  현재 진도: 42%                  │
│  [완료 처리 (100%)]  [취소]     │
└─────────────────────────────────┘
```

**구현**: 셀 클릭 → `confirm()` 다이얼로그로 완료 처리 여부 확인 → Supabase update 실행

```js
// 테이블 셀 생성 시 onclick 추가
`<td class="text-center cursor-pointer hover:bg-white/5"
    onclick="fixProgress('${sid}', '${l.id}', '${profile.name}', '${l.order_num}강')">
    <span class="${color} text-[10px] font-bold">${pct}%</span>
</td>`

// 보정 함수
async function fixProgress(userId, lessonId, studentName, lessonTitle) {
    if (!confirm(`${studentName} - ${lessonTitle}\n진도를 100% 완료로 보정하시겠습니까?`)) return;

    const { data: lesson } = await window.supabase
        .from('lessons').select('duration').eq('id', lessonId).single();

    const totalSeconds = lesson?.duration || 0;

    const { error } = await window.supabase
        .from('lesson_progress')
        .upsert({
            user_id: userId,
            lesson_id: lessonId,
            watched_seconds: totalSeconds,
            total_seconds: totalSeconds,
            progress_percent: 100,
            is_completed: true,
            last_position: totalSeconds,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,lesson_id' });

    if (error) {
        alert('보정 실패: ' + error.message);
    } else {
        alert('완료 처리되었습니다.');
        // 테이블 새로고침
        showCourseData(/* courseId, courseTitle */);
    }
}
```

### 4.6 FR-06: 저장 주기 변경

**파일**: `lesson.html`

**변경**: 2곳의 `setInterval` 주기를 30000 → 15000으로 변경

- Vimeo: ~line 1007 `}, 30000);` → `}, 15000);`
- Native: ~line 1137 `}, 30000);` → `}, 15000);`

---

## 5. 구현 순서

| Step | Task | Files | 예상 변경 규모 |
|------|------|-------|--------------|
| 1 | 건너뛰기 방지 알고리즘 개선 (Vimeo + Native) | `lesson.html` | 4줄 → 6줄 x 2곳 |
| 2 | visibilitychange/pagehide 저장 트리거 추가 | `lesson.html` | +15줄 |
| 3 | 저장 주기 30s → 15s | `lesson.html` | 숫자 변경 2곳 |
| 4 | progress.js upsert + 재시도 로직 | `js/progress.js` | 함수 1개 교체 |
| 5 | DB 중복 정리 + unique constraint SQL | `fix-progress-duplicates.sql` | 신규 파일 |
| 6 | 관리자 진도 보정 UI | `admin.html` | +30줄 |

---

## 6. Test Plan

### 6.1 수동 테스트 시나리오

| # | 시나리오 | 기대 결과 |
|---|---------|----------|
| T-01 | 영상 정상 재생 → 끝까지 시청 | progress_percent = 100%, is_completed = true |
| T-02 | 재생 중 다른 탭 전환 (10초) → 복귀 후 계속 재생 | 진도 정상 증가 (끊기지 않음) |
| T-03 | 재생 중 버퍼링 발생 (5~10초 gap) → 버퍼링 해제 후 재생 | 진도 정상 증가 |
| T-04 | 영상 중간에서 앞으로 20초 건너뛰기 | maxWatchedTime 변경 없음 (차단됨) |
| T-05 | 모바일 Safari에서 영상 재생 중 홈 버튼 | 직전까지의 진도 저장됨 |
| T-06 | 모바일 Chrome에서 영상 재생 중 앱 전환 | 직전까지의 진도 저장됨 |
| T-07 | 네트워크 끊긴 상태에서 저장 시도 | 재시도 3회 후 실패 (에러 로그) |
| T-08 | 관리자 페이지에서 학생 진도 셀 클릭 → 100% 보정 | DB에 is_completed=true 반영, 테이블 갱신 |

---

## 7. Security Considerations

- [x] 관리자 보정 기능은 기존 admin RLS 정책으로 보호됨 (관리자만 update 가능)
- [x] 클라이언트 진도 조작은 건너뛰기 방지로 제한 (서버 사이드 검증은 Out of Scope)
- [x] unique constraint로 중복 삽입 시 DB 레벨에서 차단

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial design — 6개 FR 상세 설계 | CTO (AI) |
