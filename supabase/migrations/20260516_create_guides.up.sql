-- ============================================================
-- guides: 사용 가이드 게시판 (단방향, 관리자 작성)
-- 관련 문서: docs/PLAN_guide_board.md
-- 작성일: 2026-05-16
-- ============================================================

-- 1. 메인 테이블
CREATE TABLE IF NOT EXISTS public.guides (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category         TEXT NOT NULL,
    title            TEXT NOT NULL,
    slug             TEXT UNIQUE NOT NULL,
    content_markdown TEXT NOT NULL,
    content_text     TEXT,
    thumbnail_url    TEXT,
    display_order    INT DEFAULT 0,
    is_published     BOOLEAN DEFAULT false,
    view_count       INT DEFAULT 0,
    published_at     TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    created_by       UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    CONSTRAINT guides_category_check CHECK (char_length(category) BETWEEN 1 AND 50),
    CONSTRAINT guides_title_check    CHECK (char_length(title) BETWEEN 1 AND 200),
    CONSTRAINT guides_slug_check     CHECK (char_length(slug) BETWEEN 1 AND 200)
);

-- 2. 인덱스
CREATE INDEX IF NOT EXISTS idx_guides_published_list
    ON public.guides(is_published, category, display_order, published_at DESC);

CREATE INDEX IF NOT EXISTS idx_guides_slug_published
    ON public.guides(slug)
    WHERE is_published = true;

CREATE INDEX IF NOT EXISTS idx_guides_created_at
    ON public.guides(created_at DESC);

-- 3. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION public.update_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    -- 미게시 → 게시 전환 시점에 published_at 자동 기록 (수정으로 게시일이 바뀌지는 않음)
    IF NEW.is_published = true AND OLD.is_published = false THEN
        NEW.published_at = COALESCE(NEW.published_at, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_guides_updated_at ON public.guides;
CREATE TRIGGER trigger_guides_updated_at
    BEFORE UPDATE ON public.guides
    FOR EACH ROW
    EXECUTE FUNCTION public.update_guides_updated_at();

-- 4. view_count 증가 RPC (anon에서도 호출 가능, 단일 UPDATE 만 허용)
CREATE OR REPLACE FUNCTION public.increment_guide_view_count(p_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.guides
       SET view_count = view_count + 1
     WHERE slug = p_slug
       AND is_published = true;
END;
$$;

REVOKE ALL ON FUNCTION public.increment_guide_view_count(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_guide_view_count(TEXT) TO anon, authenticated;

-- 5. RLS 활성화
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- 5-1. SELECT: 공개된 가이드는 anon 포함 누구나 조회
DROP POLICY IF EXISTS "guides_select_public" ON public.guides;
CREATE POLICY "guides_select_public" ON public.guides
    FOR SELECT
    TO anon, authenticated
    USING (is_published = true);

-- 5-2. SELECT (전체): admin은 임시저장 포함 전부 조회
DROP POLICY IF EXISTS "guides_select_admin" ON public.guides;
CREATE POLICY "guides_select_admin" ON public.guides
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
        )
    );

-- 5-3. INSERT: admin만
DROP POLICY IF EXISTS "guides_insert_admin" ON public.guides;
CREATE POLICY "guides_insert_admin" ON public.guides
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
        )
    );

-- 5-4. UPDATE: admin만
DROP POLICY IF EXISTS "guides_update_admin" ON public.guides;
CREATE POLICY "guides_update_admin" ON public.guides
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
        )
    );

-- 5-5. DELETE: admin만
DROP POLICY IF EXISTS "guides_delete_admin" ON public.guides;
CREATE POLICY "guides_delete_admin" ON public.guides
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
        )
    );

-- 6. Storage 버킷
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'guide-images',
    'guide-images',
    true,
    5242880,  -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public             = EXCLUDED.public,
    file_size_limit    = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 7. Storage RLS
-- 누구나 읽기
DROP POLICY IF EXISTS "guide_images_select" ON storage.objects;
CREATE POLICY "guide_images_select" ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'guide-images');

-- admin만 업로드
DROP POLICY IF EXISTS "guide_images_insert" ON storage.objects;
CREATE POLICY "guide_images_insert" ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'guide-images'
        AND EXISTS (
            SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
        )
    );

-- admin만 삭제
DROP POLICY IF EXISTS "guide_images_delete" ON storage.objects;
CREATE POLICY "guide_images_delete" ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'guide-images'
        AND EXISTS (
            SELECT 1 FROM public.profiles
             WHERE profiles.id = auth.uid()
               AND profiles.role = 'admin'
        )
    );

-- 8. 카테고리 시드 (참고용 — 카테고리는 TEXT 컬럼이라 별도 테이블 없음.
--    아래는 PM이 Phase 2에서 첫 가이드 작성 전에 미리 빈 임시저장 행을 만들지 않으려고
--    실제 INSERT는 하지 않고, admin.html 카테고리 드롭다운 옵션 하드코딩으로 대신함.
--    실제 시드 데이터 삽입은 Phase 2 종료 후 PM 직접 작성으로 채움.)
-- 카테고리 마스터: '시작하기', '강의 시청', '결제·환불', 'FAQ'

-- 9. 코멘트
COMMENT ON TABLE public.guides IS '사용 가이드 게시판. 관리자만 작성, 누구나 읽기 (is_published=true).';
COMMENT ON COLUMN public.guides.content_markdown IS '원본 마크다운 (Toast UI Editor 출력). HTML 변환은 클라이언트 렌더 시 marked.js + DOMPurify로 수행.';
COMMENT ON COLUMN public.guides.content_text IS '검색·미리보기용 plain text. 마크다운에서 자동 추출 (클라이언트 책임).';
COMMENT ON COLUMN public.guides.slug IS 'URL 슬러그. title에서 자동 생성, 충돌 시 -2, -3 suffix.';
COMMENT ON FUNCTION public.increment_guide_view_count(TEXT) IS '조회수 +1. anon에서도 RPC 호출 가능. SECURITY DEFINER로 RLS 우회.';
