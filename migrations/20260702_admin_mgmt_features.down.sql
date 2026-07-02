-- ====================================================================
-- 20260702_admin_mgmt_features.down.sql
-- 위 up 마이그레이션 되돌리기 (역순).
-- ⚠️ guide_attachments / site_settings 데이터와 guide-files 버킷의 파일이 삭제됨.
--    운영 롤백 시 사전 스냅백업 권장.
-- ====================================================================

-- 4) guide-files 버킷 정책 + 버킷
DROP POLICY IF EXISTS "guide-files admin delete" ON storage.objects;
DROP POLICY IF EXISTS "guide-files admin update" ON storage.objects;
DROP POLICY IF EXISTS "guide-files admin insert" ON storage.objects;
DROP POLICY IF EXISTS "guide-files public read" ON storage.objects;
-- 버킷 내 오브젝트 먼저 제거 후 버킷 삭제
DELETE FROM storage.objects WHERE bucket_id = 'guide-files';
DELETE FROM storage.buckets WHERE id = 'guide-files';

-- 3) guide_attachments
DROP POLICY IF EXISTS "guide_attachments admin write" ON public.guide_attachments;
DROP POLICY IF EXISTS "guide_attachments public read" ON public.guide_attachments;
DROP TABLE IF EXISTS public.guide_attachments;

-- 2) site_settings
DROP POLICY IF EXISTS "site_settings admin write" ON public.site_settings;
DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
DROP TABLE IF EXISTS public.site_settings;

-- 1b) prevent_role_change 원복 (auth.uid() NULL 허용 로직 제거)
CREATE OR REPLACE FUNCTION public.prevent_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        IF NEW.role IS DISTINCT FROM OLD.role THEN
            NEW.role := OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$function$;

-- 1) profiles.is_active
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_active;
