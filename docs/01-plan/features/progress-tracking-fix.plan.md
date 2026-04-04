# progress-tracking-fix Planning Document

> **Summary**: 강의 수강률 오류 근본 해결 — 건너뛰기 방지 로직 제거, 구간 추적 방식으로 전환
>
> **Project**: Allround-English
> **Author**: CTO (AI)
> **Date**: 2026-04-05
> **Status**: Draft (v2)

---

## 1. Overview

### 1.1 Purpose

학생이 Vimeo 강의를 끝까지 시청해도 수강률이 60~70%에서 멈추는 반복적 오류를 근본 해결한다.
기존 "최대 도달 지점(maxWatchedTime)" 방식을 폐기하고, **실제 시청 구간 누적** 방식으로 전환한다.

### 1.2 Background

**반복되는 오류의 근본 원인:**

현재 `updateMaxWatchedTime()` 함수(lesson.html:918)의 건너뛰기 방지 로직:

```javascript
const isNormalPlayback = timeDiff > 0 && timeDiff < 15;
const isNearWatchedFront = currentTime <= maxWatchedTime + 15;
if (isNormalPlayback && isNearWatchedFront && currentTime > maxWatchedTime) {
    maxWatchedTime = currentTime;
}
```

- Vimeo 버퍼링/네트워크 지연으로 `timeDiff >= 15`가 한 번만 발생해도 `maxWatchedTime` 업데이트 정지
- 이후 `currentTime`이 `maxWatchedTime + 15`를 초과하면 **영구적으로 진도 차단**
- 영상 중반부에서 버퍼링이 가장 빈번 → 60~70%에서 멈추는 패턴

**누적 패치 이력에도 해결 안 됨:**
- timeDiff 허용치 5초 → 15초 확대 → 15초 이상 버퍼링 시 여전히 실패
- visibilitychange 추가 → 탭전환 문제만 해결, 버퍼링 문제는 미해결
- 구조 자체가 "단일 변수(maxWatchedTime) + 건너뛰기 차단"이므로, 패치로는 한계

### 1.3 해결 방향: 구간 추적 방식

```
[기존] maxWatchedTime = 마지막 도달 지점 → 건너뛰기 방지 필요 → 버퍼링에 취약
[신규] watchedSet = 실제 시청한 초 집합 → 건너뛰기 방지 불필요 → 버퍼링 무관
```

| 시나리오 | 기존 방식 | 구간 추적 방식 |
|----------|-----------|---------------|
| 정상 시청 (처음~끝) | 100% | 100% |
| 중간 버퍼링 15초+ | **60~70%에서 멈춤** | 100% (버퍼링 무관) |
| 건너뛰기로 끝까지 | 차단 (의도) | 건너뛴 구간 미포함 → 낮은 % |
| 탭 전환 후 복귀 | 리셋 위험 | 기존 Set 유지, 정상 |

### 1.4 Related Documents

- 코드: `js/progress.js`, `lesson.html` (Vimeo 진도 추적 영역)
- DB: `lesson_progress` 테이블

---

## 2. Scope

### 2.1 In Scope

- [x] `updateMaxWatchedTime()` 건너뛰기 방지 로직 **제거**
- [x] `Set` 기반 구간 추적 시스템 구현 (1초 단위)
- [x] `watched_seconds` DB 컬럼: maxWatchedTime → Set.size (실제 시청 초) 로 의미 변경
- [x] Vimeo 전용으로 정리 (Native/YouTube 미사용 코드 제거)
- [x] 진도 저장 안정성 유지 (visibilitychange, 15초 주기, 재시도)

### 2.2 Out of Scope

- 서버 사이드 진도 검증 (Supabase Edge Function) — 향후 별도
- 관리자 진도 수동 보정 UI — 별도 feature
- DB 스키마 변경 (기존 `lesson_progress` 컬럼 그대로 사용)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| FR-01 | `Set`으로 1초 단위 시청 구간 추적. `수강률 = Set.size / duration * 100` | Critical |
| FR-02 | 건너뛰기 방지 로직 완전 제거. 학생이 자유롭게 탐색 가능 | Critical |
| FR-03 | 버퍼링/탭전환/네트워크 지연 상관없이 정상 시청 시 100% 달성 | Critical |
| FR-04 | DB 저장 시 `watched_seconds = Set.size`, `progress_percent = Set.size/duration*100` | High |
| FR-05 | 페이지 로드 시 기존 `watched_seconds` 값으로 Set 초기 복원 | High |
| FR-06 | 건너뛰기한 구간은 수강률에 미포함 (꼼수 방지) | High |

### 3.2 Non-Functional Requirements

