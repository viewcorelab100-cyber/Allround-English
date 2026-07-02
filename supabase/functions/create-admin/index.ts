import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

// create-admin: 관리자가 admin 페이지에서 이메일/비밀번호/이름으로 새 전체 관리자 계정을 생성.
// 보안(INV-1/INV-2): service_role은 서버측에서만 사용, 호출자가 role='admin'인지 반드시 검증.
// delete-user / reset-user-password 함수와 동일한 검증 패턴.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1) 호출자 인증 토큰 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return json({ error: '인증이 필요합니다.' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const token = authHeader.replace('Bearer ', '')
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 2) 호출자 확인
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token)
    if (callerError || !caller) {
      return json({ error: '유효하지 않은 인증입니다.' }, 401)
    }

    // 3) 호출자 관리자 권한 검증 (INV-2 권한 상승 차단) — 활성 관리자만 허용
    const { data: callerProfile } = await adminClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', caller.id)
      .single()

    if (!callerProfile || callerProfile.role !== 'admin' || callerProfile.is_active === false) {
      return json({ error: '관리자 권한이 필요합니다.' }, 403)
    }

    // 4) 입력 파싱/검증
    const { email, password, name } = await req.json().catch(() => ({}))

    const emailNorm = typeof email === 'string' ? email.trim().toLowerCase() : ''
    const nameNorm = typeof name === 'string' ? name.trim() : ''

    if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
      return json({ error: '올바른 이메일을 입력해주세요.' }, 400)
    }
    if (typeof password !== 'string' || password.length < 8) {
      return json({ error: '비밀번호는 8자 이상이어야 합니다.' }, 400)
    }
    if (!nameNorm) {
      return json({ error: '이름을 입력해주세요.' }, 400)
    }

    // 5) 계정 생성 (이메일 확인 완료 상태로 즉시 로그인 가능)
    const { data: created, error: createError } = await adminClient.auth.admin.createUser({
      email: emailNorm,
      password,
      email_confirm: true,
      user_metadata: { name: nameNorm },
    })

    if (createError || !created?.user) {
      const msg = createError?.message || ''
      // 중복 이메일 등 사용자 친화 메시지
      if (/already|registered|exists|duplicate/i.test(msg)) {
        return json({ error: '이미 등록된 이메일입니다.' }, 409)
      }
      return json({ error: '계정 생성 실패: ' + (msg || '알 수 없는 오류') }, 400)
    }

    const newUserId = created.user.id

    // 6) profiles 를 관리자(활성)로 설정.
    //    handle_new_user 트리거가 이미 기본 프로필을 INSERT 했으므로 UPDATE.
    //    prevent_role_change 트리거는 서버(auth.uid()=NULL) 변경을 허용하도록 보정됨.
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ role: 'admin', is_active: true, name: nameNorm })
      .eq('id', newUserId)

    if (profileError) {
      // 프로필 승격 실패 시 생성된 auth 계정 롤백 (권한 없는 유령 계정 방지)
      await adminClient.auth.admin.deleteUser(newUserId).catch(() => {})
      return json({ error: '관리자 권한 부여 실패: ' + profileError.message }, 500)
    }

    // 7) 검증: role 이 실제로 admin 으로 남았는지 재확인 (트리거 되돌림 방어)
    const { data: verifyProfile } = await adminClient
      .from('profiles')
      .select('role, is_active')
      .eq('id', newUserId)
      .single()

    if (!verifyProfile || verifyProfile.role !== 'admin') {
      await adminClient.auth.admin.deleteUser(newUserId).catch(() => {})
      return json({ error: '관리자 권한이 적용되지 않았습니다. 관리자에게 문의하세요.' }, 500)
    }

    console.log(`관리자 계정 생성: ${emailNorm} (id=${newUserId}) by admin=${caller.id}`)

    return json({ success: true, user: { id: newUserId, email: emailNorm, name: nameNorm } })
  } catch (error) {
    console.error('create-admin error:', error)
    return json({ error: (error as Error).message || '알 수 없는 오류' }, 500)
  }
})
