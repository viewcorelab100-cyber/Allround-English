// ì±„ì  ê´€??? í‹¸ë¦¬í‹° ?¨ìˆ˜

// ?´ë?ì§€ ?…ë¡œ???¨ìˆ˜
async function uploadSubmissionImage(file) {
    try {
        // ê°€??H2, H4: ?Œì¼ê³??¬ìš©???•ë³´ ?•ì¸
        const supabaseSession = window.supabase ? await window.supabase.auth.getSession() : null;
        
        const currentUser = window.currentUser;
        if (!currentUser) {
            // ê°€??H2: grading.js?ì„œ currentUserê°€ null
            throw new Error('ë¡œê·¸?¸ì´ ?„ìš”?©ë‹ˆ??');
        }

        // ?Œì¼ ?•ì¥??ì¶”ì¶œ
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;
        
        // Storage???…ë¡œ??        console.log('?“¤ [grading.js] ?…ë¡œ???œì‘ - ë²„í‚·: assignment-images, ?Œì¼ëª?', fileName);
        const { data, error } = await window.supabase.storage
            .from('assignment-images')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });

        if (error) {
            console.error('??[grading.js] Storage ?…ë¡œ???¤íŒ¨:', error);
            console.error('??[grading.js] ?ëŸ¬ ì½”ë“œ:', error.statusCode);
            console.error('??[grading.js] ?ëŸ¬ ë©”ì‹œì§€:', error.message);
            throw error;
        }

        console.log('??[grading.js] Storage ?…ë¡œ???±ê³µ:', data);

        // Public URL ?ì„±
        const { data: { publicUrl } } = window.supabase.storage
            .from('assignment-images')
            .getPublicUrl(fileName);

        console.log('?”— [grading.js] Public URL ?ì„±??', publicUrl);
        
        // URL ?ŒìŠ¤??(?¤ì œ ?‘ê·¼ ê°€?¥í•œì§€ ?•ì¸)
        try {
            const testResponse = await fetch(publicUrl, { method: 'HEAD' });
            console.log('?§ª [grading.js] URL ?‘ê·¼ ?ŒìŠ¤??', testResponse.status, testResponse.statusText);
            if (!testResponse.ok) {
                console.warn('? ï¸ [grading.js] URL?€ ?ì„±?ì?ë§??‘ê·¼ ë¶ˆê?!', testResponse.status);
            }
        } catch (testError) {
            console.error('??[grading.js] URL ?‘ê·¼ ?ŒìŠ¤???¤íŒ¨:', testError);
        }

        return { success: true, url: publicUrl, path: fileName };
    } catch (error) {
        console.error('Image upload error:', error);
        return { success: false, error: error.message };
    }
}

// ê³¼ì œ ?œì¶œ (?´ë?ì§€ ?¬í•¨)
async function submitAssignmentWithImage(submissionData) {
    try {
        const currentUser = window.currentUser;
        const currentLesson = window.currentLesson;
        
        // ê°€??H2, H3: window ?„ì—­ ë³€???•ì¸
        
        if (!currentUser || !currentLesson) {
            throw new Error('?„ìˆ˜ ?•ë³´ê°€ ?†ìŠµ?ˆë‹¤.');
        }

        // student_submissions ?Œì´ë¸”ì— ?€??        const { data, error } = await window.supabase
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
