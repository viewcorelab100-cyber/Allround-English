// Supabase Edge Function: 네이버 로그인 OAuth 2.0 처리
// Deno runtime

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const NAVER_CLIENT_ID = Deno.env.get('NAVER_CLIENT_ID')!
const NAVER_CLIENT_SECRET = Deno.env.get('NAVER_CLIENT_SECRET')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const SITE_URL = 'https://allround-english.co.kr'
const CALLBACK_URL = `${SUPABASE_URL}/functions/v1/naver-auth`

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const url = new URL(req.url)
  const action = url.searchParams.get('action')
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  try {
    // 1) 네이버 로그인 페이지로 리다이렉트
    if (action === 'login') {
      const csrfState = crypto.randomUUID()
      const naverAuthUrl = `https://nid.naver.com/oauth2.0/authorize?response_type=code&client_id=${NAVER_CLIENT_ID}&redirect_uri=${encodeURIComponent(CALLBACK_URL)}&state=${csrfState}`

      return new Response(null, {
        status: 302,
        headers: { Location: naverAuthUrl },
      })
    }

    // 2) 네이버 인증 에러 처리
    if (error) {
      const errorDesc = url.searchParams.get('error_description') || '인증 실패'
      return new Response(null, {
        status: 302,
        headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent(errorDesc)}` },
      })
    }

    // 3) 콜백: code → access_token → 프로필 → Supabase 유저 생성/로그인
    if (code) {
      // 3-1. code → access_token 교환
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
        return new Response(null, {
          status: 302,
          headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent('네이버 토큰 발급 실패')}` },
        })
      }

      // 3-2. access_token → 프로필 조회
      const profileRes = await fetch('https://openapi.naver.com/v1/nid/me', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const profileData = await profileRes.json()

      if (profileData.resultcode !== '00') {
        return new Response(null, {
          status: 302,
          headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent('네이버 프로필 조회 실패')}` },
        })
      }

      const profile = profileData.response
      const naverId = profile.id
      const email = profile.email
      const name = profile.name || ''

      // 3-3. Supabase Admin 클라이언트
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { autoRefreshToken: false, persistSession: false },
      })

      // 3-4. 기존 유저 확인 (naver_id로 프로필 조회)
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('naver_id', naverId)
        .maybeSingle()

      let userId: string

      if (existingProfile) {
        // 기존 네이버 유저 → 로그인
        userId = existingProfile.id
      } else {
        // 이메일로 기존 계정 확인 (이메일 중복 방지)
        const { data: existingByEmail } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', email)
          .maybeSingle()

        if (existingByEmail) {
          // 기존 이메일 계정에 네이버 연동
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
            return new Response(null, {
              status: 302,
              headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent('계정 생성 실패: ' + (createError?.message || ''))}` },
            })
          }

          userId = newUser.user.id

          // profiles에 naver_id 저장
          await supabase
            .from('profiles')
            .update({ naver_id: naverId, name })
            .eq('id', userId)
        }
      }

      // 3-5. 매직 링크 생성 (세션 발급용)
      const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
        type: 'magiclink',
        email,
        options: {
          redirectTo: `${SITE_URL}/auth-callback.html`,
        },
      })

      if (linkError || !linkData) {
        return new Response(null, {
          status: 302,
          headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent('세션 생성 실패')}` },
        })
      }

      // action_link에서 redirect_to를 auth-callback.html로 강제 교체
      const actionLink = linkData.properties?.action_link
      if (actionLink) {
        const linkUrl = new URL(actionLink)
        linkUrl.searchParams.set('redirect_to', `${SITE_URL}/auth-callback.html`)
        return new Response(null, {
          status: 302,
          headers: { Location: linkUrl.toString() },
        })
      }

      return new Response(null, {
        status: 302,
        headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent('링크 생성 실패')}` },
      })
    }

    // 알 수 없는 요청
    return new Response(JSON.stringify({ error: 'Invalid request' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    console.error('naver-auth error:', err)
    return new Response(null, {
      status: 302,
      headers: { Location: `${SITE_URL}/auth.html?error=${encodeURIComponent('서버 오류가 발생했습니다')}` },
    })
  }
})
