// Supabase Edge Function: 네이버 로그인 OAuth 2.0 처리
// Deno runtime
//
// 3가지 모드:
// 1) GET ?action=login → 네이버 인증 페이지로 리다이렉트
// 2) GET ?code=xxx (네이버 콜백) → code 처리 + naver_auth_temp 저장 + HTML 리다이렉트
// 3) POST { naver_code } → naver_auth_temp에서 token_hash 조회 반환

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SITE_URL = 'https://allroundedu.co.kr'
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/naver-auth`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function redirect(url: string): Response {
  return new Response(null, {
    status: 302,
    headers: { Location: url },
  })
}

async function processNaverCode(code: string, state: string) {
  // 1. code → access_token 교환
  const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      client_id: NAVER_CLIENT_ID,
      client_secret: NAVER_CLIENT_SECRET,
      code,
      state: state || '',
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error('네이버 토큰 발급 실패: ' + JSON.stringify(tokenData))
  }

  // 2. access_token → 프로필 조회
  const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
    headers: { Authorization: `Bearer ${tokenData.access_token}` },
  })
  const profileData = await profileRes.json()
  if (profileData.resultcode !== '00') {
    throw new Error('네이버 프로필 조회 실패')
  }

  const profile = profileData.response
  const naverId = profile.id
  const email = profile.email
  const name = profile.name || ''

  // 3. Supabase Admin
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // 4. 기존 유저 확인
  const { data: existingProfile } = await supabase
    .from('profiles')
    .select('id')
    .eq('naver_id', naverId)
    .maybeSingle()

  let userId: string

  if (existingProfile) {
    userId = existingProfile.id
  } else {
    const { data: existingByEmail } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .maybeSingle()

    if (existingByEmail) {
      userId = existingByEmail.id
      await supabase
        .from('profiles')
        .update({ naver_id: naverId })
        .eq('id', userId)
    } else {
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email,
        email_confirm: true,
        user_metadata: { provider: 'naver', naver_id: naverId, full_name: name },
      })
      if (createError || !newUser.user) {
        throw new Error('계정 생성 실패: ' + (createError?.message || ''))
      }
      userId = newUser.user.id
      await supabase
        .from('profiles')
        .update({ naver_id: naverId, name })
        .eq('id', userId)
    }
  }

  // 5. 매직 링크 생성
  const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError || !linkData) {
    throw new Error('세션 생성 실패: ' + (linkError?.message || ''))
  }

  const hashed_token = linkData.properties?.hashed_token
  if (!hashed_token) throw new Error('토큰 생성 실패')

  // 6. 임시 코드 저장
  const tempCode = crypto.randomUUID()
  await supabase.from('naver_auth_temp').insert({
    code: tempCode,
    token_hash: hashed_token,
    created_at: new Date().toISOString(),
  })

  return tempCode
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const action = url.searchParams.get('action')
      const code = url.searchParams.get('code')
      const error = url.searchParams.get('error')

      // 1) 네이버 로그인 시작
      if (action === 'login') {
        const csrfState = crypto.randomUUID()
        const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${csrfState}`
        return new Response(null, {
          status: 302,
          headers: { Location: naverAuthUrl },
        })
      }

      // 2) 네이버 인증 에러
      if (error) {
        return redirect(`${SITE_URL}/auth.html?error=${encodeURIComponent('네이버 인증이 취소되었습니다.')}`)
      }

      // 3) 네이버 콜백 (code 수신) → 처리 후 HTML로 리다이렉트
      if (code) {
        const state = url.searchParams.get('state') || ''
        const tempCode = await processNaverCode(code, state)
        return redirect(`${SITE_URL}/auth-callback.html?naver_code=${tempCode}`)
      }

      return new Response(JSON.stringify({ error: 'Invalid request' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4) POST: naver_code → token_hash 조회
    if (req.method === 'POST') {
      const { naver_code } = await req.json()
      if (!naver_code) {
        return new Response(JSON.stringify({ error: 'naver_code is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      const { data, error: queryError } = await supabase
        .from('naver_auth_temp')
        .select('token_hash')
        .eq('code', naver_code)
        .eq('used', false)
        .single()

      if (queryError || !data) {
        return new Response(JSON.stringify({ error: '유효하지 않은 코드' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 사용 처리
      await supabase
        .from('naver_auth_temp')
        .update({ used: true })
        .eq('code', naver_code)

      return new Response(JSON.stringify({ success: true, token_hash: data.token_hash }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('naver-auth error:', err)
    return redirect(`${SITE_URL}/auth.html?error=${encodeURIComponent(String(err))}`)
  }
})
