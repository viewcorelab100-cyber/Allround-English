// Supabase 초기화 (환경 변수 또는 하드코딩)
(function() {
    // 환경 변수가 있으면 사용, 없으면 기본값 사용
    const SUPABASE_URL = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_URL 
        ? process.env.NEXT_PUBLIC_SUPABASE_URL 
        : 'https://fqxbfetyfjyzomgrczwi.supabase.co';
    
    const SUPABASE_ANON_KEY = typeof process !== 'undefined' && process.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY
        ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxeGJmZXR5Zmp5em9tZ3JjendpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzM0NjQsImV4cCI6MjA3OTYwOTQ2NH0.90t1jzTtyEUkIu0MBMhRUwN6b1fGRZGR2CfqXBMczn0';

    // Supabase CDN이 로드되었는지 확인
    if (typeof supabase === 'undefined') {
        console.error('Supabase CDN not loaded. Please check the script tag.');
        return;
    }

    // Supabase 클라이언트 초기화
    const { createClient } = supabase;
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // 전역 변수로 설정
    window.supabase = supabaseClient;

    console.log('✅ Supabase initialized successfully');
})();

// 현재 사용자 정보 가져오기
async function getCurrentUser() {
    if (!window.supabase) {
        console.error('Supabase not initialized');
        return null;
    }
    const { data: { user } } = await window.supabase.auth.getUser();
    return user;
}

// 세션 변경 감지
if (window.supabase) {
    window.supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_IN') {
            console.log('User signed in:', session.user);
            if (typeof updateUIForLoggedInUser === 'function') {
                updateUIForLoggedInUser(session.user);
            }
        } else if (event === 'SIGNED_OUT') {
            console.log('User signed out');
            if (typeof updateUIForLoggedOutUser === 'function') {
                updateUIForLoggedOutUser();
            }
        }
    });
}

// 로그인 상태에 따른 UI 업데이트 (기본 구현)
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























