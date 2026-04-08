# Design: 학부모 결제 링크 발송 기능

> **Feature**: parent-payment-link
> **Plan**: [parent-payment-link.plan.md](../../01-plan/features/parent-payment-link.plan.md)
> **Created**: 2026-04-09
> **Status**: Draft

---

## 1. 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                       관리자 (admin.html)                        │
│  학생 선택 → 강의 선택 → 금액 확인 → "결제 링크 발송" 클릭       │
└───────────────┬─────────────────────────────────────────────────┘
                │ ① payment_links INSERT (토큰 생성)
                │ ② send-nhn-sms 호출 (SMS 발송)
                ▼
┌───────────────────────────┐     SMS     ┌──────────────────────┐
│   Supabase DB             │ ──────────► │   학부모 휴대폰       │
│   payment_links 테이블     │             │   링크 클릭           │
└───────────────────────────┘             └──────────┬───────────┘
                                                     │ ③ 링크 접속
                                                     ▼
                                          ┌──────────────────────┐
                                          │  payment-link.html   │
                                          │  (로그인 불필요)       │
                                          │  토큰 검증 → 결제 진행 │
                                          └──────────┬───────────┘
                                                     │ ④ 토스 결제
                                                     ▼
                                          ┌──────────────────────┐
                                          │  payment-link-       │
                                          │  success.html        │
                                          └──────────┬───────────┘
                                                     │ ⑤ confirm-payment-link
                                                     ▼
                                          ┌──────────────────────┐
                                          │  Edge Function       │
                                          │  결제 승인 + 수강권    │
                                          │  student_id 기준      │
                                          └──────────────────────┘
```

---

## 2. DB 설계

### 2.1 `payment_links` 테이블

```sql
CREATE TABLE payment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token VARCHAR(64) UNIQUE NOT NULL,
  student_id UUID NOT NULL REFERENCES profiles(id),
  course_id UUID NOT NULL REFERENCES courses(id),
  amount INTEGER NOT NULL,
  textbook_amount INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  created_by UUID NOT NULL REFERENCES profiles(id),
  guardian_phone VARCHAR(20) NOT NULL,
  student_name VARCHAR(100),
  course_title VARCHAR(200),
  expires_at TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  order_id VARCHAR(100),
  payment_key VARCHAR(200),
  sms_sent_at TIMESTAMPTZ,
  sms_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_payment_links_token ON payment_links(token);
CREATE INDEX idx_payment_links_status ON payment_links(status);
CREATE INDEX idx_payment_links_student ON payment_links(student_id);
```

**status 값**:
| 값 | 설명 |
|----|------|
| `pending` | 발송 완료, 결제 대기 |
| `paid` | 결제 완료 |
| `expired` | 만료됨 (72시간 초과) |
| `cancelled` | 관리자가 취소 |

### 2.2 RLS 정책

```sql
ALTER TABLE payment_links ENABLE ROW LEVEL SECURITY;

-- 관리자: 모든 CRUD
CREATE POLICY "admin_all" ON payment_links FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- 비로그인(anon): token으로 SELECT만 (학부모 결제 페이지 접근용)
CREATE POLICY "anon_select_by_token" ON payment_links FOR SELECT
  TO anon USING (true);
```

> **보안 참고**: anon SELECT를 열되, 토큰은 64자 랜덤이라 brute force 불가.
> 민감 정보(student_id 등)는 프론트에서 노출하지 않음.

---

## 3. Edge Function 설계

### 3.1 `confirm-payment-link` (신규)

**경로**: `supabase/functions/confirm-payment-link/index.ts`

**요청**:
```typescript
// POST body
{
  paymentKey: string;    // 토스 결제 키
  orderId: string;       // 주문 ID
  amount: number;        // 결제 금액
  token: string;         // payment_link 토큰 (인증 대체)
}
```

**처리 흐름**:
```
1. token으로 payment_links 조회
   → 없으면 404
   → status !== 'pending' → 400 "이미 처리된 링크"
   → expires_at < now() → 400 "만료된 링크"

2. amount vs payment_links.amount 검증
   → 불일치 시 400 "금액 변조"

3. 토스페이먼츠 결제 승인 API 호출
   → POST https://api.tosspayments.com/v1/payments/confirm
   → Basic auth (TOSS_SECRET_KEY)

4. 성공 시:
   a. orders 테이블 UPDATE (status='DONE')
   b. purchases INSERT (user_id = payment_links.student_id)
   c. payment_links UPDATE (status='paid', paid_at, order_id, payment_key)

