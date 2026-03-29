// 인증 관련 함수들

// ========== 세션 관리 (최대 3대 기기) ==========

const MAX_DEVICES = 3;

// 랜덤 세션 ID 생성
function generateSessionId() {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
}

// 기기 정보 수집
function getDeviceInfo() {
    const ua = navigator.userAgent;
    let deviceType = 'Desktop';
    let browser = 'Unknown';
    
    // 기기 타입 감지
    if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
        if (/iPad/.test(ua)) {
            deviceType = 'iPad';
        } else if (/iPhone/.test(ua)) {
            deviceType = 'iPhone';
        } else if (/Android/.test(ua)) {
            deviceType = 'Android';
        } else {
            deviceType = 'Mobile';
        }
    }
    
    // 브라우저 감지
    if (/Chrome/.test(ua) && !/Edge|Edg/.test(ua)) {
        browser = 'Chrome';
    } else if (/Safari/.test(ua) && !/Chrome/.test(ua)) {
        browser = 'Safari';
    } else if (/Firefox/.test(ua)) {
        browser = 'Firefox';
    } else if (/Edge|Edg/.test(ua)) {
        browser = 'Edge';
    }
    
    return `${deviceType} (${browser})`;
}

// 세션 ID를 DB와 localStorage에 저장 (최대 3대)
async function saveSessionId(userId, sessionId) {
    try {
        if (!window.supabase) {
            return { success: false, error: '서비스 초기화 중입니다.' };
        }
        
        // 현재 활성 세션 목록 가져오기
        const { data: profile, error: fetchError } = await window.supabase
            .from('profiles')
            .select('active_sessions')
            .eq('id', userId)
            .single();
        
        if (fetchError) throw fetchError;
        
        let activeSessions = profile.active_sessions || [];
        const currentDeviceInfo = getDeviceInfo();
        
        // 새 세션 정보
        const newSession = {
            session_id: sessionId,
            created_at: new Date().toISOString(),
            device_info: currentDeviceInfo,
            last_activity: new Date().toISOString()
        };
        
        // 같은 기기의 기존 세션 제거 (중복 방지)
        activeSessions = activeSessions.filter(s => 
            s.session_id !== sessionId && s.device_info !== currentDeviceInfo
        );
        
        // 최대 개수 초과 시 가장 오래된 세션 제거
        if (activeSessions.length >= MAX_DEVICES) {
            // created_at 기준 정렬 (오래된 순)
            activeSessions.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
            activeSessions = activeSessions.slice(-(MAX_DEVICES - 1)); // 가장 오래된 것 제거
        }
        
        // 새 세션 추가
        activeSessions.push(newSession);
        
        // DB에 저장
        const { error } = await window.supabase
            .from('profiles')
            .update({ active_sessions: activeSessions })
            .eq('id', userId);
        
        if (error) throw error;
        
        // localStorage에 저장
        localStorage.setItem('allround_session_id', sessionId);
        
        return { success: true, deviceCount: activeSessions.length };
    } catch (error) {
        console.error('Save session ID error:', error);
        return { success: false, error: error.message };
    }
}

// 세션 유효성 검증 (active_sessions 배열 확인)
async function validateSession() {
    try {
        // window.supabase가 초기화되지 않았으면 유효한 것으로 처리
        if (!window.supabase) {
            return { valid: true };
        }
        const user = await getCurrentUser();
        if (!user) return { valid: true }; // 로그인 안 된 상태는 검증 불필요

        // 데모 계정은 세션 제한 없이 여러 기기에서 접속 허용
        const demoCheck = await getUserProfile(user.id);
        if (demoCheck.success && demoCheck.data.role === 'demo') {
            return { valid: true };
        }

        // localStorage에서 현재 세션 ID 가져오기
        const localSessionId = localStorage.getItem('allround_session_id');
        if (!localSessionId) {
            // 세션 ID가 없으면 새로 생성 (기존 로그인 유저 호환)
            const newSessionId = generateSessionId();
            await saveSessionId(user.id, newSessionId);
            return { valid: true };
        }
        
        // DB에서 활성 세션 목록 가져오기
        const { data: profile, error } = await window.supabase
            .from('profiles')
            .select('active_sessions')
            .eq('id', user.id)
            .single();
        
        if (error) throw error;
        
        const activeSessions = profile.active_sessions || [];
        
        // 현재 세션 ID가 활성 세션 목록에 있는지 확인
        const isActiveSession = activeSessions.some(s => s.session_id === localSessionId);
        
        if (!isActiveSession && activeSessions.length > 0) {
            // 현재 세션이 목록에 없음 (다른 기기에서 로그인하여 밀려남)
            return { valid: false, reason: 'session_expired', deviceCount: activeSessions.length };
        }
        
        return { valid: true };
    } catch (error) {
        console.error('Validate session error:', error);
        // 네트워크 오류 시 3회까지는 허용 (일시적 장애 대응)
        if (!window._sessionErrorCount) window._sessionErrorCount = 0;
        window._sessionErrorCount++;
        if (window._sessionErrorCount >= 3) {
            return { valid: false, reason: 'error' };
        }
        return { valid: true };
    }
}

