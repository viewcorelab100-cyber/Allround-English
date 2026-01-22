import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// NHN Cloud 알림톡 API 키
const NHN_APP_KEY = 'zhZSielWtWCB3Uz8'
const NHN_SECRET_KEY = 'aSMenGNdTBFNtK8FdEr4vEuDFvTOdPxB'
const NHN_SENDER_KEY = 'ea98b16e16f06e2dbc1eaf903cd26832d0633070'

// 테스트 모드 플래그 (환경변수로 설정 가능)
const TEST_MODE = Deno.env.get('TEST_MODE') === 'true' || false

// 알림톡 발송 함수
async function sendAlimtalk(phone: string, templateCode: string, templateParams: any) {
  const formattedPhone = phone?.replace(/[^0-9]/g, '') || ''
  
  if (formattedPhone.length < 10) {
    console.error('❌ 유효하지 않은 전화번호:', phone)
    return { success: false, error: '유효하지 않은 전화번호' }
  }

  // 테스트 모드: 실제 발송 없이 시뮬레이션
  if (TEST_MODE) {
    console.log('🧪 [테스트 모드] 알림톡 발송 시뮬레이션')
    console.log('  - 전화번호:', formattedPhone)
    console.log('  - 템플릿:', templateCode)
    console.log('  - 파라미터:', JSON.stringify(templateParams))
    
    return {
      success: true,
      testMode: true,
      result: {
        header: {
          resultCode: 0,
          resultMessage: 'TEST MODE - 실제 발송 안 함'
        }
      }
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
    console.log('📥 NHN 응답:', JSON.stringify(result))

    return {
      success: result.header?.resultCode === 0,
      result
    }
  } catch (error) {
    console.error('❌ 알림톡 발송 실패:', error)
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

    console.log('🔔 자동 알림톡 체크 시작...')
    console.log(`📍 모드: ${TEST_MODE ? '🧪 테스트' : '🚀 프로덕션'}`)

    const stats = {
      unsubmittedCount: 0,
      inactiveCount: 0,
      sentCount: 0,
      failedCount: 0,
      skippedCount: 0,
      testMode: TEST_MODE
    }

    // 1. 과제 미제출 학생 체크 (24시간 경과)
    const { data: unsubmittedAssignments, error: assignmentError } = await supabase
      .from('progress')
      .select(`
        id,
        user_id,
        lesson_id,
        last_watched_at,
        profiles!inner(name, phone),
        lessons!inner(title, course_id, courses(title))
      `)
      .eq('completed', false)
      .not('last_watched_at', 'is', null)
      .lt('last_watched_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    if (assignmentError) {
      console.error('❌ 과제 체크 오류:', assignmentError)
    } else if (unsubmittedAssignments && unsubmittedAssignments.length > 0) {
      console.log(`📋 과제 미제출 학생 ${unsubmittedAssignments.length}명 발견`)
      stats.unsubmittedCount = unsubmittedAssignments.length

      for (const item of unsubmittedAssignments) {
        // 이미 알림을 보냈는지 체크 (중복 방지)
        const { data: existingNotification } = await supabase
          .from('notification_log')
          .select('id')
          .eq('user_id', item.user_id)
          .eq('lesson_id', item.lesson_id)
          .eq('type', 'assignment_reminder')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .single()

        if (existingNotification) {
          console.log(`⏭️ 이미 알림 발송됨: ${item.profiles.name}`)
          stats.skippedCount++
          continue
        }

        // 알림톡 발송
        const result = await sendAlimtalk(
          item.profiles.phone,
          'assignment_reminder',
          {
            name: item.profiles.name,
            courseName: item.lessons.courses.title,
            lessonTitle: item.lessons.title,
          }
        )

        if (result.success) {
          // 발송 로그 저장
          await supabase
            .from('notification_log')
            .insert({
              user_id: item.user_id,
              lesson_id: item.lesson_id,
              type: 'assignment_reminder',
              phone: item.profiles.phone,
              template_code: 'assignment_reminder',
              success: true,
              template_params: {
                name: item.profiles.name,
                courseName: item.lessons.courses.title,
                lessonTitle: item.lessons.title,
              }
            })
          console.log(`✅ 과제 알림 ${TEST_MODE ? '시뮬레이션' : '발송'}: ${item.profiles.name}`)
          stats.sentCount++
        } else {
          stats.failedCount++
        }
      }
    }

    // 2. 장기 미수강 학생 체크 (7일 이상)
    const { data: inactiveUsers, error: inactiveError } = await supabase
      .from('profiles')
      .select(`
        id,
        name,
        phone,
        enrollments!inner(
          course_id,
          created_at,
          courses(title)
        )
      `)
      .eq('enrollments.status', 'active')

    if (inactiveError) {
      console.error('❌ 미수강 체크 오류:', inactiveError)
    } else if (inactiveUsers && inactiveUsers.length > 0) {
      console.log(`👥 활성 수강생 ${inactiveUsers.length}명 체크`)

      for (const user of inactiveUsers) {
        // 최근 7일간 수강 기록 확인
        const { data: recentProgress } = await supabase
          .from('progress')
          .select('last_watched_at')
          .eq('user_id', user.id)
          .gte('last_watched_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
          .limit(1)

        if (!recentProgress || recentProgress.length === 0) {
          stats.inactiveCount++
          
          // 이미 알림을 보냈는지 체크
          const { data: existingNotification } = await supabase
            .from('notification_log')
            .select('id')
            .eq('user_id', user.id)
            .eq('type', 'inactive_reminder')
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
            .single()

          if (existingNotification) {
            console.log(`⏭️ 이미 알림 발송됨: ${user.name}`)
            stats.skippedCount++
            continue
          }

          // 알림톡 발송
          const result = await sendAlimtalk(
            user.phone,
            'inactive_reminder',
            {
              name: user.name,
              courseName: user.enrollments[0]?.courses?.title || '강의',
              days: '7'
            }
          )

          if (result.success) {
            // 발송 로그 저장
            await supabase
              .from('notification_log')
              .insert({
                user_id: user.id,
                type: 'inactive_reminder',
                phone: user.phone,
                template_code: 'inactive_reminder',
                success: true,
                template_params: {
                  name: user.name,
                  courseName: user.enrollments[0]?.courses?.title || '강의',
                  days: '7'
                }
              })
            console.log(`✅ 미수강 알림 ${TEST_MODE ? '시뮬레이션' : '발송'}: ${user.name}`)
            stats.sentCount++
          } else {
            stats.failedCount++
          }
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: TEST_MODE ? '테스트 모드로 실행 완료 (실제 발송 안 함)' : '자동 알림톡 체크 완료',
        stats
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('❌ 오류:', error.message)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
