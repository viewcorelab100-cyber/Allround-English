// 과제 관련 함수들

// 과제 상태 저장/업데이트
async function saveAssignment(userId, lessonId, assignmentData) {
    try {
        // 기존 과제 확인
        const { data: existing, error: fetchError } = await window.supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .maybeSingle();

        const record = {
            user_id: userId,
            lesson_id: lessonId,
            note_completed: assignmentData.note_completed || false,
            blog_completed: assignmentData.blog_completed || false,
            kakao_completed: assignmentData.kakao_completed || false,
            updated_at: new Date().toISOString()
        };

        let result;
        if (existing) {
            // 업데이트
            const { data, error } = await window.supabase
                .from('assignments')
                .update(record)
                .eq('user_id', userId)
                .eq('lesson_id', lessonId)
                .select()
                .single();

            if (error) throw error;
            result = data;
        } else {
            // 새로 생성
            record.created_at = new Date().toISOString();
            const { data, error } = await window.supabase
                .from('assignments')
                .insert(record)
                .select()
                .single();

            if (error) throw error;
            result = data;
        }

        return { success: true, data: result };
    } catch (error) {
        console.error('Save assignment error:', error);
        
        // Supabase 오류 시 localStorage에 저장
        return saveAssignmentToLocalStorage(userId, lessonId, assignmentData);
    }
}

// localStorage에 과제 저장 (fallback)
function saveAssignmentToLocalStorage(userId, lessonId, assignmentData) {
    try {
        const key = `assignment_${userId}_${lessonId}`;
        const record = {
            user_id: userId,
            lesson_id: lessonId,
            note_completed: assignmentData.note_completed || false,
            blog_completed: assignmentData.blog_completed || false,
            kakao_completed: assignmentData.kakao_completed || false,
            updated_at: new Date().toISOString()
        };
        localStorage.setItem(key, JSON.stringify(record));
        return { success: true, data: record };
    } catch (error) {
        console.error('LocalStorage save error:', error);
        return { success: false, error: error.message };
    }
}

// 사용자의 특정 레슨 과제 상태 가져오기
async function getAssignment(userId, lessonId) {
    try {
        const { data, error } = await window.supabase
            .from('assignments')
            .select('*')
            .eq('user_id', userId)
            .eq('lesson_id', lessonId)
            .maybeSingle();

        if (error && error.code !== 'PGRST116') throw error;

        return { success: true, data: data || null };
    } catch (error) {
        console.error('Get assignment error:', error);
        
        // Supabase 오류 시 localStorage에서 가져오기
        return getAssignmentFromLocalStorage(userId, lessonId);
    }
}

// localStorage에서 과제 가져오기 (fallback)
function getAssignmentFromLocalStorage(userId, lessonId) {
    try {
        const key = `assignment_${userId}_${lessonId}`;
        const stored = localStorage.getItem(key);
        if (stored) {
            return { success: true, data: JSON.parse(stored) };
        }
        return { success: true, data: null };
    } catch (error) {
        console.error('LocalStorage get error:', error);
        return { success: false, error: error.message };
    }
}

// 관리자: 모든 과제 제출 내역 가져오기
async function getAllAssignments() {
    try {
        const { data, error } = await window.supabase
            .from('assignments')
            .select(`
                *,
                profiles (name, email),
                lessons (title, course_id, courses (title))
            `)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Get all assignments error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// 관리자: 특정 강의의 과제 제출 내역 가져오기
async function getAssignmentsByCourse(courseId) {
    try {
        const { data, error } = await window.supabase
            .from('assignments')
            .select(`
                *,
                profiles (name, email),
                lessons!inner (title, course_id, courses (title))
            `)
            .eq('lessons.course_id', courseId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Get assignments by course error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// 과제 완료 여부 확인 (모든 항목 체크됨)
function isAssignmentComplete(assignment) {
    if (!assignment) return false;
    return assignment.note_completed && assignment.blog_completed && assignment.kakao_completed;
}

// 과제 통계 계산
function calculateAssignmentStats(assignments) {
    const total = assignments.length;
    const completed = assignments.filter(a => isAssignmentComplete(a)).length;
    const noteCompleted = assignments.filter(a => a.note_completed).length;
    const blogCompleted = assignments.filter(a => a.blog_completed).length;
    const kakaoCompleted = assignments.filter(a => a.kakao_completed).length;

    return {
        total,
        completed,
        completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
        noteCompleted,
        blogCompleted,
        kakaoCompleted
    };
}

// ========== 학부모 알림 관련 함수 ==========

// 학부모 알림 발송 로그 가져오기
async function getParentNotifications(userId) {
    try {
        const { data, error } = await window.supabase
            .from('parent_notifications')
            .select(`
                *,
                lessons (title, course_id, courses (title))
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Get parent notifications error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// 관리자: 모든 학부모 알림 로그 가져오기
async function getAllParentNotifications() {
    try {
        const { data, error } = await window.supabase
            .from('parent_notifications')
            .select(`
                *,
                profiles (name, email),
                lessons (title, course_id, courses (title))
            `)
            .order('created_at', { ascending: false })
            .limit(100);

        if (error) throw error;

        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Get all parent notifications error:', error);
        return { success: false, error: error.message, data: [] };
    }
}

// 학부모 알림 통계
function calculateNotificationStats(notifications) {
    const total = notifications.length;
    const sent = notifications.filter(n => n.status === 'sent').length;
    const failed = notifications.filter(n => n.status === 'failed').length;
    const pending = notifications.filter(n => n.status === 'pending').length;

    return {
        total,
        sent,
        failed,
        pending,
        successRate: total > 0 ? Math.round((sent / total) * 100) : 0
    };
}

// 사용자의 학부모 정보 가져오기
async function getUserParentInfo(userId) {
    try {
        const { data, error } = await window.supabase
            .from('profiles')
            .select('parent_name, parent_phone, parent_notification_enabled')
            .eq('id', userId)
            .single();

        if (error && error.code !== 'PGRST116') throw error;

        return { success: true, data: data || null };
    } catch (error) {
        console.error('Get user parent info error:', error);
        return { success: false, error: error.message };
    }
}

// 학부모 정보 업데이트
async function updateParentInfo(userId, parentData) {
    try {
        const { error } = await window.supabase
            .from('profiles')
            .update({
                parent_name: parentData.parentName,
                parent_phone: parentData.parentPhone,
                parent_notification_enabled: parentData.notificationEnabled,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId);

        if (error) throw error;

        return { success: true };
    } catch (error) {
        console.error('Update parent info error:', error);
        return { success: false, error: error.message };
    }
}

// ========== 리포트 생성 관련 함수 ==========
// 주의: generateCourseReport 함수는 js/courses.js에 정의되어 있습니다.
