// 강의 관련 함수들

// 모든 강의 가져오기 (레슨 시간 합계 포함)
async function getAllCourses() {
    try {
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
        
        // 각 강의의 총 시간 계산 (레슨 duration 합계)
        const coursesWithDuration = data.map(course => {
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

