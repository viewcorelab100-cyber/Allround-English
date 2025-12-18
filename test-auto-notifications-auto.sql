-- ====================================================================
-- 자동 알림톡 테스트용 데이터 생성 (자동 버전)
-- 기존 사용자를 자동으로 찾아서 테스트 데이터 생성
-- ====================================================================

DO $$
DECLARE
    test_user_1 UUID;
    test_user_2 UUID;
    test_course UUID := '00000000-0000-0000-0000-000000000010';
    test_lesson UUID := '00000000-0000-0000-0000-000000000020';
BEGIN
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '🔍 기존 사용자 검색 중...';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    
    -- 첫 번째 테스트 사용자 찾기 (가장 최근 활동 사용자)
    SELECT id INTO test_user_1
    FROM auth.users 
    WHERE email NOT LIKE '%test%'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 두 번째 테스트 사용자 찾기 (두 번째로 최근 활동 사용자)
    SELECT id INTO test_user_2
    FROM auth.users 
    WHERE email NOT LIKE '%test%'
      AND id != test_user_1
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- 사용자가 없으면 에러
    IF test_user_1 IS NULL OR test_user_2 IS NULL THEN
        RAISE EXCEPTION '❌ 테스트할 사용자가 충분하지 않습니다. 최소 2명의 회원이 필요합니다.';
    END IF;
    
    RAISE NOTICE '✅ 테스트 사용자 1 (과제 미제출): %', test_user_1;
    RAISE NOTICE '✅ 테스트 사용자 2 (장기 미수강): %', test_user_2;
    RAISE NOTICE '';
    
    -- ====================================================================
    -- 1. 테스트용 강의 및 레슨 생성
    -- ====================================================================
    
    RAISE NOTICE '📚 테스트 강의 생성 중...';
    
    INSERT INTO courses (id, title, description, instructor, published, created_at)
    VALUES 
        (test_course, '[테스트] 알림톡 테스트 강의', '알림톡 자동 테스트용 강의입니다. 테스트 완료 후 삭제해주세요.', '테스트 강사', true, NOW())
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        updated_at = NOW();
    
    INSERT INTO lessons (id, course_id, title, video_url, order_num, published, created_at)
    VALUES 
        (test_lesson, test_course, '[테스트] 알림톡 테스트 레슨 1', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', 1, true, NOW())
    ON CONFLICT (id) DO UPDATE SET 
        title = EXCLUDED.title,
        updated_at = NOW();
    
    RAISE NOTICE '✅ 테스트 강의 및 레슨 생성 완료';
    RAISE NOTICE '';
    
    -- ====================================================================
    -- 2. 테스트 시나리오 1: 과제 미제출 (24시간 경과)
    -- ====================================================================
    
    RAISE NOTICE '📝 시나리오 1 설정: 과제 미제출 (24시간 경과)';
    
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
        completed = false,
        updated_at = NOW();
    
    RAISE NOTICE '  → 사용자: %', test_user_1;
    RAISE NOTICE '  → 마지막 시청: 25시간 전';
    RAISE NOTICE '  → 과제 상태: 미제출';
    RAISE NOTICE '';
    
    -- ====================================================================
    -- 3. 테스트 시나리오 2: 장기 미수강 (7일 경과)
    -- ====================================================================
    
    RAISE NOTICE '📅 시나리오 2 설정: 장기 미수강 (7일 경과)';
    
    -- 강의 등록 (8일 전)
    INSERT INTO enrollments (user_id, course_id, status, enrolled_at)
    VALUES (test_user_2, test_course, 'active', NOW() - INTERVAL '8 days')
    ON CONFLICT (user_id, course_id) DO UPDATE SET status = 'active';
    
    -- 8일 전에 마지막 수강
    INSERT INTO progress (user_id, lesson_id, completed, last_watched_at, created_at)
    VALUES (test_user_2, test_lesson, false, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days')
    ON CONFLICT (user_id, lesson_id) 
    DO UPDATE SET 
        last_watched_at = NOW() - INTERVAL '8 days',
        updated_at = NOW();
    
    RAISE NOTICE '  → 사용자: %', test_user_2;
    RAISE NOTICE '  → 마지막 시청: 8일 전';
    RAISE NOTICE '  → 등록 상태: 활성';
    RAISE NOTICE '';
    
    -- ====================================================================
    -- 4. 이전 알림 로그 삭제 (중복 발송 방지 해제)
    -- ====================================================================
    
    DELETE FROM notification_log 
    WHERE user_id IN (test_user_1, test_user_2)
      AND created_at >= CURRENT_DATE - INTERVAL '1 day';
    
    RAISE NOTICE '🗑️  이전 알림 로그 삭제 완료';
    RAISE NOTICE '';
    
    -- ====================================================================
    -- 완료 메시지
    -- ====================================================================
    
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '✅ 테스트 데이터 생성 완료!';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '';
    RAISE NOTICE '📌 다음 단계:';
    RAISE NOTICE '  1. Edge Function 실행';
    RAISE NOTICE '  2. notification_log 테이블 확인';
    RAISE NOTICE '  3. 실제 알림톡 수신 확인';
    RAISE NOTICE '';
    
END $$;

-- ====================================================================
-- 테스트 데이터 확인
-- ====================================================================

-- 과제 미제출 학생
SELECT 
    '📝 과제 미제출 (24시간+)' as scenario,
    pr.name,
    pr.email,
    pr.phone,
    p.last_watched_at,
    ROUND(EXTRACT(EPOCH FROM (NOW() - p.last_watched_at))/3600, 1) as hours_elapsed
FROM progress p
JOIN profiles pr ON p.user_id = pr.id
WHERE p.lesson_id = '00000000-0000-0000-0000-000000000020'
  AND p.completed = false
  AND p.last_watched_at < NOW() - INTERVAL '24 hours';

-- 장기 미수강 학생
SELECT 
    '📅 장기 미수강 (7일+)' as scenario,
    pr.name,
    pr.email,
    pr.phone,
    MAX(p.last_watched_at) as last_activity,
    ROUND(EXTRACT(EPOCH FROM (NOW() - MAX(p.last_watched_at)))/86400, 1) as days_inactive
FROM profiles pr
JOIN enrollments e ON pr.id = e.user_id
LEFT JOIN progress p ON pr.id = p.user_id
WHERE e.course_id = '00000000-0000-0000-0000-000000000010'
  AND e.status = 'active'
GROUP BY pr.id, pr.name, pr.email, pr.phone
HAVING MAX(p.last_watched_at) < NOW() - INTERVAL '7 days';

-- ====================================================================
-- 정리 스크립트 (테스트 완료 후 실행)
-- ====================================================================

/*
-- 아래 주석을 해제하고 실행하면 모든 테스트 데이터가 삭제됩니다

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
DELETE FROM lessons 
WHERE id = '00000000-0000-0000-0000-000000000020';

-- courses 삭제
DELETE FROM courses 
WHERE id = '00000000-0000-0000-0000-000000000010';

-- 확인
SELECT '✅ 테스트 데이터 정리 완료!' as result;
*/

