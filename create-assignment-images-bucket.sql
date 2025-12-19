-- ====================================================================
-- Assignment Images Storage Bucket 설정
-- 과제 이미지 업로드를 위한 버킷 생성 및 정책 설정
-- ====================================================================

-- ⚠️ 주의: 이 SQL을 실행하기 전에 Supabase Dashboard에서 먼저 버킷을 생성해야 합니다!
-- Storage → New bucket → 'assignment-images' (Public 체크)

-- ====================================================================
-- 1. 인증된 사용자만 이미지 업로드 가능
-- ====================================================================
CREATE POLICY "Authenticated users can upload assignment images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'assignment-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- ====================================================================
-- 2. 본인이 업로드한 이미지만 읽기 가능 (또는 관리자)
-- ====================================================================
CREATE POLICY "Users can view own assignment images"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'assignment-images'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- ====================================================================
-- 3. 본인이 업로드한 이미지만 삭제 가능 (또는 관리자)
-- ====================================================================
CREATE POLICY "Users can delete own assignment images"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'assignment-images'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
);

-- ====================================================================
-- 4. 본인이 업로드한 이미지만 업데이트 가능 (또는 관리자)
-- ====================================================================
CREATE POLICY "Users can update own assignment images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'assignment-images'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    )
)
WITH CHECK (
    bucket_id = 'assignment-images'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
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
    AND policyname LIKE '%assignment%'
ORDER BY policyname;




