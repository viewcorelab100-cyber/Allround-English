-- ============================================
-- 보안 수정: RLS 정책 강화
-- 날짜: 2026-03-17
-- ============================================

-- 1. lessons 테이블: video_url 접근 제한
-- 구매하지 않은 사용자에게 video_url 노출 방지
-- (기존 RLS가 있으면 DROP 후 재생성)

-- 방법: video_url을 직접 제한하는 RLS는 컬럼 단위 제어가 안 되므로
-- 대안: lessons에 대한 SELECT를 구매자/관리자/미리보기만 허용

ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리
DROP POLICY IF EXISTS "lessons_select_policy" ON lessons;
DROP POLICY IF EXISTS "lessons_admin_all" ON lessons;
DROP POLICY IF EXISTS "Anyone can view lessons" ON lessons;

-- 미리보기 레슨: 누구나 조회 가능
CREATE POLICY "lessons_preview_select" ON lessons
    FOR SELECT
    USING (is_preview = true);

-- 구매한 레슨: 해당 코스를 구매한 사용자만 조회
CREATE POLICY "lessons_purchased_select" ON lessons
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM purchases
            WHERE purchases.course_id = lessons.course_id
            AND purchases.user_id = auth.uid()
            AND purchases.status = 'completed'
        )
    );

-- 관리자: 모든 레슨 접근
CREATE POLICY "lessons_admin_all" ON lessons
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 2. purchases 테이블: 클라이언트에서 직접 INSERT 차단
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "purchases_select_own" ON purchases;
DROP POLICY IF EXISTS "purchases_insert_self" ON purchases;
DROP POLICY IF EXISTS "Anyone can insert purchases" ON purchases;

-- 자신의 구매 내역만 조회
CREATE POLICY "purchases_select_own" ON purchases
    FOR SELECT
    USING (user_id = auth.uid());

-- INSERT 차단: service_role(Edge Function)에서만 생성 가능
-- 클라이언트(anon key)에서는 INSERT 불가
-- 아래 정책이 없으면 RLS가 활성화된 상태에서 INSERT가 자동 차단됨

-- 관리자만 INSERT/UPDATE/DELETE 가능
CREATE POLICY "purchases_admin_all" ON purchases
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 3. lesson_progress 테이블: 자기 데이터만 접근
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "lesson_progress_select_own" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_insert_own" ON lesson_progress;
DROP POLICY IF EXISTS "lesson_progress_update_own" ON lesson_progress;

CREATE POLICY "lesson_progress_select_own" ON lesson_progress
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "lesson_progress_insert_own" ON lesson_progress
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "lesson_progress_update_own" ON lesson_progress
    FOR UPDATE USING (user_id = auth.uid());

-- ============================================
-- 주의사항:
-- 1. 이 SQL을 Supabase SQL Editor에서 실행하세요
-- 2. purchaseCourse() 함수는 Edge Function으로 이전해야 합니다
--    클라이언트에서 직접 purchases INSERT를 차단했으므로
--    결제 완료 후 서버사이드에서 INSERT 해야 합니다
-- 3. 기존에 lessons 테이블에 다른 RLS 정책이 있다면
--    충돌 여부를 확인하세요
-- ============================================
