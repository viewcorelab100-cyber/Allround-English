// 강의 관련 함수들

// 모든 강의 가져오기 (레슨 시간 합계 포함) - 권한 체크 포함
async function getAllCourses() {
    try {
        // 현재 사용자 확인
        const { data: { user } } = await window.supabase.auth.getUser();
        const currentUserId = user?.id;

        // 기본 강의 조회 (공개된 강의만)
        const { data, error } = await window.supabase
            .from('courses')
            .select(`
                *,
                lessons (
                    id,
                    duration
                )
            `)
            .eq('is_published', true)
            .order('created_at', { ascending: false });
        
        if (error) throw error;

        // 사용자가 로그인한 경우, 접근 권한 확인
        let accessibleCourseIds = [];
        if (currentUserId) {
            const { data: permissions, error: permError } = await window.supabase
                .from('course_access_permissions')
                .select('course_id')
                .eq('user_id', currentUserId);

            if (!permError && permissions) {
                accessibleCourseIds = permissions.map(p => p.course_id);
            }
        }

        // 강의 필터링: 공개 강의 또는 권한이 있는 비공개 강의만
        const filteredCourses = data.filter(course => {
            const visibility = course.visibility || 'public';
            
            // 공개 강의는 모두 포함
            if (visibility === 'public') {
                return true;
            }
            
            // 비공개 강의는 권한이 있는 경우만 포함
            if (visibility === 'private' && currentUserId) {
                return accessibleCourseIds.includes(course.id);
            }
            
            // 비공개 강의인데 로그인 안 한 경우 제외
            return false;
        });
        
        // 각 강의의 총 시간 계산 (레슨 duration 합계)
        const coursesWithDuration = filteredCourses.map(course => {
            const totalMinutes = course.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
            const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // 소수점 1자리까지
            return {
                ...course,
                totalDuration: totalMinutes, // 분 단위
                totalDurationHours: totalHours, // 시간 단위
                lessonCount: course.lessons?.length || 0
            };
        });
        
        return { success: true, data: coursesWithDuration };
    } catch (error) {
        console.error('Get courses error:', error);
        return { success: false, error: error.message };
    }
}

// 강의 상세 정보 가져오기
async function getCourseById(courseId) {
    try {
        const { data, error } = await window.supabase
            .from('courses')
            .select(`
                *,
                lessons (
                    id,
                    title,
                    description,
                    duration,
                    order_num,
                    is_preview,
                    video_url
                )
            `)
            .eq('id', courseId)
            .single();
        
        if (error) throw error;
        
        // 레슨 순서대로 정렬
        if (data.lessons) {
            data.lessons.sort((a, b) => a.order_num - b.order_num);
        }
        
        // 총 시간 계산 (레슨 duration 합계)
        const totalMinutes = data.lessons?.reduce((sum, lesson) => sum + (lesson.duration || 0), 0) || 0;
        const totalHours = Math.round(totalMinutes / 60 * 10) / 10; // 소수점 1자리까지
        data.totalDuration = totalMinutes; // 분 단위
        data.totalDurationHours = totalHours; // 시간 단위
        
        return { success: true, data };
    } catch (error) {
        console.error('Get course error:', error);
        return { success: false, error: error.message };
    }
}

// 사용자의 구매한 강의 목록 가져오기
async function getUserPurchasedCourses(userId) {
    try {
        const { data, error } = await window.supabase
            .from('purchases')
            .select(`
                *,
                course:courses (*)
            `)
            .eq('user_id', userId)
            .eq('status', 'completed');
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Get purchased courses error:', error);
        return { success: false, error: error.message };
    }
}

