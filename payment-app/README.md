# ALLROUND 결제 시스템

토스페이먼츠 결제 위젯을 활용한 Next.js 결제 페이지입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase
- **Payment**: 토스페이먼츠 SDK v2
- **Styling**: Tailwind CSS

## 시작하기

### 1. 패키지 설치

```bash
cd payment-app
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 `.env.local`로 복사하고 값을 수정하세요:

```bash
cp env.example .env.local
```

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 토스페이먼츠 설정
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 `supabase-orders-schema.sql` 파일의 내용을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 페이지 구조

```
app/
├── page.tsx                    # 홈페이지
├── payment/
│   ├── [id]/
│   │   ├── page.tsx           # 결제 페이지 (서버 컴포넌트)
│   │   └── PaymentClient.tsx  # 결제 페이지 (클라이언트 컴포넌트)
│   ├── success/
│   │   └── page.tsx           # 결제 성공 페이지
│   └── fail/
│       └── page.tsx           # 결제 실패 페이지
```

## 사용 방법

### 1. 주문 생성

기존 HTML 페이지에서 Supabase를 통해 주문을 생성합니다:

```javascript
const { data, error } = await supabase
  .from('orders')
  .insert({
    course_id: 'course-uuid',
    amount: 50000,
    order_name: '올라운드 아티스트 라인 정규과정',
    customer_name: '홍길동',
    customer_email: 'parent@example.com',
    customer_phone: '010-1234-5678',
    status: 'pending'
  })
  .select()
  .single();

// 결제 페이지로 이동
window.location.href = `http://localhost:3000/payment/${data.id}`;
```

### 2. 결제 진행

- 학부모가 결제 페이지에 접속
- 카드/가상계좌/카카오페이 등 결제수단 선택
- 결제 완료 시 `/payment/success`로 리다이렉트
- 결제 실패 시 `/payment/fail`로 리다이렉트

### 3. 결제 승인 (서버사이드)

실제 프로덕션에서는 결제 승인을 서버사이드에서 처리해야 합니다:

```typescript
// app/api/payment/confirm/route.ts
export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json();
  
  // 토스페이먼츠 결제 승인 API 호출
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  
  // ... 처리
}
```

## 토스페이먼츠 키 정보

### 테스트 키 (현재 설정됨)
- Client Key: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa`

### 라이브 키 (프로덕션용)
토스페이먼츠 개발자센터에서 발급받은 라이브 키로 교체하세요.

## 지원 결제수단

- 💳 카드 결제
- 🏧 가상계좌
- 📱 카카오페이
- 💰 토스페이
- 🔢 계좌이체
- 📲 휴대폰 결제

## 주의사항

1. **테스트 환경**: 현재 테스트 키가 설정되어 있습니다. 실제 결제는 진행되지 않습니다.
2. **결제 승인**: 프로덕션에서는 반드시 서버사이드에서 결제 승인을 처리하세요.
3. **보안**: Secret Key는 절대 클라이언트에 노출하지 마세요.


토스페이먼츠 결제 위젯을 활용한 Next.js 결제 페이지입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase
- **Payment**: 토스페이먼츠 SDK v2
- **Styling**: Tailwind CSS

## 시작하기

### 1. 패키지 설치

```bash
cd payment-app
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 `.env.local`로 복사하고 값을 수정하세요:

```bash
cp env.example .env.local
```

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 토스페이먼츠 설정
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 `supabase-orders-schema.sql` 파일의 내용을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 페이지 구조

```
app/
├── page.tsx                    # 홈페이지
├── payment/
│   ├── [id]/
│   │   ├── page.tsx           # 결제 페이지 (서버 컴포넌트)
│   │   └── PaymentClient.tsx  # 결제 페이지 (클라이언트 컴포넌트)
│   ├── success/
│   │   └── page.tsx           # 결제 성공 페이지
│   └── fail/
│       └── page.tsx           # 결제 실패 페이지
```

## 사용 방법

### 1. 주문 생성

기존 HTML 페이지에서 Supabase를 통해 주문을 생성합니다:

```javascript
const { data, error } = await supabase
  .from('orders')
  .insert({
    course_id: 'course-uuid',
    amount: 50000,
    order_name: '올라운드 아티스트 라인 정규과정',
    customer_name: '홍길동',
    customer_email: 'parent@example.com',
    customer_phone: '010-1234-5678',
    status: 'pending'
  })
  .select()
  .single();

