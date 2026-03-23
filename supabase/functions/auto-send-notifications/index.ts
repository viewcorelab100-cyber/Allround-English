import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const NHN_APP_KEY = Deno.env.get('NHN_APP_KEY') || ''
const NHN_SECRET_KEY = Deno.env.get('NHN_SECRET_KEY') || ''
const NHN_SENDER_KEY = Deno.env.get('NHN_SENDER_KEY') || ''

const TEST_MODE = Deno.env.get('TEST_MODE') === 'true' || false

async function sendAlimtalk(phone: string, templateCode: string, templateParams: any) {
  const formattedPhone = phone?.replace(/[^0-9]/g, '') || ''

  if (formattedPhone.length < 10) {
    return { success: false, error: '유효하지 않은 전화번호' }
  }

  // NHN 템플릿 변수 값 14자 제한
  const safeParams: Record<string, string> = {}
  for (const [key, value] of Object.entries(templateParams)) {
    const strVal = String(value || '')
    safeParams[key] = strVal.length > 14 ? strVal.substring(0, 13) + '…' : strVal
  }

  if (TEST_MODE) {
    console.log(`[테스트] ${templateCode} → ${formattedPhone}`, JSON.stringify(safeParams))
    return { success: true, testMode: true }
  }

  try {
    const response = await fetch(
      `https://api-alimtalk.cloud.toast.com/alimtalk/v2.2/appkeys/${NHN_APP_KEY}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          'X-Secret-Key': NHN_SECRET_KEY,
        },
        body: JSON.stringify({
          senderKey: NHN_SENDER_KEY,
          templateCode,
          recipientList: [{ recipientNo: formattedPhone, templateParameter: safeParams }]
        })
      }
    )
    const result = await response.json()
    return { success: result.header?.resultCode === 0, result }
  } catch (error) {
    return { success: false, error: error.message }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
    const supabase = createClient(supabaseUrl, supabaseKey)

    console.log(`자동 알림톡 체크 시작 (${TEST_MODE ? '테스트' : '프로덕션'})`)

    const stats = {
      unsubmittedCount: 0,
      inactiveCount: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      testMode: TEST_MODE
    }

    // ============================================================
    // 1. 과제 미제출 학생 체크
    // 조건: 레슨을 완료(is_completed=true)했고, 24시간 경과했으며,
    //       해당 레슨에 quizzes가 등록되어 있는데(=과제가 존재하는 레슨)
    //       assignments에서 과제를 완료하지 않은 학생
    // ============================================================

    // 과제가 존재하는 레슨 목록 먼저 확인 (quizzes 테이블에 레코드가 있는 레슨)
    const { data: lessonsWithQuiz, error: quizLessonError } = await supabase
      .from('quizzes')
      .select('lesson_id')

    if (quizLessonError) {
      console.error('퀴즈 레슨 조회 오류:', quizLessonError)
    }

    // 과제가 있는 레슨 ID 집합
    const lessonIdsWithAssignment = new Set(
      (lessonsWithQuiz || []).map((q: any) => q.lesson_id)
    )

    if (lessonIdsWithAssignment.size > 0) {
      const { data: completedLessons, error: progressError } = await supabase
        .from('lesson_progress')
        .select(`
          id, user_id, lesson_id, updated_at,
          lessons!inner(title, order_num, course_id, courses(title))
        `)
        .eq('is_completed', true)
        .in('lesson_id', Array.from(lessonIdsWithAssignment))
        .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

      if (progressError) {
        console.error('진도 체크 오류:', progressError)
      } else if (completedLessons && completedLessons.length > 0) {
        console.log(`과제 있는 완료 레슨 ${completedLessons.length}건 체크`)

        for (const item of completedLessons) {
          // 과제 완료 여부 확인
          const { data: assignment } = await supabase
            .from('assignments')
            .select('note_completed, blog_completed, kakao_completed')
            .eq('user_id', item.user_id)
            .eq('lesson_id', item.lesson_id)
            .maybeSingle()

          // 과제 전부 완료 → 스킵
          if (assignment?.note_completed && assignment?.blog_completed && assignment?.kakao_completed) {
            continue
          }

          // 학생 프로필 (관리자 제외)
          const { data: profile } = await supabase
            .from('profiles')
            .select('name, phone, role')
            .eq('id', item.user_id)
            .single()

          if (!profile || profile.role === 'admin' || !profile.phone) continue

          // 24시간 내 중복 방지
          const { data: existing } = await supabase
            .from('notification_logs')
            .select('id')
            .eq('user_id', item.user_id)
            .eq('notification_type', 'assignment_reminder')
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
            .maybeSingle()

          if (existing) { stats.skippedCount++; continue }

          stats.unsubmittedCount++

          const result = await sendAlimtalk(profile.phone, 'assignment_reminder', {
            '학생명': profile.name || '학생',
            '과정명': item.lessons.courses?.title || '강의',
            '강의제목': item.lessons.title || '',
          })

          await supabase.from('notification_logs').insert({
            user_id: item.user_id,
            notification_type: 'assignment_reminder',
            recipient_type: 'student',
            phone_number: profile.phone,
            status: result.success ? 'sent' : 'failed',
            error_message: result.success ? null : (result.error || 'unknown')
          })

          if (result.success) stats.sentCount++
          else stats.failedCount++
        }
      }
    } else {
      console.log('과제가 등록된 레슨이 없음 → 과제 알림 스킵')
    }

    // ============================================================
    // 2. 장기 미수강 학생 체크 (7일 이상)
    // ============================================================
    const { data: purchasedStudents, error: purchaseError } = await supabase
      .from('purchases')
      .select('user_id, course_id, courses(title)')
      .eq('status', 'completed')

    if (purchaseError) {
      console.error('구매 체크 오류:', purchaseError)
    } else if (purchasedStudents && purchasedStudents.length > 0) {
      const studentCourses = new Map<string, any>()
      for (const p of purchasedStudents) {
        if (!studentCourses.has(p.user_id)) {
          studentCourses.set(p.user_id, p)
        }
      }

      for (const [userId, purchase] of studentCourses) {
        // 최근 7일간 활동 확인
        const { data: recentProgress } = await supabase
          .from('lesson_progress')
          .select('updated_at')
          .eq('user_id', userId)
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (recentProgress && recentProgress.length > 0) continue

        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone, role')
          .eq('id', userId)
          .single()

        if (!profile || profile.role === 'admin' || !profile.phone) continue

        // 7일 내 중복 방지
        const { data: existing } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_type', 'inactive_reminder')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle()

        if (existing) { stats.skippedCount++; continue }

        stats.inactiveCount++

        const result = await sendAlimtalk(profile.phone, 'inactive_reminder', {
          '학생명': profile.name || '학생',
          '과정명': purchase.courses?.title || '강의',
          '경과일수': '7'
        })

        await supabase.from('notification_logs').insert({
          user_id: userId,
          notification_type: 'inactive_reminder',
          recipient_type: 'student',
          phone_number: profile.phone,
          status: result.success ? 'sent' : 'failed',
          error_message: result.success ? null : (result.error || 'unknown')
        })

        if (result.success) stats.sentCount++
        else stats.failedCount++
      }
    }

    console.log('완료:', JSON.stringify(stats))

    return new Response(
      JSON.stringify({ success: true, message: TEST_MODE ? '테스트 완료' : '자동 알림톡 체크 완료', stats }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('오류:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