// 강의 구매 권한 확인
async function hasAccessToCourse(userId, courseId) {
    try {
        const { data, error } = await window.supabase
            .from('purchases')
            .select('id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .eq('status', 'completed')
            .single();
        
        if (error && error.code !== 'PGRST116') throw error;
        
        return { success: true, hasAccess: !!data };
    } catch (error) {
        console.error('Check access error:', error);
        return { success: false, hasAccess: false };
    }
}

// 강의 구매 처리
async function purchaseCourse(userId, courseId, paymentInfo) {
    try {
        const { data, error } = await window.supabase
            .from('purchases')
            .insert({
                user_id: userId,
                course_id: courseId,
                status: 'completed',
                payment_method: paymentInfo.method,
                amount: paymentInfo.amount,
                purchased_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Purchase error:', error);
        return { success: false, error: error.message };
    }
}

// 레슨 정보 가져오기
async function getLessonById(lessonId) {
    try {
        const { data, error } = await window.supabase
            .from('lessons')
            .select(`
                *,
                course:courses (id, title)
            `)
            .eq('id', lessonId)
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Get lesson error:', error);
        return { success: false, error: error.message };
    }
}

// 코스 리포트 생성
async function generateCourseReport(userId, courseId) {
    try {
        // 1. 사용자 정보 가져오기
        const { data: userData, error: userError } = await window.supabase
            .from('profiles')
            .select('name, email')
            .eq('id', userId)
            .single();
        
        if (userError) throw userError;
        
        // 2. 코스 정보 가져오기
        const { data: courseData, error: courseError } = await window.supabase
            .from('courses')
            .select(`
                title,
                lessons (
                    id,
                    duration
                )
            `)
            .eq('id', courseId)
            .single();
        
        if (courseError) throw courseError;
        
        const lessons = courseData.lessons || [];
        const lessonIds = lessons.map(l => l.id);
        const totalLessons = lessons.length;
        
        if (totalLessons === 0) {
            throw new Error('강의에 레슨이 없습니다.');
        }
        
        // 3. 진도 정보 가져오기
        const { data: progressData, error: progressError } = await window.supabase
            .from('lesson_progress')
            .select('*')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds);
        
        if (progressError) throw progressError;
        
        // 4. 과제 정보 가져오기
        const { data: assignmentData, error: assignmentError } = await window.supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .in('lesson_id', lessonIds);
        
        if (assignmentError) throw assignmentError;
        
        // 5. 통계 계산
        const completedLessons = progressData ? progressData.filter(p => p.is_completed).length : 0;
        const totalProgress = Math.round((completedLessons / totalLessons) * 100);
        
        // 평균 시청률 계산
        let totalWatchRate = 0;
        if (progressData && progressData.length > 0) {
            totalWatchRate = progressData.reduce((sum, p) => {
                const watchRate = p.total_seconds > 0 
                    ? Math.round((p.watched_seconds / p.total_seconds) * 100) 
                    : 0;
                return sum + watchRate;
            }, 0);
        }
        const averageWatchRate = progressData && progressData.length > 0 
            ? Math.round(totalWatchRate / progressData.length) 
            : 0;
        
        // 과제 완료율 계산
        const completedAssignments = assignmentData ? assignmentData.filter(a => a.status === 'submitted' || a.status === 'graded').length : 0;
        const assignmentRate = totalLessons > 0 ? Math.round((completedAssignments / totalLessons) * 100) : 0;
        
        // 6. 기존 리포트 확인 (있으면 업데이트, 없으면 생성)
        const { data: existingReport } = await window.supabase
            .from('course_reports')
            .select('id, public_id')
            .eq('user_id', userId)
            .eq('course_id', courseId)
            .maybeSingle();
        
        const reportData = {
            user_id: userId,
            course_id: courseId,
            student_name: userData.name || '학생',
            course_title: courseData.title,
            total_lessons: totalLessons,
            completed_lessons: completedLessons,
            total_progress: totalProgress,
            average_watch_rate: averageWatchRate,
            assignment_rate: assignmentRate,
            updated_at: new Date().toISOString()
        };
        
        // public_id는 새로 생성할 때만 추가 (기존 리포트는 유지)
        if (!existingReport) {
            reportData.public_id = crypto.randomUUID();
        }
        
        let result;
        if (existingReport) {
            // 업데이트
            const { data, error } = await window.supabase
                .from('course_reports')
                .update(reportData)
                .eq('id', existingReport.id)
                .select()
                .single();
            
            if (error) throw error;
            result = data;
        } else {
            // 새로 생성
            reportData.created_at = new Date().toISOString();
            const { data, error } = await window.supabase
                .from('course_reports')
                .insert(reportData)
                .select()
                .single();
            
            if (error) throw error;
            result = data;
        }
        
        return { success: true, data: result };
    } catch (error) {
        console.error('Generate report error:', error);
        console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        });
        return { success: false, error: error.message };
    }
}

