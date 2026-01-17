-- ====================================================================
-- ALLROUND GRAMMAR 01, READING 01, STRUCTURE 01 강좌 레슨 업데이트
-- Supabase SQL Editor에서 실행하세요
-- ====================================================================

-- ====================================================================
-- 1. 기존 임시 레슨 삭제 (임시강좌 1, 2, 3)
-- ====================================================================
DELETE FROM lessons
WHERE title LIKE '%임시강좌%' OR title LIKE '%임시 강좌%';

-- ====================================================================
-- 2. ALLROUND GRAMMAR 01 - 문법 12강
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 품사의 이해', '명사, 동사, 형용사, 부사의 기본 개념', 20, 1, true, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 문장의 기본 구조', '주어, 동사, 목적어, 보어의 역할', 22, 2, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 시제의 기초', '현재, 과거, 미래 시제 이해하기', 25, 3, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 진행형과 완료형', '진행 시제와 완료 시제 구분하기', 23, 4, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 조동사 활용', 'can, will, may, must 등 조동사 사용법', 20, 5, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 수동태 기초', '능동태와 수동태 변환하기', 22, 6, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 부정사와 동명사', 'to 부정사와 -ing 동명사 구분', 24, 7, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 분사의 이해', '현재분사와 과거분사 활용', 21, 8, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 관계대명사', 'who, which, that의 사용법', 25, 9, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 접속사와 전치사', '문장 연결과 위치 표현', 22, 10, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 비교급과 최상급', '형용사와 부사의 비교 표현', 20, 11, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 가정법 기초', '가정법 현재와 과거 이해하기', 25, 12, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND GRAMMAR 01' ON CONFLICT DO NOTHING;

-- ====================================================================
-- 3. ALLROUND READING 01 - 독해 12강
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 읽기의 기초', '영어 읽기 전략과 접근법', 18, 1, true, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 주제 파악하기', '글의 중심 내용 찾는 방법', 20, 2, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 세부 정보 찾기', '핵심 정보와 세부 사항 구분', 22, 3, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 문맥 속 어휘', '문맥을 통한 단어 의미 추론', 21, 4, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 지시어와 연결어', '대명사와 접속사로 흐름 파악', 20, 5, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 추론하기', '글에서 암시된 내용 파악', 24, 6, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 글의 구조 이해', '서론, 본론, 결론 구조 분석', 22, 7, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 사실과 의견 구분', 'Fact vs Opinion 판별하기', 20, 8, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 비교와 대조', '두 대상의 공통점과 차이점 파악', 23, 9, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 원인과 결과', '인과 관계 파악하기', 21, 10, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 요약하기', '글의 핵심을 간결하게 정리', 22, 11, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 종합 독해 연습', '다양한 지문 유형 실전 연습', 25, 12, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND READING 01' ON CONFLICT DO NOTHING;

-- ====================================================================
-- 4. ALLROUND STRUCTURE 01 - 문장구조 12강
-- ====================================================================
INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '1강 - 문장의 5형식', '영어 문장의 기본 5가지 형식', 22, 1, true, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '2강 - 1형식과 2형식', '주어+동사, 주어+동사+보어 구조', 20, 2, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '3강 - 3형식 문장', '주어+동사+목적어 구조 마스터', 21, 3, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '4강 - 4형식 문장', '주어+동사+간접목적어+직접목적어', 23, 4, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '5강 - 5형식 문장', '주어+동사+목적어+목적보어 구조', 24, 5, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '6강 - 구와 절의 이해', '명사구, 형용사구, 부사구 구분', 22, 6, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '7강 - 명사절 활용', 'that절, whether절, 의문사절', 25, 7, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '8강 - 형용사절 활용', '관계대명사와 관계부사 사용', 23, 8, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '9강 - 부사절 활용', '시간, 조건, 이유, 양보의 부사절', 24, 9, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '10강 - 병렬 구조', '등위접속사와 병렬 표현', 20, 10, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '11강 - 도치와 강조', '문장 어순 변화와 강조 구문', 22, 11, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

INSERT INTO lessons (course_id, title, description, duration, order_num, is_preview, video_url, created_at)
SELECT c.id, '12강 - 복합 문장 구성', '여러 절을 결합한 복잡한 문장', 25, 12, false, '', NOW()
FROM courses c WHERE c.title = 'ALLROUND STRUCTURE 01' ON CONFLICT DO NOTHING;

-- ====================================================================
-- 확인 쿼리
-- ====================================================================
SELECT c.title as course, l.order_num, l.title as lesson_title
FROM lessons l
JOIN courses c ON l.course_id = c.id
WHERE c.title IN ('ALLROUND GRAMMAR 01', 'ALLROUND READING 01', 'ALLROUND STRUCTURE 01')
ORDER BY c.title, l.order_num;
