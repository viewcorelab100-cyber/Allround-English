import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

    const token = authHeader.replace('Bearer ', '')
    const adminClient = createClient(supabaseUrl, supabaseServiceKey)

    // 요청자 인증 확인
    const { data: { user: caller }, error: callerError } = await adminClient.auth.getUser(token)
    if (callerError || !caller) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다.' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 관리자 권한 확인
    const { data: profile } = await adminClient
      .from('profiles')
      .select('role')
      .eq('id', caller.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 필요합니다.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId가 필요합니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 자기 자신 삭제 방지
    if (userId === caller.id) {
      return new Response(
        JSON.stringify({ error: '자기 자신의 계정은 삭제할 수 없습니다.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 관련 데이터 삭제 (FK 제약 조건 순서 고려)
    const tables = [
      'teacher_feedback',
      'quiz_results',
      'student_submissions',
      'lesson_progress',
      'assignments',
      'notification_logs',
    ]

    for (const table of tables) {
      const { error } = await adminClient.from(table).delete().eq('user_id', table === 'teacher_feedback' ? 'student_id' : 'user_id', userId)
      if (error) {
        console.warn(`Warning: failed to delete from ${table}:`, error.message)
      }
    }

    // user_id 컬럼명이 다를 수 있는 테이블 개별 처리
    await adminClient.from('teacher_feedback').delete().eq('student_id', userId)
    await adminClient.from('quiz_results').delete().eq('user_id', userId)
    await adminClient.from('student_submissions').delete().eq('user_id', userId)
    await adminClient.from('lesson_progress').delete().eq('user_id', userId)
    await adminClient.from('assignments').delete().eq('user_id', userId)
    await adminClient.from('notification_logs').delete().eq('user_id', userId)

    // profiles 삭제
    const { error: profileError } = await adminClient.from('profiles').delete().eq('id', userId)
    if (profileError) {
      console.error('Profile delete error:', profileError)
    }

    // Auth 사용자 삭제
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      console.error('Auth delete error:', deleteError)
      return new Response(
        JSON.stringify({ error: '계정 삭제 실패: ' + deleteError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`회원 삭제 완료: userId=${userId}, by admin=${caller.id}`)

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Delete user error:', error)
    return new Response(
      JSON.stringify({ error: error.message || '알 수 없는 오류' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
