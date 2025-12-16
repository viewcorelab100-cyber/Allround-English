// 인증 관련 함수들

// ========== 세션 관리 (중복 로그인 방지) ==========

// 랜덤 세션 ID 생성
function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// 세션 ID를 DB와 localStorage에 저장
async function saveSessionId(userId, sessionId) {
    try {
        if (!window.supabase) {
            return { success: false, error: '서비스 초기화 중입니다.' };
        }
        // DB에 저장
        const { error } = await window.supabase
            .from('profiles')
            .update({ last_session_id: sessionId })
            .eq('id', userId);
        
        if (error) throw error;
        
        // localStorage에 저장
        localStorage.setItem('allround_session_id', sessionId);
        
        return { success: true };
    } catch (error) {
        console.error('Save session ID error:', error);
        return { success: false, error: error.message };
    }
}

// 세션 유효성 검증
async function validateSession() {
    try {
        // window.supabase가 초기화되지 않았으면 유효한 것으로 처리
        if (!window.supabase) {
            return { valid: true };
        }
        const user = await getCurrentUser();
        if (!user) return { valid: true }; // 로그인 안 된 상태는 검증 불필요
        
        // localStorage에서 현재 세션 ID 가져오기
        const localSessionId = localStorage.getItem('allround_session_id');
        if (!localSessionId) {
            // 세션 ID가 없으면 새로 생성 (기존 로그인 유저 호환)
            const newSessionId = generateSessionId();
            await saveSessionId(user.id, newSessionId);
            return { valid: true };
        }
        
        // DB에서 최신 세션 ID 가져오기
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('last_session_id')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        // 세션 ID 비교
        if (profile.last_session_id && profile.last_session_id !== localSessionId) {
            // 다른 기기에서 로그인됨
            return { valid: false, reason: 'another_device' };
        }
        
        return { valid: true };
    } catch (error) {
        console.error('Validate session error:', error);
        return { valid: true }; // 에러 시에는 일단 허용
    }
}

// 강제 로그아웃 (다른 기기에서 로그인 시)
async function forceLogout(message = '다른 기기에서 로그인되어 현재 세션이 종료됩니다.') {
    // localStorage 정리
    localStorage.removeItem('allround_session_id');
    
    // 알림 표시
    alert(message);
    
    // 로그아웃 처리
    if (window.supabase) {
        await window.supabase.auth.signOut();
    }
    
    // 로그인 페이지로 이동
    window.location.href = 'auth.html';
}

// 페이지 로드 시 세션 검증 (각 페이지에서 호출)
async function checkSessionOnPageLoad() {
    const result = await validateSession();
    
    if (!result.valid) {
        if (result.reason === 'another_device') {
            await forceLogout('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
        }
    }
}

// 주기적 세션 검증 시작 (선택적: 실시간 감지)
let sessionCheckInterval = null;

function startSessionMonitor(intervalMs = 30000) {
    // 기존 인터벌 정리
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
    }
    
    // 주기적으로 세션 검증
    sessionCheckInterval = setInterval(async () => {
        const result = await validateSession();
        if (!result.valid && result.reason === 'another_device') {
            clearInterval(sessionCheckInterval);
            await forceLogout('다른 기기에서 로그인되어 현재 세션이 종료됩니다.');
        }
    }, intervalMs);
}

function stopSessionMonitor() {
    if (sessionCheckInterval) {
        clearInterval(sessionCheckInterval);
        sessionCheckInterval = null;
    }
}

// ========== 기존 인증 함수들 ==========

// 회원가입
// userData: { name, phone, postcode, address, guardian_name, guardian_phone }
async function signUp(email, password, userData) {
    try {
        // window.supabase가 초기화되지 않았으면 에러
        if (!window.supabase) {
            throw new Error('서비스 초기화 중입니다. 잠시 후 다시 시도해주세요.');
        }
        const { data, error } = await window.supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: userData.name,
                    phone: userData.phone,
                    postcode: userData.postcode,
                    address: userData.address,
                    guardian_name: userData.guardian_name,
                    guardian_phone: userData.guardian_phone
                }
            }
        });
        
        if (error) throw error;
        
        // DB Trigger가 기본 프로필을 생성하므로, 추가 정보만 업데이트
        if (data.user) {
            const sessionId = generateSessionId();
            
            // 잠시 대기 (trigger가 프로필 생성할 시간)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // 추가 정보 업데이트
            const { error: updateError } = await window.supabase.from('profiles').update({
                phone: userData.phone,
                postcode: userData.postcode,
                address: userData.address,
                guardian_name: userData.guardian_name,
                guardian_phone: userData.guardian_phone,
                last_session_id: sessionId
            }).eq('id', data.user.id);
            
            if (updateError) {
                console.error('Profile update error:', updateError);
                // 업데이트 실패 시 재시도
                await new Promise(resolve => setTimeout(resolve, 1000));
                const { error: retryError } = await window.supabase.from('profiles').update({
                    phone: userData.phone,
                    postcode: userData.postcode,
                    address: userData.address,
                    guardian_name: userData.guardian_name,
                    guardian_phone: userData.guardian_phone,
                    last_session_id: sessionId
                }).eq('id', data.user.id);
                
                if (retryError) {
                    console.error('Profile update retry error:', retryError);
                }
            }
            
            // localStorage에도 저장
            localStorage.setItem('allround_session_id', sessionId);
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Sign up error:', error);
        
        // 에러 메시지를 사용자 친화적으로 변환
        let errorMessage = error.message;
        if (errorMessage.includes('already registered') || errorMessage.includes('duplicate')) {
            errorMessage = '이미 가입된 이메일입니다.';
        } else if (errorMessage.includes('invalid email')) {
            errorMessage = '올바른 이메일 형식이 아닙니다.';
        } else if (errorMessage.includes('password')) {
            errorMessage = '비밀번호는 최소 8자 이상이어야 합니다.';
        } else if (errorMessage.includes('rate limit') || errorMessage.includes('Rate limit')) {
            errorMessage = '요청이 너무 많습니다. 1~2분 후에 다시 시도해주세요.';
        }
        
        return { success: false, error: errorMessage };
    }
}

