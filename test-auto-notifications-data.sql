-- ====================================================================
-- 자동 알림톡 테스트용 데이터 생성 스크립트 (수정본)
-- ====================================================================

-- 주의: 이 스크립트는 테스트 환경에서만 사용하세요!

-- ====================================================================
-- 중요: 테스트 계정 생성 필요
-- ====================================================================

-- 이 스크립트를 실행하기 전에 먼저 다음 작업을 수행하세요:
-- 1. 웹사이트에서 테스트 계정 2개 생성:
--    - test1@allround.co.kr (비밀번호: test1234!)
--    - test2@allround.co.kr (비밀번호: test1234!)
-- 2. 로그인하여 프로필 설정 (이름, 전화번호)
-- 3. 아래 쿼리로 user_id 확인 후 이 스크립트 실행

-- 테스트 사용자 ID 확인
SELECT id, email, name, phone FROM profiles 
WHERE email LIKE 'test%@allround.co.kr' 
ORDER BY email;

-- ====================================================================
-- 방법 1: 기존 실제 사용자 활용 (추천!)
-- ====================================================================

-- 현재 시스템에 있는 실제 사용자 중 2명을 테스트 대상으로 사용
-- 아래 쿼리로 테스트할 사용자 선택

-- 활성 사용자 목록 조회
SELECT 
    p.id,
    p.email,
    p.name,
    p.phone,
    COUNT(DISTINCT pr.lesson_id) as lessons_watched
FROM profiles p
LEFT JOIN progress pr ON p.user_id = pr.user_id
WHERE p.role = 'student'
GROUP BY p.id, p.email, p.name, p.phone
ORDER BY lessons_watched DESC
LIMIT 10;

-- 위 쿼리 결과에서 2명의 user_id를 선택한 후
-- 아래 변수에 할당하세요

-- ⬇️⬇️⬇️ 여기에 실제 user_id를 입력하세요 ⬇️⬇️⬇️
DO $$
DECLARE
    test_user_1 UUID := 'YOUR_USER_ID_1'; -- 첫 번째 테스트 사용자 ID
    test_user_2 UUID := 'YOUR_USER_ID_2'; -- 두 번째 테스트 사용자 ID
    test_course UUID;
    test_lesson UUID;
