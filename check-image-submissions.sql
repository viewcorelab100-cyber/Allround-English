-- ====================================================================
-- 이미지 과제 제출 확인 쿼리
-- student_submissions 테이블의 image_url 값 확인
-- ====================================================================

-- 최근 제출된 이미지 과제 확인 (최근 10개)
SELECT 
    id,
    user_id,
    lesson_id,
    title,
    image_url,
    status,
    created_at,
    updated_at,
    CASE 
        WHEN image_url IS NULL THEN '❌ NULL'
        WHEN image_url = '' THEN '❌ 빈 문자열'
        WHEN image_url LIKE 'http%' THEN '✅ HTTP URL'
        ELSE '⚠️ 기타: ' || LEFT(image_url, 50)
    END as url_status,
    LENGTH(image_url) as url_length
FROM student_submissions
WHERE created_at > NOW() - INTERVAL '1 day'  -- 최근 1일 이내
ORDER BY created_at DESC
LIMIT 10;

-- ====================================================================
-- 이미지 URL이 있는 제출만 확인
-- ====================================================================
SELECT 
    ss.id,
    p.email as student_email,
    l.title as lesson_title,
    ss.image_url,
    ss.status,
    ss.created_at
FROM student_submissions ss
LEFT JOIN profiles p ON ss.user_id = p.id
LEFT JOIN lessons l ON ss.lesson_id = l.id
WHERE ss.image_url IS NOT NULL 
  AND ss.image_url != ''
  AND ss.created_at > NOW() - INTERVAL '1 day'
ORDER BY ss.created_at DESC
LIMIT 5;

-- ====================================================================
-- 이미지 URL이 없는 제출 확인
-- ====================================================================
SELECT 
    ss.id,
    p.email as student_email,
    l.title as lesson_title,
    ss.status,
    ss.created_at
FROM student_submissions ss
LEFT JOIN profiles p ON ss.user_id = p.id
LEFT JOIN lessons l ON ss.lesson_id = l.id
WHERE (ss.image_url IS NULL OR ss.image_url = '')
  AND ss.created_at > NOW() - INTERVAL '1 day'
ORDER BY ss.created_at DESC
LIMIT 5;























