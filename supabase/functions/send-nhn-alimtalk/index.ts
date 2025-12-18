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
    const { phone, templateCode, templateParams, submissionId, pdfUrl } = await req.json()

    console.log('📱 알림톡 발송 요청:', { phone, templateCode, submissionId, pdfUrl, templateParams })

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

    console.log('📋 템플릿 파라미터:', templateParams)
    console.log('🔗 PDF URL:', pdfUrl)

    // NHN API 요청 페이로드 (버튼 제거)
    const nhnPayload = {
      plusFriendId: NHN_SENDER_KEY,
      templateCode: templateCode,  // NHN에 등록된 템플릿 코드 그대로 사용
      recipientList: [
        {
          recipientNo: formattedPhone,
          templateParameter: templateParams
          // 버튼 제거 - 템플릿 본문에 PDF링크 변수만 사용
        }
      ]
    }

    console.log('🔑 [H1] NHN 환경 변수:', { 
      APP_KEY: NHN_APP_KEY?.substring(0, 8) + '...',
      SECRET_KEY: NHN_SECRET_KEY?.substring(0, 8) + '...',
      SENDER_KEY_FULL: NHN_SENDER_KEY,
      SENDER_KEY_LENGTH: NHN_SENDER_KEY?.length || 0
    })
    
    console.log('📤 [H2,H3] NHN API 요청 페이로드 (전체):', JSON.stringify(nhnPayload, null, 2))
    
    console.log('📋 [H4] 템플릿 파라미터 키 목록:', Object.keys(templateParams))
    console.log('📋 [H4] 템플릿 파라미터 값:', templateParams)

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

    console.log('📥 [H5] NHN API 응답 상태:', { 
      status: nhnResponse.status,
      statusText: nhnResponse.statusText,
      ok: nhnResponse.ok
    })
    
    console.log('📥 [H5] NHN API 응답 본문 (전체):', JSON.stringify(nhnResult, null, 2))
    
    console.log('📥 [H5] NHN API 응답 헤더:', {
      resultCode: nhnResult?.header?.resultCode,
      resultMessage: nhnResult?.header?.resultMessage,
      isSuccessful: nhnResult?.header?.isSuccessful
    })

    if (!nhnResponse.ok || nhnResult?.header?.resultCode !== 0) {
      const errorDetail = {
        status: nhnResponse.status,
        resultCode: nhnResult?.header?.resultCode,
        resultMessage: nhnResult?.header?.resultMessage,
        fullResponse: nhnResult
      }
      console.error('❌ [H5] NHN API 오류 상세:', JSON.stringify(errorDetail, null, 2))
      throw new Error(`NHN API 오류: ${JSON.stringify(errorDetail)}`)
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
