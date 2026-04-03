// Supabase Edge Function: 토스페이먼츠 웹훅 수신
// 가상계좌 입금 확인, 결제 취소 등의 이벤트 처리
// Deno runtime

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { status: 200 })
  }

  try {
    const body = await req.json()
    console.log('[WEBHOOK] 수신:', JSON.stringify(body))

    // Supabase 서비스 역할 클라이언트
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 토스페이먼츠 웹훅 형식 판별:
    // - DEPOSIT_CALLBACK: 플랫 구조 {orderId, status, secret, transactionKey, createdAt}
    // - PAYMENT_STATUS_CHANGED: 래핑 구조 {eventType, data: {...}}
    const eventType = body.eventType
    const isDepositCallback = !eventType && body.orderId && body.secret
    const isPaymentStatusChanged = eventType === 'PAYMENT_STATUS_CHANGED'

    console.log('[WEBHOOK] 형식 판별:', { eventType, isDepositCallback, isPaymentStatusChanged })

    if (isDepositCallback) {
      // ===== 가상계좌 입금 콜백 (플랫 구조) =====
      const { orderId, status, transactionKey, secret } = body
      console.log('[DEPOSIT_CALLBACK] 처리 시작:', { orderId, status, transactionKey })

      // 주문 조회
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error('[DEPOSIT_CALLBACK] 주문 조회 실패:', orderError)
        return new Response(
          JSON.stringify({ success: false, error: '주문을 찾을 수 없습니다.' }),
          { headers: { 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      console.log('[DEPOSIT_CALLBACK] 주문 조회 성공:', { orderId, orderStatus: order.status, userId: order.user_id })

      if (status === 'DONE') {
        // 이미 완료된 주문
        if (order.status === 'DONE') {
          console.log('[DEPOSIT_CALLBACK] 이미 완료된 주문:', orderId)
          return new Response(JSON.stringify({ success: true, message: '이미 처리됨' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        // 입금 대기 상태가 아닌 주문은 무시
        if (order.status !== 'WAITING_FOR_DEPOSIT') {
          console.error('[DEPOSIT_CALLBACK] 잘못된 상태:', { orderId, currentStatus: order.status })
          return new Response(JSON.stringify({ success: true, message: '상태 불일치 - 무시' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // 1. orders → DONE
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'DONE',
            updated_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'WAITING_FOR_DEPOSIT')

        if (updateError) {
          console.error('[DEPOSIT_CALLBACK] 주문 업데이트 실패:', updateError)
          return new Response(JSON.stringify({ success: false, error: '주문 업데이트 실패' }), {
            headers: { 'Content-Type': 'application/json' }, status: 500,
          })
        }

        // 2. purchases 생성 (강의 접근 권한 부여)
        const purchaseAmount = order.paid_amount || order.amount
        const paymentKey = order.payment_key || transactionKey
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: order.user_id,
            course_id: order.course_id,
            order_id: orderId,
            payment_key: paymentKey,
            status: 'completed',
            payment_method: 'tosspayments',
            amount: purchaseAmount,
            purchased_at: new Date().toISOString(),
          })

        if (purchaseError && purchaseError.code !== '23505') {
          console.error('[DEPOSIT_CALLBACK] 구매 기록 생성 실패:', purchaseError)
        }

        console.log('[DEPOSIT_CALLBACK] 입금 완료 처리 성공:', { orderId, amount: purchaseAmount })

      } else if (status === 'CANCELED' || status === 'EXPIRED') {
        if (order.status !== 'WAITING_FOR_DEPOSIT') {
          console.log('[DEPOSIT_CALLBACK] 이미 처리된 주문 취소/만료 무시:', orderId)
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        await supabase
          .from('orders')
          .update({
            status: status === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'WAITING_FOR_DEPOSIT')

        // 쿠폰 복원
        await supabase
          .from('user_coupons')
          .update({ is_used: false, used_at: null, order_id: null })
          .eq('order_id', orderId)
          .eq('is_used', true)

        console.log(`[DEPOSIT_CALLBACK] ${status} 처리 완료:`, orderId)
      }

    } else if (isPaymentStatusChanged) {
      // ===== 결제 상태 변경 (래핑 구조) =====
      const data = body.data
      const { orderId, paymentKey, status } = data
      console.log('[PAYMENT_STATUS_CHANGED]:', { orderId, paymentKey, status })

      if (status === 'CANCELED') {
        await supabase
          .from('orders')
          .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
          .eq('id', orderId)

        await supabase
          .from('purchases')
          .update({ status: 'refunded' })
          .eq('order_id', orderId)
      }
    } else {
      console.log('[WEBHOOK] 알 수 없는 형식, 무시:', { eventType, keys: Object.keys(body) })
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('[WEBHOOK] 오류:', error)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
