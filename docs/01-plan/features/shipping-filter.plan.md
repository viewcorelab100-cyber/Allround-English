# Plan: shipping-filter

> 관리자 배송탭에 교재비 결제 주문만 표시

## 1. Background

현재 관리자 "Orders & Shipping" 탭은 `orders` 테이블에서 `status: 'DONE'`인 **모든** 주문을 가져온다.

결제 시스템은 강의비(`payment_type: 'course'`)와 교재비(`payment_type: 'textbook'`)를 **별도 주문**으로 생성한다. 교재비가 0원이면 교재 주문 자체가 생성되지 않는다.

**문제**: 교재가 없는 강의의 강의비 주문(`payment_type: 'course'`)도 배송탭에 노출됨. 배송할 물건이 없는 주문이 배송 관리 목록에 있어 관리자에게 혼란을 줌.

## 2. Goal

- 배송탭에는 `payment_type: 'textbook'`인 주문만 표시
- 강의비 전용 주문은 배송 관리 대상에서 제외
- 배송 상태 통계도 교재 주문 기준으로 산출

## 3. Current Flow

```
결제 → createOrder(payment_type: 'course' | 'textbook')
           ↓
admin loadOrders() → orders.status == 'DONE' (전체)
           ↓
배송탭에 전부 표시 ← 문제
```

## 4. Target Flow

```
결제 → createOrder(payment_type: 'course' | 'textbook')
           ↓
admin loadOrders() → orders.status == 'DONE' AND payment_type == 'textbook'
           ↓
배송탭에 교재 주문만 표시
```

## 5. Changes

### 5-1. admin.html - loadOrders() 쿼리 수정
- **파일**: admin.html (line ~4814)
- **변경**: `.eq('status', 'DONE')` 뒤에 `.eq('payment_type', 'textbook')` 추가
- **영향 범위**: 배송탭 목록, 통계 카운트, 필터

### 5-2. 배송 상태 통계 업데이트
- 상단 통계 카드(배송대기, 배송중, 배송완료 등)도 교재 주문 기준으로 카운트

## 6. Risk

- **낮음**: 쿼리에 필터 1줄 추가. 기존 데이터/기능에 영향 없음
- orders 테이블에 `payment_type` 컬럼이 null인 레거시 데이터가 있을 수 있음 → null 주문도 제외되므로 오히려 정리 효과

## 7. Success Criteria

- 배송탭에 `payment_type: 'textbook'`인 주문만 표시됨
- 강의비만 결제한 주문은 배송탭에 나타나지 않음
- 배송 상태 변경/저장 기능 정상 동작
