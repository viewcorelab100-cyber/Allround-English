// 토스페이먼츠 결제 관련 함수들 (v2 SDK - 결제창 방식)

// 토스페이먼츠 클라이언트 키 (테스트용 - API 개별 연동 키)
const TOSS_CLIENT_KEY = 'test_ck_GePWvyJnrKJ5kWnko4KbVgLzN97E';

// 전역 변수
let tossPayment = null;
let currentOrder = null;
let currentCourse = null;
let selectedPaymentMethod = 'CARD'; // 기본값: 카드/간편결제

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
        
        // 기본 결제 요청 파라미터
        const paymentParams = {
            method: method,
            amount: {
                currency: 'KRW',
                value: currentOrder.amount
            },
            orderId: currentOrder.id,
            orderName: currentOrder.order_name,
            customerName: customerName,
            customerEmail: customerEmail,
            successUrl: `${window.location.origin}/payment-success.html`,
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

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPaymentPage);
