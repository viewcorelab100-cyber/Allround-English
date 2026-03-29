// 학습 진도 관련 함수들

// 레슨 진도 저장/업데이트
async function updateLessonProgress(userId, lessonId, progressData) {
    try {
        // 기존 진도 확인 (.maybeSingle()로 중복 레코드 안전 처리)
        const { data: rows, error: fetchError } = await window.supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .order('watched_seconds', { ascending: false })
            .limit(1);

        if (fetchError) throw fetchError;
        const existing = rows && rows.length > 0 ? rows[0] : null;

        const progressRecord = {
            user_id: userId,
            lesson_id: lessonId,
            watched_seconds: progressData.watchedSeconds,
            total_seconds: progressData.totalSeconds,
            progress_percent: progressData.totalSeconds > 0 ? Math.round((progressData.watchedSeconds / progressData.totalSeconds) * 100) : 0,
            is_completed: progressData.totalSeconds > 0 && progressData.watchedSeconds >= progressData.totalSeconds * 0.95,
            last_position: progressData.lastPosition,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            // 업데이트 (더 높은 진도만 저장, last_position은 항상 갱신)
            if (progressData.watchedSeconds > existing.watched_seconds) {
                const { data, error } = await window.supabase
                    .from('lesson_progress')
                    .update(progressRecord)
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            } else {
                // 진도는 낮지만 last_position은 갱신
                const { data, error } = await window.supabase
                    .from('lesson_progress')
                    .update({
                        last_position: progressData.lastPosition,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();

                if (error) throw error;
                result = data;
            }
        } else {
            // 새로 생성
            progressRecord.created_at = new Date().toISOString();
            const { data, error } = await window.supabase
                .from('lesson_progress')
                .insert(progressRecord)
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return { success: true, data: result };
    } catch (error) {
        console.error('Update progress error:', error);
        return { success: false, error: error.message };
    }
}

// 레슨 진도 가져오기
async function getLessonProgress(userId, lessonId) {
    try {
        const { data: rows, error } = await window.supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .order('watched_seconds', { ascending: false })
            .limit(1);

        if (error) throw error;

        return { success: true, data: (rows && rows.length > 0) ? rows[0] : null };
    } catch (error) {
        console.error('Get progress error:', error);
        return { success: false, error: error.message };
    }
}

// 코스 전체 진도 계산
async function getCourseProgress(userId, courseId) {
    try {
        // 코스의 모든 레슨 가져오기
        const { data: lessons, error: lessonsError } = await window.supabase
            .from('lessons')
            .select('id')
            .eq('course_id', courseId);
        
        if (lessonsError) throw lessonsError;
        
        if (!lessons || lessons.length === 0) {
            return { success: true, data: { progress: 0, completedLessons: 0, totalLessons: 0 } };
        }
        
        // 사용자의 해당 코스 레슨 진도 가져오기
        const lessonIds = lessons.map(l => l.id);
        const { data: progress, error: progressError } = await window.supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds);
        
        if (progressError) throw progressError;

        // lesson_id 기준 deduplicate (watched_seconds가 가장 높은 레코드만 사용)
        const uniqueProgress = [];
        const seen = new Set();
        if (progress) {
            progress.sort((a, b) => (b.watched_seconds || 0) - (a.watched_seconds || 0));
            for (const p of progress) {
                if (!seen.has(p.lesson_id)) {
                    seen.add(p.lesson_id);
                    uniqueProgress.push(p);
                }
            }
        }

        const completedLessons = uniqueProgress.filter(p => p.is_completed).length;
        const totalLessons = lessons.length;
        const overallProgress = Math.round((completedLessons / totalLessons) * 100);
        
        return { 
            success: true, 
            data: { 
                progress: overallProgress, 
                completedLessons, 
                totalLessons,
                lessonProgress: uniqueProgress
            } 
        };
    } catch (error) {
        console.error('Get course progress error:', error);
        return { success: false, error: error.message };
    }
}

// 사용자의 모든 코스 진도 가져오기
async function getAllCourseProgress(userId) {
    try {
        // 구매한 코스 목록 가져오기
        const { data: purchases, error: purchasesError } = await window.supabase
            .from('purchases')
            .select('course_id')
            .eq('user_id', userId)
            .eq('status', 'completed');
        
        if (purchasesError) throw purchasesError;
        
        if (!purchases || purchases.length === 0) {
            return { success: true, data: [] };
        }
        
        // 각 코스의 진도 계산
        const progressPromises = purchases.map(p => getCourseProgress(userId, p.course_id));
        const progressResults = await Promise.all(progressPromises);
        
        const courseProgress = purchases.map((p, index) => ({
            courseId: p.course_id,
            ...progressResults[index].data
        }));
        
        return { success: true, data: courseProgress };
    } catch (error) {
        console.error('Get all course progress error:', error);
        return { success: false, error: error.message };
    }
}

// 마지막 시청 위치 저장
async function saveLastPosition(userId, lessonId, position) {
    try {
        const { data: rows, error: fetchError } = await window.supabase
            .from('lesson_progress')
            .select('id')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .limit(1);

        if (fetchError) throw fetchError;

        if (rows && rows.length > 0) {
            await window.supabase
                .from('lesson_progress')
                .update({
                    last_position: position,
                    updated_at: new Date().toISOString()
                })
                .eq('id', rows[0].id);
        }

        return { success: true };
    } catch (error) {
        console.error('Save position error:', error);
        return { success: false, error: error.message };
    }
}

