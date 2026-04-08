# Plan: 학부모 결제 링크 발송 기능

> **Feature**: parent-payment-link
> **Created**: 2026-04-08
> **Status**: Draft
> **Priority**: High

---

## 1. 배경 및 목적

### 현재 문제
- 현재 결제 흐름: 학생 본인이 `course-detail.html` → `payment.html?courseId=xxx`로 직접 결제
- **학부모가 결제해야 하는 경우** (미성년자 학생), 학생 계정으로 로그인 → 결제 페이지 접근 → 학부모에게 기기 전달... 이 과정이 번거로움
- 관리자가 학부모에게 결제 링크를 직접 보내는 기능이 없음

### 목표
- **관리자가 특정 학생의 학부모에게 결제 링크를 알림톡으로 발송**할 수 있게 한다
- 학부모는 링크 클릭만으로 결제 페이지에 접근, **로그인 없이** 결제 완료 가능
- 결제 완료 시 **해당 학생 계정에 자동으로 수강권 부여**

---

## 2. 현재 시스템 분석

### 2.1 활용 가능한 기존 인프라

| 인프라 | 상태 | 용도 |
|--------|------|------|
| **NHN 알림톡** (`send-nhn-alimtalk` Edge Function) | 운영 중 | 채점 완료 알림 발송에 사용 중 |
| **토스페이먼츠** (`confirm-payment` Edge Function) | 운영 중 | 카드/가상계좌 결제 승인 처리 |
| **Supabase `orders` 테이블** | 운영 중 | 주문 생성/관리 |
| **Supabase `purchases` 테이블** | 운영 중 | 수강권 부여 |
| **Supabase `profiles` 테이블** | 운영 중 | 학생/학부모 연락처 보유 (`phone`, `guardian_phone`) |
| **`notification_logs` 테이블** | 운영 중 | 알림 발송 내역 기록 |

### 2.2 현재 결제 흐름 (변경 불필요)
```
학생 로그인 → course-detail.html → payment.html?courseId=xxx
→ 토스 결제창 → payment-success.html → confirm-payment Edge Function
→ orders DONE + purchases INSERT
```

### 2.3 핵심 제약 사항
- **토스페이먼츠**: 결제창 호출 시 `customerKey` 필요 (비회원 결제 = `TossPayments.ANONYMOUS`)
- **알림톡 템플릿**: 카카오 승인 필요 (신규 템플릿 등록 시 1~3일 소요)
- **보안**: 결제 링크는 1회용이어야 하며, 만료 시간 필요

---

## 3. 구현 방안

### 3.1 전체 흐름 (관리자 → 학부모)

```
[관리자 페이지]
  1. 학생 선택 + 강의 선택
  2. "결제 링크 발송" 버튼 클릭
  3. 결제 링크 토큰 생성 (DB 저장)
  4. 학부모 번호로 알림톡 발송 (결제 링크 포함)

[학부모]
  5. 알림톡 수신 → 링크 클릭
  6. 전용 결제 페이지 (로그인 불필요)
  7. 강의 정보 확인 + 토스 결제 진행
  8. 결제 완료

[서버 (Edge Function)]
  9. 결제 승인 처리
 10. 해당 학생 계정에 purchases INSERT (수강권 부여)
 11. 결제 링크 토큰 만료 처리
```

### 3.2 신규 구성 요소

#### A. DB: `payment_links` 테이블 (신규)
```sql
CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,        -- URL에 사용할 고유 토큰
  student_id UUID REFERENCES profiles(id),   -- 수강권 부여 대상 학생
  course_id UUID REFERENCES courses(id),     -- 결제할 강의
  amount INTEGER NOT NULL,                    -- 결제 금액
  status VARCHAR(20) DEFAULT 'pending',       -- pending / paid / expired / cancelled
  created_by UUID REFERENCES profiles(id),   -- 생성한 관리자
  guardian_phone VARCHAR(20),                 -- 발송 대상 학부모 번호
  expires_at TIMESTAMPTZ NOT NULL,           -- 만료 시각 (기본 72시간)
  paid_at TIMESTAMPTZ,                       -- 결제 완료 시각
  order_id VARCHAR(100),                     -- 연결된 주문 ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: 관리자만 생성, 토큰으로 조회는 공개
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;
```

#### B. 프론트엔드: `payment-link.html` (신규)
- 로그인 불필요한 전용 결제 페이지
- URL 형식: `https://allround-english.vercel.app/payment-link.html?token=xxx`
- 토큰 검증 → 강의 정보 표시 → 토스 결제 진행
- 만료/이미 결제된 토큰은 안내 메시지 표시

#### C. Edge Function: `confirm-payment-link` (신규)
- 기존 `confirm-payment`과 유사하지만:
  - 인증 토큰 대신 **payment_link 토큰**으로 검증
  - 결제 완료 시 **student_id 기준**으로 purchases INSERT
  - payment_links 상태를 `paid`로 업데이트

#### D. 알림톡 템플릿: `payment_request` (신규 - 카카오 승인 필요)
```
[올라운드영어] 수강료 결제 안내

안녕하세요, #{학생명} 학부모님.
#{강의명} 수강료 결제를 요청드립니다.

결제 금액: #{금액}원

아래 버튼을 눌러 결제를 진행해주세요.
결제 링크는 #{만료시간} 이후 만료됩니다.
```
- 버튼: `결제하기` → 결제 링크 URL

