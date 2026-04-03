-- 가상계좌(무통장입금) 지원을 위한 orders 테이블 마이그레이션
-- Supabase SQL Editor에서 실행하세요

-- 1. 실제 결제 금액 (쿠폰 할인 적용 후) 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_amount INTEGER;

-- 2. 가상계좌 정보 저장 컬럼 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS virtual_account_info TEXT;

-- 3. status 체크 제약 업데이트 (WAITING_FOR_DEPOSIT, EXPIRED 추가)
-- 기존 제약 제거 후 재생성
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded', 'PENDING', 'DONE', 'FAILED', 'CANCELLED', 'WAITING_FOR_DEPOSIT', 'EXPIRED'));

-- 4. updated_at 컬럼이 없으면 추가
ALTER TABLE orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 5. 가상계좌 입금 대기 주문 인덱스
CREATE INDEX IF NOT EXISTS idx_orders_waiting_deposit ON orders(status) WHERE status = 'WAITING_FOR_DEPOSIT';
