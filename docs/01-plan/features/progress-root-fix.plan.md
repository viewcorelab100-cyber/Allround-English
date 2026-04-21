# progress-root-fix Planning Document

> **Summary**: 진도율 일대일 대응 종결 — `ended` 이벤트 버그 수정 + 완료 판정 기준 완화 + 야간 자동 보정 cron 도입으로 Case A/B 회귀 근본 해결
>
> **Project**: Allround-English
> **Author**: CTO (AI)
> **Date**: 2026-04-21
> **Status**: Draft (v1)
> **Related**: `progress-tracking-fix.plan.md` (2026-04-05, 구간 추적 도입) → 여전히 Case B 회귀 발생 → 본 문서로 근본 해결

---

## 1. Overview

### 1.1 Purpose

4/5 구간 추적 도입, 4/17 seek/glitch 보정 패치 이후에도 지속되는 진도율 이상치(Case A/B)와 "학생이 재시청해도 진도율이 오르지 않는" 문제를 구조적으로 해결하여, **일대일 수동 대응을 제거**한다.

### 1.2 Background — 반복되는 회귀의 진짜 원인

#### ① `ended` 이벤트 치명적 버그 (`lesson.html:1042-1052`)

```javascript
vimeoPlayer.on('ended', function() {
    const progress = getWatchedProgress(videoDuration);
    if (progress >= 90) {  // ← 이 조건이 근본 버그
        const totalSec = Math.floor(videoDuration);
        for (let s = 0; s <= totalSec; s++) watchedSet.add(s);
    }
    saveVimeoProgress();
});
```

- **학생이 영상을 끝까지 시청 → `ended` 이벤트 발생**이 가장 강력한 완료 증거
- 그런데 현재 `watchedSet`이 timeupdate 누락으로 47%만 쌓였다면, `progress < 90` 조건에 걸려 Set 보정이 **스킵됨**
- 결과: 끝까지 봤음에도 47%로 저장되고 `is_completed = false`
- **Case B 회귀의 주 원인**

#### ② `watchedSet` 세션 메모리 한계 + DB 스키마 제약

- `watchedSet`은 페이지 로드 시 `new Set()`으로 초기화 (세션당)
- DB에는 시청 구간이 아닌 **`watched_seconds` 숫자**만 저장 (`js/progress.js:30`)
- 재시청 시 2회차 Set은 빈 상태에서 시작 → 이전 세션의 "놓친 구간"을 합집합으로 보완 불가
- 저장 로직(`progress.js:40`)도 `Math.max(new_watched, existing_watched)`로 단순 비교 → Set 합집합 불가능
- **결과: "두 번 봤는데 진도율 그대로" 현상**

#### ③ 완료 판정이 단일 조건 (`progress.js:33`)

```javascript
is_completed: watchedSeconds >= progressData.totalSeconds * 0.90
```

- `watched_seconds` 하나에만 의존 → 위 ①, ② 버그에 전적으로 노출
- `last_position`(어디까지 봤는지)은 완료 판정에 전혀 사용 안 됨 → 실제 도달했다는 증거 무시

### 1.3 Goals

- **G1**. 학생이 영상 끝까지 시청 시 즉시 완료 처리 (`ended` 버그 수정)
- **G2**. `watched_seconds`가 부족해도 `last_position`이 끝에 도달했다면 완료 인정 (판정 완화)
- **G3**. 기존에 쌓여있는 Case A/B 이상치 및 향후 발생분을 야간 cron으로 자동 보정 (수동 보정 불필요)
- **G4**. 진단 쿼리 재실행 시 이상치 건수 10건/주 이하로 감소

### 1.4 Non-Goals

- **시청 세그먼트의 DB 저장 (정석 해결)**: `watched_seconds` 숫자 대신 JSON array로 구간 저장 → Set 합집합 가능. 구조 변경 규모가 크고, 위 3개 패치로 운영 부담은 충분히 해소되므로 본 작업에서는 **제외**. 향후 별도 마일스톤.
- **Vimeo Analytics API 연동**: 유료 플랜 검토 필요, 현재 단계 오버엔지니어링
- **Heartbeat-based 서버 추적**: 구조 변경 규모 큼, 우선순위 낮음

---

## 2. Scope

### 2.1 In Scope (3 changes)

| # | 변경 | 파일 | 예상 공수 |
|---|---|---|---|
| **C1** | `ended` 이벤트에서 `progress >= 90` 조건 제거 — 끝까지 도달 시 항상 `watchedSet` 꽉 채움 | `lesson.html:1042-1052` | 1시간 |
| **C2** | `is_completed` 판정 완화 — `watched >= 70% OR last_position >= 95%` | `js/progress.js:33` | 2시간 |
| **C3** | 야간 자동 보정 pg_cron — Case B 이상치 자동 완료 처리 | `supabase/migrations/*_progress_auto_fix.sql` | 4시간 |