// 결제 페이지로 이동
window.location.href = `http://localhost:3000/payment/${data.id}`;
```

### 2. 결제 진행

- 학부모가 결제 페이지에 접속
- 카드/가상계좌/카카오페이 등 결제수단 선택
- 결제 완료 시 `/payment/success`로 리다이렉트
- 결제 실패 시 `/payment/fail`로 리다이렉트

### 3. 결제 승인 (서버사이드)

실제 프로덕션에서는 결제 승인을 서버사이드에서 처리해야 합니다:

```typescript
// app/api/payment/confirm/route.ts
export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json();
  
  // 토스페이먼츠 결제 승인 API 호출
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  
  // ... 처리
}
```

## 토스페이먼츠 키 정보

### 테스트 키 (현재 설정됨)
- Client Key: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa`

### 라이브 키 (프로덕션용)
토스페이먼츠 개발자센터에서 발급받은 라이브 키로 교체하세요.

## 지원 결제수단

- 💳 카드 결제
- 🏧 가상계좌
- 📱 카카오페이
- 💰 토스페이
- 🔢 계좌이체
- 📲 휴대폰 결제

## 주의사항

1. **테스트 환경**: 현재 테스트 키가 설정되어 있습니다. 실제 결제는 진행되지 않습니다.
2. **결제 승인**: 프로덕션에서는 반드시 서버사이드에서 결제 승인을 처리하세요.
3. **보안**: Secret Key는 절대 클라이언트에 노출하지 마세요.


토스페이먼츠 결제 위젯을 활용한 Next.js 결제 페이지입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase
- **Payment**: 토스페이먼츠 SDK v2
- **Styling**: Tailwind CSS

## 시작하기

### 1. 패키지 설치

```bash
cd payment-app
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 `.env.local`로 복사하고 값을 수정하세요:

```bash
cp env.example .env.local
```

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 토스페이먼츠 설정
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 `supabase-orders-schema.sql` 파일의 내용을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 페이지 구조

```
app/
├── page.tsx                    # 홈페이지
├── payment/
│   ├── [id]/
│   │   ├── page.tsx           # 결제 페이지 (서버 컴포넌트)
│   │   └── PaymentClient.tsx  # 결제 페이지 (클라이언트 컴포넌트)
│   ├── success/
│   │   └── page.tsx           # 결제 성공 페이지
│   └── fail/
│       └── page.tsx           # 결제 실패 페이지
```

## 사용 방법

### 1. 주문 생성

기존 HTML 페이지에서 Supabase를 통해 주문을 생성합니다:

```javascript
const { data, error } = await supabase
  .from('orders')
  .insert({
    course_id: 'course-uuid',
    amount: 50000,
    order_name: '올라운드 아티스트 라인 정규과정',
    customer_name: '홍길동',
    customer_email: 'parent@example.com',
    customer_phone: '010-1234-5678',
    status: 'pending'
  })
  .select()
  .single();

// 결제 페이지로 이동
window.location.href = `http://localhost:3000/payment/${data.id}`;
```

### 2. 결제 진행

- 학부모가 결제 페이지에 접속
- 카드/가상계좌/카카오페이 등 결제수단 선택
- 결제 완료 시 `/payment/success`로 리다이렉트
- 결제 실패 시 `/payment/fail`로 리다이렉트

### 3. 결제 승인 (서버사이드)

실제 프로덕션에서는 결제 승인을 서버사이드에서 처리해야 합니다:

```typescript
// app/api/payment/confirm/route.ts
export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json();
  
  // 토스페이먼츠 결제 승인 API 호출
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  
  // ... 처리
}
```

## 토스페이먼츠 키 정보

### 테스트 키 (현재 설정됨)
- Client Key: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa`