5. 가상계좌인 경우:
   a. orders UPDATE (status='WAITING_FOR_DEPOSIT')
   b. payment_links는 아직 pending 유지
   c. toss-webhook에서 입금 확인 시 별도 처리 필요
```

**응답**:
```typescript
// 성공
{
  success: true,
  order: { id, status, ... },
  course: { title, ... },
  isVirtualAccount: boolean,
  virtualAccountInfo?: { accountNumber, bankName, dueDate }
}

// 실패
{
  success: false,
  error: string,
  code?: string
}
```

### 3.2 기존 `toss-webhook` 수정 (가상계좌 입금 확인)

현재 webhook은 orders 기준으로 처리. payment_links 경유 주문도 처리할 수 있도록:

```
입금 확인 시:
1. orderId로 orders 조회
2. orders에 payment_link_id 컬럼이 있으면:
   a. payment_links.student_id로 purchases INSERT
   b. payment_links status → 'paid'
```

> **결정 필요**: orders 테이블에 `payment_link_id` 컬럼 추가할지, 아니면 order_id로 payment_links를 역조회할지.
> → **order_id 역조회 방식 채택** (기존 orders 테이블 변경 최소화)

---

## 4. 프론트엔드 설계

### 4.1 `payment-link.html` (신규 - 학부모 결제 페이지)

**URL**: `https://allround-english.vercel.app/payment-link.html?token=xxx`

**로그인 불필요**. Supabase anon key로 토큰 기반 조회.

#### 페이지 상태 분기

| 상태 | 화면 |
|------|------|
| 유효 (pending + 미만료) | 강의 정보 + 금액 + 토스 결제 버튼 |
| 결제 완료 (paid) | "이미 결제가 완료되었습니다" 안내 |
| 만료 (expired 또는 expires_at 초과) | "결제 링크가 만료되었습니다. 학원에 문의해주세요 (0507-1339-3828)" |
| 취소 (cancelled) | "취소된 결제 링크입니다" 안내 |
| 토큰 없음/잘못됨 | "유효하지 않은 링크입니다" |

#### UI 구조 (라이트 테마, 기존 payment.html 스타일 준수)

```
┌─────────────────────────────────┐
│  ALLROUND 로고                   │
├─────────────────────────────────┤
│                                 │
│  수강료 결제                     │
│  ─────────────────              │
│                                 │
│  ┌─ 학생 정보 ──────────────┐   │
│  │ 학생: 홍길동              │   │
│  │ 강의: ALLROUND original  │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌─ 결제 금액 ──────────────┐   │
│  │ 강의비     ₩330,000      │   │
│  │ ────────────────────     │   │
│  │ 총 결제    ₩330,000      │   │
│  └──────────────────────────┘   │
│                                 │
│  ┌─ 결제 수단 ──────────────┐   │
│  │ [카드/간편결제] [무통장입금]│   │
│  └──────────────────────────┘   │
│                                 │
│  [ ────── 결제하기 ────── ]     │
│                                 │
│  ※ 결제 문의: 0507-1339-3828   │
│  ※ 링크 유효기간: 2026.04.12   │
│                                 │
├─────────────────────────────────┤
│  올라운드원격학원 | 사업자 정보   │
└─────────────────────────────────┘
```

#### 토스 결제 연동

```javascript
// 비회원 결제 (로그인 불필요)
const tossPayments = TossPayments(TOSS_CLIENT_KEY);
const payment = tossPayments.payment({
  customerKey: TossPayments.ANONYMOUS
});

await payment.requestPayment({
  method: selectedMethod,  // 'CARD' or 'VIRTUAL_ACCOUNT'
  amount: { currency: 'KRW', value: linkData.amount },
  orderId: generatedOrderId,
  orderName: linkData.course_title + ' (수강료)',
  successUrl: origin + '/payment-link-success.html?token=' + token,
  failUrl: origin + '/payment-link-fail.html?token=' + token
});
```

### 4.2 `payment-link-success.html` (신규 - 결제 성공 처리)

**기존 `payment-success.html`과 별도** (로그인 기반 로직 분리).

