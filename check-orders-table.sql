-- ====================================================================
-- orders 테이블 확인
-- ====================================================================

-- 1. orders 테이블 존재 여부 및 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'orders'
ORDER BY ordinal_position;

-- 2. orders 테이블의 모든 데이터 확인 (최근 10개)
SELECT *
FROM orders
ORDER BY created_at DESC
LIMIT 10;

-- 3. orders 테이블의 status별 개수
SELECT 
    status,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM orders
GROUP BY status;

-- 4. 오늘 생성된 orders 확인
SELECT *
FROM orders
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- 5. purchases와 orders 관계 확인
-- (같은 order_id를 가진 데이터가 있는지)
SELECT 
    p.id as purchase_id,
    p.order_id,
    p.status as purchase_status,
    p.amount as purchase_amount,
    o.id as order_id_in_orders,
    o.status as order_status,
    o.amount as order_amount
FROM purchases p
LEFT JOIN orders o ON p.order_id = o.id
ORDER BY p.purchased_at DESC
LIMIT 10;




