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
    console.log('토스 웹훅 수신:', JSON.stringify(body))

    const { eventType, data } = body

    // 토스페이먼츠 secret 필드로 검증 (각 결제 건에 포함된 시크릿)
    const tossSecretKey = Deno.env.get('TOSS_SECRET_KEY')
    if (data?.secret && tossSecretKey) {
      if (data.secret !== tossSecretKey) {
        console.error('웹훅 secret 검증 실패')
        return new Response('Invalid secret', { status: 401 })
      }
    }

    // Supabase 서비스 역할 클라이언트
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 수신 데이터 상세 로깅
    console.log('[WEBHOOK] eventType:', eventType)
    console.log('[WEBHOOK] data keys:', Object.keys(data || {}))
    console.log('[WEBHOOK] data.orderId:', data?.orderId)
    console.log('[WEBHOOK] data.paymentKey:', data?.paymentKey)
    console.log('[WEBHOOK] data.status:', data?.status)

    // 이벤트 타입별 처리
    if (eventType === 'DEPOSIT_CALLBACK') {
      // 가상계좌 입금 완료
      const { orderId, paymentKey, status } = data
      console.log('[DEPOSIT_CALLBACK] 처리 시작:', { orderId, paymentKey, status })

      if (!orderId || !paymentKey) {
        console.error('웹훅 필수 파라미터 누락:', { orderId, paymentKey })
        return new Response(
          JSON.stringify({ success: false, error: '필수 파라미터 누락' }),
          { headers: { 'Content-Type': 'application/json' }, status: 400 }
        )
      }

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
        // 실제 입금 완료 → 주문 완료 처리

        // 이미 완료됐거나, 입금 대기 상태가 아닌 주문은 무시
        if (order.status === 'DONE') {
          console.log('이미 완료된 주문:', orderId)
          return new Response(JSON.stringify({ success: true, message: '이미 처리됨' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }
        if (order.status !== 'WAITING_FOR_DEPOSIT') {
          console.error('입금 대기 상태가 아닌 주문에 DONE 웹훅 수신:', { orderId, currentStatus: order.status })
          return new Response(JSON.stringify({ success: false, error: '잘못된 주문 상태' }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // 1. orders 상태를 DONE으로 업데이트 (WAITING_FOR_DEPOSIT인 경우만)
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
          console.error('웹훅 주문 업데이트 실패:', updateError)
          return new Response(JSON.stringify({ success: false, error: '주문 상태 업데이트 실패' }), {
            headers: { 'Content-Type': 'application/json' }, status: 500,
          })
        }

        // 2. purchases 레코드 생성 (paid_amount가 있으면 사용, 없으면 원래 amount)
        const purchaseAmount = order.paid_amount || order.amount
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
          console.error('웹훅 구매 기록 생성 실패:', purchaseError)
        }

        console.log('가상계좌 입금 완료 처리 성공:', { orderId, paymentKey, amount: purchaseAmount })

      } else if (status === 'CANCELED' || status === 'EXPIRED') {
        // 입금 대기 상태가 아니면 무시
        if (order.status !== 'WAITING_FOR_DEPOSIT') {
          console.log('이미 처리된 주문의 취소/만료 웹훅 무시:', { orderId, currentStatus: order.status })
          return new Response(JSON.stringify({ success: true }), {
            headers: { 'Content-Type': 'application/json' },
          })
        }

        // 입금 기한 만료 또는 취소
        const { error: cancelError } = await supabase
          .from('orders')
          .update({
            status: status === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)
          .eq('status', 'WAITING_FOR_DEPOSIT')

        if (cancelError) {
          console.error('웹훅 주문 취소 업데이트 실패:', cancelError)
        }

        // 쿠폰 복원 (가상계좌 발급 시 사용 처리했던 쿠폰)
        const { error: couponRestoreError } = await supabase
          .from('user_coupons')
          .update({
            is_used: false,
            used_at: null,
            order_id: null,
          })
          .eq('order_id', orderId)
          .eq('is_used', true)

        if (couponRestoreError) {
          console.error('쿠폰 복원 실패:', couponRestoreError)
        } else {
          console.log('미입금 취소/만료 - 쿠폰 복원 완료:', orderId)
        }

        console.log(`가상계좌 ${status} 처리 완료:`, orderId)
      }
    } else if (eventType === 'PAYMENT_STATUS_CHANGED') {
      // 일반 결제 상태 변경 (환불 등)
      const { orderId, paymentKey, status } = data
      console.log('결제 상태 변경:', { orderId, paymentKey, status })

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
    }

    // 토스페이먼츠는 200 응답을 기대
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('웹훅 처리 오류:', error)
    // DB 오류 등 일시적 오류는 500 반환 → 토스가 재시도
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
