import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NHN Cloud 알림톡 API 키 (Supabase Dashboard > Edge Functions > Secrets 에서 설정)
const NHN_APP_KEY = Deno.env.get('NHN_APP_KEY') || ''
const NHN_SECRET_KEY = Deno.env.get('NHN_SECRET_KEY') || ''
const NHN_SENDER_KEY = Deno.env.get('NHN_SENDER_KEY') || ''

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, templateCode, templateParams, userId, submissionId, recipientType } = await req.json()

    console.log('📱 알림톡 발송 시작:', { phone, templateCode })

    // 전화번호 포맷팅
    const formattedPhone = phone?.replace(/[^0-9]/g, '') || ''

    if (formattedPhone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 전화번호' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 템플릿 파라미터 값 14자 제한 (NHN Blacklist 규정)
    const safeParams: Record<string, string> = {}
    if (templateParams) {
      for (const [key, value] of Object.entries(templateParams)) {
        const strVal = String(value || '')
        safeParams[key] = strVal.length > 14 ? strVal.substring(0, 13) + '…' : strVal
      }
    }

    // NHN API 호출
    const nhnPayload = {
      senderKey: NHN_SENDER_KEY,
      templateCode: templateCode || 'grading_complete',
      recipientList: [{
        recipientNo: formattedPhone,
        templateParameter: safeParams
      }]
    }

    const bodyStr = JSON.stringify(nhnPayload)
    const bodyBytes = new TextEncoder().encode(bodyStr)
    console.log('📤 NHN 요청:', bodyStr)

    const response = await fetch(
      `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/${NHN_APP_KEY}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': NHN_SECRET_KEY,
          'Content-Length': String(bodyBytes.length),
        },
        body: bodyBytes
      }
    )

    const result = await response.json()
    console.log('📥 NHN 응답:', JSON.stringify(result))

    const success = result.header?.resultCode === 0

    // notification_logs에 기록 (서버 사이드 로깅)
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
      const supabase = createClient(supabaseUrl, supabaseKey)

      await supabase.from('notification_logs').insert({
        user_id: userId || null,
        submission_id: submissionId || null,
        notification_type: templateCode || 'grading_complete',
        recipient_type: recipientType || 'student',
        phone_number: formattedPhone,
        status: success ? 'sent' : 'failed',
        error_message: success ? null : (result.header?.resultMessage || 'NHN API 오류'),
      })
      console.log('📝 notification_logs 기록 완료')
    } catch (logError) {
      console.error('⚠️ 로그 기록 실패 (발송은 정상):', logError.message)
    }

    if (success) {
      return new Response(
        JSON.stringify({ success: true, message: '알림톡 발송 성공' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      console.error('❌ NHN API 오류:', JSON.stringify(result))
      return new Response(
        JSON.stringify({
          success: false,
          error: result.header?.resultMessage || 'NHN API 오류',
          code: result.header?.resultCode,
          detail: result
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('❌ 오류:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
