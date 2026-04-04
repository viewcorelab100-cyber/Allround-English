# Plan: Sentry Bugfix

> Sentry에서 수집된 미해결 JavaScript 오류 수정

## 1. Background

Sentry 모니터링에서 10건의 미해결 이슈가 발견됨. 이 중 5건은 코드 수정으로 해결 가능하고, 5건은 외부 환경(크로스오리진, 브라우저 제한, 사용자 권한) 이슈로 무시 처리 대상.

## 2. Goals

- 코드 버그로 인한 Sentry 오류 0건 달성
- 외부 이슈는 Sentry ignoreErrors에 추가하여 노이즈 제거
- 사용자 경험에 영향을 주는 런타임 에러 제거

## 3. Issues (수정 대상 5건)

### 3-1. JAVASCRIPT-9: showSection is not defined (admin.html)
- **심각도**: HIGH
- **발생**: 2026-04-03, Count: 1
- **원인**: 페이지 로딩 중 사이드바 클릭 시, 메인 스크립트(`<script>` line 1620~)가 아직 파싱되지 않아 `showSection` 함수 미정의
- **수정**: 사이드바 앞에 스텁 함수 선언 + init()에서 pending 섹션 처리
- **상태**: ✅ 수정 완료

### 3-2. JAVASCRIPT-5: Identifier 'validPurchases' has already been declared (mypage.html)
- **심각도**: HIGH
- **발생**: 2026-04-02, Count: 2
- **원인**: mypage.html에서 `const validPurchases`가 중복 선언됨 (같은 스코프 내 재선언)
- **수정 방향**: 중복 선언 제거 또는 스코프 분리
- **파일**: mypage.html

### 3-3. JAVASCRIPT-6: showTab is not defined (mypage.html)
- **심각도**: HIGH
- **발생**: 2026-04-02, Count: 1
- **원인**: JAVASCRIPT-9과 동일 패턴 - 페이지 로딩 중 탭 클릭 시 함수 미정의
- **수정 방향**: mypage.html에도 조기 스텁 함수 선언
- **파일**: mypage.html

### 3-4. JAVASCRIPT-7: Cannot read properties of null (reading 'id') (payment.html)
- **심각도**: MEDIUM
- **발생**: 2026-04-03, Count: 1
- **원인**: `requestPayment()` 함수에서 null 객체의 id 프로퍼티 접근
- **수정 방향**: null 체크 추가
- **파일**: payment.html

### 3-5. JAVASCRIPT-3: Cannot read properties of null (reading 'id') (mypage.html)
- **심각도**: MEDIUM
- **발생**: 2026-04-01, Count: 3
- **원인**: mypage.html에서 null 객체의 id 프로퍼티 접근 (로컬 경로로 발생 - 개발 환경)
- **수정 방향**: null 체크 추가
- **파일**: mypage.html

## 4. Issues (무시 대상 5건)

| ID | Title | 사유 |
|----|-------|------|
| JAVASCRIPT-2 | `<unknown>` Script error | 크로스오리진 - 제어 불가 |
| JAVASCRIPT-4 | `<unknown>` Script error | 크로스오리진 - 제어 불가 |
| JAVASCRIPT-A | UnsupportedError: Fullscreen | Mobile Safari 제한 - Vimeo 플레이어 |
| JAVASCRIPT-1 | NotAllowedError | 사용자 권한 거부 - 이미 ignoreErrors에 있음 |
| JAVASCRIPT-8 | TypeError: r.name.includes | Vimeo 플레이어 내부 에러 |

## 5. Implementation Order

1. ~~JAVASCRIPT-9: admin.html showSection 스텁~~ (완료)
2. JAVASCRIPT-5: mypage.html validPurchases 중복 선언
3. JAVASCRIPT-6: mypage.html showTab 스텁
4. JAVASCRIPT-7: payment.html null 체크
5. JAVASCRIPT-3: mypage.html null 체크
6. Sentry ignoreErrors 설정 업데이트 (UnsupportedError, 플레이어 내부 에러)

## 6. Success Criteria

- Sentry 수정 대상 5건 모두 해결 (resolve)
- 무시 대상 이슈가 더 이상 새 이벤트로 수집되지 않음
- 기존 기능에 영향 없음 (회귀 없음)

## 7. Risk

- `validPurchases` 중복 선언 수정 시 로직 변경 가능성 -> 스코프 확인 필수
- payment.html null 체크 시 결제 플로우 영향 -> 방어적 처리 + 사용자 안내 필요
