// Supabase 설정 예제 파일
// 실제 사용시: 이 파일을 'supabase-config.js'로 복사하고 실제 값을 입력하세요

const SUPABASE_URL = 'YOUR_SUPABASE_URL_HERE';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY_HERE';

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

