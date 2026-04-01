# progress-tracking-fix Planning Document

> **Summary**: 강의 완료 후에도 진도율이 반영되지 않는 문제의 근본적 해결
>
> **Project**: Allround-English
> **Author**: CTO (AI)
> **Date**: 2026-04-01
> **Status**: Draft

---

## 1. Overview

### 1.1 Purpose

학생이 강의 영상을 끝까지 시청했음에도 진도율(progress_percent)이 올라가지 않는 현상을 근본적으로 해결한다.

### 1.2 Background

현재 진도 추적 시스템은 **클라이언트 사이드에서만** 동작하며, 다음과 같은 구조적 결함이 존재한다:

**근본 원인 분석 (5가지)**

| # | 원인 | 심각도 | 설명 |
|---|------|--------|------|
| 1 | **건너뛰기 방지 로직 과도하게 엄격** | CRITICAL | `timeDiff > 0 && timeDiff < 5` 조건이 Vimeo 버퍼링, 네트워크 지연, 브라우저 탭 전환 시 5초 이상 gap이 발생하면 `maxWatchedTime`을 멈추게 함. 학생이 정상적으로 연속 재생해도 진도가 올라가지 않는 직접적 원인 |
| 2 | **`beforeunload` 비신뢰성** | HIGH | 모바일 브라우저(Safari, Chrome)에서 `beforeunload`가 발화하지 않아 마지막 30초 분량의 진도가 유실됨 |
| 3 | **DB unique constraint 부재** | MEDIUM | `lesson_progress` 테이블에 `(user_id, lesson_id)` unique 제약조건 없음. 중복 행 발생 시 클라이언트 dedup 로직에 의존 |
| 4 | **저장 실패 무시** | MEDIUM | `saveVimeoProgress()`가 실패해도 사용자에게 알림 없이 조용히 실패. 에러 로그만 console에 출력 |
| 5 | **timeupdate 이벤트 불규칙성** | HIGH | Vimeo Player의 `timeupdate`는 약 250ms 간격이지만, 느린 기기/네트워크에서 1~10초 gap 발생 가능. 현재 로직은 5초 이상 gap을 모두 "건너뛰기"로 판정 |

**재현 시나리오:**
1. 학생이 영상 재생 중 다른 탭으로 전환 → 복귀 시 timeupdate gap > 5초 → 이후 진도 멈춤
2. 느린 Wi-Fi에서 버퍼링 발생 → 버퍼링 해제 후 timeDiff > 5초 → 진도 멈춤
3. 모바일에서 영상 끝까지 시청 후 앱 전환/브라우저 닫기 → beforeunload 미발화 → 마지막 진도 유실

### 1.3 Related Documents

- 코드: `js/progress.js`, `lesson.html` (line 970~1070)
- DB: `lesson_progress` 테이블

---

## 2. Scope

### 2.1 In Scope

- [x] 건너뛰기 방지 알고리즘 개선 (timeDiff 허용 범위 확대 + 누적 방식 전환)
- [x] 진도 저장 안정성 강화 (visibilitychange, pagehide 이벤트 추가)
- [x] 중복 레코드 방지 (DB unique constraint 추가)
- [x] 저장 실패 시 재시도 로직 추가
- [x] 관리자용 진도 수동 보정 기능

### 2.2 Out of Scope

- 서버 사이드 진도 검증 (Supabase Edge Function) — 향후 별도 feature
- 비디오 DRM/암호화
- legacy `progress` 테이블 마이그레이션 (notification-system feature에서 처리)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| FR-01 | 건너뛰기 방지 알고리즘을 "누적 시청 시간" 기반으로 전환. 탭 전환/버퍼링 후에도 정상 재생 시 진도가 올라가야 함 | Critical | Pending |
| FR-02 | `visibilitychange` + `pagehide` 이벤트로 진도 저장 (beforeunload 대체/보완) | High | Pending |
| FR-03 | `lesson_progress` 테이블에 `UNIQUE(user_id, lesson_id)` 제약조건 추가 + 기존 중복 데이터 정리 마이그레이션 | High | Pending |
| FR-04 | 진도 저장 실패 시 최대 3회 재시도 (exponential backoff) | Medium | Pending |
| FR-05 | 관리자 페이지에서 특정 학생의 진도를 수동 보정할 수 있는 UI 추가 | Medium | Pending |
| FR-06 | 진도 저장 주기를 30초 → 15초로 단축하여 유실 구간 최소화 | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| 신뢰성 | 정상 재생 시 진도 누락률 0% | 테스트 시나리오 수동 검증 |
| 호환성 | Chrome, Safari, 모바일 브라우저 모두 동작 | 크로스 브라우저 테스트 |
| 성능 | 진도 저장 API 호출 시 UI 블로킹 없음 | 체감 테스트 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 탭 전환 후 복귀해도 진도가 정상 기록됨
- [ ] 버퍼링 발생 후에도 진도가 정상 기록됨
- [ ] 모바일에서 브라우저 닫아도 직전까지의 진도가 저장됨
- [ ] 중복 lesson_progress 레코드가 발생하지 않음
- [ ] 관리자가 진도를 수동 보정할 수 있음

