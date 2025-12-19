-- ====================================================================
-- 잘못된 이미지 제출 데이터 정리
-- 404 오류가 나는 URL을 가진 제출물을 찾아 정리
-- ====================================================================

-- ⚠️ 주의: 이 SQL은 실제 데이터를 삭제합니다!
-- 실행 전에 백업하거나 조심히 확인하세요.

-- 1단계: 문제 있는 제출물 확인 (삭제하지 않음)
SELECT 
    id,
    user_id,
    lesson_id,
    title,
    image_url,
    status,
    created_at
FROM student_submissions
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND created_at > NOW() - INTERVAL '1 day'  -- 최근 1일 이내만
ORDER BY created_at DESC;

-- 2단계: 문제 있는 제출물 삭제 (실행하기 전에 위의 결과를 확인!)
-- 아래 주석을 해제하고 실행하세요:

/*
DELETE FROM student_submissions
WHERE image_url IS NOT NULL 
  AND image_url != ''
  AND created_at > NOW() - INTERVAL '1 day'  -- 최근 1일 이내만
  AND id IN (
    -- 여기에 삭제할 id를 직접 입력하세요
    -- 예: '12345678-1234-1234-1234-123456789012'
  );
*/

-- 또는 테스트 목적으로 최근 제출물을 모두 삭제하려면:
/*
DELETE FROM student_submissions
WHERE created_at > NOW() - INTERVAL '1 day';
*/