| Category | Criteria |
|----------|----------|
| 신뢰성 | 정상 시청 시 수강률 누락 0% |
| 성능 | Set 메모리: 60분 영상 = 3600개 정수 = ~30KB (무시 가능) |
| 호환성 | Chrome, Safari, 모바일 브라우저 |
| 하위호환 | 기존 `lesson_progress` 데이터 보존 (새 방식으로 덮어쓰기만 함) |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 끝까지 정상 시청 시 수강률 95%+ (100% 근접)
- [ ] 버퍼링 발생해도 수강률 정상 기록
- [ ] 건너뛰기 시 건너뛴 구간 미포함
- [ ] 기존 학생 데이터 손실 없음
- [ ] mypage, admin 수강률 표시 정상

### 4.2 Quality Criteria

- [ ] lesson.html 내 Native/YouTube 미사용 tracking 코드 제거
- [ ] `updateMaxWatchedTime()` 함수 완전 제거
- [ ] 코드 가독성 향상 (인라인 → 함수 분리)

---

## 5. Risks and Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| 학생이 영상 틀어놓고 안 봐도 수강률 오름 | Low | 수업 특성상 큰 문제 아님. 필요 시 향후 퀴즈 연동으로 해결 |
| 기존 watched_seconds 값과 새 방식 불일치 | Medium | 새 Set.size가 기존 값보다 클 때만 업데이트 (기존 진도 보호) |
| Set이 페이지 리로드 시 초기화 | Medium | DB의 watched_seconds로 복원 + 15초 주기 저장으로 유실 최소화 |

---

## 6. Architecture

### 6.1 핵심 알고리즘

**제거:**
```javascript
// 삭제: updateMaxWatchedTime() 전체
// 삭제: maxWatchedTime 변수
// 삭제: lastPlaybackTime 변수
// 삭제: 건너뛰기 판정 로직
```

**신규:**
```javascript
const watchedSet = new Set(); // 시청한 초를 기록

// Vimeo timeupdate 이벤트 (~250ms 간격)
vimeoPlayer.on('timeupdate', function(data) {
    const sec = Math.floor(data.seconds);
    watchedSet.add(sec); // 현재 초를 Set에 추가 (중복 자동 무시)
    
    const progress = data.duration > 0 
        ? Math.min(Math.round((watchedSet.size / data.duration) * 100), 100) 
        : 0;
    
    // UI 업데이트
    updateProgressUI(progress);
});

// 저장 시
function saveProgress() {
    updateLessonProgress(userId, lessonId, {
        watchedSeconds: watchedSet.size,  // 실제 시청한 초 수
        totalSeconds: videoDuration,
        lastPosition: currentTime
    });
}
```

### 6.2 데이터 흐름

```
[Vimeo timeupdate] → watchedSet.add(초) → Set.size / duration = 수강률
       ↓ (15초마다 / pause / visibilitychange)
  saveProgress() → updateLessonProgress() → Supabase lesson_progress
       ↓
  mypage: getCourseProgress() → completedLessons 기반 코스 수강률
```

### 6.3 DB 변경 없음

| 컬럼 | 기존 의미 | 변경 후 의미 |
|------|-----------|-------------|
| `watched_seconds` | maxWatchedTime (도달 지점) | watchedSet.size (실제 시청한 초 수) |
| `progress_percent` | maxWatchedTime/duration | watchedSet.size/duration |
| `is_completed` | watched_seconds >= total * 0.95 | 동일 |
| `last_position` | 마지막 재생 위치 | 동일 |

---

## 7. Implementation Order

| Step | Task | Files |
|------|------|-------|
| 1 | `lesson.html` — watchedSet 기반 Vimeo 진도 추적으로 교체 | `lesson.html` |
| 2 | `lesson.html` — `updateMaxWatchedTime()` 및 건너뛰기 관련 코드 제거 | `lesson.html` |
| 3 | `lesson.html` — Native/YouTube 미사용 tracking 코드 정리 | `lesson.html` |
| 4 | `js/progress.js` — watched_seconds 비교 로직 확인 (새 방식 호환) | `js/progress.js` |
| 5 | 수동 테스트: 정상 시청, 버퍼링, 건너뛰기, 탭전환 시나리오 | — |

---

## 8. Next Steps

1. [ ] PM 검토 및 승인
2. [ ] 구현 시작 (Design 생략 — 변경 범위가 명확하고 DB 변경 없음)

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial draft — timeDiff 허용치 확대 방식 | CTO (AI) |
| 2.0 | 2026-04-05 | 전면 재설계 — 건너뛰기 방지 제거, Set 기반 구간 추적 방식 전환 | CTO (AI) |
