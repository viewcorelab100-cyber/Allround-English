-- ============================================
-- 강의 공개/비공개 시스템
-- ============================================
-- 실행 방법: Supabase SQL Editor에서 실행

-- 1. courses 테이블에 visibility 컬럼 추가
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'public' 
CHECK (visibility IN ('public', 'private'));

-- 기존 강의는 모두 공개로 설정
UPDATE courses SET visibility = 'public' WHERE visibility IS NULL;

COMMENT ON COLUMN courses.visibility IS '강의 공개 설정: public(공개), private(비공개-승인된 사용자만)';

-- 2. 비공개 강의 접근 권한 테이블 생성
CREATE TABLE IF NOT EXISTS course_access_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    granted_by UUID REFERENCES auth.users(id), -- 권한 부여한 관리자
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT, -- 권한 부여 사유 등
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, user_id) -- 같은 강의에 대해 중복 권한 방지
);

COMMENT ON TABLE course_access_permissions IS '비공개 강의 접근 권한 관리';

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_course_access_permissions_course_id 
ON course_access_permissions(course_id);

CREATE INDEX IF NOT EXISTS idx_course_access_permissions_user_id 
ON course_access_permissions(user_id);

CREATE INDEX IF NOT EXISTS idx_courses_visibility 
ON courses(visibility);

-- 4. RLS (Row Level Security) 정책 설정

-- RLS 활성화
ALTER TABLE course_access_permissions ENABLE ROW LEVEL SECURITY;

-- 정책 삭제 (기존에 있다면)
DROP POLICY IF EXISTS "Anyone can view public courses" ON courses;
DROP POLICY IF EXISTS "Users can view courses they have access to" ON courses;
DROP POLICY IF EXISTS "Admins can view all courses" ON courses;
DROP POLICY IF EXISTS "Users can view their own permissions" ON course_access_permissions;
DROP POLICY IF EXISTS "Admins can manage all permissions" ON course_access_permissions;

-- courses 테이블 정책: 공개 강의는 모두 볼 수 있음
CREATE POLICY "Anyone can view public courses"
ON courses FOR SELECT
USING (
    is_published = true AND visibility = 'public'
);

-- courses 테이블 정책: 비공개 강의는 권한이 있는 사용자만
CREATE POLICY "Users can view courses they have access to"
ON courses FOR SELECT
USING (
    is_published = true AND 
    visibility = 'private' AND
    EXISTS (
        SELECT 1 FROM course_access_permissions
        WHERE course_access_permissions.course_id = courses.id
        AND course_access_permissions.user_id = auth.uid()
    )
);

-- courses 테이블 정책: 관리자는 모든 강의 조회/관리 가능
CREATE POLICY "Admins can manage all courses"
ON courses FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- course_access_permissions 테이블 정책: 사용자는 자신의 권한만 조회
CREATE POLICY "Users can view their own permissions"
ON course_access_permissions FOR SELECT
USING (user_id = auth.uid());

-- course_access_permissions 테이블 정책: 관리자는 모든 권한 관리
CREATE POLICY "Admins can manage all permissions"
ON course_access_permissions FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.is_admin = true
    )
);

-- 5. 권한 부여/삭제 헬퍼 함수 생성

-- 권한 부여 함수
CREATE OR REPLACE FUNCTION grant_course_access(
    p_course_id UUID,
    p_user_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS course_access_permissions
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result course_access_permissions;
BEGIN
    -- 관리자만 실행 가능
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION '관리자만 권한을 부여할 수 있습니다.';
    END IF;

    -- 권한 부여 (이미 있으면 업데이트)
    INSERT INTO course_access_permissions (
        course_id, 
        user_id, 
        granted_by, 
        notes,
        granted_at,
        updated_at
    )
    VALUES (
        p_course_id, 
        p_user_id, 
        auth.uid(), 
        p_notes,
        NOW(),
        NOW()
    )
    ON CONFLICT (course_id, user_id) 
    DO UPDATE SET
        granted_by = auth.uid(),
        notes = EXCLUDED.notes,
        granted_at = NOW(),
        updated_at = NOW()
    RETURNING * INTO v_result;

    RETURN v_result;
END;
$$;

-- 권한 삭제 함수
CREATE OR REPLACE FUNCTION revoke_course_access(
    p_course_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 관리자만 실행 가능
    IF NOT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_admin = true
    ) THEN
        RAISE EXCEPTION '관리자만 권한을 삭제할 수 있습니다.';
    END IF;

    DELETE FROM course_access_permissions
    WHERE course_id = p_course_id AND user_id = p_user_id;

    RETURN FOUND;
END;
$$;

-- 6. 사용자의 접근 가능한 강의 목록 조회 함수
CREATE OR REPLACE FUNCTION get_accessible_courses(p_user_id UUID)
RETURNS TABLE (
    course_id UUID,
    title TEXT,
    description TEXT,
    price NUMERIC,
    thumbnail_url TEXT,
    category TEXT,
    visibility TEXT,
    has_permission BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id AS course_id,
        c.title,
        c.description,
        c.price,
        c.thumbnail_url,
        c.category,
        c.visibility,
        CASE 
            WHEN c.visibility = 'public' THEN TRUE
            WHEN EXISTS (
                SELECT 1 FROM course_access_permissions cap
                WHERE cap.course_id = c.id AND cap.user_id = p_user_id
            ) THEN TRUE
            ELSE FALSE
        END AS has_permission
    FROM courses c
    WHERE c.is_published = true
    AND (
        c.visibility = 'public'
        OR EXISTS (
            SELECT 1 FROM course_access_permissions cap
            WHERE cap.course_id = c.id AND cap.user_id = p_user_id
        )
    )
    ORDER BY c.created_at DESC;
END;
$$;

-- 7. 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '✅ 강의 공개/비공개 시스템이 성공적으로 생성되었습니다!';
    RAISE NOTICE '   - courses.visibility 컬럼 추가 완료';
    RAISE NOTICE '   - course_access_permissions 테이블 생성 완료';
    RAISE NOTICE '   - RLS 정책 설정 완료';
    RAISE NOTICE '   - 헬퍼 함수 생성 완료';
END $$;
