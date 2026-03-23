import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NHN Cloud 알림톡 API 키
const NHN_APP_KEY = Deno.env.get('NHN_APP_KEY') || ''
const NHN_SECRET_KEY = Deno.env.get('NHN_SECRET_KEY') || ''
const NHN_SENDER_KEY = Deno.env.get('NHN_SENDER_KEY') || ''

const TEST_MODE = Deno.env.get('TEST_MODE') === 'true' || false

// 알림톡 발송 함수
async function sendAlimtalk(phone: string, templateCode: string, templateParams: any) {
  const formattedPhone = phone?.replace(/[^0-9]/g, '') || ''

  if (formattedPhone.length < 10) {
    console.error('유효하지 않은 전화번호:', phone)
    return { success: false, error: '유효하지 않은 전화번호' }
  }

  if (TEST_MODE) {
    console.log('[테스트 모드] 알림톡 발송 시뮬레이션')
    console.log('  - 전화번호:', formattedPhone)
    console.log('  - 템플릿:', templateCode)
    console.log('  - 파라미터:', JSON.stringify(templateParams))
    return {
      success: true,
      testMode: true,
      result: { header: { resultCode: 0, resultMessage: 'TEST MODE' } }
    }
  }

  const nhnPayload = {
    senderKey: NHN_SENDER_KEY,
    templateCode: templateCode,
    recipientList: [{
      recipientNo: formattedPhone,
      templateParameter: templateParams
    }]
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
        body: JSON.stringify(nhnPayload)
      }
    )

    const result = await response.json()
    console.log('NHN 응답:', JSON.stringify(result))

    return {
      success: result.header?.resultCode === 0,
      result
    }
  } catch (error) {
    console.error('알림톡 발송 실패:', error)
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

    console.log('자동 알림톡 체크 시작...')
    console.log(`모드: ${TEST_MODE ? '테스트' : '프로덕션'}`)

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
    // 조건: lesson_progress에서 is_completed=true인데
    //       assignments 테이블에 해당 레슨의 과제가 없는 학생
    //       + lesson_progress.updated_at이 24시간 이전
    // ============================================================
    const { data: completedLessons, error: progressError } = await supabase
      .from('lesson_progress')
      .select(`
        id,
        user_id,
        lesson_id,
        updated_at,
        lessons!inner(title, order_num, course_id, courses(title))
      `)
      .eq('is_completed', true)
      .lt('updated_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (progressError) {
      console.error('과제 체크 오류:', progressError)
    } else if (completedLessons && completedLessons.length > 0) {
      console.log(`완료된 레슨 ${completedLessons.length}건 체크`)

      for (const item of completedLessons) {
        // 해당 레슨에 과제가 제출되었는지 확인
        const { data: assignment } = await supabase
          .from('assignments')
          .select('id, note_completed, blog_completed, kakao_completed')
          .eq('user_id', item.user_id)
          .eq('lesson_id', item.lesson_id)
          .maybeSingle()

        // 과제가 이미 전부 제출됨 → 스킵
        if (assignment?.note_completed && assignment?.blog_completed && assignment?.kakao_completed) {
          continue
        }

        // 학생 프로필 조회 (관리자 제외)
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone, role')
          .eq('id', item.user_id)
          .single()

        if (!profile || profile.role === 'admin' || !profile.phone) continue

        // 이미 알림을 보냈는지 체크 (24시간 내 중복 방지)
        const { data: existingNotification } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', item.user_id)
          .eq('notification_type', 'assignment_reminder')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle()

        if (existingNotification) {
          stats.skippedCount++
          continue
        }

        stats.unsubmittedCount++

        const result = await sendAlimtalk(
          profile.phone,
          'assignment_reminder',
          {
            '학생명': profile.name || '학생',
            '과정명': item.lessons.courses?.title || '강의',
            '강의제목': item.lessons.title || '',
          }
        )

        if (result.success) {
          await supabase
            .from('notification_logs')
            .insert({
              user_id: item.user_id,
              notification_type: 'assignment_reminder',
              recipient_type: 'student',
              phone_number: profile.phone,
              status: 'sent'
            })
          console.log(`과제 알림 발송: ${profile.name}`)
          stats.sentCount++
        } else {
          await supabase
            .from('notification_logs')
            .insert({
              user_id: item.user_id,
              notification_type: 'assignment_reminder',
              recipient_type: 'student',
              phone_number: profile.phone,
              status: 'failed',
              error_message: result.error || 'unknown'
            })
          stats.failedCount++
        }
      }
    }

    // ============================================================
    // 2. 장기 미수강 학생 체크 (7일 이상)
    // 조건: purchases에서 구매 완료된 학생 중
    //       lesson_progress.updated_at이 7일 이전이거나 기록 없음
    // ============================================================
    const { data: purchasedStudents, error: purchaseError } = await supabase
      .from('purchases')
      .select(`
        user_id,
        course_id,
        courses(title)
      `)
      .eq('status', 'completed')

    if (purchaseError) {
      console.error('구매 체크 오류:', purchaseError)
    } else if (purchasedStudents && purchasedStudents.length > 0) {
      // 학생별로 그룹화
      const studentCourses = new Map<string, any>()
      for (const p of purchasedStudents) {
        if (!studentCourses.has(p.user_id)) {
          studentCourses.set(p.user_id, p)
        }
      }

      console.log(`수강생 ${studentCourses.size}명 미수강 체크`)

      for (const [userId, purchase] of studentCourses) {
        // 최근 7일간 수강 기록 확인
        const { data: recentProgress } = await supabase
          .from('lesson_progress')
          .select('updated_at')
          .eq('user_id', userId)
          .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        // 최근 7일간 활동 있음 → 스킵
        if (recentProgress && recentProgress.length > 0) continue

        // 학생 프로필 조회 (관리자 제외)
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone, role')
          .eq('id', userId)
          .single()

        if (!profile || profile.role === 'admin' || !profile.phone) continue

        // 이미 알림을 보냈는지 체크 (7일 내 중복 방지)
        const { data: existingNotification } = await supabase
          .from('notification_logs')
          .select('id')
          .eq('user_id', userId)
          .eq('notification_type', 'inactive_reminder')
          .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .maybeSingle()

        if (existingNotification) {
          stats.skippedCount++
          continue
        }

        stats.inactiveCount++

        const result = await sendAlimtalk(
          profile.phone,
          'inactive_reminder',
          {
            '학생명': profile.name || '학생',
            '과정명': purchase.courses?.title || '강의',
            '경과일수': '7'
          }
        )

        if (result.success) {
          await supabase
            .from('notification_logs')
            .insert({
              user_id: userId,
              notification_type: 'inactive_reminder',
              recipient_type: 'student',
              phone_number: profile.phone,
              status: 'sent'
            })
          console.log(`미수강 알림 발송: ${profile.name}`)
          stats.sentCount++
        } else {
          await supabase
            .from('notification_logs')
            .insert({
              user_id: userId,
              notification_type: 'inactive_reminder',
              recipient_type: 'student',
              phone_number: profile.phone,
              status: 'failed',
              error_message: result.error || 'unknown'
            })
          stats.failedCount++
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: TEST_MODE ? '테스트 모드 실행 완료 (실제 발송 안 함)' : '자동 알림톡 체크 완료',
        stats
      }),
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
