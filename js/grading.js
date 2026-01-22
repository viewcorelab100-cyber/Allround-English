// 채점 관련 유틸리티 함수

// 이미지 업로드 함수 (WebP 변환 적용)
async function uploadSubmissionImage(file) {
    try {
        const currentUser = window.currentUser;
        if (!currentUser) {
            throw new Error('로그인이 필요합니다.');
        }

        // WebP로 변환 (image-utils.js의 convertToWebP 함수 사용)
        let uploadFile = file;
        let fileName = `${currentUser.id}/${Date.now()}`;

        if (typeof convertToWebP === 'function') {
            const { file: convertedFile } = await convertToWebP(file, {
                quality: 0.85,
                maxWidth: 1920,
                maxHeight: 1080
            });
            uploadFile = convertedFile;
            fileName += '.webp';
        } else {
            // convertToWebP가 없는 경우 원본 사용
            const fileExt = file.name.split('.').pop();
            fileName += '.' + fileExt;
        }

        // Storage에 업로드
        const { data, error } = await window.supabase.storage
            .from('assignment-images')
            .upload(fileName, uploadFile, {
                cacheControl: '3600',
                upsert: false,
                contentType: uploadFile.type
            });

        if (error) {
            console.error('[grading.js] Storage 업로드 실패:', error);
            throw error;
        }

        // Public URL 생성
        const { data: { publicUrl } } = window.supabase.storage
            .from('assignment-images')
            .getPublicUrl(fileName);

        return { success: true, url: publicUrl, path: fileName };
    } catch (error) {
        console.error('Image upload error:', error);
        return { success: false, error: error.message };
    }
}

// 과제 제출 (이미지 포함)
async function submitAssignmentWithImage(submissionData) {
    try {
        const currentUser = window.currentUser;
        const currentLesson = window.currentLesson;
        
        if (!currentUser || !currentLesson) {
            throw new Error('필수 정보가 없습니다.');
        }

        // student_submissions 테이블에 삽입
        const { data, error } = await window.supabase
            .from('student_submissions')
            .insert({
                user_id: currentUser.id,
                lesson_id: currentLesson.id,
                image_url: submissionData.imageUrl,
                status: 'submitted',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            })
            .select()
            .single();

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Submit assignment error:', error);
        return { success: false, error: error.message };
    }
}

// Export for use in other files
if (typeof window !== 'undefined') {
    window.GradingUtils = {
        uploadSubmissionImage,
        submitAssignmentWithImage
    };
}
