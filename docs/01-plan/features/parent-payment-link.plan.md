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
- **학생이 "수강 신청" 버튼 클릭 시 "본인 결제 / 학부모 결제" 선택** 가능
- "학부모 결제" 선택 시 학부모 번호 입력 → **SMS로 결제 링크 자동 발송**
- 학부모는 링크 클릭만으로 결제 페이지에 접근, **로그인 없이** 결제 완료 가능
- 결제 완료 시 **해당 학생 계정에 자동으로 수강권 부여**
- 관리자도 관리 페이지에서 직접 결제 링크를 발송할 수 있음 (보조 기능)

---

## 2. 현재 시스템 분석

### 2.1 활용 가능한 기존 인프라

| 인프라 | 상태 | 용도 |
|--------|------|------|
| **NHN SMS** (`send-nhn-sms` Edge Function) | 운영 중 | SMS 발송 (phone + message만 전달하면 동작) |
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

### 2.3 SMS 발송 방식 선택 이유
- **알림톡은 결제 링크 발송 불가**: 카카오 정책상 결제 유도 메시지는 광고성으로 분류, 템플릿 반려 위험 높음
- **SMS는 URL 포함 제한 없음**: 템플릿 승인 불필요, 즉시 사용 가능
- **기존 `send-nhn-sms` Edge Function 재활용**: 신규 개발 최소화
- 비용: 건당 SMS ~15원 / LMS ~50원 (URL 포함 시 90바이트 초과하므로 LMS)

### 2.4 핵심 제약 사항
- **토스페이먼츠**: 비회원 결제 시 `customerKey = TossPayments.ANONYMOUS` 사용
- **SMS 글자 수**: SMS 90바이트(한글 ~45자) 초과 시 자동으로 LMS 전환 필요
- **보안**: 결제 링크는 1회용이어야 하며, 만료 시간 필요

---

## 3. 구현 방안

### 3.1 전체 흐름 (학생 주도)

```
[학생 - course-detail.html]
  1. "수강 신청" 버튼 클릭
  2. "본인 결제" / "학부모 결제" 선택 모달
  3-A. 본인 결제 → 기존 payment.html 흐름 (변경 없음)
  3-B. 학부모 결제 → 학부모 번호 입력 → 결제 링크 토큰 생성 → SMS 발송

[학부모]
  4. SMS 수신 → 링크 클릭
  5. 전용 결제 페이지 (로그인 불필요)
  6. 강의 정보 확인 + 토스 결제 진행
  7. 결제 완료

[서버 (Edge Function)]
  8. 결제 승인 처리
  9. 해당 학생 계정에 purchases INSERT (수강권 부여)
 10. 결제 링크 토큰 만료 처리
```

### 3.1-B 보조 흐름 (관리자 발송)
관리자도 admin.html에서 직접 학생/강의를 선택하여 결제 링크를 발송할 수 있음.

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

-- RLS: 관리자만 생성, 토큰으로 조회는 공개 (비로그인 학부모 접근 허용)
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin_insert" ON payment_links FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "public_select_by_token" ON payment_links FOR SELECT
  TO anon, authenticated USING (true);
```

#### B. 프론트엔드: `payment-link.html` (신규)
- 로그인 불필요한 전용 결제 페이지
- URL 형식: `https://allround-english.vercel.app/payment-link.html?token=xxx`
- 토큰 검증 → 강의 정보 표시 → 토스 결제 진행
- 상태별 분기:
  - `pending` + 미만료: 정상 결제 페이지 표시
  - `paid`: "이미 결제 완료된 링크입니다" 안내
  - `expired`/만료: "만료된 링크입니다. 학원에 문의해주세요" 안내

#### C. Edge Function: `confirm-payment-link` (신규)
- 기존 `confirm-payment`과 유사하지만:
  - 인증 토큰 대신 **payment_link 토큰**으로 검증
  - 결제 완료 시 **student_id 기준**으로 purchases INSERT
  - payment_links 상태를 `paid`로 업데이트
  - payment_links.amount vs 토스 결제금액 대조 (금액 변조 방지)