```javascript
async function handlePaymentLinkSuccess() {
  const params = new URLSearchParams(location.search);
  const token = params.get('token');
  const paymentKey = params.get('paymentKey');
  const orderId = params.get('orderId');
  const amount = params.get('amount');

  // confirm-payment-link Edge Function 호출 (anon key로)
  const { data, error } = await supabase.functions.invoke('confirm-payment-link', {
    body: { paymentKey, orderId, amount: parseInt(amount), token }
  });

  if (data?.success) {
    // 결제 완료 UI 표시
    showSuccess(data.course.title);
  } else {
    showError(data?.error || '결제 처리 중 오류');
  }
}
```

### 4.3 `payment-link-fail.html` (신규 - 결제 실패)

간단한 실패 안내 + "다시 시도" 버튼 (원래 결제 링크로 복귀).

---

## 5. 관리자 페이지 설계 (admin.html)

### 5.1 결제 링크 발송 UI

**진입점**: 기존 강의 관리 섹션의 각 강의 행에 "결제 링크" 버튼 추가
또는 학생 관리 → 개별 학생 → "결제 링크 발송" 버튼

#### 발송 모달

```
┌─────────────────────────────────────┐
│  결제 링크 발송                      │  ← 모달 제목
├─────────────────────────────────────┤
│                                     │
│  학생: [드롭다운 - 학생 목록]        │  ← profiles에서 조회
│  강의: [드롭다운 - 강의 목록]        │  ← courses에서 조회
│                                     │
│  강의비: ₩330,000 (자동 입력)        │  ← course.price
│  유효기간: [72시간 ▼]               │  ← 24h / 48h / 72h 선택
│                                     │
│  수신번호: 010-1234-5678            │  ← guardian_phone 자동 입력
│  (학부모 연락처)                     │     없으면 직접 입력
│                                     │
│  SMS 미리보기:                       │
│  ┌─────────────────────────────┐    │
│  │ [올라운드영어] 수강료 결제 안내│    │
│  │ 홍길동님의 ALLROUND original │    │
│  │ 수강료(330,000원) 결제 링크  │    │
│  │ https://allround-english... │    │
│  │ * 72시간 내 결제해주세요.    │    │
│  └─────────────────────────────┘    │
│                                     │
│  [취소]              [발송하기]      │
└─────────────────────────────────────┘
```

#### 발송 로직 (JavaScript)

```javascript
async function sendPaymentLink(studentId, courseId, amount, phone, expiresHours) {
  // 1. 토큰 생성
  const token = crypto.randomUUID().replace(/-/g, '') +
                crypto.randomUUID().replace(/-/g, '').substring(0, 32);
  // → 64자 hex 토큰

  // 2. payment_links INSERT
  const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
  const { data: link, error } = await supabase
    .from('payment_links')
    .insert({
      token,
      student_id: studentId,
      course_id: courseId,
      amount,
      created_by: adminUserId,
      guardian_phone: phone,
      student_name: studentName,
      course_title: courseTitle,
      expires_at: expiresAt.toISOString()
    })
    .select()
    .single();

  if (error) throw error;

  // 3. SMS 발송
  const paymentUrl = `${location.origin}/payment-link.html?token=${token}`;
  const message = `[올라운드영어] 수강료 결제 안내\n` +
    `${studentName}님의 ${courseTitle} 수강료(${amount.toLocaleString()}원) 결제 링크입니다.\n` +
    `${paymentUrl}\n` +
    `* ${expiresHours}시간 내 결제해주세요.`;

  const smsResult = await supabase.functions.invoke('send-nhn-sms', {
    body: { phone, message }
  });

  // 4. SMS 발송 상태 업데이트
  await supabase
    .from('payment_links')
    .update({
      sms_sent_at: new Date().toISOString(),
      sms_status: smsResult.data?.success ? 'sent' : 'failed'
    })
    .eq('id', link.id);

  return { success: true, link, smsResult };
}
```

### 5.2 발송 내역 섹션

기존 admin.html 사이드바에 "결제 링크" 메뉴 항목 추가.

```
┌───────────────────────────────────────────────────────────────┐
│  결제 링크 발송 내역                     [+ 새 링크 발송]      │
├───────────────────────────────────────────────────────────────┤
│  상태 필터: [전체 ▼]    날짜: [최근 30일 ▼]                   │
├────┬──────┬──────────┬────────┬────────┬───────┬─────────────┤
│ #  │ 학생  │ 강의      │ 금액    │ 상태    │ 발송일 │ 액션       │
├────┼──────┼──────────┼────────┼────────┼───────┼─────────────┤
│ 1  │홍길동│ Original │330,000│ 결제완료│ 04/09 │ 상세        │
│ 2  │김영희│ Strategy │250,000│ 대기중  │ 04/08 │ 재발송|취소 │
│ 3  │박철수│ Firstee  │180,000│ 만료    │ 04/05 │ 재발송      │
└────┴──────┴──────────┴────────┴────────┴───────┴─────────────┘
```

