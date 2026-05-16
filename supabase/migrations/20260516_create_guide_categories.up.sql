-- ============================================================
-- guide_categories: 게시판 카테고리 마스터 테이블
-- 관련 문서: docs/PLAN_guide_board.md (Phase C 추가 작업)
-- 작성일: 2026-05-16
-- ============================================================

-- 1. 테이블
CREATE TABLE IF NOT EXISTS public.guide_categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT UNIQUE NOT NULL,
    display_order INT  DEFAULT 0,
    created_at    TIMESTAMPTZ DEFAULT now(),
    updated_at    TIMESTAMPTZ DEFAULT now(),
    CONSTRAINT guide_categories_name_check CHECK (char_length(name) BETWEEN 1 AND 50)
);

CREATE INDEX IF NOT EXISTS idx_guide_categories_order
    ON public.guide_categories(display_order, name);

-- 2. updated_at 트리거
CREATE OR REPLACE FUNCTION public.update_guide_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guide_categories_updated_at ON public.guide_categories;
CREATE TRIGGER trigger_guide_categories_updated_at
    BEFORE UPDATE ON public.guide_categories
    FOR EACH ROW
    EXECUTE FUNCTION public.update_guide_categories_updated_at();

-- 3. RLS
ALTER TABLE public.guide_categories ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 (공개 페이지 카테고리 탭에서 사용)
DROP POLICY IF EXISTS "guide_categories_select_all" ON public.guide_categories;
CREATE POLICY "guide_categories_select_all" ON public.guide_categories
    FOR SELECT
    TO anon, authenticated
    USING (true);

-- admin만 INSERT/UPDATE/DELETE
DROP POLICY IF EXISTS "guide_categories_insert_admin" ON public.guide_categories;
CREATE POLICY "guide_categories_insert_admin" ON public.guide_categories
    FOR INSERT TO authenticated
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "guide_categories_update_admin" ON public.guide_categories;
CREATE POLICY "guide_categories_update_admin" ON public.guide_categories
    FOR UPDATE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

DROP POLICY IF EXISTS "guide_categories_delete_admin" ON public.guide_categories;
CREATE POLICY "guide_categories_delete_admin" ON public.guide_categories
    FOR DELETE TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- 4. 카테고리 이름 일괄 변경 RPC (트랜잭션 보장)
CREATE OR REPLACE FUNCTION public.rename_guide_category(p_old_name TEXT, p_new_name TEXT)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_admin BOOLEAN;
    v_count INT;
BEGIN
    -- 호출자 admin 검증
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
         WHERE id = auth.uid() AND role = 'admin'
    ) INTO v_admin;

    IF NOT v_admin THEN
        RAISE EXCEPTION 'permission denied: admin only';
    END IF;

    IF p_old_name IS NULL OR p_new_name IS NULL OR length(trim(p_new_name)) = 0 THEN
        RAISE EXCEPTION 'invalid category name';
    END IF;

    -- 카테고리 마스터 업데이트
    UPDATE public.guide_categories
       SET name = p_new_name
     WHERE name = p_old_name;

    -- guides 테이블 일괄 갱신 (updated_at은 트리거에서 처리)
    UPDATE public.guides
       SET category = p_new_name
     WHERE category = p_old_name;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.rename_guide_category(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rename_guide_category(TEXT, TEXT) TO authenticated;

-- 5. 시드 데이터 (기존 가이드의 기본 카테고리 4종)
INSERT INTO public.guide_categories (name, display_order)
VALUES
    ('시작하기',   10),
    ('강의 시청', 20),
    ('결제·환불', 30),
    ('FAQ',       40)
ON CONFLICT (name) DO NOTHING;

-- 6. 코멘트
COMMENT ON TABLE public.guide_categories IS '게시판 카테고리 마스터. guides.category 컬럼과 이름으로 매칭(FK 아님).';
COMMENT ON FUNCTION public.rename_guide_category(TEXT, TEXT) IS '카테고리 이름 일괄 변경. guide_categories + guides.category 동시 UPDATE. admin 권한 필요.';
