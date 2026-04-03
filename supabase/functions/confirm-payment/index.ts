// Supabase Edge Function: 토스페이먼츠 결제 승인
// Deno runtime

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
    const { paymentKey, orderId, amount, couponId } = await req.json()

    // 필수 파라미터 검증
    if (!paymentKey || !orderId || !amount) {
      return new Response(
        JSON.stringify({ success: false, error: '필수 파라미터 누락 (paymentKey, orderId, amount)' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Supabase 클라이언트 (서비스 역할 키로 생성 - RLS 우회)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 인증된 사용자 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: '인증이 필요합니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: `Bearer ${token}` } }
    }).auth.getUser()

    if (userError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: '유효하지 않은 인증 토큰입니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
      )
    }

    // 1. 주문 정보 조회 및 검증
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      console.error('주문 조회 실패:', orderError)
      return new Response(
        JSON.stringify({ success: false, error: '주문 정보를 찾을 수 없습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      )
    }

    // 주문 소유자 검증
    if (order.user_id !== user.id) {
      return new Response(
        JSON.stringify({ success: false, error: '주문 접근 권한이 없습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 403 }
      )
    }

    // 이미 완료된 주문인지 확인
    if (order.status === 'DONE') {
      return new Response(
        JSON.stringify({ success: true, alreadyDone: true, order }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 금액 검증 (쿠폰 할인 고려)
    let expectedAmount = order.amount
    let appliedCoupon = null

    if (couponId) {
      const { data: userCoupon, error: couponError } = await supabase
        .from('user_coupons')
        .select(`
          *,
          coupons (
            code, name, discount_type, discount_value,
            min_purchase_amount, max_discount_amount
          )
        `)
        .eq('id', couponId)
        .single()

      if (!couponError && userCoupon && userCoupon.coupons) {
        appliedCoupon = userCoupon
        const coupon = userCoupon.coupons

        let discountAmount = 0
        if (coupon.discount_type === 'percentage') {
          discountAmount = Math.floor(order.amount * (coupon.discount_value / 100))
          if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
            discountAmount = Math.floor(Number(coupon.max_discount_amount))
          }
        } else {
          discountAmount = Math.floor(Number(coupon.discount_value))
        }

        expectedAmount = Math.max(0, order.amount - discountAmount)
      }
    }

    if (parseInt(amount) !== expectedAmount) {
      console.error('금액 불일치:', { expected: expectedAmount, received: amount })
      return new Response(
        JSON.stringify({ success: false, error: '결제 금액이 일치하지 않습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // 2. 토스페이먼츠 결제 승인 API 호출
    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY')
    if (!tossSecretKey) {
      console.error('TOSS_SECRET_KEY 환경변수가 설정되지 않았습니다.')
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

    console.log('토스 결제 승인 성공:', { orderId, paymentKey, amount, method: confirmResult.method, status: confirmResult.status })

    // 가상계좌(무통장입금) 여부 판별
    const isVirtualAccount = confirmResult.method === '가상계좌'
    const isWaitingForDeposit = isVirtualAccount && confirmResult.status === 'WAITING_FOR_DEPOSIT'

    // 3. 강의 정보 조회 (교재 포함 여부)
    const { data: course } = await supabase
      .from('courses')
      .select('*, has_textbook')
      .eq('id', order.course_id)
      .single()

    // 4. orders 테이블 업데이트
    const updateData: Record<string, unknown> = {
      payment_key: paymentKey,
      updated_at: new Date().toISOString(),
      has_textbook: course?.has_textbook || false,
    }

    // 실제 결제(할인 적용 후) 금액 저장
    updateData.paid_amount = expectedAmount

    if (isWaitingForDeposit) {
      // 가상계좌: 입금 대기 상태로 설정 (DONE이 아님)
      updateData.status = 'WAITING_FOR_DEPOSIT'
      updateData.payment_method = '가상계좌'
      // 가상계좌 정보 저장
      if (confirmResult.virtualAccount) {
        updateData.virtual_account_info = JSON.stringify({
          accountNumber: confirmResult.virtualAccount.accountNumber,
          bank: confirmResult.virtualAccount.bankCode,
          bankName: confirmResult.virtualAccount.bank,
          customerName: confirmResult.virtualAccount.customerName,
          dueDate: confirmResult.virtualAccount.dueDate,
        })
      }
    } else {
      // 카드 등 즉시 결제: 기존대로 DONE 처리
      updateData.status = 'DONE'
      updateData.paid_at = new Date().toISOString()
    }

    if (!course?.has_textbook) {
      updateData.shipping_status = 'NO_SHIPPING'
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)

    if (updateError) {
      console.error('주문 상태 업데이트 실패:', updateError)
      return new Response(
        JSON.stringify({ success: false, error: '주문 상태 업데이트에 실패했습니다.' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      )
    }

    // 5. 쿠폰 사용 처리 (가상계좌도 계좌 발급 시점에 쿠폰 차감 - 미입금 취소 시 복원은 웹훅에서 처리)
    if (appliedCoupon) {
      const { data: couponUpdateResult, error: couponUseError } = await supabase
        .from('user_coupons')
        .update({
          is_used: true,
          used_at: new Date().toISOString(),
          order_id: orderId,
        })
        .eq('id', appliedCoupon.id)
        .eq('is_used', false)
        .select()

      if (couponUseError) {
        console.error('쿠폰 사용 처리 실패:', couponUseError)
      } else if (!couponUpdateResult || couponUpdateResult.length === 0) {
        console.error('쿠폰이 이미 사용되었습니다:', appliedCoupon.id)
      }
    }

    // 6. 가상계좌가 아닌 경우에만 즉시 purchases 생성 (가상계좌는 입금 확인 웹훅에서 생성)
    if (!isWaitingForDeposit) {
      const { error: purchaseError } = await supabase
        .from('purchases')
        .insert({
          user_id: user.id,
          course_id: order.course_id,
          order_id: orderId,
          payment_key: paymentKey,
          status: 'completed',
          payment_method: 'tosspayments',
          amount: parseInt(amount),
          purchased_at: new Date().toISOString(),
        })

      if (purchaseError && purchaseError.code !== '23505') {
        console.error('구매 기록 생성 실패:', purchaseError)
      }
    }

    // 7. 성공 응답
    const responseOrder = {
      ...order,
      status: isWaitingForDeposit ? 'WAITING_FOR_DEPOSIT' : 'DONE',
      payment_key: paymentKey,
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: responseOrder,
        course,
        isVirtualAccount,
        isWaitingForDeposit,
        virtualAccountInfo: isWaitingForDeposit && confirmResult.virtualAccount ? {
          accountNumber: confirmResult.virtualAccount.accountNumber,
          bank: confirmResult.virtualAccount.bankCode,
          bankName: confirmResult.virtualAccount.bank,
          customerName: confirmResult.virtualAccount.customerName,
          dueDate: confirmResult.virtualAccount.dueDate,
        } : null,
        appliedCoupon: appliedCoupon ? {
          id: appliedCoupon.id,
          name: appliedCoupon.coupons.name,
          discountAmount: order.amount - expectedAmount,
        } : null,
        finalAmount: expectedAmount,
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
