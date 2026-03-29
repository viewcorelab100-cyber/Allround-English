// Supabase 설정
// 실제 프로젝트에서는 환경변수로 관리해야 합니다
const SUPABASE_URL = 'https://fqxbfetyfjyzomgrczwi.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZxeGJmZXR5Zmp5em9tZ3JjendpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzM0NjQsImV4cCI6MjA3OTYwOTQ2NH0.90t1jzTtyEUkIu0MBMhRUwN6b1fGRZGR2CfqXBMczn0';

// Supabase 클라이언트 초기화
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 전역 변수로 설정 (다른 파일에서 사용)
window.supabase = supabaseClient;
