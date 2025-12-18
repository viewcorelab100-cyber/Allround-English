import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NHN Cloud 알림톡 API 키 (하드코딩 - 테스트용)
const NHN_APP_KEY = 'g2A5M3Ingqykfg94'
const NHN_SECRET_KEY = 'wXNer48RkCc9YyGOOvlFkPkjxyEtu9pX'
const NHN_SENDER_KEY = '05bca9e77ae8957c3aa12d7f24dc6a9e7145754e'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, templateCode, templateParams } = await req.json()
    
    console.log('📱 알림톡 발송 시작:', { phone, templateCode })

    // 전화번호 포맷팅
    const formattedPhone = phone?.replace(/[^0-9]/g, '') || ''
    
    if (formattedPhone.length < 10) {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 전화번호' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // NHN API 호출
    const nhnPayload = {
      senderKey: NHN_SENDER_KEY,
      templateCode: templateCode || 'grading_complete',
      recipientList: [{
        recipientNo: formattedPhone,
        templateParameter: templateParams || {}
      }]
    }

    console.log('📤 NHN 요청:', JSON.stringify(nhnPayload))

    const response = await fetch(
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

    const result = await response.json()
    console.log('📥 NHN 응답:', JSON.stringify(result))

    if (result.header?.resultCode === 0) {
      return new Response(
        JSON.stringify({ success: true, message: '알림톡 발송 성공' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: result.header?.resultMessage || 'NHN API 오류',
          code: result.header?.resultCode
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
