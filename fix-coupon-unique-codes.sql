-- ============================================
-- 쿠폰 고유 코드 시스템 추가
-- ============================================

-- 1. user_coupons 테이블에 custom_code 컬럼 추가
ALTER TABLE user_coupons 
ADD COLUMN IF NOT EXISTS custom_code TEXT UNIQUE;

-- 2. 고유 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_unique_coupon_code()
RETURNS TEXT AS $$
DECLARE
    v_code TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- COMPLETE-XXXXXX 형식의 6자리 랜덤 코드 생성
        v_code := 'COMPLETE-' || upper(substring(md5(random()::text) from 1 for 6));
        
        -- 중복 체크
        SELECT EXISTS(SELECT 1 FROM user_coupons WHERE custom_code = v_code) INTO v_exists;
        
        -- 중복이 없으면 반환
        IF NOT v_exists THEN
            RETURN v_code;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 3. 쿠폰 발급 함수 업데이트 (고유 코드 포함)
CREATE OR REPLACE FUNCTION issue_completion_coupon(
    p_user_id UUID,
    p_course_id UUID
)
RETURNS UUID AS $$
DECLARE
    v_coupon_id UUID;
    v_expires_at TIMESTAMPTZ;
    v_user_coupon_id UUID;
    v_custom_code TEXT;
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
        -- 이미 발급된 쿠폰의 ID 반환
        SELECT id INTO v_user_coupon_id
        FROM user_coupons
        WHERE user_id = p_user_id 
        AND coupon_id = v_coupon_id 
        AND course_id = p_course_id
        LIMIT 1;
        
        RETURN v_user_coupon_id;
    END IF;
    
    -- 고유 코드 생성
    v_custom_code := generate_unique_coupon_code();
    
    -- 쿠폰 발급 (고유 코드 포함)
    INSERT INTO user_coupons (user_id, coupon_id, course_id, expires_at, custom_code)
    VALUES (p_user_id, v_coupon_id, p_course_id, v_expires_at, v_custom_code)
    RETURNING id INTO v_user_coupon_id;
    
    RETURN v_user_coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_coupons_custom_code ON user_coupons(custom_code);

-- 5. 기존에 발급된 쿠폰에도 고유 코드 생성 (custom_code가 NULL인 경우)
DO $$
DECLARE
    coupon_record RECORD;
    new_code TEXT;
BEGIN
    FOR coupon_record IN 
        SELECT id FROM user_coupons WHERE custom_code IS NULL
    LOOP
        -- 고유 코드 생성
        new_code := generate_unique_coupon_code();
        
        -- 업데이트
        UPDATE user_coupons 
        SET custom_code = new_code 
        WHERE id = coupon_record.id;
    END LOOP;
END $$;

COMMENT ON COLUMN user_coupons.custom_code IS '사용자별 고유 쿠폰 코드 (예: COMPLETE-A3F2B1)';
COMMENT ON FUNCTION generate_unique_coupon_code IS '중복되지 않는 쿠폰 코드 생성';

