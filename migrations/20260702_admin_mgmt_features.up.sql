-- ====================================================================
-- 20260702_admin_mgmt_features.up.sql
-- 관리자 기능 4종 기반 스키마 (추가형 전용 — 기존 데이터 무변경)
--   1) profiles.is_active  : 관리자 계정 비활성화 플래그
--   2) site_settings       : 강사채용 토글·링크 등 사이트 전역 설정(key-value)
--   3) guide_attachments   : 게시판 첨부/썸네일 파일 메타
--   4) guide-files 버킷     : 게시판 파일 저장(Storage) + RLS
-- CLAUDE.md Migration Governance 준수: 스키마 전용, bulk UPDATE 없음, down 분리.
-- ====================================================================

-- ---------------------------------------------------------------
-- 1) profiles.is_active (관리자 비활성화용) — 기존 전원 활성 유지
-- ---------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN public.profiles.is_active IS
    '관리자 계정 활성 여부. false면 admin 접근 차단. 학생은 항상 true.';

-- ---------------------------------------------------------------
-- 2) site_settings (key-value, value=jsonb)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.site_settings (
    key        text PRIMARY KEY,
    value      jsonb NOT NULL DEFAULT '{}'::jsonb,
    updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.site_settings IS '사이트 전역 설정(강사채용 토글·링크 등). 공개 읽기, 쓰기 admin.';

-- 강사채용 기본값: OFF, 링크 없음
INSERT INTO public.site_settings (key, value)
VALUES ('recruit', '{"enabled": false, "url": ""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "site_settings public read" ON public.site_settings;
CREATE POLICY "site_settings public read"
    ON public.site_settings FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "site_settings admin write" ON public.site_settings;
CREATE POLICY "site_settings admin write"
    ON public.site_settings FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------
-- 3) guide_attachments (게시판 썸네일/첨부 메타)
-- ---------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.guide_attachments (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    guide_id   uuid NOT NULL REFERENCES public.guides(id) ON DELETE CASCADE,
    kind       text NOT NULL DEFAULT 'attachment' CHECK (kind IN ('thumbnail', 'attachment')),
    file_url   text NOT NULL,
    file_name  text NOT NULL,
    file_size  bigint,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_guide_attachments_guide_id
    ON public.guide_attachments(guide_id);

COMMENT ON TABLE public.guide_attachments IS '게시판 글 첨부/썸네일 파일 메타. 공개 읽기, 쓰기 admin.';

ALTER TABLE public.guide_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "guide_attachments public read" ON public.guide_attachments;
CREATE POLICY "guide_attachments public read"
    ON public.guide_attachments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "guide_attachments admin write" ON public.guide_attachments;
CREATE POLICY "guide_attachments admin write"
    ON public.guide_attachments FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'))
    WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ---------------------------------------------------------------
-- 4) guide-files Storage 버킷 (공개 읽기, 쓰기 admin)
--    create-submissions-bucket.sql 패턴. 여기서는 버킷을 SQL로 직접 생성.
-- ---------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('guide-files', 'guide-files', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "guide-files public read" ON storage.objects;
CREATE POLICY "guide-files public read"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'guide-files');

DROP POLICY IF EXISTS "guide-files admin insert" ON storage.objects;
CREATE POLICY "guide-files admin insert"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'guide-files'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "guide-files admin update" ON storage.objects;
CREATE POLICY "guide-files admin update"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'guide-files'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    )
    WITH CHECK (
        bucket_id = 'guide-files'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

DROP POLICY IF EXISTS "guide-files admin delete" ON storage.objects;
CREATE POLICY "guide-files admin delete"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'guide-files'
        AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
