import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, templateCode, templateParams, submissionId } = await req.json()

    console.log('📱 알림톡 발송 요청:', { phone, templateCode, submissionId })

    // 환경 변수 확인
    const NHN_APP_KEY = Deno.env.get('NHN_APP_KEY')
    const NHN_SECRET_KEY = Deno.env.get('NHN_SECRET_KEY')
    const NHN_SENDER_KEY = Deno.env.get('NHN_SENDER_KEY')
    const SITE_URL = Deno.env.get('SITE_URL') || 'https://allround-english.vercel.app'

    if (!NHN_APP_KEY || !NHN_SECRET_KEY || !NHN_SENDER_KEY) {
      console.error('❌ NHN API 키가 설정되지 않았습니다.')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'NHN API 키가 설정되지 않았습니다.',
          message: '환경 변수를 확인해주세요: NHN_APP_KEY, NHN_SECRET_KEY, NHN_SENDER_KEY'
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 전화번호 포맷팅 (하이픈 제거)
    const formattedPhone = phone.replace(/[^0-9]/g, '')

    // 마이페이지 링크 생성 (제출 상세로 이동)
    const detailUrl = `${SITE_URL}/mypage.html?submission=${submissionId}`

    // NHN API 요청 페이로드
    const nhnPayload = {
      plusFriendId: NHN_SENDER_KEY,
      templateCode: templateCode,
      recipientList: [
        {
          recipientNo: formattedPhone,
          templateParameter: templateParams,
          buttons: [
            {
              ordering: 1,
              type: 'WL', // Web Link
              name: '채점 결과 확인',
              linkMo: detailUrl,
              linkPc: detailUrl
            }
          ]
        }
      ]
    }

    console.log('📤 NHN API 호출:', { 
      recipientNo: formattedPhone, 
      templateCode,
      buttonUrl: detailUrl 
    })

    // NHN API 호출
    const nhnResponse = await fetch(
      `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/${NHN_APP_KEY}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': NHN_SECRET_KEY,
        },
        body: JSON.stringify(nhnPayload)
      }
    )

    const nhnResult = await nhnResponse.json()

    console.log('📥 NHN API 응답:', { 
      status: nhnResponse.status, 
      result: nhnResult 
    })

    if (!nhnResponse.ok) {
      throw new Error(`NHN API 오류: ${JSON.stringify(nhnResult)}`)
    }

    // Supabase에 로그 저장
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    if (submissionId) {
      const { data: submission } = await supabaseClient
        .from('student_submissions')
        .select('user_id')
        .eq('id', submissionId)
        .single()

      if (submission) {
        await supabaseClient.from('notification_logs').insert({
          user_id: submission.user_id,
          submission_id: submissionId,
          notification_type: 'grading_complete',
          recipient_phone: formattedPhone,
          status: 'sent',
          sent_at: new Date().toISOString()
        })
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: '알림톡이 발송되었습니다.',
        requestId: nhnResult.header?.resultCode
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ 알림톡 발송 오류:', error)

    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        stack: error.stack
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
