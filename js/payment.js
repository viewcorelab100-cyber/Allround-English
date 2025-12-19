// 토스페이먼츠 결제 관련 함수들 (v2 SDK - 결제창 방식)

// 토스페이먼츠 클라이언트 키 (테스트용 - API 개별 연동 키)
const TOSS_CLIENT_KEY = 'test_ck_GePWvyJnrKJ5kWnko4KbVgLzN97E';

// 전역 변수
let tossPayment = null;
let currentOrder = null;
let currentCourse = null;
let selectedPaymentMethod = 'CARD'; // 기본값: 카드/간편결제
let appliedCouponData = null; // 적용된 쿠폰 정보

// 결제 수단 선택
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.getElementById('selected-payment-method').value = method;
    
    // UI 업데이트
    const cardBtn = document.getElementById('method-card');
    const virtualBtn = document.getElementById('method-virtual');
    
    if (method === 'CARD') {
        cardBtn.classList.remove('bg-opacity-5', 'border-transparent');
        cardBtn.classList.add('bg-opacity-10', 'border-white');
        virtualBtn.classList.remove('bg-opacity-10', 'border-white');
        virtualBtn.classList.add('bg-opacity-5', 'border-transparent');
    } else {
        virtualBtn.classList.remove('bg-opacity-5', 'border-transparent');
        virtualBtn.classList.add('bg-opacity-10', 'border-white');
        cardBtn.classList.remove('bg-opacity-10', 'border-white');
        cardBtn.classList.add('bg-opacity-5', 'border-transparent');
    }
}

// 주문 ID 생성 (고유한 ID)
// 토스페이먼츠 orderId 규칙: 6자 이상 64자 이하, 영문 대소문자, 숫자, -, _ 만 허용
function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 11);
    return `order-${timestamp}-${random}`;
}

// URL에서 파라미터 가져오기
function getPaymentParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        courseId: params.get('courseId'),
        orderId: params.get('orderId')
    };
}

