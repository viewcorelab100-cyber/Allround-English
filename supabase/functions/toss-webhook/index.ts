// Supabase Edge Function: 토스페이먼츠 웹훅 수신
// 가상계좌 입금 확인, 결제 취소 등의 이벤트 처리
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
    const body = await req.json()
    console.log('토스 웹훅 수신:', JSON.stringify(body))

    const { eventType, data } = body

    // Supabase 서비스 역할 클라이언트
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 이벤트 타입별 처리
    if (eventType === 'DEPOSIT_CALLBACK') {
      // 가상계좌 입금 완료
      const { orderId, paymentKey, status } = data

      if (!orderId || !paymentKey) {
        console.error('웹훅 필수 파라미터 누락:', { orderId, paymentKey })
        return new Response(
          JSON.stringify({ success: false, error: '필수 파라미터 누락' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
      }

      // 주문 조회
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single()

      if (orderError || !order) {
        console.error('웹훅 주문 조회 실패:', orderError)
        return new Response(
          JSON.stringify({ success: false, error: '주문을 찾을 수 없습니다.' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
      }

      if (status === 'DONE') {
        // 실제 입금 완료 → 주문 완료 처리
        if (order.status === 'DONE') {
          console.log('이미 완료된 주문:', orderId)
          return new Response(
            JSON.stringify({ success: true, message: '이미 처리된 주문입니다.' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }

        // 1. orders 상태를 DONE으로 업데이트
        const { error: updateError } = await supabase
          .from('orders')
          .update({
            status: 'DONE',
            updated_at: new Date().toISOString(),
            paid_at: new Date().toISOString(),
          })
          .eq('id', orderId)

        if (updateError) {
          console.error('웹훅 주문 업데이트 실패:', updateError)
          return new Response(
            JSON.stringify({ success: false, error: '주문 상태 업데이트 실패' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          )
        }

        // 2. purchases 레코드 생성 (이 시점에서 강의 접근 권한 부여)
        const { error: purchaseError } = await supabase
          .from('purchases')
          .insert({
            user_id: order.user_id,
            course_id: order.course_id,
            order_id: orderId,
            payment_key: paymentKey,
            status: 'completed',
            payment_method: 'tosspayments',
            amount: order.amount,
            purchased_at: new Date().toISOString(),
          })

        if (purchaseError && purchaseError.code !== '23505') {
          console.error('웹훅 구매 기록 생성 실패:', purchaseError)
        }

        console.log('가상계좌 입금 완료 처리 성공:', { orderId, paymentKey })

      } else if (status === 'CANCELED' || status === 'EXPIRED') {
        // 입금 기한 만료 또는 취소
        const { error: cancelError } = await supabase
          .from('orders')
          .update({
            status: status === 'EXPIRED' ? 'EXPIRED' : 'CANCELLED',
            updated_at: new Date().toISOString(),
          })
          .eq('id', orderId)

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
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('웹훅 처리 오류:', error)
    // 웹훅은 실패해도 200 반환 (재시도 방지)
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
