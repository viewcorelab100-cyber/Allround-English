-- ====================================================================
-- Submissions Storage Bucket 정책 설정
-- 피드백 파일 및 채점 리포트 저장용 버킷
-- ====================================================================

-- ⚠️ 주의: 이 SQL을 실행하기 전에 Supabase Dashboard에서 먼저 버킷을 생성해야 합니다!
-- Storage → New bucket → 'submissions' (Public 체크)

-- ====================================================================
-- 1. 인증된 사용자(관리자)만 업로드 가능
-- ====================================================================
CREATE POLICY "Authenticated users can upload to submissions"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submissions');

-- ====================================================================
-- 2. 모든 사용자가 읽기 가능 (피드백 확인용)
-- ====================================================================
CREATE POLICY "Anyone can view submissions"
ON storage.objects FOR SELECT
USING (bucket_id = 'submissions');

-- ====================================================================
-- 3. 관리자만 삭제 가능
-- ====================================================================
CREATE POLICY "Admins can delete submissions"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'submissions'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- ====================================================================
-- 4. 관리자만 업데이트 가능
-- ====================================================================
CREATE POLICY "Admins can update submissions"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'submissions'
    AND EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
)
WITH CHECK (
    bucket_id = 'submissions'
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
    AND policyname LIKE '%submission%'
ORDER BY policyname;

