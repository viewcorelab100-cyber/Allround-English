-- ============================================================
-- DOWN migration: guide_categories 롤백
-- ⚠️ guides.category 컬럼은 그대로 유지 (이름 매칭이라 무영향)
-- ============================================================

DROP FUNCTION IF EXISTS public.rename_guide_category(TEXT, TEXT);

DROP POLICY IF EXISTS "guide_categories_delete_admin" ON public.guide_categories;
DROP POLICY IF EXISTS "guide_categories_update_admin" ON public.guide_categories;
DROP POLICY IF EXISTS "guide_categories_insert_admin" ON public.guide_categories;
DROP POLICY IF EXISTS "guide_categories_select_all"   ON public.guide_categories;

DROP TRIGGER  IF EXISTS trigger_guide_categories_updated_at ON public.guide_categories;
DROP FUNCTION IF EXISTS public.update_guide_categories_updated_at();

DROP TABLE IF EXISTS public.guide_categories;
