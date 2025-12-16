// HTML 파일들에 보안 태그를 일괄 추가하는 스크립트
// 사용법: node add-security-tags.js

const fs = require('fs');
const path = require('path');

// 처리할 HTML 파일 목록
const htmlFiles = [
    'index.html',
    'auth.html',
    'courses.html',
    'course-detail.html',
    'admin.html',
    'lesson.html',
    'mypage.html',
    'artist.html',
    'payment.html',
    'payment-success.html',
    'payment-fail.html',
    'report.html',
    'firstee.html',
    'about.html'
];

// 제외할 파일 (이미 처리된 파일이나 필요없는 파일)
const excludeFiles = [
    'site-login.html', // 로그인 페이지는 제외
    'master.html',
    'test copy.html',
    'email-template.html',
    'email-template-confirm.html',
    'email-template-reset-password.html',
    'vimeo-test.html',
    'test-scroll-motion.html'
];

function addSecurityTags(filePath) {
    try {
        let content = fs.readFileSync(filePath, 'utf8');
        let modified = false;

        // 1. robots meta 태그 추가 (아직 없는 경우)
        if (!content.includes('name="robots"') && !content.includes('noindex')) {
            content = content.replace(
                /<meta\s+name="viewport"[^>]*>/i,
                '$&\n    <meta name="robots" content="noindex, nofollow">'
            );
            modified = true;
            console.log(`✅ ${filePath}: robots meta 태그 추가됨`);
        }

        // 2. site-auth.js 스크립트 추가 (아직 없는 경우)
        if (!content.includes('site-auth.js')) {
            // Supabase 스크립트 다음에 추가
            content = content.replace(
                /<script\s+src="https:\/\/unpkg\.com\/@supabase\/supabase-js@[^"]*"><\/script>/i,
                '$&\n    <script src="js/site-auth.js"></script>'
            );
            
            // 만약 Supabase 스크립트가 없다면 tailwindcss 다음에 추가
            if (!content.includes('site-auth.js')) {
                content = content.replace(
                    /<script\s+src="https:\/\/cdn\.tailwindcss\.com"><\/script>/i,
                    '$&\n    <script src="js/site-auth.js"></script>'
                );
            }
            
            modified = true;
            console.log(`✅ ${filePath}: site-auth.js 추가됨`);
        }

        // 파일 저장
        if (modified) {
            fs.writeFileSync(filePath, content, 'utf8');
            console.log(`💾 ${filePath}: 저장 완료\n`);
        } else {
            console.log(`⏭️  ${filePath}: 이미 처리됨\n`);
        }

    } catch (error) {
        console.error(`❌ ${filePath} 처리 중 오류:`, error.message);
    }
}

// 메인 실행
console.log('🔒 보안 태그 일괄 추가 스크립트 시작...\n');

htmlFiles.forEach(file => {
    if (!excludeFiles.includes(file) && fs.existsSync(file)) {
        addSecurityTags(file);
    }
});

console.log('✨ 모든 HTML 파일 처리 완료!');
console.log('\n⚠️  주의사항:');
console.log('1. 변경사항을 확인하세요.');
console.log('2. site-login.html의 비밀번호를 변경하세요.');
console.log('3. js/supabase-config.js 파일을 생성하고 실제 값을 입력하세요.');

