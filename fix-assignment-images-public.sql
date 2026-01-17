-- ====================================================================
-- Assignment Images 버킷 공개 읽기 정책
-- ====================================================================

-- 기존 읽기 정책 삭제
DROP POLICY IF EXISTS "Users can view own assignment images" ON storage.objects;

-- 새로운 공개 읽기 정책 생성 (모든 사용자가 읽을 수 있음)
CREATE POLICY "Public read access for assignment images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'assignment-images');

-- 확인
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






















