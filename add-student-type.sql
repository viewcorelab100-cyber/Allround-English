-- ====================================================================
-- 학생 유형 (온라인/오프라인) 컬럼 추가
-- ====================================================================
-- Supabase SQL Editor에서 실행하세요

-- 1. profiles 테이블에 student_type 컬럼 추가
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS student_type TEXT DEFAULT 'online'
CHECK (student_type IN ('online', 'offline'));

-- 기존 회원은 모두 온라인으로 설정
UPDATE profiles SET student_type = 'online' WHERE student_type IS NULL;

COMMENT ON COLUMN profiles.student_type IS '학생 유형: online(온라인 강의 학생), offline(오프라인 강의 학생)';

-- 2. 인덱스 추가 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_profiles_student_type ON profiles(student_type);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE 'student_type 컬럼 추가 완료!';
    RAISE NOTICE '   - online: 온라인 강의 학생';
    RAISE NOTICE '   - offline: 오프라인 강의 학생';
END $$;