// 주문 생성 (Supabase orders 테이블에 저장)
async function createOrder(userId, courseId, amount, orderName, customerInfo) {
    try {
        const orderId = generateOrderId();
        
        const { data, error } = await window.supabase
            .from('orders')
            .insert({
                id: orderId,
                user_id: userId,
                course_id: courseId,
                amount: amount,
                order_name: orderName,
                customer_name: customerInfo.name,
                customer_email: customerInfo.email,
                customer_phone: customerInfo.phone,
                status: 'PENDING'
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Create order error:', error);
        return { success: false, error: error.message };
    }
}

// 주문 상태 업데이트
async function updateOrderStatus(orderId, status, paymentKey = null) {
    try {
        const updateData = {
            status: status,
            updated_at: new Date().toISOString()
        };
        
        if (paymentKey) {
            updateData.payment_key = paymentKey;
        }
        
        const { data, error } = await window.supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId)
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Update order status error:', error);
        return { success: false, error: error.message };
    }
}

// 주문 정보 가져오기
async function getOrderById(orderId) {
    try {
        const { data, error } = await window.supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Get order error:', error);
        return { success: false, error: error.message };
    }
}

// 구매 완료 처리 (purchases 테이블에 저장)
async function completePurchase(userId, courseId, orderId, paymentKey, amount) {
    try {
        const { data, error } = await window.supabase
            .from('purchases')
            .insert({
                user_id: userId,
                course_id: courseId,
                order_id: orderId,
                payment_key: paymentKey,
                status: 'completed',
                payment_method: 'tosspayments',
                amount: amount,
                purchased_at: new Date().toISOString()
            })
            .select()
            .single();
        
        if (error) throw error;
        
        return { success: true, data };
    } catch (error) {
        console.error('Complete purchase error:', error);
        return { success: false, error: error.message };
    }
}

// 결제창 초기화 (v2 SDK - 결제창 방식)
async function initPayment() {
    try {
        // 토스페이먼츠 초기화
        const tossPayments = TossPayments(TOSS_CLIENT_KEY);
        
        // 결제창 인스턴스 생성 (비회원 결제)
        tossPayment = tossPayments.payment({
            customerKey: TossPayments.ANONYMOUS
        });
        
        return true;
    } catch (error) {
        console.error('Payment init error:', error);
        return false;
    }
}

// 결제 요청
async function requestPayment() {
    if (!tossPayment || !currentOrder) {
        alert('결제 정보가 올바르지 않습니다. 다시 시도해주세요.');
        return;
    }
    
    // 구매자 정보 가져오기
    const customerName = document.getElementById('customer-name').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();
    
    if (!customerName) {
        alert('이름을 입력해주세요.');
        return;
    }
    
    if (!customerEmail) {
        alert('이메일을 입력해주세요.');
        return;
    }
    
    try {
        // 결제 버튼 비활성화
        const paymentButton = document.getElementById('payment-button');
        paymentButton.disabled = true;
        paymentButton.textContent = '결제 진행 중...';
        paymentButton.classList.add('opacity-50');
        
        // 전화번호에서 숫자만 추출 (모든 특수문자 제거)
        const phoneNumberOnly = customerPhone.replace(/[^0-9]/g, '');
        
        // 선택된 결제 수단 확인
        const method = selectedPaymentMethod || 'CARD';
        
        // 최종 결제 금액 (쿠폰 적용된 금액)
        const finalAmount = currentOrder.finalAmount || currentOrder.amount;
        
        // 쿠폰 정보를 URL 파라미터로 전달 (캐시 무효화 포함)
        let successUrl = `${window.location.origin}/payment-success.html?_t=${Date.now()}`;
        if (appliedCouponData) {
            successUrl += `&couponId=${appliedCouponData.id}`;
            console.log('💳 [결제 요청] 쿠폰 적용:', {
                couponId: appliedCouponData.id,
                code: appliedCouponData.custom_code || appliedCouponData.coupons?.code,
                originalAmount: currentOrder.amount,
                discountAmount: currentOrder.discountAmount,
                finalAmount: finalAmount
            });
        }
        
        // 기본 결제 요청 파라미터
        const paymentParams = {
            method: method,
            amount: {
                currency: 'KRW',
                value: finalAmount
            },
            orderId: currentOrder.id,
            orderName: currentOrder.order_name,
            customerName: customerName,
            customerEmail: customerEmail,
            successUrl: successUrl,
            failUrl: `${window.location.origin}/payment-fail.html`
        };
        
        // 전화번호가 있을 경우에만 추가
        if (phoneNumberOnly && phoneNumberOnly.length >= 10) {
            paymentParams.customerMobilePhone = phoneNumberOnly;
        }
        
        // 결제 수단별 추가 파라미터
        if (method === 'CARD') {
            // 카드/간편결제
            paymentParams.card = {
                useEscrow: false,
                flowMode: 'DEFAULT', // 통합결제창
                useCardPoint: false,
                useAppCardOnly: false
            };
        } else if (method === 'VIRTUAL_ACCOUNT') {
            // 가상계좌 (무통장입금)
            paymentParams.virtualAccount = {
                cashReceipt: {
                    type: '소득공제'
                },
                useEscrow: false,
                validHours: 24 // 24시간 내 입금
            };
        }
        
        // 결제 요청 (v2 SDK - Redirect 방식)
        await tossPayment.requestPayment(paymentParams);
        
    } catch (error) {
        console.error('Payment request error:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        // 결제 버튼 복원
        const paymentButton = document.getElementById('payment-button');
        paymentButton.disabled = false;
        paymentButton.textContent = '결제하기';
        paymentButton.classList.remove('opacity-50');
        
        if (error.code === 'USER_CANCEL') {
            // 사용자가 결제를 취소한 경우
            console.log('사용자가 결제를 취소했습니다.');
        } else {
            // 자세한 오류 메시지 표시
            const errorMsg = error.message || '알 수 없는 오류';
            alert(`결제 요청 중 오류가 발생했습니다.\n오류: ${errorMsg}`);
        }
    }
}

// 결제 페이지 초기화
async function initPaymentPage() {
    const { courseId, orderId } = getPaymentParams();
    
    // 로그인 확인
    const user = await getCurrentUser();
    if (!user) {
        alert('로그인이 필요합니다.');
        window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
        return;
    }
    
    // courseId로 새 주문 생성 또는 orderId로 기존 주문 조회
    if (courseId) {
        // 강의 정보 가져오기
        const courseResult = await getCourseById(courseId);
        if (!courseResult.success) {
            showErrorState();
            return;
        }
        
        currentCourse = courseResult.data;
        
        // 프로필 정보 가져오기 (구매자 정보 기본값)
        const { data: profile } = await window.supabase
            .from('profiles')
            .select('name, email, phone, guardian_phone')
            .eq('id', user.id)
            .single();
        
        // 주문 생성 (전화번호는 phone 우선, 없으면 guardian_phone 사용)
        const customerPhone = profile?.phone || profile?.guardian_phone || '';
        const orderResult = await createOrder(
            user.id,
            courseId,
            currentCourse.price,
            currentCourse.title,
            {
                name: profile?.name || user.email?.split('@')[0] || '',
                email: user.email || '',
                phone: customerPhone
            }
        );
        
        if (!orderResult.success) {
            showErrorState();
            return;
        }
        
        currentOrder = orderResult.data;
        
    } else if (orderId) {
        // 기존 주문 조회
        const orderResult = await getOrderById(orderId);
        if (!orderResult.success || !orderResult.data) {
            showErrorState();
            return;
        }
        
        currentOrder = orderResult.data;
        
        // 강의 정보 가져오기
        const courseResult = await getCourseById(currentOrder.course_id);
        if (!courseResult.success) {
            showErrorState();
            return;
        }
        
        currentCourse = courseResult.data;
        
    } else {
        showErrorState();
        return;
    }
    
    // UI 업데이트
    renderPaymentInfo();
    
    // 결제창 초기화 (v2)
    const paymentInitialized = await initPayment();
    
    if (!paymentInitialized) {
        showErrorState();
        return;
    }
    
    // 결제 화면 표시
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('payment-content').classList.remove('hidden');
}

// 결제 정보 렌더링
function renderPaymentInfo() {
    // 강의 정보
    document.getElementById('course-thumbnail').style.backgroundImage = 
        `url('${currentCourse.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80'}')`;
    document.getElementById('course-title').textContent = currentCourse.title;
    document.getElementById('course-lessons').textContent = `${currentCourse.lessons?.length || 0}개 레슨`;
    document.getElementById('course-price').textContent = `₩${currentOrder.amount.toLocaleString()}`;
    
    // 구매자 정보
    document.getElementById('customer-name').value = currentOrder.customer_name || '';
    document.getElementById('customer-email').value = currentOrder.customer_email || '';
    document.getElementById('customer-phone').value = currentOrder.customer_phone || '';
    
    // 결제 금액
    document.getElementById('product-price').textContent = `₩${currentOrder.amount.toLocaleString()}`;
    document.getElementById('total-price').textContent = `₩${currentOrder.amount.toLocaleString()}`;
}

// 오류 상태 표시
function showErrorState() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('payment-content').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
}

// ========== 쿠폰 관리 ==========

// 쿠폰 적용
async function applyCoupon() {
    const couponCode = document.getElementById('coupon-code').value.trim().toUpperCase();
    
    console.log('🎟️ [쿠폰 적용 시작] 입력 코드:', couponCode);
    
    if (!couponCode) {
        showCouponMessage('쿠폰 코드를 입력해주세요.', false);
        return;
    }
    
    try {
        const user = await getCurrentUser();
        console.log('🎟️ [사용자 확인]', { userId: user?.id, email: user?.email });
        
        if (!user) {
            showCouponMessage('로그인이 필요합니다.', false);
            return;
        }
        
        // 쿠폰 코드로 사용 가능한 쿠폰 찾기 (custom_code 포함)
        const nowISO = new Date().toISOString();
        
        const { data: userCoupons, error } = await window.supabase
            .from('user_coupons')
            .select(`
                *,
                coupons (
                    code,
                    name,
                    discount_type,
                    discount_value,
                    min_purchase_amount,
                    max_discount_amount
                )
            `)
            .eq('user_id', user.id)
            .eq('is_used', false)
            .gt('expires_at', nowISO);
        
        if (error) throw error;
        
        console.log('🎟️ [쿠폰 조회 완료]', {
            조회개수: userCoupons?.length,
            쿠폰목록: userCoupons?.map(uc => ({
                id: uc.id,
                custom_code: uc.custom_code,
                db_code: uc.coupons?.code,
                is_used: uc.is_used,
                expires_at: uc.expires_at
            }))
        });
        
        
        // 입력한 코드와 일치하는 쿠폰 찾기 (custom_code 우선, coupons.code 대체)
        const matchedCoupon = userCoupons?.find(uc => {
            // custom_code가 있으면 우선 사용, 없으면 coupons.code 사용
            const effectiveCode = uc.custom_code || uc.coupons?.code;
            
            console.log('🔍 [매칭 시도]', {
                ucId: uc.id,
                custom_code: uc.custom_code,
                db_code: uc.coupons?.code,
                effective_code: effectiveCode,
                입력코드: couponCode,
                매칭여부: effectiveCode?.toUpperCase() === couponCode
            });
            
            if (!effectiveCode) {
                console.warn('⚠️ 쿠폰 코드가 없습니다:', uc);
                return false;
            }
            return effectiveCode.toUpperCase() === couponCode;
        });
        
        console.log('✅ [최종 매칭 결과]', {
            성공: !!matchedCoupon,
            쿠폰ID: matchedCoupon?.id,
            쿠폰코드: matchedCoupon?.custom_code || matchedCoupon?.coupons?.code,
            쿠폰명: matchedCoupon?.coupons?.name
        });
        
        if (!matchedCoupon) {
            showCouponMessage('유효하지 않거나 사용할 수 없는 쿠폰입니다.', false);
            return;
        }
        
        // 최소 구매 금액 확인
        if (matchedCoupon.coupons.min_purchase_amount > currentOrder.amount) {
            showCouponMessage(
                `이 쿠폰은 ₩${matchedCoupon.coupons.min_purchase_amount.toLocaleString()} 이상 구매 시 사용 가능합니다.`,
                false
            );
            return;
        }
        
        // 쿠폰 적용
        appliedCouponData = matchedCoupon;
        updatePaymentAmount();
        
        // UI 업데이트
        document.getElementById('applied-coupon-name').textContent = matchedCoupon.coupons.name;
        document.getElementById('applied-coupon').classList.remove('hidden');
        document.getElementById('coupon-code').value = '';
        showCouponMessage('쿠폰이 적용되었습니다!', true);
        
    } catch (error) {
        console.error('Apply coupon error:', error);
        showCouponMessage('쿠폰 적용 중 오류가 발생했습니다.', false);
    }
}

// 쿠폰 제거
function removeCoupon() {
    appliedCouponData = null;
    updatePaymentAmount();
    
    // UI 업데이트
    document.getElementById('applied-coupon').classList.add('hidden');
    document.getElementById('coupon-message').classList.add('hidden');
}

// 결제 금액 업데이트 (쿠폰 적용 반영)
function updatePaymentAmount() {
    let finalAmount = currentOrder.amount;
    let discountAmount = 0;
    
    if (appliedCouponData) {
        const coupon = appliedCouponData.coupons;
        
        if (coupon.discount_type === 'percentage') {
            // 퍼센트 할인
            discountAmount = Math.floor(currentOrder.amount * (coupon.discount_value / 100));
            
            // 최대 할인 금액 적용
            if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                discountAmount = coupon.max_discount_amount;
            }
        } else {
            // 고정 금액 할인
            discountAmount = coupon.discount_value;
        }
        
        finalAmount = currentOrder.amount - discountAmount;
        
        // 음수 방지
        if (finalAmount < 0) finalAmount = 0;
    }
    
    // UI 업데이트
    document.getElementById('discount-amount').textContent = 
        discountAmount > 0 ? `-₩${discountAmount.toLocaleString()}` : '₩0';
    document.getElementById('total-price').textContent = `₩${finalAmount.toLocaleString()}`;
    
    // currentOrder 금액도 업데이트 (결제 시 사용)
    currentOrder.finalAmount = finalAmount;
    currentOrder.discountAmount = discountAmount;
}

// 쿠폰 메시지 표시
function showCouponMessage(message, isSuccess) {
    const messageEl = document.getElementById('coupon-message');
    messageEl.textContent = message;
    messageEl.classList.remove('hidden', 'text-red-400', 'text-green-400');
    messageEl.classList.add(isSuccess ? 'text-green-400' : 'text-red-400');
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 3000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPaymentPage);
