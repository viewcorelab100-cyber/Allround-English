-- ====================================================================
-- 이미지 URL 테스트
-- 실제로 저장된 URL이 접근 가능한지 확인
-- ====================================================================

-- 1. 최근 제출된 이미지 URL 확인
SELECT 
    id,
    user_id,
    lesson_id,
    title,
    LEFT(image_url, 100) as image_url_preview,
    LENGTH(image_url) as url_length,
    created_at
FROM student_submissions
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC
LIMIT 5;

-- 2. assignment-images 버킷이 Public인지 확인
SELECT 
    id,
    name,
    public,  -- 이 값이 true여야 함!
    file_size_limit,
    allowed_mime_types,
    created_at
FROM storage.buckets
WHERE name = 'assignment-images';

-- ⚠️ 만약 public = false이면:
-- Supabase Dashboard → Storage → assignment-images → ⚙️ Settings 
-- → "Public bucket" 체크박스 켜기!

-- 3. 업로드된 파일 목록 확인
SELECT 
    name,
    bucket_id,
    created_at,
    updated_at,
    last_accessed_at
FROM storage.objects
WHERE bucket_id = 'assignment-images'
ORDER BY created_at DESC
LIMIT 10;















