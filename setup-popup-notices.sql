-- ============================================
-- popup_notices 테이블 + Storage + RLS
-- Supabase SQL Editor에서 실행
-- ============================================

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS popup_notices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  image_url TEXT,
  notice_type TEXT DEFAULT 'text' CHECK (notice_type IN ('text', 'image')),
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  display_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_popup_notices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_popup_notices_updated_at
  BEFORE UPDATE ON popup_notices
  FOR EACH ROW
  EXECUTE FUNCTION update_popup_notices_updated_at();

-- 3. RLS 활성화
ALTER TABLE popup_notices ENABLE ROW LEVEL SECURITY;

-- 읽기: 모든 인증 사용자
CREATE POLICY "popup_notices_select" ON popup_notices
  FOR SELECT TO authenticated
  USING (true);

-- 삽입: admin만
CREATE POLICY "popup_notices_insert" ON popup_notices
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 수정: admin만
CREATE POLICY "popup_notices_update" ON popup_notices
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 삭제: admin만
CREATE POLICY "popup_notices_delete" ON popup_notices
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 4. Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('popup-images', 'popup-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: 누구나 읽기
CREATE POLICY "popup_images_select" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'popup-images');

-- Storage RLS: admin만 업로드
CREATE POLICY "popup_images_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'popup-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Storage RLS: admin만 삭제
CREATE POLICY "popup_images_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'popup-images'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
