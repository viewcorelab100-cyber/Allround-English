-- ====================================================================
-- Homepage Images Storage Bucket 설정
-- 홈페이지 메인 이미지(about.png, logo.png, 원장.jpg 등)를 위한 버킷
-- ====================================================================

-- ⚠️ 사용 방법:
-- 1. Supabase Dashboard → Storage → New bucket
-- 2. Bucket name: 'homepage-images'
-- 3. Public bucket: ✅ 체크 (공개)
-- 4. 버킷 생성 후 이 SQL을 실행

-- ====================================================================
-- 1. 모든 사용자가 홈페이지 이미지 읽기 가능 (공개)
-- ====================================================================
CREATE POLICY "Anyone can view homepage images"
ON storage.objects FOR SELECT
USING (bucket_id = 'homepage-images');

-- ====================================================================
-- 2. 관리자만 이미지 업로드 가능
-- ====================================================================
CREATE POLICY "Admins can upload homepage images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'homepage-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 3. 관리자만 이미지 삭제 가능
-- ====================================================================
CREATE POLICY "Admins can delete homepage images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'homepage-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 4. 관리자만 이미지 업데이트 가능
-- ====================================================================
CREATE POLICY "Admins can update homepage images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'homepage-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'homepage-images'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 완료! 정책 확인
-- ====================================================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%homepage%'
ORDER BY policyname;

-- ====================================================================
-- 📌 다음 단계:
-- 1. 이미지 업로드: Supabase Dashboard → Storage → homepage-images
-- 2. 업로드할 이미지:
--    - about.png (메인 카드 배경)
--    - logo.png (로고)
--    - 원장.jpg (원장 사진)
-- 3. 업로드 후 Public URL 복사
-- 4. index.html에서 이미지 경로를 Supabase URL로 변경
-- ====================================================================