**상태 뱃지 색상**:
- 대기중(pending): 노란색
- 결제완료(paid): 초록색
- 만료(expired): 회색
- 취소(cancelled): 빨간색

---

## 6. SMS 메시지 설계

### 6.1 발송 메시지 (LMS)

```
[올라운드영어] 수강료 결제 안내
{학생명}님의 {강의명} 수강료({금액}원) 결제 링크입니다.
{결제URL}
* {만료시간}시간 내 결제해주세요.
```

**글자 수 계산** (최악의 경우):
- 헤더: ~20자
- 본문: ~50자 (학생명 10자 + 강의명 20자)
- URL: ~70자
- 안내: ~20자
- **합계: ~160자 → LMS 자동 전환** (SMS 한계 90바이트 = ~45자)

### 6.2 NHN SMS API 호출

기존 `send-nhn-sms` Edge Function 그대로 사용:
```javascript
await supabase.functions.invoke('send-nhn-sms', {
  body: {
    phone: '01012345678',
    message: smsContent  // 위 메시지
  }
});
```

NHN Cloud가 90바이트 초과 시 자동으로 LMS로 전환 처리.

---

## 7. 토큰 보안 설계

### 7.1 토큰 생성

```javascript
// 64자 hex (UUID 2개 결합)
const token = crypto.randomUUID().replace(/-/g, '') +
              crypto.randomUUID().replace(/-/g, '').substring(0, 32);
// 예: "a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2"
```

- 경우의 수: 16^64 = 2^256 → brute force 불가능
- DB UNIQUE 제약으로 충돌 방지

### 7.2 만료 검증 (프론트 + 서버 이중 체크)

```javascript
// 프론트 (payment-link.html)
if (link.status !== 'pending') { showAlreadyProcessed(); return; }
if (new Date(link.expires_at) < new Date()) { showExpired(); return; }

// 서버 (confirm-payment-link Edge Function)
if (link.status !== 'pending') return error(400, '이미 처리된 링크');
if (new Date(link.expires_at) < new Date()) return error(400, '만료된 링크');
```

### 7.3 금액 변조 방지

결제 금액은 **payment_links.amount에서만 읽음** (프론트 전달값 무시):
```typescript
// Edge Function
const expectedAmount = paymentLink.amount;
if (Math.floor(Number(requestAmount)) !== expectedAmount) {
  return error(400, '금액 불일치');
}
```

---

## 8. 파일 목록

### 신규 생성

| 파일 | 설명 |
|------|------|
| `payment-link.html` | 학부모 결제 페이지 (로그인 불필요) |
| `payment-link-success.html` | 결제 링크 전용 성공 페이지 |
| `payment-link-fail.html` | 결제 링크 전용 실패 페이지 |
| `supabase/functions/confirm-payment-link/index.ts` | 토큰 기반 결제 승인 Edge Function |

### 수정

| 파일 | 변경 내용 |
|------|-----------|
| `admin.html` | 결제 링크 발송 UI, 발송 내역 섹션 추가 |

### DB 마이그레이션

| 작업 | SQL |
|------|-----|
| `payment_links` 테이블 생성 | Section 2.1 참조 |
| RLS 정책 설정 | Section 2.2 참조 |

---

## 9. 구현 순서

```
Phase 1: DB
  1-1. payment_links 테이블 + RLS 생성 (Supabase SQL Editor)

Phase 2: Edge Function
  2-1. confirm-payment-link 작성 + 배포

Phase 3: 학부모 결제 페이지
  3-1. payment-link.html (토큰 검증 + 결제)
  3-2. payment-link-success.html (결제 승인 처리)
  3-3. payment-link-fail.html

Phase 4: 관리자 UI
  4-1. 결제 링크 발송 모달 (admin.html)
  4-2. 발송 내역 섹션 (admin.html)
  4-3. SMS 발송 연동 (send-nhn-sms 호출)

Phase 5: 테스트
  5-1. 토큰 생성 → SMS 발송 → 결제 → 수강권 확인
  5-2. 만료/취소/중복결제 시나리오
```
