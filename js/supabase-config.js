// Supabase 설정
// 실제 프로젝트에서는 환경변수로 관리해야 합니다
const SUPABASE_URL = 'https://fqxbfetyfjyzomgrczwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxeGJmZXR5Zmp5em9tZ3JjendpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzM0NjQsImV4cCI6MjA3OTYwOTQ2NH0.90t1jzTtyEUkIu0MBMhRUwN6b1fGRZGR2CfqXBMczn0';

// Supabase 클라이언트 초기화
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수로 설정 (다른 파일에서 사용)
window.supabase = supabaseClient;

// 현재 사용자 정보 가져오기
async function getCurrentUser() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user;
}

// 세션 변경 감지
supabaseClient.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN') {
        console.log('User signed in:', session.user);
        updateUIForLoggedInUser(session.user);
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        updateUIForLoggedOutUser();
    }
});

// 로그인 상태에 따른 UI 업데이트
function updateUIForLoggedInUser(user) {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.style.display = 'none';
    if (userMenu) {
        userMenu.style.display = 'flex';
        const userName = userMenu.querySelector('.user-name');
        if (userName) userName.textContent = user.email;
    }
}

function updateUIForLoggedOutUser() {
    const authButtons = document.getElementById('auth-buttons');
    const userMenu = document.getElementById('user-menu');
    
    if (authButtons) authButtons.style.display = 'flex';
    if (userMenu) userMenu.style.display = 'none';
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener('DOMContentLoaded', async () => {
    const user = await getCurrentUser();
    if (user) {
        updateUIForLoggedInUser(user);
    } else {
        updateUIForLoggedOutUser();
    }
});


