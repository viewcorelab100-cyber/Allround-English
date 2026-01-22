-- ====================================================================
-- 교재비 컬럼 추가 및 결제 구조 변경
-- ====================================================================
-- Supabase SQL Editor에서 실행하세요

-- 1. courses 테이블에 교재비 컬럼 추가
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS textbook_price NUMERIC DEFAULT 0;

COMMENT ON COLUMN courses.textbook_price IS '교재비 (강의비와 별도)';

-- 기존 강의는 교재비 0으로 설정
UPDATE courses SET textbook_price = 0 WHERE textbook_price IS NULL;

-- 2. orders 테이블에 결제 유형 컬럼 추가 (강의비/교재비 구분)
ALTER TABLE orders
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'course'
CHECK (payment_type IN ('course', 'textbook'));

COMMENT ON COLUMN orders.payment_type IS '결제 유형: course(강의비), textbook(교재비)';

-- 기존 주문은 강의비로 설정
UPDATE orders SET payment_type = 'course' WHERE payment_type IS NULL;

-- 3. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_orders_payment_type ON orders(payment_type);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '교재비 결제 구조 추가 완료!';
    RAISE NOTICE '   - courses.textbook_price 컬럼 추가';
    RAISE NOTICE '   - orders.payment_type 컬럼 추가 (course/textbook)';
END $$;
