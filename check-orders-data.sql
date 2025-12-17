-- ====================================================================
-- 주문/결제 데이터 확인 쿼리
-- ====================================================================

-- 1. 오늘 생성된 모든 주문 확인
SELECT 
    id,
    user_id,
    course_id,
    amount,
    status,
    order_name,
    created_at,
    paid_at,
    shipping_status
FROM orders
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- 2. 모든 주문의 status 확인 (최근 10개)
SELECT 
    id,
    status,
    amount,
    created_at,
    CASE 
        WHEN created_at::date = CURRENT_DATE THEN '오늘'
        WHEN created_at::date = CURRENT_DATE - 1 THEN '어제'
        ELSE created_at::date::text
    END as when_created
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 3. status별 주문 개수
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM orders
GROUP BY status;

-- 4. purchases 테이블 구조 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'purchases'
ORDER BY ordinal_position;

-- 5. purchases 테이블 최근 데이터 (컬럼 이름 확인용)
SELECT *
FROM purchases
ORDER BY id DESC
LIMIT 5;

