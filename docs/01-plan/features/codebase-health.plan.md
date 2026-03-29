# Codebase Health - Issue Resolution Plan

> Created: 2026-03-29
> Status: In Progress
> Priority: CRITICAL issues first, then HIGH with PM approval

---

## Phase 1: CRITICAL Issues (즉시 수정)

### C1. SMS Edge Function 보안
- **문제**: API 키 하드코딩 + 인증 없음
- **파일**: `supabase/functions/send-nhn-sms/index.ts`
- **수정**: 환경변수 이동 + Authorization 헤더 체크 추가
- **위험도**: 낮음 (Edge Function 단독 수정, 프론트 영향 없음)
- [x] 완료 (2026-03-29) - 환경변수 + Auth 헤더 체크 추가

### C2. 쿠폰 race condition
- **문제**: 동시 결제 시 쿠폰 중복 사용 가능
- **파일**: `supabase/functions/confirm-payment/index.ts`
- **수정**: coupon update에 `.eq('is_used', false)` 조건 추가
- **위험도**: 낮음 (쿼리 조건 추가만, 정상 플로우 영향 없음)
- [x] 완료 (2026-03-29) - `.eq('is_used', false)` atomic update

### C3. supabase-config.js 중복 함수 제거
- **문제**: auth.js와 함수 3개 중복 → UI 충돌 (inline style vs Tailwind class)
- **파일**: `js/supabase-config.js`
- **수정**: 초기화 코드만 남기고 중복 함수/리스너 제거
- **위험도**: 중간 (모든 페이지에 영향 → 전수 테스트 필요)
- [x] 완료 (2026-03-29) - 초기화만 남기고 중복 함수/리스너 전부 제거

### C4. 진도 건너뛰기 감지 완화
- **문제**: 2초 간격이 너무 엄격 → 느린 기기/백그라운드 탭에서 진도 멈춤
- **파일**: `lesson.html`
- **수정**: 허용 간격 2초→5초, 버퍼링 고려
- **위험도**: 낮음 (lesson.html 내부 로직만)
- [x] 완료 (2026-03-29) - 허용 간격 2초→5초

### C5. 채점 결과 DOM ID 불일치
- **문제**: `grading-result` 참조하지만 실제 ID는 `grading-result-modal`
- **파일**: `lesson.html`
- **수정**: DOM ID 참조 수정
- **위험도**: 낮음 (lesson.html 내부만)
- [x] 완료 (2026-03-29) - grading-result → grading-result-modal 등

### C6. 이메일 찾기 마스킹
- **문제**: 이메일 전체 노출 → 이메일 수집 공격 가능
- **파일**: `auth.html`
- **수정**: 결과를 `h***@gmail.com` 형태로 마스킹 + innerHTML→textContent
- **위험도**: 낮음 (auth.html 내부만)
- [x] 완료 (2026-03-29) - 마스킹 + innerHTML→textContent

### C7. validateSession fail-open 수정
- **문제**: 오류 시 valid:true 반환 → DB 장애 시 제한 무력화
- **파일**: `js/auth.js`
- **수정**: catch 블록에서 valid:false 반환
- **위험도**: 중간 (네트워크 불안정 시 정상 사용자도 튕길 수 있음 → graceful 처리)
- [x] 완료 (2026-03-29) - 3회 연속 에러 후 차단 (일시적 장애 허용)

### C8. 이중 이미지 압축 제거
- **문제**: lesson.html에서 JPEG 압축 후 다시 WebP 변환
- **파일**: `lesson.html`
- **수정**: compressImage() 제거, convertToWebP()만 사용
- **위험도**: 낮음 (이미지 업로드 로직만)
- [x] 완료 (2026-03-29) - compressImage 제거, 50MB 제한 추가

### C9. getCourseProgress 중복 레코드 처리
- **문제**: 중복 lesson_progress 레코드로 진도율 오카운트
- **파일**: `js/progress.js`
- **수정**: lesson_id 기준 deduplicate 추가
- **위험도**: 낮음 (progress.js 내부만)
- [x] 완료 (2026-03-29) - lesson_id 기준 deduplicate 추가

### C10. 세션 관리 race condition
- **문제**: active_sessions TOCTOU (read-modify-write)
- **파일**: `js/auth.js`
- **수정**: Postgres 함수로 atomic 처리 (DB 변경 필요)
- **위험도**: 높음 (DB 스키마 변경 + auth.js 수정) → Phase 1에서 계획만, Phase 2에서 실행
- [ ] 계획 수립

---

## Phase 2: HIGH Issues (PM 검토 후 진행)

### 안전한 수정 (프론트 영향 최소)

| # | 이슈 | 파일 | 위험도 | 비고 |
|---|------|------|--------|------|
| H1 | 회원가입 setTimeout→retry 로직 | auth.js | 낮음 | 회원가입 안정성 향상 |
| H2 | 세션 ID → crypto.getRandomValues | auth.js | 낮음 | 보안 강화, 동작 변화 없음 |
| H3 | device_info 중복제거 제거 | auth.js | 낮음 | 세션 관리 정확성 |
| H4 | beforeunload → sendBeacon | lesson.html | 보통 | 진도 유실 방지 |
| H5 | YouTube 진도 추적 경고 표시 | lesson.html | 낮음 | 현재 YouTube 영상 있는지 확인 필요 |
| H6 | 이미지 업로드 버킷 통일 | lesson.html, grading.js | 보통 | 기존 데이터 마이그레이션 필요 |
| H7 | CORS origin 제한 | confirm-payment | 낮음 | Edge Function만 수정 |
| H8 | XSS: innerHTML→textContent | auth.html | 낮음 | |
| H9 | hasTextbook 하드코딩 수정 | payment-success.html | 낮음 | 결제 플로우 확인 필요 |

### 위험한 수정 (관리자 페이지 관련) - 별도 계획 필요

| # | 이슈 | 위험도 | 접근 방식 |
|---|------|--------|----------|
| H10 | admin.html 모듈 분리 | **매우 높음** | 단계적 분리 (한 섹션씩) |
| H11 | loadMembers 서버사이드 페이지네이션 | **높음** | 기존 동작 보존하며 점진적 개선 |
| H12 | loadStudentAssignments 페이지네이션 | **높음** | H11과 동일 접근 |
| H13 | 알림 N+1 쿼리 최적화 | 보통 | Edge Function만 수정 |
| H14 | 알림 테이블명 통일 | **높음** | DB 확인 후 코드/문서 통일 |

**관리자 페이지 수정 원칙:**
1. admin.html은 현재 동작하는 코드를 절대 먼저 삭제하지 않음
2. 새 코드를 추가하고 검증 후 기존 코드 교체
3. 한 번에 하나의 섹션만 수정
4. 매 수정 후 PM 확인

---

## Phase 3: MEDIUM/LOW (여유 있을 때)

- 세션 폴링 30초→120초 (또는 Realtime 전환)
- 채점 알림 이중 로깅 제거
- lesson.html JS 분리 (3,015줄)
- 과제 상태 로드 가드 플래그 추가
- 디버그 로그 제거
- 쿠폰 중복 발급 방지
- 쿠폰 발급 limit(100) 해제

---

## 수정 순서 (Phase 1)

```
C1 (SMS 보안) → C2 (쿠폰) → C5 (DOM ID) → C8 (이중압축) → C9 (진도 중복)
→ C4 (건너뛰기) → C6 (이메일 마스킹) → C3 (config 중복) → C7 (세션 fail-open)
```

위험도 낮은 것부터 → 중간 순서로 진행
Edge Function/백엔드 먼저 → 프론트엔드 나중에