### 2.2 Out of Scope

- 시청 세그먼트 DB 스키마 확장
- Vimeo API 연동
- 새 UI 요소 추가
- 기존 4/17 진단 로깅(`progressDiag`) 변경

---

## 3. Success Criteria

### 3.1 정량 지표

- **배포 1주일 후** `scripts/diagnose-progress.sql` 재실행 결과:
  - Case A(watched≥85% but not completed): **0건** (완료 판정 완화로 자동 해소)
  - Case B(position > watched+120s): **주당 5건 이하** (현재 주당 8건+)
- 학생 진도율 관련 문의: **주 0~1건** (현재 주 2~3건)

### 3.2 정성 검증

- 영상 끝까지 시청한 테스트 계정이 탭 전환/백그라운드 재생 후에도 완료 처리되는지 확인
- cron 실행 로그에서 자동 보정 건수가 기록되는지 확인
- 학생 민원 발생 시 수동 DB 보정 없이 다음 cron 실행으로 해소되는지 확인

---

## 4. Risks & Mitigations

| 위험 | 영향 | 완화책 |
|---|---|---|
| **R1. 부정행위 확대** — 완료 기준 완화로 건너뛰기 악용 가능 | 낮음. 기존 seek 방지 로직(lesson.html:922-928) 유지되어 `last_position` 도달은 자연 재생 또는 허용된 seek만 가능. | 기존 로직 변경 없음. 악용 의심 시 `playback_errors` 로그로 감지 가능 |
| **R2. cron 오작동** — 정상 학생을 완료로 잘못 표시 | 중. 역진행 시 되돌리기 힘듦 | ① 첫 배포는 SELECT 모드(dry-run)로 영향받을 row 미리 확인 ② 보정 조건 엄격: position≥95% AND updated_at ≥ 7일 이내 AND watched_seconds ≥ duration*0.5 (너무 적게 본 건 제외) ③ 매 실행마다 로그 테이블에 기록 |
| **R3. `ended` 버그 수정 시 100% 처리로 인한 과제 모달 동시 트리거** | 낮음. 기존 흐름과 동일. | 변경 없음, `showAssignmentSequence()` 호출 순서 유지 |
| **R4. 배포 직후 회귀** | 중. static HTML 배포라 즉시 전 사용자 영향 | ① C1, C2 먼저 배포 후 하루 관찰 ② C3(cron)은 그 다음 배포 ③ 첫 cron 실행 후 1시간 모니터링 |

---

## 5. Rollout Plan

### Phase 1 (Day 1) — 클라이언트 수정
1. `lesson.html` `ended` 핸들러 수정 (C1)
2. `js/progress.js` `is_completed` 조건 완화 (C2)
3. 테스트 계정으로 영상 끝까지 재생 → 진도율 100% 확인
4. auto-commit & push

### Phase 2 (Day 2) — Dry-run
1. pg_cron 쿼리를 SELECT 모드로 작성, 영향받을 row 수 조회
2. PM과 함께 영향 건수 검토 (예상: 기존 Case B 5~10건)
3. 문제 없으면 Phase 3 진행

### Phase 3 (Day 2~3) — Cron 배포
1. Supabase migration으로 pg_cron job 등록 (매일 03:00 KST 실행)
2. 첫 실행 후 보정된 row 수 확인
3. 1주일 후 `diagnose-progress.sql` 재실행하여 성공 기준 검증

---

## 6. Open Questions

- **Q1**. 완료 판정 완화 기준을 70%/95%로 할지, 75%/90%로 할지 — 본 문서는 70%/95% 채택(엄격한 seek 방지 로직이 이미 있으므로 안전)
- **Q2**. cron 실행 주기 — 매일 03:00 KST. 빈도 더 높일 필요 있나? → 당분간 매일로 충분, 필요 시 6시간 간격으로 조정
- **Q3**. 기존 피해 학생 소급 보정 — cron 첫 실행으로 자동 처리됨. 별도 수동 작업 불필요

---

## 7. References

- `project_progress_tracking_regression.md` (memory) — 4/17 Case B 회귀 8건 확인
- `scripts/diagnose-progress.sql` — 진단 쿼리
- `docs/01-plan/features/progress-tracking-fix.plan.md` — 4/5 1차 구간 추적 도입
- `lesson.html:911-948` — `recordWatchedSecond` 구현
- `lesson.html:1042-1052` — `ended` 이벤트 핸들러 (C1 수정 대상)
- `js/progress.js:30-36` — `progressRecord` 구성 (C2 수정 대상)
