# 🎁 쿠폰 시스템 가이드

## 📖 개요

완강 보상 시스템으로 자동 쿠폰 발급, 쿠폰 관리, 결제 시 쿠폰 적용 기능을 제공합니다.

---

## 🗄️ 데이터베이스 구조

### 1. `coupons` 테이블 (쿠폰 마스터)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 쿠폰 ID (Primary Key) |
| `code` | TEXT | 쿠폰 코드 (UNIQUE) |
| `name` | TEXT | 쿠폰 이름 |
| `description` | TEXT | 쿠폰 설명 |
| `discount_type` | TEXT | 할인 타입 (percentage/fixed) |
| `discount_value` | NUMERIC | 할인 값 (10 = 10% 또는 10000원) |
| `min_purchase_amount` | NUMERIC | 최소 구매 금액 |
| `max_discount_amount` | NUMERIC | 최대 할인 금액 (percentage일 때) |
| `valid_days` | INTEGER | 유효 기간 (일) |
| `usage_limit` | INTEGER | 사용 가능 횟수 |
| `is_active` | BOOLEAN | 쿠폰 활성화 여부 |
| `coupon_type` | TEXT | 쿠폰 종류 (completion/welcome/promotion/manual) |

### 2. `user_coupons` 테이블 (사용자별 쿠폰)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | UUID | 사용자 쿠폰 ID (Primary Key) |
| `user_id` | UUID | 사용자 ID (FK) |
| `coupon_id` | UUID | 쿠폰 ID (FK) |
| `course_id` | UUID | 완강한 강의 ID (완강 쿠폰인 경우) |
| `issued_at` | TIMESTAMPTZ | 발급 시간 |
| `expires_at` | TIMESTAMPTZ | 만료 시간 |
| `used_at` | TIMESTAMPTZ | 사용 시간 |
| `order_id` | UUID | 사용한 주문 ID |
| `is_used` | BOOLEAN | 사용 여부 |

---

## 🔧 데이터베이스 설정

### 1. 테이블 생성

```bash
# Supabase SQL Editor에서 실행
create-coupon-system.sql
```

이 스크립트는 다음을 수행합니다:
- 쿠폰 마스터 및 사용자 쿠폰 테이블 생성
- RLS 정책 설정
- 인덱스 생성
- 기본 완강 쿠폰 생성 (15% 할인)
- 쿠폰 발급/사용 함수 생성

### 2. RLS 정책

- **coupons**: 모든 인증 사용자가 활성화된 쿠폰 조회 가능
- **user_coupons**: 본인의 쿠폰만 조회/수정 가능

---

## 🎯 주요 기능

### 1. 완강 시 자동 쿠폰 발급

**위치**: `report.html`, `js/report.js`

```javascript
// 리포트 로드 시 자동으로 쿠폰 발급
await issueCoupon(userId, courseId);
```

**발급 로직**:
1. RPC 함수 `issue_completion_coupon` 호출
2. 기본 완강 쿠폰 (`COMPLETION_DEFAULT`) 발급
3. 유효기간 7일 설정
4. 이미 발급된 경우 중복 발급 방지

**사용자 경험**:
- 강의 완강 시 리포트 페이지에서 쿠폰 코드 표시
- "내 쿠폰 확인하기" 버튼으로 마이페이지로 이동
- 쿠폰 유효기간 및 할인 금액 안내

### 2. 추천 강의

**위치**: `report.html`, `js/report.js`

```javascript
// 같은 카테고리의 최신 강의 2개 추천
await loadRecommendedCourses(currentCourseId);
```

**추천 로직**:
- 현재 강의와 같은 카테고리의 강의 조회
- 최신순으로 2개 선택
- 썸네일, 제목, 가격, 레슨 수 표시

### 3. 마이페이지 쿠폰 관리

**위치**: `mypage.html`

**기능**:
- 🎟️ 쿠폰 탭 추가
- 쿠폰 코드 입력으로 수동 등록
- 사용 가능한 쿠폰 목록 표시
  - 할인 금액/비율
  - 쿠폰 코드
  - 최소 구매 금액
  - 남은 유효기간 (2일 이하일 때 강조)
- 사용 완료/만료된 쿠폰 내역

**URL 파라미터 지원**:
```
mypage.html?tab=coupons
```
리포트 페이지에서 바로 쿠폰 탭으로 이동 가능

### 4. 결제 시 쿠폰 적용

**위치**: `payment.html`, `js/payment.js`

**사용자 플로우**:
1. 결제 페이지에서 쿠폰 코드 입력
2. "쿠폰 적용" 버튼 클릭
3. 유효성 검사:
   - 사용자가 보유한 쿠폰인지 확인
   - 만료되지 않았는지 확인
   - 최소 구매 금액 충족 여부 확인
4. 할인 금액 계산 및 총 결제 금액 업데이트
5. 결제 진행 시 할인된 금액으로 결제