BEGIN
    -- ====================================================================
    -- 1. 테스트용 강의 및 레슨 생성
    -- ====================================================================
    
    -- 테스트 강의 생성
    INSERT INTO courses (id, title, description, instructor, published, created_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000010', '[테스트] 알림톡 테스트 강의', '알림톡 테스트용 강의입니다', '테스트 강사', true, NOW())
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        updated_at = NOW();
    
    test_course := '00000000-0000-0000-0000-000000000010';
    
    -- 테스트 레슨 생성
    INSERT INTO lessons (id, course_id, title, video_url, order_num, published, created_at)
    VALUES 
        ('00000000-0000-0000-0000-000000000020', test_course, '[테스트] 알림톡 테스트 레슨', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, NOW())
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        updated_at = NOW();
    
    test_lesson := '00000000-0000-0000-0000-000000000020';
    
    -- ====================================================================
    -- 2. 테스트 시나리오 1: 과제 미제출 (24시간 경과)
    -- ====================================================================
    
    -- 사용자가 존재하는지 확인
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_1) THEN
        -- 강의 등록
        INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
        VALUES (test_user_1, test_course, 'active', NOW() - INTERVAL '2 days')
        ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active';
        
        -- 25시간 전에 강의 시청했지만 과제 미제출
        INSERT INTO progress (user_id, lesson_id, completed, last_watched_at, created_at)
        VALUES (test_user_1, test_lesson, false, NOW() - INTERVAL '25 hours', NOW() - INTERVAL '25 hours')
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET 
            last_watched_at = NOW() - INTERVAL '25 hours',
            completed = false;
        
        RAISE NOTICE '✅ 테스트 사용자 1 (과제 미제출) 설정 완료: %', test_user_1;
    ELSE
        RAISE EXCEPTION '❌ 테스트 사용자 1이 존재하지 않습니다: %', test_user_1;
    END IF;
    
    -- ====================================================================
    -- 3. 테스트 시나리오 2: 장기 미수강 (7일 경과)
    -- ====================================================================
    
    IF EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_2) THEN
        -- 강의 등록 (8일 전)
        INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
        VALUES (test_user_2, test_course, 'active', NOW() - INTERVAL '8 days')
        ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active';
        
        -- 8일 전에 마지막 수강
        INSERT INTO progress (user_id, lesson_id, completed, last_watched_at, created_at)
        VALUES (test_user_2, test_lesson, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
        ON CONFLICT (user_id, lesson_id) 
        DO UPDATE SET last_watched_at = NOW() - INTERVAL '8 days';
        
        RAISE NOTICE '✅ 테스트 사용자 2 (장기 미수강) 설정 완료: %', test_user_2;
    ELSE
        RAISE EXCEPTION '❌ 테스트 사용자 2가 존재하지 않습니다: %', test_user_2;
    END IF;
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ 테스트 데이터 생성 완료!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
END $$;

-- ====================================================================
-- 4. 테스트 데이터 확인
-- ====================================================================

-- 과제 미제출 학생 확인 (24시간 이상 경과)
SELECT 
    '과제 미제출' as test_scenario,
    p.id as progress_id,
    pr.id as user_id,
    pr.name,
    pr.phone,
    l.title as lesson_title,
    p.last_watched_at,
    EXTRACT(EPOCH FROM (NOW() - p.last_watched_at))/3600 as hours_elapsed
FROM progress p
JOIN profiles pr ON p.user_id = pr.id
JOIN lessons l ON p.lesson_id = l.id
WHERE p.completed = false
  AND p.last_watched_at IS NOT NULL
  AND p.last_watched_at < NOW() - INTERVAL '24 hours'
  AND l.id = '00000000-0000-0000-0000-000000000020';

-- 장기 미수강 학생 확인 (7일 이상)
SELECT 
    '장기 미수강' as test_scenario,
    pr.id as user_id,
    pr.name,
    pr.phone,
    c.title as course_title,
    MAX(p.last_watched_at) as last_activity,
    EXTRACT(EPOCH FROM (NOW() - MAX(p.last_watched_at)))/86400 as days_inactive
FROM profiles pr
JOIN enrollments e ON pr.id = e.user_id
JOIN courses c ON e.course_id = c.id
LEFT JOIN progress p ON pr.id = p.user_id
WHERE e.status = 'active'
  AND e.course_id = '00000000-0000-0000-0000-000000000010'
GROUP BY pr.id, pr.name, pr.phone, c.title
HAVING MAX(p.last_watched_at) < NOW() - INTERVAL '7 days';

-- ====================================================================
-- 5. 이전 알림 로그 삭제 (재테스트를 위해)
-- ====================================================================

-- 테스트 강의 관련 알림 로그 삭제 (중복 발송 방지 해제)
DELETE FROM notification_log 
WHERE lesson_id = '00000000-0000-0000-0000-000000000020'
   OR created_at >= CURRENT_DATE - INTERVAL '1 day';

RAISE NOTICE '✅ 이전 알림 로그 삭제 완료 (재테스트 가능)';

-- ====================================================================
-- 6. 테스트 완료 후 데이터 정리
-- ====================================================================

-- 테스트가 끝나면 아래 쿼리로 테스트 데이터를 삭제하세요
/*
-- notification_log 삭제
DELETE FROM notification_log 
WHERE lesson_id = '00000000-0000-0000-0000-000000000020';

-- progress 삭제
DELETE FROM progress 
WHERE lesson_id = '00000000-0000-0000-0000-000000000020';

-- enrollments 삭제
DELETE FROM enrollments 
WHERE course_id = '00000000-0000-0000-0000-000000000010';

-- lessons 삭제
DELETE FROM lessons WHERE id = '00000000-0000-0000-0000-000000000020';

-- courses 삭제
DELETE FROM courses WHERE id = '00000000-0000-0000-0000-000000000010';

-- 테스트 계정도 삭제하려면 (선택사항)
-- DELETE FROM auth.users WHERE email LIKE 'test%@allround.co.kr';
*/
