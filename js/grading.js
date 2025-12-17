// 채점 관련 유틸리티 함수

// 이미지 업로드 함수
async function uploadSubmissionImage(file) {
    try {
        // #region agent log
        // 가설 H2, H4: 파일과 사용자 정보 확인
        const supabaseSession = window.supabase ? await window.supabase.auth.getSession() : null;
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grading.js:4',message:'uploadSubmissionImage 시작',data:{windowCurrentUserExists:!!window.currentUser,windowCurrentUserId:window.currentUser?.id,fileExists:!!file,fileName:file?.name,fileSize:file?.size,fileType:file?.type},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H4'})}).catch(()=>{});
        // #endregion
        
        const currentUser = window.currentUser;
        if (!currentUser) {
            // #region agent log
            // 가설 H2: grading.js에서 currentUser가 null
            fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grading.js:13',message:'grading.js - currentUser null',data:{windowCurrentUser:window.currentUser,typeofWindowCurrentUser:typeof window.currentUser},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2'})}).catch(()=>{});
            // #endregion
            throw new Error('로그인이 필요합니다.');
        }

        // 파일 확장자 추출
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
        
        // Storage에 업로드
        console.log('📤 [grading.js] 업로드 시작 - 버킷: assignment-images, 파일명:', fileName);
        const { data, error } = await window.supabase.storage
            .from('assignment-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('❌ [grading.js] Storage 업로드 실패:', error);
            console.error('❌ [grading.js] 에러 코드:', error.statusCode);
            console.error('❌ [grading.js] 에러 메시지:', error.message);
            throw error;
        }

        console.log('✅ [grading.js] Storage 업로드 성공:', data);

        // Public URL 생성
        const { data: { publicUrl } } = window.supabase.storage
            .from('assignment-images')
            .getPublicUrl(fileName);

        console.log('🔗 [grading.js] Public URL 생성됨:', publicUrl);
        
        // URL 테스트 (실제 접근 가능한지 확인)
        try {
            const testResponse = await fetch(publicUrl, { method: 'HEAD' });
            console.log('🧪 [grading.js] URL 접근 테스트:', testResponse.status, testResponse.statusText);
            if (!testResponse.ok) {
                console.warn('⚠️ [grading.js] URL은 생성됐지만 접근 불가!', testResponse.status);
            }
        } catch (testError) {
            console.error('❌ [grading.js] URL 접근 테스트 실패:', testError);
        }

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
        
        // #region agent log
        // 가설 H2, H3: window 전역 변수 확인
        fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grading.js:48',message:'submitAssignmentWithImage 호출',data:{currentUserExists:!!currentUser,currentUserId:currentUser?.id,currentLessonExists:!!currentLesson,currentLessonId:currentLesson?.id,submissionDataImageUrl:submissionData?.imageUrl},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H2,H3'})}).catch(()=>{});
        // #endregion
        
        if (!currentUser || !currentLesson) {
            // #region agent log
            fetch('http://127.0.0.1:7243/ingest/89491bf6-bdf5-4b48-a2a1-bc20f57de44a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'grading.js:54',message:'필수 정보 없음 오류',data:{currentUserExists:!!currentUser,currentLessonExists:!!currentLesson},timestamp:Date.now(),sessionId:'debug-session',hypothesisId:'H3'})}).catch(()=>{});
            // #endregion
            throw new Error('필수 정보가 없습니다.');
        }

        // student_submissions 테이블에 저장
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
