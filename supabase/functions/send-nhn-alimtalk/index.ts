import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('✅ START: Function execution started')
    
    const body = await req.json()
    console.log('✅ STEP 1: Body parsed:', body)
    
    const { phone, templateCode, templateParams } = body
    console.log('✅ STEP 2: Variables extracted')
    
    // 하드코딩된 NHN 키
    const NHN_APP_KEY = 'g2A5M3Ingqykfg94'
    const NHN_SECRET_KEY = 'wXNer48RkCc9YyGOOvlFkPkjxyEtu9pX'
    const NHN_SENDER_KEY = '05bca9e77ae8957c3aa12d7f24dc6a9e7145754e'
    
    console.log('✅ STEP 3: NHN keys loaded (hardcoded)')
    console.log('📞 Phone:', phone)
    console.log('📋 Template:', templateCode)
    console.log('📋 Params:', templateParams)
    
    // 전화번호 포맷팅
    const formattedPhone = phone.replace(/[^0-9]/g, '')
    console.log('✅ STEP 4: Phone formatted:', formattedPhone)
    
    // NHN API 페이로드
    const nhnPayload = {
      senderKey: NHN_SENDER_KEY,
      templateCode: templateCode,
      recipientList: [{
        recipientNo: formattedPhone,
        templateParameter: templateParams
      }]
    }
    
    console.log('✅ STEP 5: Payload created')
    console.log('📤 Payload:', JSON.stringify(nhnPayload, null, 2))
    
    // NHN API 호출
    const url = `https://api-alimtalk.cloud.nhn.com/alimtalk/v2.2/appkeys/${NHN_APP_KEY}/messages`
    console.log('✅ STEP 6: Calling NHN API:', url)
    
    const nhnResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json;charset=UTF-8',
        'X-Secret-Key': NHN_SECRET_KEY,
      },
      body: JSON.stringify(nhnPayload)
    })
    
    console.log('✅ STEP 7: NHN API response received')
    console.log('📥 Status:', nhnResponse.status)
    
    const nhnResult = await nhnResponse.json()
    console.log('✅ STEP 8: Response parsed')
    console.log('📥 Result:', JSON.stringify(nhnResult, null, 2))
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        nhnResult 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ ERROR:', error)
    console.error('❌ Stack:', error.stack)
    
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