// 강제 로그아웃 (세션이 만료되었을 때)
async function forceLogout(message = '최대 3대까지만 동시 접속이 가능합니다.\n다른 기기에서 로그인하여 현재 세션이 종료되었습니다.') {
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
        if (result.reason === 'session_expired') {
            await forceLogout(`최대 ${MAX_DEVICES}대까지만 동시 접속이 가능합니다.\n다른 기기에서 로그인하여 현재 세션이 종료되었습니다.`);
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
        if (!result.valid && result.reason === 'session_expired') {
            clearInterval(sessionCheckInterval);
            await forceLogout(`최대 ${MAX_DEVICES}대까지만 동시 접속이 가능합니다.\n다른 기기에서 로그인하여 현재 세션이 종료되었습니다.`);
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
            
            // 첫 번째 세션 생성
            const firstSession = [{
                session_id: sessionId,
                created_at: new Date().toISOString(),
                device_info: getDeviceInfo()
            }];
            
            // 추가 정보 업데이트
            const { error: updateError } = await window.supabase.from('profiles').update({
                phone: userData.phone,
                postcode: userData.postcode,
                address: userData.address,
                guardian_name: userData.guardian_name,
                guardian_phone: userData.guardian_phone,
                student_type: userData.student_type || 'online',
                active_sessions: firstSession
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
                    student_type: userData.student_type || 'online',
                    active_sessions: firstSession
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
        
        // 현재 세션 ID를 활성 세션 목록에서 제거
        const user = await getCurrentUser();
        if (user) {
            const localSessionId = localStorage.getItem('allround_session_id');
            
            if (localSessionId) {
                // 현재 활성 세션 목록 가져오기
                const { data: profile } = await window.supabase
                    .from('profiles')
                    .select('active_sessions')
                    .eq('id', user.id)
                    .single();
                
                if (profile) {
                    let activeSessions = profile.active_sessions || [];
                    // 현재 세션만 제거
                    activeSessions = activeSessions.filter(s => s.session_id !== localSessionId);
                    
                    // DB 업데이트
                    await window.supabase
                        .from('profiles')
                        .update({ active_sessions: activeSessions })
                        .eq('id', user.id);
                }
            }
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

    // DB의 role 컬럼만 신뢰
    const profile = await getUserProfile(user.id);
    return profile.success && profile.data.role === 'admin';
}

// 데모 사용자 확인
async function isDemoUser() {
    const user = await getCurrentUser();
    if (!user) return false;
    const profile = await getUserProfile(user.id);
    return profile.success && profile.data.role === 'demo';
}

// 관리자 또는 데모 사용자 확인 (관리자 페이지 접근용)
async function isAdminOrDemo() {
    const user = await getCurrentUser();
    if (!user) return false;
    const profile = await getUserProfile(user.id);
    return profile.success && (profile.data.role === 'admin' || profile.data.role === 'demo');
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
            
            // 관리자 또는 데모 계정 확인 및 관리자 링크 표시
            const adminOrDemoStatus = await isAdminOrDemo();
            if (adminLink) {
                if (adminOrDemoStatus) {
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