### 라이브 키 (프로덕션용)
토스페이먼츠 개발자센터에서 발급받은 라이브 키로 교체하세요.

## 지원 결제수단

- 💳 카드 결제
- 🏧 가상계좌
- 📱 카카오페이
- 💰 토스페이
- 🔢 계좌이체
- 📲 휴대폰 결제

## 주의사항

1. **테스트 환경**: 현재 테스트 키가 설정되어 있습니다. 실제 결제는 진행되지 않습니다.
2. **결제 승인**: 프로덕션에서는 반드시 서버사이드에서 결제 승인을 처리하세요.
3. **보안**: Secret Key는 절대 클라이언트에 노출하지 마세요.


토스페이먼츠 결제 위젯을 활용한 Next.js 결제 페이지입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Database**: Supabase
- **Payment**: 토스페이먼츠 SDK v2
- **Styling**: Tailwind CSS

## 시작하기

### 1. 패키지 설치

```bash
cd payment-app
npm install
```

### 2. 환경변수 설정

`env.example` 파일을 `.env.local`로 복사하고 값을 수정하세요:

```bash
cp env.example .env.local
```

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# 토스페이먼츠 설정
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa
```

### 3. Supabase 테이블 생성

Supabase SQL Editor에서 `supabase-orders-schema.sql` 파일의 내용을 실행하세요.

### 4. 개발 서버 실행

```bash
npm run dev
```

http://localhost:3000 에서 확인할 수 있습니다.

## 페이지 구조

```
app/
├── page.tsx                    # 홈페이지
├── payment/
│   ├── [id]/
│   │   ├── page.tsx           # 결제 페이지 (서버 컴포넌트)
│   │   └── PaymentClient.tsx  # 결제 페이지 (클라이언트 컴포넌트)
│   ├── success/
│   │   └── page.tsx           # 결제 성공 페이지
│   └── fail/
│       └── page.tsx           # 결제 실패 페이지
```

## 사용 방법

### 1. 주문 생성

기존 HTML 페이지에서 Supabase를 통해 주문을 생성합니다:

```javascript
const { data, error } = await supabase
  .from('orders')
  .insert({
    course_id: 'course-uuid',
    amount: 50000,
    order_name: '올라운드 아티스트 라인 정규과정',
    customer_name: '홍길동',
    customer_email: 'parent@example.com',
    customer_phone: '010-1234-5678',
    status: 'pending'
  })
  .select()
  .single();

// 결제 페이지로 이동
window.location.href = `http://localhost:3000/payment/${data.id}`;
```

### 2. 결제 진행

- 학부모가 결제 페이지에 접속
- 카드/가상계좌/카카오페이 등 결제수단 선택
- 결제 완료 시 `/payment/success`로 리다이렉트
- 결제 실패 시 `/payment/fail`로 리다이렉트

### 3. 결제 승인 (서버사이드)

실제 프로덕션에서는 결제 승인을 서버사이드에서 처리해야 합니다:

```typescript
// app/api/payment/confirm/route.ts
export async function POST(request: Request) {
  const { paymentKey, orderId, amount } = await request.json();
  
  // 토스페이먼츠 결제 승인 API 호출
  const response = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(TOSS_SECRET_KEY + ':').toString('base64')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  
  // ... 처리
}
```

## 토스페이먼츠 키 정보

### 테스트 키 (현재 설정됨)
- Client Key: `test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa`

### 라이브 키 (프로덕션용)
토스페이먼츠 개발자센터에서 발급받은 라이브 키로 교체하세요.

## 지원 결제수단

- 💳 카드 결제
- 🏧 가상계좌
- 📱 카카오페이
- 💰 토스페이
- 🔢 계좌이체
- 📲 휴대폰 결제

## 주의사항

1. **테스트 환경**: 현재 테스트 키가 설정되어 있습니다. 실제 결제는 진행되지 않습니다.
2. **결제 승인**: 프로덕션에서는 반드시 서버사이드에서 결제 승인을 처리하세요.
3. **보안**: Secret Key는 절대 클라이언트에 노출하지 마세요.















