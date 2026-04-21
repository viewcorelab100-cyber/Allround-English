// 학습 진도 관련 함수들

// 레슨 진도 저장/업데이트 (재시도 로직 포함)
async function updateLessonProgress(userId, lessonId, progressData, retryCount = 0) {
    const MAX_RETRIES = 3;

    try {
        // totalSeconds가 유효하지 않으면 저장하지 않음 (BUG #3 수정)
        if (!progressData.totalSeconds || progressData.totalSeconds <= 0 || !isFinite(progressData.totalSeconds)) {
            console.warn('Invalid totalSeconds, skipping progress save:', progressData.totalSeconds);
            return { success: false, error: 'Invalid totalSeconds' };
        }

        // watchedSeconds 유효성 검증
        const watchedSeconds = Math.max(0, Math.min(progressData.watchedSeconds || 0, progressData.totalSeconds));

        // 기존 진도 확인
        const { data: existing } = await window.supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .single();

        const progressPercent = Math.round((watchedSeconds / progressData.totalSeconds) * 100);

        // 완료 판정 (이중 조건):
        //   A. 시청 비율 70% 이상, OR
        //   B. 마지막 위치 95% 이상 도달 AND 최소 40% 이상 시청 (seek-only 부정행위 차단)
        // watched_seconds는 timeupdate 누락으로 부족할 수 있으므로, last_position이 끝에 도달했다면
        // 실제 시청한 것으로 인정하되, 40% 하한으로 스킵 악용 방지
        const lastPosition = progressData.lastPosition || 0;
        const watchedRatio = watchedSeconds / progressData.totalSeconds;
        const positionRatio = lastPosition / progressData.totalSeconds;
        const isCompleted =
            watchedRatio >= 0.70 ||
            (positionRatio >= 0.95 && watchedRatio >= 0.40);

        // position 기반으로 완료 인정된 경우(watched<70%)엔 화면에 100%로 표시
        // → "완료됐는데 왜 47%?" 혼란 방지. watched_seconds 원본은 보존(관리자 watchRate 분석용)
        const isPositionBasedCompletion = isCompleted && watchedRatio < 0.70;
        const displayPercent = isPositionBasedCompletion ? 100 : Math.min(progressPercent, 100);

        const progressRecord = {
            user_id: userId,
            lesson_id: lessonId,
            watched_seconds: watchedSeconds,
            total_seconds: progressData.totalSeconds,
            progress_percent: displayPercent,
            is_completed: isCompleted,
            last_position: lastPosition,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            if (watchedSeconds > existing.watched_seconds) {
                const { data, error } = await window.supabase
                    .from('lesson_progress')
                    .update(progressRecord)
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            } else {
                // watchedSeconds가 기존보다 작거나 같아도 last_position은 갱신 가능
                // is_completed도 기존 watched_seconds + 새 last_position으로 재평가
                // (완료 기준 완화 후 기존 Case B 행이 재접속 시 자동 해소되도록)
                const existingWatchedRatio = existing.watched_seconds / progressData.totalSeconds;
                const newPositionRatio = (progressData.lastPosition || 0) / progressData.totalSeconds;
                const recomputedCompleted = existing.is_completed ||
                    existingWatchedRatio >= 0.70 ||
                    (newPositionRatio >= 0.95 && existingWatchedRatio >= 0.30);

                const { data, error } = await window.supabase
                    .from('lesson_progress')
                    .update({
                        last_position: progressData.lastPosition || 0,
                        is_completed: recomputedCompleted,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', existing.id)
                    .select()
                    .single();
                if (error) throw error;
                result = data;
            }
        } else {
            progressRecord.created_at = new Date().toISOString();
            const { data, error } = await window.supabase
                .from('lesson_progress')
                .insert(progressRecord)
                .select()
                .single();

            // unique constraint 충돌 → 재조회 후 update로 전환
            if (error && error.code === '23505') {
                return updateLessonProgress(userId, lessonId, progressData, retryCount);
            }
            if (error) throw error;
            result = data;
        }

        return { success: true, data: result };
    } catch (error) {
        // 재시도 (exponential backoff: 500ms, 1s, 2s)
        if (retryCount < MAX_RETRIES) {
            const delay = Math.pow(2, retryCount) * 500;
            await new Promise(r => setTimeout(r, delay));
            return updateLessonProgress(userId, lessonId, progressData, retryCount + 1);
        }
        console.error('Update progress error (max retries reached):', error);
        return { success: false, error: error.message };
    }
}

// 레슨 진도 가져오기
async function getLessonProgress(userId, lessonId) {
    try {
        const { data, error } = await window.supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return { success: true, data: data || null };
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

        const completedLessons = progress ? progress.filter(p => p.is_completed).length : 0;
        const totalLessons = lessons.length;
        const overallProgress = Math.round((completedLessons / totalLessons) * 100);

        return {
            success: true,
            data: {
                progress: overallProgress,
                completedLessons,
                totalLessons,
                lessonProgress: progress || []
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
        const { data: existing } = await window.supabase
            .from('lesson_progress')
            .select('id')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .single();

        if (existing) {
            await window.supabase
                .from('lesson_progress')
                .update({
                    last_position: position,
                    updated_at: new Date().toISOString()
                })
                .eq('id', existing.id);
        }

        return { success: true };
    } catch (error) {
        console.error('Save position error:', error);
        return { success: false, error: error.message };
    }
}
