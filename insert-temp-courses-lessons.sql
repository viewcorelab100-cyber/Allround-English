-- ====================================================================
-- 임시 강좌 3개 + 각 강좌별 12개 레슨 삽입
-- Supabase SQL Editor에서 실행하세요
-- ====================================================================

-- ====================================================================
-- 1. 기존 임시 데이터 삭제 (선택사항 - 필요시 주석 해제)
-- ====================================================================
-- DELETE FROM lessons WHERE course_id IN (SELECT id FROM courses WHERE title LIKE '임시강좌%');
-- DELETE FROM courses WHERE title LIKE '임시강좌%';

-- ====================================================================
-- 2. 임시 강좌 3개 삽입
-- ====================================================================
INSERT INTO courses (title, description, price, thumbnail_url, is_published, created_at)
VALUES 
    ('임시강좌 1 - 기초 영어회화', '영어회화의 기초를 다지는 강좌입니다. 일상생활에서 자주 사용하는 표현들을 배웁니다.', 99000, 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80', true, NOW()),
    ('임시강좌 2 - 비즈니스 영어', '직장에서 필요한 비즈니스 영어를 배웁니다. 이메일, 회의, 프레젠테이션 영어를 다룹니다.', 129000, 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=800&q=80', true, NOW()),
    ('임시강좌 3 - 영어 발음 교정', '정확한 발음과 억양을 배우는 강좌입니다. 네이티브처럼 말하기 위한 핵심 기술을 다룹니다.', 89000, 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?w=800&q=80', true, NOW())
ON CONFLICT DO NOTHING;

-- ====================================================================
-- 3. 강좌 ID 확인 후 레슨 삽입
-- ====================================================================

-- 임시강좌 1의 레슨 12개
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT 
    c.id,
    '1강 - 인사와 자기소개',
    '영어로 인사하고 자기소개하는 방법을 배웁니다.',
    15,
    1,
    true,
    '',
    NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화'
ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 날씨와 계절 표현', '날씨와 계절에 대해 영어로 대화하는 방법을 배웁니다.', 18, 2, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 음식 주문하기', '레스토랑에서 음식을 주문하는 표현을 배웁니다.', 20, 3, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 길 찾기와 교통수단', '길을 물어보고 교통수단을 이용하는 표현을 배웁니다.', 22, 4, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 쇼핑하기', '쇼핑할 때 필요한 영어 표현을 배웁니다.', 17, 5, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 전화 영어', '전화로 대화하는 영어 표현을 배웁니다.', 19, 6, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 약속 잡기', '약속을 잡고 일정을 조율하는 표현을 배웁니다.', 16, 7, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 취미와 여가', '취미와 여가 활동에 대해 이야기하는 표현을 배웁니다.', 21, 8, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 건강과 병원', '건강 상태를 표현하고 병원에서 사용하는 영어를 배웁니다.', 23, 9, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 호텔과 숙소', '호텔 예약과 체크인/체크아웃 영어를 배웁니다.', 18, 10, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 여행 영어', '해외여행 시 필요한 영어 표현을 배웁니다.', 25, 11, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 종합 복습', '지금까지 배운 내용을 종합적으로 복습합니다.', 30, 12, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 1 - 기초 영어회화' ON CONFLICT DO NOTHING;


-- 임시강좌 2의 레슨 12개
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 비즈니스 인사와 소개', '비즈니스 상황에서의 격식있는 인사와 소개 방법을 배웁니다.', 20, 1, true, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 이메일 작성법', '전문적인 비즈니스 이메일 작성법을 배웁니다.', 25, 2, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 전화 회의', '전화 회의에서 사용하는 영어 표현을 배웁니다.', 22, 3, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 프레젠테이션 기초', '영어 프레젠테이션의 기본 구조와 표현을 배웁니다.', 28, 4, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 협상 영어', '협상 상황에서 사용하는 영어 표현을 배웁니다.', 24, 5, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 미팅 진행', '미팅을 주재하고 진행하는 영어 표현을 배웁니다.', 23, 6, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 보고서 작성', '비즈니스 보고서 작성에 필요한 영어를 배웁니다.', 26, 7, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 고객 응대', '고객을 응대할 때 사용하는 영어 표현을 배웁니다.', 21, 8, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 면접 영어', '영어 면접 준비와 자주 묻는 질문 답변법을 배웁니다.', 27, 9, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 네트워킹', '비즈니스 네트워킹에서 사용하는 영어를 배웁니다.', 19, 10, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 해외 출장', '해외 출장 시 필요한 비즈니스 영어를 배웁니다.', 24, 11, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 종합 실전 연습', '배운 내용을 종합적으로 실전 연습합니다.', 30, 12, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 2 - 비즈니스 영어' ON CONFLICT DO NOTHING;


-- 임시강좌 3의 레슨 12개
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 영어 발음의 기초', '영어 발음의 기본 원리와 중요성을 배웁니다.', 18, 1, true, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 모음 발음', '영어의 다양한 모음 발음을 정확하게 배웁니다.', 22, 2, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 자음 발음', '영어의 자음 발음, 특히 한국인이 어려워하는 발음을 배웁니다.', 24, 3, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - R과 L 발음', 'R과 L 발음의 차이를 명확하게 구분하는 방법을 배웁니다.', 20, 4, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - TH 발음', 'TH 발음을 정확하게 내는 방법을 배웁니다.', 19, 5, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 강세와 리듬', '영어의 강세 패턴과 리듬감을 배웁니다.', 23, 6, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 억양과 인토네이션', '자연스러운 영어 억양을 만드는 방법을 배웁니다.', 25, 7, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 연음과 축약', '영어의 연음과 축약 현상을 이해하고 연습합니다.', 21, 8, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 문장 읽기 연습', '긴 문장을 자연스럽게 읽는 연습을 합니다.', 26, 9, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 쉐도잉 기법', '원어민 음성을 따라하는 쉐도잉 기법을 배웁니다.', 24, 10, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 실전 대화 연습', '실제 대화 상황에서 발음을 적용하는 연습을 합니다.', 27, 11, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 종합 발음 테스트', '배운 발음을 종합적으로 테스트하고 피드백합니다.', 30, 12, false, '', NOW()
FROM courses c WHERE c.title = '임시강좌 3 - 영어 발음 교정' ON CONFLICT DO NOTHING;


-- ====================================================================
-- 4. 확인 쿼리 - 삽입된 데이터 확인
-- ====================================================================
SELECT 
    c.title as course_title,
    COUNT(l.id) as lesson_count
FROM courses c
LEFT JOIN lessons l ON l.course_id = c.id
WHERE c.title LIKE '임시강좌%'
GROUP BY c.id, c.title
ORDER BY c.title;