#### E. 관리자 페이지: 결제 링크 발송 UI (admin.html 수정)
- 학생 관리 or 강의 관리 섹션에 "결제 링크 발송" 기능 추가
- 학생 선택 → 강의 선택 → 금액 확인 → 발송 버튼
- 발송 내역 조회 (상태: 대기중/결제완료/만료)

---

## 4. 작업 목록 및 우선순위

### Phase 1: 기반 구축 (DB + Edge Function)
| # | 작업 | 설명 |
|---|------|------|
| 1-1 | `payment_links` 테이블 생성 | Supabase SQL Editor에서 실행 |
| 1-2 | RLS 정책 설정 | admin INSERT, 토큰 기반 공개 SELECT |
| 1-3 | `confirm-payment-link` Edge Function | 토큰 기반 결제 승인 + 학생 수강권 부여 |

### Phase 2: 학부모 결제 페이지
| # | 작업 | 설명 |
|---|------|------|
| 2-1 | `payment-link.html` 생성 | 로그인 없이 토큰으로 접근하는 결제 페이지 |
| 2-2 | 토큰 검증 + 강의 정보 표시 | 만료/결제완료 상태 분기 처리 |
| 2-3 | 토스페이먼츠 결제 연동 | 비회원 결제 (ANONYMOUS customerKey) |

### Phase 3: 알림톡 연동
| # | 작업 | 설명 |
|---|------|------|
| 3-1 | 알림톡 템플릿 등록 | NHN Cloud에 `payment_request` 템플릿 등록 + 카카오 승인 대기 |
| 3-2 | 발송 로직 구현 | 기존 `send-nhn-alimtalk` Edge Function 재활용 |

### Phase 4: 관리자 페이지 UI
| # | 작업 | 설명 |
|---|------|------|
| 4-1 | 결제 링크 발송 UI | 학생 선택 → 강의 선택 → 금액 → 발송 |
| 4-2 | 발송 내역 조회 | payment_links 테이블 기반 목록/상태 표시 |
| 4-3 | 재발송/취소 기능 | 만료 전 재발송, 취소 처리 |

---

## 5. 기술적 고려사항

### 5.1 보안
- **토큰**: crypto.randomUUID() + 추가 랜덤 문자열 (추측 불가)
- **만료**: 기본 72시간, 결제 완료 즉시 무효화
- **1회 사용**: paid 상태 전환 후 재사용 불가
- **금액 검증**: Edge Function에서 payment_links.amount vs 토스 결제금액 대조

### 5.2 알림톡 템플릿 승인 리스크
- 카카오 승인에 1~3일 소요
- **대안**: 승인 전까지 SMS로 대체 발송 가능 (기존 `send-nhn-sms` Edge Function 활용)
- 템플릿에 동적 URL 포함 시 카카오 심사가 까다로울 수 있음 → 버튼 링크 방식 권장

### 5.3 결제 실패/만료 처리
- 결제 실패: payment_links 상태 유지 (재시도 가능)
- 72시간 만료: cron 또는 조회 시점에 만료 체크
- 가상계좌(무통장): 기존 toss-webhook 로직과 동일하게 입금 확인 후 처리

### 5.4 기존 시스템 영향 최소화
- 기존 `payment.html` 결제 흐름은 **변경 없음**
- 기존 `confirm-payment` Edge Function은 **변경 없음**
- 신규 `payment-link.html` + `confirm-payment-link`으로 **별도 경로** 운영

---

## 6. 의존성 및 선행 작업

| 항목 | 상태 | 비고 |
|------|------|------|
| NHN 알림톡 API 연동 | 완료 | 채점 알림에서 사용 중 |
| 토스페이먼츠 결제 | 완료 | 라이브 키 운영 중 |
| Supabase Edge Functions | 완료 | CLI 배포 환경 구축됨 |
| profiles.guardian_phone | 완료 | 학부모 연락처 필드 존재 |
| **알림톡 신규 템플릿 승인** | **미완료** | 카카오 승인 1~3일 필요 (병렬 진행 가능) |

---

## 7. 성공 기준

- [ ] 관리자가 학생+강의 선택 후 결제 링크를 학부모에게 알림톡으로 발송할 수 있다
- [ ] 학부모가 링크 클릭 → 로그인 없이 결제 완료할 수 있다
- [ ] 결제 완료 시 학생 계정에 수강권이 자동 부여된다
- [ ] 만료된/사용된 토큰으로 접근 시 적절한 안내 메시지가 표시된다
- [ ] 관리자 페이지에서 발송 내역 및 결제 상태를 확인할 수 있다

---

## 8. 예상 일정

| Phase | 작업 | 예상 소요 |
|-------|------|-----------|
| Phase 1 | DB + Edge Function | 1일 |
| Phase 2 | 학부모 결제 페이지 | 1일 |
| Phase 3 | 알림톡 연동 | 템플릿 승인 대기 (1~3일) |
| Phase 4 | 관리자 UI | 1일 |
| 테스트 | 통합 테스트 | 0.5일 |
