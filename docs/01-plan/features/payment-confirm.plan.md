# Payment Confirm - Plan

## 1. 배경 및 문제

### 현재 결제 흐름 (문제 있음)
```
사용자 → 토스 결제창 → 결제 완료 → payment-success.html 리다이렉트
→ 클라이언트에서 직접 DB 업데이트 (orders.status = 'DONE') → 끝
```

### 문제점

| # | 문제 | 심각도 | 설명 |
|---|------|--------|------|
| 1 | **결제 승인(confirm) API 미호출** | CRITICAL | 토스 v2에서는 결제 후 서버에서 confirm API를 호출해야 실제 결제가 확정됨. 미호출 시 라이브 모드에서 결제 자동 취소됨 |
| 2 | **시크릿 키 없음** | CRITICAL | confirm API에는 시크릿 키가 필요하나, 서버 사이드 코드가 없어 시크릿 키를 사용할 곳이 없음 |
| 3 | **클라이언트 금액 검증** | HIGH | URL 파라미터(amount)로 금액을 검증하고 있어, 브라우저에서 URL 조작 시 가짜 주문 완료 가능 |
| 4 | **클라이언트 DB 직접 수정** | HIGH | 결제 완료 처리(orders.status = DONE, purchases INSERT)를 프론트엔드에서 직접 수행 |

### 테스트 모드에서 문제없었던 이유
- 토스 테스트 모드는 confirm 없이도 결제가 자동 승인 처리됨
- 라이브 모드에서는 confirm 미호출 시 10분 후 결제 자동 취소

## 2. 정상 결제 흐름 (목표)

```
사용자 → 토스 결제창 → 결제 완료 → payment-success.html 리다이렉트
→ Supabase Edge Function 호출 (paymentKey, orderId, amount)
→ Edge Function에서:
  1. 토스 confirm API 호출 (시크릿 키 사용)
  2. 금액 검증 (서버 사이드)
  3. orders 테이블 업데이트
  4. purchases 테이블 INSERT
  5. 결과 반환
→ 클라이언트에서 성공 화면 표시
```

## 3. 솔루션

### Supabase Edge Function 생성: `confirm-payment`

- **위치**: `supabase/functions/confirm-payment/index.ts`
- **역할**: 토스 결제 승인 + DB 업데이트를 서버에서 처리
- **환경변수**: `TOSS_SECRET_KEY` (Supabase Secrets에 저장)

### payment-success.html 수정

- DB 직접 수정 코드 제거
- Edge Function 호출로 대체
- 에러 핸들링 강화

## 4. 범위

### In Scope
- Supabase Edge Function `confirm-payment` 생성
- `payment-success.html` 수정 (Edge Function 호출)
- 토스 시크릿 키 환경변수 설정 가이드
- 쿠폰 할인 로직 서버 이관

### Out of Scope
- 결제 취소/환불 기능 (별도 feature)
- 결제 수단 추가
- 가상계좌 입금 확인 웹훅

## 5. 위험 요소

| 위험 | 대응 |
|------|------|
| Edge Function 배포 실패 | 로컬 테스트 후 배포 |
| 시크릿 키 노출 | Supabase Secrets에만 저장, 코드에 하드코딩 금지 |
| 기존 테스트 결제 데이터 불일치 | 기존 데이터는 그대로 유지, 신규 결제부터 적용 |
| Edge Function 응답 지연 | 타임아웃 설정 + 로딩 UI |

## 6. 필요 정보 (PM 확인)

- [ ] 토스페이먼츠 라이브 시크릿 키 (`live_sk_...`)
- [ ] 토스페이먼츠 라이브 클라이언트 키 (`live_ck_...`)