**할인 계산 로직**:
```javascript
// 퍼센트 할인
discountAmount = 원가 * (할인율 / 100);
if (최대할인금액 && discountAmount > 최대할인금액) {
    discountAmount = 최대할인금액;
}

// 고정 금액 할인
discountAmount = 할인금액;

최종금액 = 원가 - discountAmount;
```

---

## 📝 사용 시나리오

### 시나리오 1: 완강 보상 쿠폰 받기

1. **학생이 강의를 완강**
   ```
   courses/[courseId]/progress → 100% 달성
   ```

2. **리포트 생성 및 쿠폰 자동 발급**
   ```
   report.html?id=[reportId]
   → issueCoupon() 호출
   → DB에 user_coupons 레코드 생성
   ```

3. **쿠폰 정보 확인**
   - 리포트 페이지에 쿠폰 코드 표시
   - 15% 할인, 7일간 유효
   - "내 쿠폰 확인하기" 버튼

4. **다음 강의 구매**
   - 추천 강의 중 선택
   - 결제 페이지에서 쿠폰 코드 입력
   - 할인된 가격으로 결제

### 시나리오 2: 프로모션 쿠폰 등록

1. **관리자가 프로모션 쿠폰 생성**
   ```sql
   INSERT INTO coupons (code, name, discount_type, discount_value, ...)
   VALUES ('SUMMER2024', '여름 특별 할인', 'percentage', 20, ...);
   ```

2. **사용자가 쿠폰 코드 받음** (이메일, SNS 등)

3. **마이페이지에서 등록**
   ```
   mypage.html?tab=coupons
   → 쿠폰 코드 입력
   → registerCoupon() 호출
   ```

4. **결제 시 사용**

---

## 🎨 UI/UX 특징

### 1. 리포트 페이지
- **쿠폰 섹션**: 그라데이션 배경 (노란색→주황색)
- **쿠폰 코드**: 흰색 박스에 크게 표시
- **CTA 버튼**: "내 쿠폰 확인하기" (마이페이지 연결)

### 2. 마이페이지 쿠폰 탭
- **사용 가능 쿠폰**: 눈에 띄는 그라데이션 카드
- **만료 임박**: 2일 이하일 때 빨간색 강조
- **사용 완료/만료**: 반투명 처리, 회색톤

### 3. 결제 페이지
- **쿠폰 입력**: 상품 정보와 결제 금액 사이에 배치
- **할인 금액**: 초록색으로 표시 (마이너스 금액)
- **적용 상태**: 초록색 박스로 현재 적용된 쿠폰 표시
- **취소 버튼**: ✕ 아이콘으로 간편하게 제거

---

## 🔒 보안 고려사항

1. **RLS 정책**: 본인의 쿠폰만 조회/사용 가능
2. **유효성 검사**: 
   - 만료일 확인
   - 최소 구매 금액 확인
   - 중복 사용 방지
3. **서버 함수**: `issue_completion_coupon`, `use_coupon`은 `SECURITY DEFINER`로 설정

---

## 📊 관리자 기능 (향후 확장)

현재는 SQL로 직접 관리하지만, 향후 Admin 페이지에서 다음 기능 추가 가능:
- 쿠폰 생성/수정/삭제
- 쿠폰 사용 통계
- 사용자별 쿠폰 발급 내역
- 대량 쿠폰 생성 (CSV 업로드)

---

## 🚀 배포 체크리스트

- [ ] `create-coupon-system.sql` 실행
- [ ] 기본 완강 쿠폰 생성 확인
- [ ] RLS 정책 활성화 확인
- [ ] 쿠폰 발급 테스트
- [ ] 쿠폰 적용 테스트
- [ ] 결제 플로우 테스트

---

## 🐛 트러블슈팅

### Q1: 쿠폰이 발급되지 않아요
- `coupons` 테이블에 `COMPLETION_DEFAULT` 쿠폰이 있는지 확인
- `is_active = true`인지 확인
- 이미 발급된 쿠폰인지 확인 (중복 발급 방지)

### Q2: 쿠폰 적용이 안 돼요
- 쿠폰이 만료되지 않았는지 확인
- 최소 구매 금액을 충족하는지 확인
- 쿠폰이 이미 사용되었는지 확인

### Q3: 결제 후 쿠폰이 사용 처리되지 않아요
- `payment-success.html`에서 쿠폰 사용 처리 로직 확인 필요
- URL 파라미터로 `couponId`가 전달되는지 확인

---

## 📚 관련 파일

### 데이터베이스
- `create-coupon-system.sql`: 쿠폰 시스템 DB 스키마

### 프론트엔드
- `report.html`: 완강 리포트 + 쿠폰 발급 + 추천 강의
- `js/report.js`: 쿠폰 발급 및 추천 강의 로직
- `mypage.html`: 쿠폰 관리 탭
- `payment.html`: 쿠폰 적용 UI
- `js/payment.js`: 쿠폰 적용 및 결제 로직

---

## 🎉 완료!

이제 학생들이 강의를 완강하면 자동으로 쿠폰을 받고, 다음 강의 구매 시 할인 혜택을 받을 수 있습니다!

