// Supabase Edge Function: NHN Cloud SMS 발송
// Deno runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS 헤더
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NHN Cloud API 설정 (환경변수에서 로드)
const NHN_CLOUD_APP_KEY = Deno.env.get('NHN_CLOUD_APP_KEY') || ''
const NHN_SENDER_PHONE = Deno.env.get('NHN_SENDER_PHONE') || ''

serve(async (req) => {
  // CORS preflight 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 인증 확인 (Supabase anon key 또는 service_role key 필요)
    const authHeader = req.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

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

    // SMS/LMS 자동 전환 (90바이트 초과 시 LMS)
    const messageBytes = new TextEncoder().encode(message).length
    const isLms = messageBytes > 90
    const smsUrl = isLms
      ? `https://api-sms.cloud.toast.com/sms/v3.0/appkeys/${NHN_CLOUD_APP_KEY}/sender/lms`
      : `https://api-sms.cloud.toast.com/sms/v3.0/appkeys/${NHN_CLOUD_APP_KEY}/sender/sms`

    const smsBody: Record<string, unknown> = {
      body: message,
      sendNo: NHN_SENDER_PHONE,
      recipientList: [
        {
          recipientNo: phone,
          internationalRecipientNo: phone
        }
      ]
    }

    // LMS는 title 필드 필요
    if (isLms) {
      smsBody.title = '[올라운드영어]'
    }

    console.log(`NHN ${isLms ? 'LMS' : 'SMS'} API 호출 (${messageBytes}bytes):`, smsUrl)

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