#### D. SMS 메시지 (템플릿 승인 불필요)
```
[올라운드영어] 수강료 결제 안내
{학생명}님의 {강의명} 수강료({금액}원) 결제 링크입니다.
https://allround-english.vercel.app/payment-link.html?token=xxx
* 72시간 내 결제해주세요.
```
- 기존 `send-nhn-sms` Edge Function에 phone + message 전달
- 글자 수 90바이트 초과 → NHN에서 자동 LMS 전환

#### E. 관리자 페이지: 결제 링크 발송 UI (admin.html 수정)
- 학생 관리 or 강의 관리 섹션에 "결제 링크 발송" 기능 추가
- 학생 선택 → 강의 선택 → 금액 확인 → 학부모 번호 확인 → 발송 버튼
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
| 2-4 | 결제 성공/실패 페이지 | 토큰 기반 전용 성공/실패 처리 |

### Phase 3: SMS 발송 연동
| # | 작업 | 설명 |
|---|------|------|
| 3-1 | SMS 메시지 생성 로직 | 학생명/강의명/금액/링크 조합 |
| 3-2 | 기존 `send-nhn-sms` 호출 | phone + message 전달 (LMS 자동 전환) |

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

### 5.2 SMS 발송 관련
- 90바이트 초과 시 LMS로 자동 전환 (NHN Cloud 정책)
- LMS 비용: 건당 ~50원 (SMS ~15원 대비 높지만 URL 포함 필수)
- 발송 실패 시 관리자에게 실패 알림 표시
- `send-nhn-sms`에 LMS 전환 로직이 NHN 서버 측에서 자동 처리됨

### 5.3 결제 실패/만료 처리
- 결제 실패: payment_links 상태 유지 (재시도 가능)
- 72시간 만료: 조회 시점에 `expires_at < NOW()` 체크 (별도 cron 불필요)
- 가상계좌(무통장): 기존 toss-webhook 로직과 동일하게 입금 확인 후 처리

### 5.4 기존 시스템 영향 최소화
- 기존 `payment.html` 결제 흐름은 **변경 없음**
- 기존 `confirm-payment` Edge Function은 **변경 없음**
- 신규 `payment-link.html` + `confirm-payment-link`으로 **별도 경로** 운영

---

## 6. 의존성 및 선행 작업

| 항목 | 상태 | 비고 |
|------|------|------|
| NHN SMS API 연동 (`send-nhn-sms`) | 완료 | phone + message 전달로 동작 |
| 토스페이먼츠 결제 | 완료 | 라이브 키 운영 중 |
| Supabase Edge Functions | 완료 | CLI 배포 환경 구축됨 |
| profiles.guardian_phone | 완료 | 학부모 연락처 필드 존재 |
| NHN_CLOUD_APP_KEY 환경변수 | 확인 필요 | SMS Edge Function에서 사용 중이면 OK |
| NHN_SENDER_PHONE 환경변수 | 확인 필요 | 발신번호 사전등록 필수 |

---

## 7. 성공 기준

- [ ] 관리자가 학생+강의 선택 후 결제 링크를 학부모에게 SMS로 발송할 수 있다
- [ ] 학부모가 SMS 링크 클릭 → 로그인 없이 결제 완료할 수 있다
- [ ] 결제 완료 시 학생 계정에 수강권이 자동 부여된다
- [ ] 만료된/사용된 토큰으로 접근 시 적절한 안내 메시지가 표시된다
- [ ] 관리자 페이지에서 발송 내역 및 결제 상태를 확인할 수 있다

---

## 8. 예상 일정

| Phase | 작업 | 비고 |
|-------|------|------|
| Phase 1 | DB + Edge Function | 템플릿 승인 대기 없음 |
| Phase 2 | 학부모 결제 페이지 | 기존 payment.html 참고 |
| Phase 3 | SMS 발송 연동 | 기존 Edge Function 재활용 |
| Phase 4 | 관리자 UI | admin.html에 섹션 추가 |
| 테스트 | 통합 테스트 | SMS 수신 + 결제 + 수강권 확인 |
