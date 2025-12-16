-- orders 테이블 생성 (토스페이먼츠 결제용)
-- Supabase SQL Editor에서 실행하세요

CREATE TABLE IF NOT EXISTS orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    course_id UUID,
    
    -- 결제 정보
    amount INTEGER NOT NULL,
    order_name TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_email TEXT,
    customer_phone TEXT,
    
    -- 결제 상태
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'cancelled', 'refunded')),
    
    -- 토스페이먼츠 관련
    payment_key TEXT,
    payment_method TEXT,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    
    -- 추가 정보
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);

-- RLS 활성화
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- RLS 정책
-- 1. 사용자는 자신의 주문만 조회 가능
CREATE POLICY "Users can view own orders" ON orders
    FOR SELECT USING (auth.uid() = user_id);

-- 2. 인증된 사용자는 주문 생성 가능
CREATE POLICY "Authenticated users can create orders" ON orders
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 3. 시스템(서비스 역할)만 주문 업데이트 가능 (결제 승인 등)
-- 주의: 실제 환경에서는 서버사이드에서 service_role 키로 업데이트해야 합니다
CREATE POLICY "System can update orders" ON orders
    FOR UPDATE USING (true);

-- 4. 비회원 결제를 위한 정책 (user_id가 null인 경우)
CREATE POLICY "Anyone can view pending orders by id" ON orders
    FOR SELECT USING (status = 'pending');

-- 주문 생성 함수 (선택적)
CREATE OR REPLACE FUNCTION create_order(
    p_course_id UUID,
    p_amount INTEGER,
    p_order_name TEXT,
    p_customer_name TEXT,
    p_customer_email TEXT DEFAULT NULL,
    p_customer_phone TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    INSERT INTO orders (
        user_id,
        course_id,
        amount,
        order_name,
        customer_name,
        customer_email,
        customer_phone,
        status
    ) VALUES (
        auth.uid(),
        p_course_id,
        p_amount,
        p_order_name,
        p_customer_name,
        p_customer_email,
        p_customer_phone,
        'pending'
    ) RETURNING id INTO v_order_id;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 주문 상태 업데이트 함수
CREATE OR REPLACE FUNCTION update_order_payment(
    p_order_id UUID,
    p_payment_key TEXT,
    p_payment_method TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE orders
    SET 
        status = 'paid',
        payment_key = p_payment_key,
        payment_method = p_payment_method,
        paid_at = NOW()
    WHERE id = p_order_id AND status = 'pending';
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 테스트 데이터 삽입 (개발용)
-- INSERT INTO orders (amount, order_name, customer_name, customer_email, status)
-- VALUES (50000, '올라운드 아티스트 라인 정규과정', '홍길동', 'test@example.com', 'pending');















