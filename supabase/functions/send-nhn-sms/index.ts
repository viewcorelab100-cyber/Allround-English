// Supabase Edge Function: NHN Cloud SMS 발송
// Deno runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NHN Cloud API 설정
const NHN_CLOUD_APP_KEY = 'xZBg2ycyyAv1RUyq'
const NHN_SENDER_PHONE = '01063363823'

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone, message } = await req.json()

    console.log('NHN SMS 발송 요청:', { phone, message })

    // 필수 파라미터 검증
    if (!phone || !message) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 파라미터 누락 (phone, message)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // API 키 검증
    if (!NHN_CLOUD_APP_KEY || !NHN_SENDER_PHONE) {
      return new Response(
        JSON.stringify({ success: false, error: 'NHN Cloud API 키가 설정되지 않았습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // SMS 발송
    const smsUrl = `https://api-sms.cloud.toast.com/sms/v3.0/appkeys/${NHN_CLOUD_APP_KEY}/sender/sms`
    
    const smsBody = {
      body: message,
      sendNo: NHN_SENDER_PHONE,
      recipientList: [
        {
          recipientNo: phone,
          internationalRecipientNo: phone
        }
      ]
    }

    console.log('NHN SMS API 호출:', smsUrl)

    const smsResponse = await fetch(smsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8'
      },
      body: JSON.stringify(smsBody)
    })

    const smsResult = await smsResponse.json()
    console.log('NHN SMS 응답:', smsResult)

    // 성공 확인
    if (smsResult.header?.isSuccessful === true) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          data: smsResult 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: smsResult.header?.resultMessage || 'SMS 발송 실패',
          data: smsResult
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

  } catch (error) {
    console.error('Edge Function 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})







