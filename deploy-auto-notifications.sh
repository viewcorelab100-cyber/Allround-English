#!/bin/bash

# 자동 알림톡 시스템 배포 스크립트

echo "🚀 올라운드 자동 알림톡 시스템 배포 시작..."
echo ""

# 1. Supabase 프로젝트 연결 확인
echo "📌 Step 1: Supabase 프로젝트 연결 확인"
if ! supabase projects list &> /dev/null; then
    echo "❌ Supabase CLI에 로그인되어 있지 않습니다."
    echo "   다음 명령어로 로그인하세요: supabase login"
    exit 1
fi
echo "✅ Supabase 연결 확인 완료"
echo ""

# 2. Edge Function 배포
echo "📌 Step 2: Edge Function 배포"
echo "   auto-send-notifications 함수 배포 중..."
supabase functions deploy auto-send-notifications

if [ $? -eq 0 ]; then
    echo "✅ Edge Function 배포 완료"
else
    echo "❌ Edge Function 배포 실패"
    exit 1
fi
echo ""

# 3. 환경 변수 설정 안내
echo "📌 Step 3: 환경 변수 설정"
echo "   다음 명령어로 필요한 환경 변수를 설정하세요:"
echo ""
echo "   supabase secrets set NHN_APP_KEY=your_app_key"
echo "   supabase secrets set NHN_SECRET_KEY=your_secret_key"
echo "   supabase secrets set NHN_SENDER_KEY=your_sender_key"
echo ""

# 4. SQL 스크립트 실행 안내
echo "📌 Step 4: Database 설정"
echo "   Supabase Dashboard에서 다음 파일을 실행하세요:"
echo "   📄 setup-auto-notifications.sql"
echo ""
echo "   1. Database → SQL Editor로 이동"
echo "   2. setup-auto-notifications.sql 파일 내용 복사"
echo "   3. SQL Editor에 붙여넣기 후 실행"
echo ""

# 5. 스케줄링 설정 안내
echo "📌 Step 5: 스케줄링 설정"
echo "   setup-auto-notifications.sql 파일에서 다음을 수정하세요:"
echo "   - YOUR_PROJECT_REF: Supabase 프로젝트 참조 ID"
echo "   - YOUR_SERVICE_ROLE_KEY: Service Role Key"
echo ""

# 6. 테스트 명령어 안내
echo "📌 Step 6: 테스트"
echo "   다음 명령어로 수동 테스트를 실행할 수 있습니다:"
echo ""
echo "   curl -X POST \\"
echo "     'https://YOUR_PROJECT_REF.supabase.co/functions/v1/auto-send-notifications' \\"
echo "     -H 'Authorization: Bearer YOUR_SERVICE_ROLE_KEY' \\"
echo "     -H 'Content-Type: application/json'"
echo ""

echo "✅ 배포 스크립트 실행 완료!"
echo "📖 자세한 설정 방법은 docs/AUTO_NOTIFICATION_SETUP.md를 참고하세요."














