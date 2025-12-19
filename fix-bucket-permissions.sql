-- ====================================================================
-- Storage Bucket 권한 문제 해결
-- Public URL로 접근이 안 될 때 실행하는 SQL
-- ====================================================================

-- 1. 먼저 기존 정책 확인
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND (policyname LIKE '%assignment%' OR policyname LIKE '%image%')
ORDER BY policyname;

-- ====================================================================
-- 2. 기존 정책 삭제 (충돌 방지)
-- ====================================================================
DROP POLICY IF EXISTS "Authenticated users can upload assignment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view own assignment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own assignment images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own assignment images" ON storage.objects;

-- ====================================================================
-- 3. 새로운 정책 생성 (더 관대한 권한)
-- ====================================================================

-- 모든 사람이 읽기 가능 (Public Bucket이므로)
CREATE POLICY "Public can view assignment images"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-images');

-- 인증된 사용자는 자신의 폴더에 업로드 가능
CREATE POLICY "Authenticated users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증된 사용자는 자신의 파일 삭제 가능
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignment-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 인증된 사용자는 자신의 파일 업데이트 가능
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'assignment-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ====================================================================
-- 4. 정책 확인
-- ====================================================================
SELECT 
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname LIKE '%assignment%'
ORDER BY policyname;

-- ====================================================================
-- 5. 버킷 설정 확인
-- ====================================================================
SELECT 
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
FROM storage.buckets
WHERE name = 'assignment-images';

-- ⚠️ 만약 public 컬럼이 false이면:
-- Supabase Dashboard → Storage → assignment-images → Settings → Public bucket 체크!




