-- ============================================
-- 쿠폰 시스템 데이터베이스 스키마
-- ============================================

-- 1. 쿠폰 마스터 테이블
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL, -- 쿠폰 코드 (예: WELCOME2024)
    name TEXT NOT NULL, -- 쿠폰 이름
    description TEXT, -- 쿠폰 설명
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')), -- percentage: 퍼센트 할인, fixed: 고정 금액 할인
    discount_value NUMERIC NOT NULL, -- 할인 값 (10 = 10% 또는 10000원)
    min_purchase_amount NUMERIC DEFAULT 0, -- 최소 구매 금액
    max_discount_amount NUMERIC, -- 최대 할인 금액 (percentage일 때)
    valid_days INTEGER DEFAULT 7, -- 유효 기간 (일)
    usage_limit INTEGER DEFAULT 1, -- 사용 가능 횟수 (1회 제한)
    is_active BOOLEAN DEFAULT TRUE, -- 쿠폰 활성화 여부
    coupon_type TEXT DEFAULT 'completion' CHECK (coupon_type IN ('completion', 'welcome', 'promotion', 'manual')), -- 쿠폰 종류
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 사용자 쿠폰 테이블
CREATE TABLE IF NOT EXISTS user_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL, -- 완강한 강의 ID (완강 쿠폰인 경우)
    issued_at TIMESTAMPTZ DEFAULT NOW(), -- 발급 시간
    expires_at TIMESTAMPTZ NOT NULL, -- 만료 시간
    used_at TIMESTAMPTZ, -- 사용 시간
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL, -- 사용한 주문 ID (orders.id는 TEXT 타입)
    is_used BOOLEAN DEFAULT FALSE, -- 사용 여부
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    CONSTRAINT unique_user_coupon UNIQUE(user_id, coupon_id, course_id)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_user_coupons_user_id ON user_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_user_coupons_expires_at ON user_coupons(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_coupons_is_used ON user_coupons(is_used);

-- 4. RLS 정책
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_coupons ENABLE ROW LEVEL SECURITY;

-- 쿠폰 마스터: 모든 사용자가 활성화된 쿠폰 조회 가능
DROP POLICY IF EXISTS "Anyone can view active coupons" ON coupons;
CREATE POLICY "Anyone can view active coupons" ON coupons
    FOR SELECT TO authenticated
    USING (is_active = true);

-- 사용자 쿠폰: 본인의 쿠폰만 조회 가능
DROP POLICY IF EXISTS "Users can view own coupons" ON user_coupons;
CREATE POLICY "Users can view own coupons" ON user_coupons
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- 사용자 쿠폰: 본인의 쿠폰만 업데이트 가능
DROP POLICY IF EXISTS "Users can update own coupons" ON user_coupons;
CREATE POLICY "Users can update own coupons" ON user_coupons
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id);

-- 사용자 쿠폰: 시스템이 발급 가능
DROP POLICY IF EXISTS "System can insert coupons" ON user_coupons;
CREATE POLICY "System can insert coupons" ON user_coupons
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- 5. 업데이트 트리거
CREATE OR REPLACE FUNCTION update_coupons_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_coupons_updated_at ON coupons;
CREATE TRIGGER trigger_update_coupons_updated_at
    BEFORE UPDATE ON coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_coupons_updated_at();

-- 6. 기본 완강 보상 쿠폰 생성
INSERT INTO coupons (code, name, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, valid_days, usage_limit, coupon_type)
VALUES 
    ('COMPLETION_DEFAULT', '완강 축하 쿠폰', '강의 완강을 축하합니다! 다음 강의 구매 시 사용하세요.', 'percentage', 15, 0, 50000, 7, 1, 'completion')
ON CONFLICT (code) DO NOTHING;

-- 7. 쿠폰 발급 함수
CREATE OR REPLACE FUNCTION issue_completion_coupon(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_coupon_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_user_coupon_id UUID;
BEGIN
    -- 기본 완강 쿠폰 가져오기
    SELECT id INTO v_coupon_id
    FROM coupons
    WHERE code = 'COMPLETION_DEFAULT' AND is_active = true
    LIMIT 1;
    
    IF v_coupon_id IS NULL THEN
        RAISE EXCEPTION 'No active completion coupon found';
    END IF;
    
    -- 만료일 계산 (7일 후)
    v_expires_at := NOW() + INTERVAL '7 days';
    
    -- 이미 발급된 쿠폰인지 확인
    IF EXISTS (
        SELECT 1 FROM user_coupons
        WHERE user_id = p_user_id 
        AND coupon_id = v_coupon_id 
        AND course_id = p_course_id
    ) THEN
        RETURN NULL; -- 이미 발급됨
    END IF;
    
    -- 쿠폰 발급
    INSERT INTO user_coupons (user_id, coupon_id, course_id, expires_at)
    VALUES (p_user_id, v_coupon_id, p_course_id, v_expires_at)
    RETURNING id INTO v_user_coupon_id;
    
    RETURN v_user_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 쿠폰 사용 함수
CREATE OR REPLACE FUNCTION use_coupon(
    p_user_coupon_id UUID,
    p_order_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_user_id UUID;
    v_is_used BOOLEAN;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 쿠폰 정보 가져오기
    SELECT user_id, is_used, expires_at
    INTO v_user_id, v_is_used, v_expires_at
    FROM user_coupons
    WHERE id = p_user_coupon_id;
    
    -- 유효성 검사
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Coupon not found';
    END IF;
    
    IF v_user_id != auth.uid() THEN
        RAISE EXCEPTION 'Not authorized';
    END IF;
    
    IF v_is_used THEN
        RAISE EXCEPTION 'Coupon already used';
    END IF;
    
    IF v_expires_at < NOW() THEN
        RAISE EXCEPTION 'Coupon expired';
    END IF;
    
    -- 쿠폰 사용 처리
    UPDATE user_coupons
    SET is_used = true,
        used_at = NOW(),
        order_id = p_order_id
    WHERE id = p_user_coupon_id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 만료된 쿠폰 확인 함수 (뷰로 처리)
CREATE OR REPLACE VIEW valid_user_coupons AS
SELECT 
    uc.*,
    c.name,
    c.description,
    c.discount_type,
    c.discount_value,
    c.min_purchase_amount,
    c.max_discount_amount,
    CASE 
        WHEN uc.expires_at < NOW() THEN true
        ELSE false
    END AS is_expired
FROM user_coupons uc
JOIN coupons c ON uc.coupon_id = c.id
WHERE uc.is_used = false;

COMMENT ON TABLE coupons IS '쿠폰 마스터 테이블';
COMMENT ON TABLE user_coupons IS '사용자별 발급된 쿠폰 테이블';
COMMENT ON FUNCTION issue_completion_coupon IS '완강 시 자동으로 쿠폰 발급';
COMMENT ON FUNCTION use_coupon IS '쿠폰 사용 처리';