// 로그인
async function signIn(email, password) {
    try {
        // window.supabase가 초기화되지 않았으면 에러
        if (!window.supabase) {
            throw new Error('서비스 초기화 중입니다. 잠시 후 다시 시도해주세요.');
        }
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email: email,
            password: password
        });
        
        if (error) throw error;
        
        // 로그인 성공 시 새 세션 ID 생성 및 저장
        if (data.user) {
            const sessionId = generateSessionId();
            await saveSessionId(data.user.id, sessionId);
            
            // 세션 모니터링 시작
            startSessionMonitor();
        }
        
        return { success: true, data };
    } catch (error) {
        console.error('Sign in error:', error);
        
        // 에러 메시지를 사용자 친화적으로 변환
        let errorMessage = error.message;
        if (errorMessage.includes('Invalid login credentials') || errorMessage.includes('invalid')) {
            errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (errorMessage.includes('Email not confirmed')) {
            errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
        }
        
        return { success: false, error: errorMessage };
    }
}

// 로그아웃
async function signOut() {
    try {
        // 세션 모니터링 중지
        stopSessionMonitor();
        
        // window.supabase가 초기화되지 않았으면 에러
        if (!window.supabase) {
            throw new Error('서비스 초기화 중입니다.');
        }
        
        // 세션 ID 정리
        const user = await getCurrentUser();
        if (user) {
            // DB에서 세션 ID 제거 (선택적)
            await window.supabase
                .from('profiles')
                .update({ last_session_id: null })
                .eq('id', user.id);
        }
        
        // localStorage 정리
        localStorage.removeItem('allround_session_id');
        
        const { error } = await window.supabase.auth.signOut();
        if (error) throw error;
        
        window.location.href = 'index.html';
        return { success: true };
    } catch (error) {
        console.error('Sign out error:', error);
        return { success: false, error: error.message };
    }
}

// 비밀번호 재설정 이메일 전송
async function resetPassword(email) {
    try {
        if (!window.supabase) {
            throw new Error('서비스 초기화 중입니다. 잠시 후 다시 시도해주세요.');
        }
        const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password.html'
        });
        
        if (error) throw error;
        
        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: error.message };
    }
}

// 현재 로그인한 사용자 가져오기
async function getCurrentUser() {
    try {
        // window.supabase가 초기화되지 않았으면 null 반환
        if (!window.supabase) {
            return null;
        }
        const { data: { user } } = await window.supabase.auth.getUser();
        return user;
    } catch (error) {
        console.error('Get current user error:', error);
        return null;
    }
}

// 사용자 프로필 가져오기
async function getUserProfile(userId) {
    try {
        if (!window.supabase) {
            return { success: false, error: '서비스 초기화 중입니다.' };
        }
        const { data, error } = await window.supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Get profile error:', error);
        return { success: false, error: error.message };
    }
}

// 관리자 권한 확인
async function isAdmin() {
    const user = await getCurrentUser();
    if (!user) return false;
    
    // ✅ 특정 이메일은 무조건 관리자로 인식
    if (user.email === 'admin@allround.com') {
        return true;
    }
    
    const profile = await getUserProfile(user.id);
    return profile.success && profile.data.role === 'admin';
}

// ========== UI 업데이트 함수 ==========

// 로그인 상태에 따른 UI 업데이트
async function updateAuthUI() {
    const user = await getCurrentUser();
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    const adminLink = document.getElementById('admin-link');
    
    if (authButtons && userMenu) {
        if (user) {
            authButtons.classList.add('hidden');
            userMenu.classList.remove('hidden');
            userMenu.classList.add('flex', 'flex-row');
            
            // 관리자 권한 확인 및 관리자 링크 표시
            const adminStatus = await isAdmin();
            if (adminLink) {
                if (adminStatus) {
                    adminLink.classList.remove('hidden');
                } else {
                    adminLink.classList.add('hidden');
                }
            }
        } else {
            authButtons.classList.remove('hidden');
            userMenu.classList.add('hidden');
            userMenu.classList.remove('flex', 'flex-row');
            
            // 로그아웃 시 관리자 링크 숨김
            if (adminLink) {
                adminLink.classList.add('hidden');
            }
        }
    }
}

// ========== 페이지 초기화 시 자동 실행 ==========

// 인증 상태 변경 감지 및 세션 모니터링
window.supabase?.auth?.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session) {
        // 로그인 시 세션 모니터링 시작
        startSessionMonitor();
        updateAuthUI();
    } else if (event === 'SIGNED_OUT') {
        // 로그아웃 시 모니터링 중지
        stopSessionMonitor();
        updateAuthUI();
    }
});

// 페이지 로드 시 세션 검증 및 UI 업데이트
document.addEventListener('DOMContentLoaded', () => {
    // Supabase 초기화 대기 후 세션 검증
    const checkInit = setInterval(() => {
        if (window.supabase) {
            clearInterval(checkInit);
            checkSessionOnPageLoad();
            updateAuthUI();
        }
    }, 100);
    
    // 최대 5초 대기 후 타임아웃
    setTimeout(() => {
        clearInterval(checkInit);
    }, 5000);
});