### 4.2 Quality Criteria

- [ ] 기존 건너뛰기 방지 기능 유지 (영상 앞으로 건너뛰기는 여전히 차단)
- [ ] 기존 학생 데이터 손실 없음
- [ ] 마이그레이션 SQL 검증 완료

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| 알고리즘 완화로 건너뛰기 우회 가능 | High | Medium | 앞으로 건너뛰기(forward skip)만 차단, 연속 재생은 gap 허용 범위 확대 (5초→15초) |
| DB 마이그레이션 시 기존 데이터 손실 | High | Low | 중복 중 최고 watched_seconds 행만 보존, 나머지 삭제 후 unique 추가 |
| 저장 주기 단축으로 API 부하 증가 | Low | Low | 15초 간격은 Supabase 무료 tier에서도 충분히 처리 가능 |
| visibilitychange 미지원 브라우저 | Medium | Low | fallback으로 beforeunload 유지 |

---

## 6. Architecture Considerations

### 6.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Dynamic** | Feature-based modules, Supabase backend | ✅ |

### 6.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| 건너뛰기 방지 방식 | A) timeDiff 허용치 확대 / B) 누적 시청 시간 기반 | B) 누적 기반 | gap 크기에 의존하지 않고, "뒤로 가지 않는 한 누적"하는 방식이 버퍼링/탭전환에 강건함 |
| 진도 저장 트리거 | A) beforeunload만 / B) visibilitychange + pagehide + beforeunload | B) 멀티 이벤트 | 모바일 호환성 확보 |
| 중복 방지 | A) 클라이언트 dedup만 / B) DB unique + upsert | B) DB 레벨 | 근본적 해결 |

### 6.3 핵심 알고리즘 변경

**현재 (문제):**
```
timeupdate 발생 시:
  timeDiff = currentTime - lastPlaybackTime
  IF timeDiff > 0 AND timeDiff < 5 AND currentTime > maxWatchedTime AND currentTime <= maxWatchedTime + 5:
    maxWatchedTime = currentTime
  // → 5초 이상 gap이면 진도 멈춤!
```

**개선안:**
```
timeupdate 발생 시:
  timeDiff = currentTime - lastPlaybackTime
  
  // 정상 재생 판정: 시간이 소폭 전진 (뒤로 가지 않음)
  IF timeDiff > 0 AND timeDiff < 15:
    // 현재 위치가 maxWatchedTime 근처이면 진도 전진 허용
    IF currentTime <= maxWatchedTime + 15:
      maxWatchedTime = MAX(maxWatchedTime, currentTime)
  
  // 대폭 전진 = 건너뛰기 → maxWatchedTime 변경 없음
  // 뒤로 이동 = 복습 → maxWatchedTime 변경 없음
  
  lastPlaybackTime = currentTime
```

핵심 변경점:
- gap 허용치 5초 → 15초 (버퍼링/탭전환 커버)
- `maxWatchedTime + 5` → `maxWatchedTime + 15` (연속 재생 판정 범위 확대)
- 대폭 건너뛰기(15초 이상 점프)는 여전히 차단

---

## 7. Implementation Order

| Step | Task | Files | Dependency |
|------|------|-------|------------|
| 1 | DB 중복 데이터 정리 + unique constraint 추가 SQL 작성 | migration SQL | 없음 |
| 2 | `progress.js` — upsert 패턴으로 전환 (insert → ON CONFLICT UPDATE) | `js/progress.js` | Step 1 |
| 3 | `lesson.html` — 건너뛰기 방지 알고리즘 개선 (Vimeo + Native 양쪽) | `lesson.html` | 없음 |
| 4 | `lesson.html` — visibilitychange/pagehide 저장 트리거 추가 | `lesson.html` | 없음 |
| 5 | `lesson.html` — 저장 실패 재시도 로직 | `lesson.html`, `js/progress.js` | Step 2 |
| 6 | `lesson.html` — 저장 주기 30초→15초 변경 | `lesson.html` | 없음 |
| 7 | `admin.html` — 진도 수동 보정 UI | `admin.html` | Step 1 |
| 8 | 크로스 브라우저 테스트 (Chrome, Safari, Mobile) | — | All |

---

## 8. Next Steps

1. [ ] PM 검토 및 승인
2. [ ] Design 문서 작성 (`/pdca design progress-tracking-fix`)
3. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-01 | Initial draft — 근본 원인 분석 및 해결 방안 수립 | CTO (AI) |
