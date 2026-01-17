-- ====================================================================
-- 기기별 세션 관리를 위한 컬럼 추가 (최대 3대)
-- ====================================================================

-- profiles 테이블에 active_sessions JSONB 컬럼 추가
-- active_sessions 구조: [{ session_id, created_at, device_info }]
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS active_sessions JSONB DEFAULT '[]'::jsonb;

-- 기존 last_session_id를 active_sessions로 마이그레이션
UPDATE profiles
SET active_sessions = jsonb_build_array(
    jsonb_build_object(
        'session_id', last_session_id,
        'created_at', NOW()::text,
        'device_info', 'Legacy Device'
    )
)
WHERE last_session_id IS NOT NULL 
  AND active_sessions = '[]'::jsonb;

-- 확인
SELECT 
    id,
    name,
    email,
    jsonb_array_length(active_sessions) as active_device_count,
    active_sessions
FROM profiles
WHERE jsonb_array_length(active_sessions) > 0
LIMIT 10;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_profiles_active_sessions 
ON profiles USING gin(active_sessions);























