// Supabase Edge Function: 네이버 로그인 OAuth 2.0 처리
// Deno runtime
//
// 2가지 모드:
// 1) GET ?action=login → 네이버 인증 페이지로 리다이렉트
// 2) POST { code, state } → code 교환 + 유저 생성 + token_hash 반환 (API)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SITE_URL = 'https://allround-english.co.kr'
const NAVER_CALLBACK_URL = `${SITE_URL}/auth-callback.html`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) GET ?action=login → 네이버 인증 페이지로 리다이렉트
    if (req.method === 'GET') {
      const url = new URL(req.url)
      const action = url.searchParams.get('action')

      if (action === 'login') {
        const csrfState = crypto.randomUUID()
        const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(NAVER_CALLBACK_URL)}&state=${csrfState}`
        return new Response(null, {
          status: 302,
          headers: { Location: naverAuthUrl },
        })
      }

      return new Response(JSON.stringify({ error: 'Invalid action' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 2) POST { code, state } → 코드 교환 + 유저 생성 + token_hash 반환
    if (req.method === 'POST') {
      const { code, state } = await req.json()

      if (!code) {
        return new Response(JSON.stringify({ error: 'code is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 2-1. code → access_token 교환
      const tokenRes = await fetch('https://nid.naver.com/oauth2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          client_id: NAVER_CLIENT_ID,
          client_secret: NAVER_CLIENT_SECRET,
          code,
          state: state || '',
          redirect_uri: NAVER_CALLBACK_URL,
        }),
      })
      const tokenData = await tokenRes.json()

      if (!tokenData.access_token) {
        return new Response(JSON.stringify({ error: '네이버 토큰 발급 실패', detail: tokenData }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // 2-2. access_token → 프로필 조회
      const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profileData = await profileRes.json()

      if (profileData.resultcode !== '00') {
        return new Response(JSON.stringify({ error: '네이버 프로필 조회 실패' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const profile = profileData.response
      const naverId = profile.id
      const email = profile.email
      const name = profile.name || ''

      // 2-3. Supabase Admin 클라이언트
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // 2-4. 기존 유저 확인 (naver_id로 프로필 조회)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('naver_id', naverId)
        .maybeSingle()

      let userId: string

      if (existingProfile) {
        userId = existingProfile.id
      } else {
        // 이메일로 기존 계정 확인
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
          // 신규 유저 생성
          const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
            email,
            email_confirm: true,
            user_metadata: {
              provider: 'naver',
              naver_id: naverId,
              full_name: name,
            },
          })

          if (createError || !newUser.user) {
            return new Response(JSON.stringify({ error: '계정 생성 실패', detail: createError?.message }), {
              status: 500,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            })
          }

          userId = newUser.user.id

          await supabase
            .from('profiles')
            .update({ naver_id: naverId, name })
            .eq('id', userId)
        }
      }

      // 2-5. 매직 링크 생성 → token_hash 반환
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
      })

      if (linkError || !linkData) {
        return new Response(JSON.stringify({ error: '세션 생성 실패', detail: linkError?.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      const hashed_token = linkData.properties?.hashed_token
      return new Response(JSON.stringify({
        success: true,
        token_hash: hashed_token,
        is_new: !existingProfile,
      }), {
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
    return new Response(JSON.stringify({ error: '서버 오류', detail: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
