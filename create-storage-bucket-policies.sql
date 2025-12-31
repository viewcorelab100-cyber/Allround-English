-- ====================================================================
-- Storage Bucket 정책 설정
-- course-thumbnails bucket에 대한 접근 권한 설정
-- ====================================================================

-- 주의: Bucket은 Supabase Dashboard에서 먼저 생성해야 합니다!
-- Storage → New bucket → course-thumbnails (Public 체크)

-- ====================================================================
-- 1. 모든 사용자가 썸네일 읽기 가능
-- ====================================================================
CREATE POLICY "Anyone can view thumbnails"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- ====================================================================
-- 2. 인증된 사용자(관리자)만 업로드 가능
-- ====================================================================
CREATE POLICY "Authenticated users can upload thumbnails"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'course-thumbnails');

-- ====================================================================
-- 3. 관리자만 삭제 가능
-- ====================================================================
CREATE POLICY "Admins can delete thumbnails"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'course-thumbnails'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 4. 관리자만 업데이트 가능
-- ====================================================================
CREATE POLICY "Admins can update thumbnails"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'course-thumbnails'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'course-thumbnails'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 완료!
-- ====================================================================

-- 정책 확인
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%thumbnail%'
ORDER BY policyname;















