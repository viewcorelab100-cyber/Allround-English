// Supabase Edge Function: 학부모 결제 링크 결제 승인
// 토큰 기반 검증 (로그인 불필요) → 토스 승인 → 학생 수강권 부여

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { paymentKey, orderId, amount, token } = await req.json()

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount || !token) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 파라미터 누락 (paymentKey, orderId, amount, token)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Supabase 클라이언트 (서비스 역할 키 - RLS 우회)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 1. 토큰으로 payment_links 조회
    const { data: link, error: linkError } = await supabase
      .from('payment_links')
      .select('*')
      .eq('token', token)
      .single()

    if (linkError || !link) {
      console.error('결제 링크 조회 실패:', linkError)
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 결제 링크입니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 2. 상태 검증
    if (link.status !== 'pending') {
      return new Response(
        JSON.stringify({ success: false, error: '이미 처리된 결제 링크입니다.', linkStatus: link.status }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 3. 만료 검증
    if (new Date(link.expires_at) < new Date()) {
      // 만료 상태 업데이트
      await supabase
        .from('payment_links')
        .update({ status: 'expired', updated_at: new Date().toISOString() })
        .eq('id', link.id)

      return new Response(
        JSON.stringify({ success: false, error: '만료된 결제 링크입니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 4. 금액 검증 (DB 금액 기준)
    const expectedAmount = link.amount
    if (Math.floor(Number(amount)) !== expectedAmount) {
      console.error('금액 불일치:', { expected: expectedAmount, received: amount })
      return new Response(
        JSON.stringify({ success: false, error: '결제 금액이 일치하지 않습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 5. 토스페이먼츠 결제 승인 API 호출
    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY')
    if (!tossSecretKey) {
      console.error('TOSS_SECRET_KEY 환경변수 미설정')
      return new Response(
        JSON.stringify({ success: false, error: '결제 시스템 설정 오류' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    const encodedKey = btoa(`${tossSecretKey}:`)

    const confirmResponse = await fetch('https://api.tosspayments.com/v1/payments/confirm', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${encodedKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': orderId,
      },
      body: JSON.stringify({
        paymentKey,
        orderId,
        amount: parseInt(amount),
      }),
    })

    const confirmResult = await confirmResponse.json()

    if (!confirmResponse.ok) {
      console.error('토스 결제 승인 실패:', confirmResult)
      return new Response(
        JSON.stringify({
          success: false,
          error: confirmResult.message || '결제 승인에 실패했습니다.',
          code: confirmResult.code,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('토스 결제 승인 성공:', { orderId, paymentKey, amount })

    // 가상계좌 여부
    const isVirtualAccount = confirmResult.method === '가상계좌'
    const isWaitingForDeposit = isVirtualAccount && confirmResult.status === 'WAITING_FOR_DEPOSIT'

    // 6. 강의 정보 조회
    const { data: course } = await supabase
      .from('courses')
      .select('*, has_textbook')
      .eq('id', link.course_id)
      .single()

    // 7. orders 테이블에 주문 기록 INSERT
    const orderData: Record<string, unknown> = {
      id: orderId,
      user_id: link.student_id,
      course_id: link.course_id,
      amount: expectedAmount,
      paid_amount: expectedAmount,
      order_name: (link.course_title || '온라인 강의') + ' (학부모 결제)',
      customer_name: link.student_name || '',
      customer_phone: link.guardian_phone || '',
      payment_key: paymentKey,
      has_textbook: course?.has_textbook || false,
      status: isWaitingForDeposit ? 'WAITING_FOR_DEPOSIT' : 'DONE',
      paid_at: isWaitingForDeposit ? null : new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (!course?.has_textbook) {
      orderData.shipping_status = 'NO_SHIPPING'
    }

    if (isWaitingForDeposit && confirmResult.virtualAccount) {
      orderData.virtual_account_info = JSON.stringify({
        accountNumber: confirmResult.virtualAccount.accountNumber,
        bank: confirmResult.virtualAccount.bankCode,
        bankName: confirmResult.virtualAccount.bank,
        customerName: confirmResult.virtualAccount.customerName,
        dueDate: confirmResult.virtualAccount.dueDate,
      })
    }

    const { error: orderError } = await supabase
      .from('orders')
      .insert(orderData)

    if (orderError) {
      console.error('주문 기록 생성 실패:', orderError)
      // 주문 생성 실패해도 결제는 이미 승인됨 → 로그만 남김
    }

    // 8. 즉시 결제(카드 등)인 경우 purchases INSERT
    if (!isWaitingForDeposit) {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: link.student_id,
          course_id: link.course_id,
          order_id: orderId,
          payment_key: paymentKey,
          status: 'completed',
          payment_method: 'tosspayments',
          amount: parseInt(amount),
          purchased_at: new Date().toISOString(),
        })

      if (purchaseError && purchaseError.code !== '23505') {
        console.error('수강권 생성 실패:', purchaseError)
      }
    }

    // 9. payment_links 상태 업데이트
    const linkUpdate: Record<string, unknown> = {
      order_id: orderId,
      payment_key: paymentKey,
      updated_at: new Date().toISOString(),
    }

    if (!isWaitingForDeposit) {
      linkUpdate.status = 'paid'
      linkUpdate.paid_at = new Date().toISOString()
    }
    // 가상계좌는 입금 확인 전까지 pending 유지

    await supabase
      .from('payment_links')
      .update(linkUpdate)
      .eq('id', link.id)

    // 10. 성공 응답
    return new Response(
      JSON.stringify({
        success: true,
        order: { id: orderId, status: orderData.status },
        course: course ? { title: course.title } : null,
        studentName: link.student_name,
        isVirtualAccount,
        isWaitingForDeposit,
        virtualAccountInfo: isWaitingForDeposit && confirmResult.virtualAccount ? {
          accountNumber: confirmResult.virtualAccount.accountNumber,
          bankName: confirmResult.virtualAccount.bank,
          dueDate: confirmResult.virtualAccount.dueDate,
        } : null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Edge Function 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
