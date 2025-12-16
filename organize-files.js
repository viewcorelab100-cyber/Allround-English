// 📁 프로젝트 파일 자동 정리 스크립트
// 사용법: node organize-files.js

const fs = require('fs');
const path = require('path');

// 폴더 생성 함수
function createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ 폴더 생성: ${dirPath}`);
    }
}

// 파일 이동 함수
function moveFile(from, to) {
    try {
        if (fs.existsSync(from)) {
            createDir(path.dirname(to));
            fs.renameSync(from, to);
            console.log(`📦 이동: ${from} → ${to}`);
            return true;
        }
    } catch (error) {
        console.error(`❌ 이동 실패: ${from} - ${error.message}`);
    }
    return false;
}

console.log('🚀 프로젝트 파일 정리 시작...\n');

// ============================================
// 1️⃣ 문서 파일 정리
// ============================================
console.log('📚 1. 문서 파일 정리 중...');
createDir('docs');

const docFiles = [
    'DEPLOYMENT_GUIDE.md',
    'README_SECURITY.md',
    'SUPABASE_SECURITY_CHECKLIST.md',
    'GIT_GUIDE.md',
    'MOTION_GUIDE.md',
    'NHN_ALIMTALK_SETUP.md',
    'NHN_ENV_SETUP.md',
    'NHN_연동_완료_가이드.md',
    'QUICK_EMAIL_SETUP.md',
    'SUPABASE_EMAIL_SETUP.md',
    'SUPABASE_ENV_설정.txt',
    'SUPABASE_STORAGE_SETUP.md',
    'RLS_오류_해결방법.md',
    '과제제출-오류-해결방법.md',
    '배포_가이드.md',
    '채점-이미지-기능-추가.md',
    'artist_line_page.txt'
];

docFiles.forEach(file => {
    moveFile(file, `docs/${file}`);
});

// ============================================
// 2️⃣ SQL 파일 정리
// ============================================
console.log('\n💾 2. SQL 파일 정리 중...');
createDir('sql');

const sqlFiles = [
    'add-assignment-checkboxes.sql',
    'add-blog-link-to-lessons.sql',
    'add-feedback-image-column.sql',
    'add-grading-images-column.sql',
    'add-parent-notification.sql',
    'check-profiles-columns.sql',
    'create-grading-system-fixed.sql',
    'create-progress-assignments-tables.sql',
    'create-quizzes-table.sql',
    'create-report-table.sql',
    'create-submission-grading-tables.sql',
    'create-tables-step1.sql',
    'fix-404-errors.sql',
    'fix-all-missing-columns.sql',
    'fix-security-vulnerability.sql',
    'fix-storage-rls.sql',
    'fix-student-submission-rls.sql',
    'QUICK_RLS_SETUP_FIXED.sql',
    'QUICK_RLS_SETUP.sql',
    'RLS_CLEANUP_AND_SETUP.sql',
    'supabase-orders-schema-fix.sql',
    'supabase-orders-schema.sql',
    'supabase-rls-complete.sql',
    'supabase-rls-fix.sql',
    'supabase-rls-remaining.sql',
    'supabase-schema.sql',
    'supabase-shipping-schema.sql'
];

sqlFiles.forEach(file => {
    moveFile(file, `sql/${file}`);
});

// ============================================
// 3️⃣ 테스트/임시 파일 정리
// ============================================
console.log('\n🧪 3. 테스트 파일 정리 중...');
createDir('archive');

const testFiles = [
    'test copy.html',
    'test-scroll-motion.html',
    'vimeo-test.html',
    'index-with-loading.html',
    'email-template.html',
    'email-template-confirm.html',
    'email-template-reset-password.html',
    'master.html',
    'fix_lesson.py'
];

testFiles.forEach(file => {
    moveFile(file, `archive/${file}`);
});

// ============================================
// 4️⃣ 이미지/디자인 파일 정리
// ============================================
console.log('\n🎨 4. 디자인 파일 정리 중...');
createDir('assets/images');
createDir('assets/fonts');
createDir('assets/design');

const imageFiles = [
    'm.png',
    'm2.gif',
    'm2.png',
    'm2.psd',
    'm3.gif',
    'Allround_홈페이지 무료시안_전체섹션.png',
    'Allround_홈페이지 무료시안.png',
    'firstbee 목업.png',
    'firstbee 시안.png',
    'u8814421532_A_soft_white_feather_floating_gently_in_the_foregro_3ddccc10-e8ad-48d2-8f1d-ee093966ca20.png',
    'u8814421532_A_soft_white_feather_floating_gently_in_the_foregro_3ddccc10-e8ad-48d2-8f1d-ee093966ca20.psd',
    '시험지.jpg',
    '원장사진테스트시안.jpg',
    '채점.jpg'
];

imageFiles.forEach(file => {
    moveFile(file, `assets/images/${file}`);
});

// 폰트 폴더 이동
if (fs.existsSync('Boska_Complete')) {
    moveFile('Boska_Complete', 'assets/fonts/Boska_Complete');
}
if (fs.existsSync('Britney_Complete')) {
    moveFile('Britney_Complete', 'assets/fonts/Britney_Complete');
}

// ============================================
// 5️⃣ 작업 폴더 정리
// ============================================
console.log('\n📂 5. 작업 폴더 정리 중...');
createDir('archive/work');

const workDirs = [
    '1205 lms 진행샇아',
    '공유자료',
    '히어로섹션 예시',
    'components'
];

workDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
        const targetDir = `archive/work/${dir}`;
        if (!fs.existsSync(targetDir)) {
            fs.renameSync(dir, targetDir);
            console.log(`📦 이동: ${dir} → ${targetDir}`);
        }
    }
});

// ============================================
// 6️⃣ Supabase Functions 정리
// ============================================
console.log('\n⚡ 6. Supabase Functions 정리 중...');
if (fs.existsSync('supabase') && fs.existsSync('supabase/functions')) {
    console.log('✅ supabase/functions 폴더 유지');
}

// ============================================
// 7️⃣ Payment App 정리
// ============================================
console.log('\n💳 7. Payment App 정리 중...');
if (fs.existsSync('payment-app')) {
    console.log('✅ payment-app 폴더 유지 (Next.js 프로젝트)');
}

// ============================================
// ✅ 완료
// ============================================
console.log('\n' + '='.repeat(50));
console.log('✨ 파일 정리 완료!');
console.log('='.repeat(50));

console.log('\n📁 새로운 폴더 구조:');
console.log(`
프로젝트 루트/
├── 📄 HTML 파일들 (index.html, auth.html 등)
├── 📁 js/              # JavaScript 파일
├── 📁 docs/            # 📚 모든 문서 파일
├── 📁 sql/             # 💾 모든 SQL 파일
├── 📁 archive/         # 🗑️ 사용 안 하는 파일
│   ├── work/          # 작업 폴더들
│   └── (테스트 파일들)
├── 📁 assets/          # 🎨 디자인 리소스
│   ├── images/        # 이미지 파일
│   └── fonts/         # 폰트 파일
├── 📁 payment-app/     # 💳 Next.js 결제 앱
└── 📁 supabase/        # ⚡ Supabase Functions
`);

console.log('\n⚠️  주의사항:');
console.log('1. Git에 올리기 전에 .gitignore 확인');
console.log('2. js/supabase-config.js는 Git에 올리지 마세요!');
console.log('3. assets/, archive/, sql/ 폴더는 Git에서 제외됨');
console.log('\n✅ 이제 git add . 하셔도 됩니다!');

