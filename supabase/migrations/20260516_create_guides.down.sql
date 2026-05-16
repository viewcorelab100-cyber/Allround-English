-- ============================================================
-- DOWN migration: guides 게시판 전체 롤백
-- 관련 UP: 20260516_create_guides.up.sql
-- ⚠️ 주의: 본 down은 데이터(가이드 본문, 업로드 이미지)를 모두 삭제합니다.
--         운영 환경에서 실행 전 PM 명시적 승인 필수.
-- ============================================================

-- 1. Storage RLS 정책 제거
DROP POLICY IF EXISTS "guide_images_delete" ON storage.objects;
DROP POLICY IF EXISTS "guide_images_insert" ON storage.objects;
DROP POLICY IF EXISTS "guide_images_select" ON storage.objects;

-- 2. Storage 버킷 내 파일 삭제 후 버킷 삭제
--    (버킷이 비어있어야 DROP 가능. 운영 적용 전 PM이 Supabase Studio에서 수동 비우기 권장)
DELETE FROM storage.objects WHERE bucket_id = 'guide-images';
DELETE FROM storage.buckets WHERE id = 'guide-images';

-- 3. 테이블 RLS 정책 제거
DROP POLICY IF EXISTS "guides_delete_admin"  ON public.guides;
DROP POLICY IF EXISTS "guides_update_admin"  ON public.guides;
DROP POLICY IF EXISTS "guides_insert_admin"  ON public.guides;
DROP POLICY IF EXISTS "guides_select_admin"  ON public.guides;
DROP POLICY IF EXISTS "guides_select_public" ON public.guides;

-- 4. 트리거 + 함수 제거
DROP TRIGGER  IF EXISTS trigger_guides_updated_at ON public.guides;
DROP FUNCTION IF EXISTS public.update_guides_updated_at();
DROP FUNCTION IF EXISTS public.increment_guide_view_count(TEXT);

-- 5. 테이블 제거
DROP TABLE IF EXISTS public.guides;
