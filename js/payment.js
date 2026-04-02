// 토스페이먼츠 결제 관련 함수들 (v2 SDK - 결제창 방식)

// 토스페이먼츠 클라이언트 키 (라이브 - API 개별 연동 키)
const TOSS_CLIENT_KEY = 'live_ck_26DlbXAaV0LZO9Yb0YQxVqY50Q9R';

// 전역 변수
let tossPayment = null;
let currentOrder = null;
let currentCourse = null;
let selectedPaymentMethod = 'CARD'; // 기본값: 카드/간편결제
let appliedCouponData = null; // 적용된 쿠폰 정보
let currentPaymentType = null; // 현재 결제 중인 유형 (course/textbook)
let _paymentInFlight = false; // 결제 중복 요청 방지 플래그

// 결제 수단 선택
function selectPaymentMethod(method) {
    selectedPaymentMethod = method;
    document.getElementById('selected-payment-method').value = method;
    
    // UI 업데이트
    const cardBtn = document.getElementById('method-card');
    const virtualBtn = document.getElementById('method-virtual');
    
    if (method === 'CARD') {
        cardBtn.classList.remove('border-transparent', 'bg-gray-50');
        cardBtn.classList.add('border-[#2F2725]', 'bg-white');
        virtualBtn.classList.remove('border-[#2F2725]', 'bg-white');
        virtualBtn.classList.add('border-transparent', 'bg-gray-50');
    } else {
        virtualBtn.classList.remove('border-transparent', 'bg-gray-50');
        virtualBtn.classList.add('border-[#2F2725]', 'bg-white');
        cardBtn.classList.remove('border-[#2F2725]', 'bg-white');
        cardBtn.classList.add('border-transparent', 'bg-gray-50');
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
async function createOrder(userId, courseId, amount, orderName, customerInfo, paymentType = 'course') {
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
                payment_type: paymentType,
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

// 구매 완료 처리 - 보안: 클라이언트 직접 INSERT 차단
// purchases INSERT는 confirm-payment Edge Function에서만 수행됩니다.
// completePurchase() 함수는 보안상 제거되었습니다.

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
    if (_paymentInFlight) return;
    _paymentInFlight = true;

    if (!tossPayment || !currentCourse) {
        alert('결제 정보가 올바르지 않습니다. 다시 시도해주세요.');
        _paymentInFlight = false;
        return;
    }

    // 구매자 정보 가져오기
    const customerName = document.getElementById('customer-name').value.trim();
    const customerEmail = document.getElementById('customer-email').value.trim();
    const customerPhone = document.getElementById('customer-phone').value.trim();

    if (!customerName) {
        alert('이름을 입력해주세요.');
        _paymentInFlight = false;
        return;
    }

    if (!customerEmail) {
        alert('이메일을 입력해주세요.');
        _paymentInFlight = false;
        return;
    }

    // 선택된 결제 항목 확인
    const payCourse = document.getElementById('pay-course')?.checked || false;
    const payTextbook = document.getElementById('pay-textbook')?.checked || false;

    if (!payCourse && !payTextbook) {
        alert('결제할 항목을 선택해주세요.');
        _paymentInFlight = false;
        return;
    }

    // 결제 항목 순서 결정: 강의비 먼저, 교재비 나중에
    const paymentQueue = [];
    if (payCourse && currentCourse.price > 0) {
        paymentQueue.push({ type: 'course', amount: currentCourse.price, name: `${currentCourse.title} (강의비)` });
    }
    if (payTextbook && currentCourse.textbook_price > 0) {
        paymentQueue.push({ type: 'textbook', amount: currentCourse.textbook_price, name: `${currentCourse.title} (교재비)` });
    }

    if (paymentQueue.length === 0) {
        alert('결제할 금액이 없습니다.');
        _paymentInFlight = false;
        return;
    }

    // 첫 번째 결제 항목 처리
    const firstPayment = paymentQueue[0];
    currentPaymentType = firstPayment.type;

    // 남은 결제 항목이 있으면 sessionStorage에 저장
    if (paymentQueue.length > 1) {
        const pendingPayments = paymentQueue.slice(1);
        sessionStorage.setItem('pendingPayments', JSON.stringify({
            courseId: currentCourse.id,
            payments: pendingPayments,
            customerInfo: { name: customerName, email: customerEmail, phone: customerPhone }
        }));
    } else {
        sessionStorage.removeItem('pendingPayments');
    }

    // 새 주문 생성
    const user = await getCurrentUser();
    const orderResult = await createOrder(
        user.id,
        currentCourse.id,
        firstPayment.amount,
        firstPayment.name,
        { name: customerName, email: customerEmail, phone: customerPhone },
        firstPayment.type
    );

    if (!orderResult.success) {
        alert('주문 생성에 실패했습니다.');
        _paymentInFlight = false;
        return;
    }

    currentOrder = orderResult.data;

    // 결제 진행
    await processPayment(firstPayment.amount, firstPayment.name, customerName, customerEmail, customerPhone);
}

// 실제 결제 처리 함수
async function processPayment(amount, orderName, customerName, customerEmail, customerPhone) {
    try {
        // 결제 버튼 비활성화
        const paymentButton = document.getElementById('payment-button');
        paymentButton.disabled = true;
        paymentButton.textContent = '결제 진행 중...';
        paymentButton.classList.add('opacity-50');

        // 전화번호에서 숫자만 추출
        const phoneNumberOnly = customerPhone.replace(/[^0-9]/g, '');

        // 선택된 결제 수단 확인
        const method = selectedPaymentMethod || 'CARD';

        // 최종 결제 금액 (쿠폰 적용된 금액 - 강의비에만 적용)
        let finalAmount = amount;
        if (currentPaymentType === 'course' && appliedCouponData) {
            const coupon = appliedCouponData.coupons;
            let discountAmount = 0;

            if (coupon.discount_type === 'percentage') {
                discountAmount = Math.floor(amount * (coupon.discount_value / 100));
                if (coupon.max_discount_amount && discountAmount > coupon.max_discount_amount) {
                    discountAmount = coupon.max_discount_amount;
                }
            } else {
                discountAmount = coupon.discount_value;
            }

            finalAmount = amount - discountAmount;
            if (finalAmount < 0) finalAmount = 0;
        }

        // 성공 URL 설정
        let successUrl = `${window.location.origin}/payment-success.html?_t=${Date.now()}`;

        // 쿠폰 ID는 URL 대신 sessionStorage에 저장 (보안)
        if (currentPaymentType === 'course' && appliedCouponData) {
            sessionStorage.setItem('appliedCouponId', appliedCouponData.id);
        } else {
            sessionStorage.removeItem('appliedCouponId');
        }

        // 기본 결제 요청 파라미터
        const paymentParams = {
            method: method,
            amount: {
                currency: 'KRW',
                value: finalAmount
            },
            orderId: currentOrder.id,
            orderName: orderName,
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
            paymentParams.card = {
                useEscrow: false,
                flowMode: 'DEFAULT',
                useCardPoint: false,
                useAppCardOnly: false
            };
        } else if (method === 'VIRTUAL_ACCOUNT') {
            paymentParams.virtualAccount = {
                cashReceipt: { type: '소득공제' },
                useEscrow: false,
                validHours: 24
            };
        }

        // 결제 요청
        await tossPayment.requestPayment(paymentParams);

    } catch (error) {
        console.error('Payment request error:', error);
        _paymentInFlight = false;

        // 결제 버튼 복원
        const paymentButton = document.getElementById('payment-button');
        paymentButton.disabled = false;
        paymentButton.textContent = '결제하기';
        paymentButton.classList.remove('opacity-50');

        if (error.code === 'USER_CANCEL') {
            console.log('사용자가 결제를 취소했습니다.');
            // 취소 시 대기 중인 결제도 삭제
            sessionStorage.removeItem('pendingPayments');
        } else {
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

    // 대기 중인 결제가 있는지 확인 (이전 결제 후 리다이렉트된 경우)
    const pendingPaymentsStr = sessionStorage.getItem('pendingPayments');
    if (pendingPaymentsStr && !courseId && !orderId) {
        const pendingData = JSON.parse(pendingPaymentsStr);

        // 강의 정보 가져오기
        const courseResult = await getCourseById(pendingData.courseId);
        if (!courseResult.success) {
            sessionStorage.removeItem('pendingPayments');
            showErrorState();
            return;
        }

        currentCourse = courseResult.data;

        // 대기 중인 결제 항목으로 UI 설정
        setupPendingPayment(pendingData);

        // 결제창 초기화
        const paymentInitialized = await initPayment();
        if (!paymentInitialized) {
            showErrorState();
            return;
        }

        document.getElementById('loading-state').classList.add('hidden');
        document.getElementById('payment-content').classList.remove('hidden');
        loadMyCoupons();
        return;
    }

    // courseId로 새 결제 또는 orderId로 기존 주문 조회
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

        // 구매자 정보 저장 (주문은 결제 시 생성)
        const customerPhone = profile?.phone || profile?.guardian_phone || '';
        currentOrder = {
            customer_name: profile?.name || user.email?.split('@')[0] || '',
            customer_email: user.email || '',
            customer_phone: customerPhone
        };

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

    // 보유 쿠폰 목록 로드
    loadMyCoupons();
}

// 대기 중인 결제로 UI 설정
function setupPendingPayment(pendingData) {
    // 강의 정보 표시
    document.getElementById('course-thumbnail').style.backgroundImage =
        `url('${currentCourse.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80'}')`;
    document.getElementById('course-title').textContent = currentCourse.title;
    document.getElementById('course-lessons').textContent = `${currentCourse.lessons?.length || 0}개 레슨`;

    // 강의비/교재비 표시
    const coursePrice = currentCourse.price || 0;
    const textbookPrice = currentCourse.textbook_price || 0;

    document.getElementById('course-fee-display').textContent = `₩${coursePrice.toLocaleString()}`;
    document.getElementById('textbook-fee-display').textContent = `₩${textbookPrice.toLocaleString()}`;

    // 결제 항목 체크박스 설정 (대기 중인 항목만 체크)
    const nextPayment = pendingData.payments[0];

    // 강의비 체크박스 - 이미 결제됨 또는 대기 중이 아님
    const payCourseEl = document.getElementById('pay-course');
    if (payCourseEl) {
        payCourseEl.checked = nextPayment.type === 'course';
        payCourseEl.disabled = nextPayment.type !== 'course';
        if (nextPayment.type !== 'course') {
            payCourseEl.closest('label').classList.add('opacity-50');
            payCourseEl.closest('label').querySelector('p.font-semibold').innerHTML = '강의비 <span class="text-green-400 text-xs">(결제 완료)</span>';
        }
    }

    // 교재비 체크박스
    const payTextbookEl = document.getElementById('pay-textbook');
    if (payTextbookEl) {
        payTextbookEl.checked = nextPayment.type === 'textbook';
        payTextbookEl.disabled = nextPayment.type !== 'textbook';
        if (textbookPrice === 0) {
            payTextbookEl.closest('label').style.display = 'none';
        }
    }

    // 구매자 정보 설정
    document.getElementById('customer-name').value = pendingData.customerInfo.name || '';
    document.getElementById('customer-email').value = pendingData.customerInfo.email || '';
    document.getElementById('customer-phone').value = pendingData.customerInfo.phone || '';

    // 결제 금액 표시
    const totalAmount = nextPayment.amount;
    document.getElementById('product-price').textContent = `₩${totalAmount.toLocaleString()}`;
    document.getElementById('total-price').textContent = `₩${totalAmount.toLocaleString()}`;
    document.getElementById('discount-amount').textContent = '₩0';

    // 안내 메시지 표시
    const paymentItemSection = document.querySelector('#payment-content > .space-y-8 > div:nth-child(3)');
    if (paymentItemSection) {
        const notice = document.createElement('div');
        notice.className = 'p-4 bg-yellow-500 bg-opacity-10 border border-yellow-500 border-opacity-30 rounded-xl mb-4';
        notice.innerHTML = `
            <p class="text-yellow-400 text-sm font-semibold">추가 결제가 필요합니다</p>
            <p class="text-gray-400 text-xs mt-1">강의비 결제가 완료되었습니다. 교재비 결제를 진행해주세요.</p>
        `;
        paymentItemSection.insertBefore(notice, paymentItemSection.firstChild);
    }
}

// 결제 정보 렌더링
function renderPaymentInfo() {
    // 강의 정보
    document.getElementById('course-thumbnail').style.backgroundImage =
        `url('${currentCourse.thumbnail_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&q=80'}')`;
    document.getElementById('course-title').textContent = currentCourse.title;
    document.getElementById('course-lessons').textContent = `${currentCourse.lessons?.length || 0}개 레슨`;

    // 강의비/교재비 표시
    const coursePrice = currentCourse.price || 0;
    const textbookPrice = currentCourse.textbook_price || 0;

    document.getElementById('course-fee-display').textContent = `₩${coursePrice.toLocaleString()}`;
    document.getElementById('textbook-fee-display').textContent = `₩${textbookPrice.toLocaleString()}`;

    // 교재비가 0이면 체크박스 숨기기
    if (textbookPrice === 0) {
        document.getElementById('pay-textbook').closest('label').style.display = 'none';
        document.getElementById('pay-textbook').checked = false;
    }

    // 구매자 정보
    document.getElementById('customer-name').value = currentOrder.customer_name || '';
    document.getElementById('customer-email').value = currentOrder.customer_email || '';
    document.getElementById('customer-phone').value = currentOrder.customer_phone || '';

    // 선택된 결제 항목에 따라 금액 업데이트
    updateSelectedPayments();
}

// 선택된 결제 항목 업데이트
function updateSelectedPayments() {
    const payCourseEl = document.getElementById('pay-course');
    const payTextbookEl = document.getElementById('pay-textbook');

    // disabled된 체크박스는 무시
    const payCourse = payCourseEl && !payCourseEl.disabled && payCourseEl.checked;
    const payTextbook = payTextbookEl && !payTextbookEl.disabled && payTextbookEl.checked;

    const coursePrice = currentCourse?.price || 0;
    const textbookPrice = currentCourse?.textbook_price || 0;

    let totalAmount = 0;
    if (payCourse) totalAmount += coursePrice;
    if (payTextbook) totalAmount += textbookPrice;

    // 결제 금액 업데이트
    document.getElementById('product-price').textContent = `₩${totalAmount.toLocaleString()}`;
    document.getElementById('total-price').textContent = `₩${totalAmount.toLocaleString()}`;
    document.getElementById('discount-amount').textContent = '₩0';

    // currentOrder 금액 업데이트
    if (currentOrder) {
        currentOrder.amount = totalAmount;
        currentOrder.payItems = {
            course: payCourse,
            textbook: payTextbook
        };
    }

    // 선택된 항목이 없으면 결제 버튼 비활성화
    const paymentButton = document.getElementById('payment-button');
    if (paymentButton) {
        if (!payCourse && !payTextbook) {
            paymentButton.disabled = true;
            paymentButton.classList.add('opacity-50');
        } else {
            paymentButton.disabled = false;
            paymentButton.classList.remove('opacity-50');
        }
    }

    // 쿠폰 적용 시 할인 금액 재계산
    if (appliedCouponData && totalAmount > 0) {
        updatePaymentAmount();
    }
}

// 오류 상태 표시
function showErrorState() {
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('payment-content').classList.add('hidden');
    document.getElementById('error-state').classList.remove('hidden');
}

// ========== 쿠폰 관리 ==========

// 보유 쿠폰 목록 로드 및 표시
async function loadMyCoupons() {
    const container = document.getElementById('my-coupons-list');
    if (!container) return;

    try {
        const user = await getCurrentUser();
        if (!user) {
            container.innerHTML = '';
            return;
        }

        const nowISO = new Date().toISOString();
        const { data, error } = await window.supabase
            .from('user_coupons')
            .select('*, coupons(code, name, discount_type, discount_value, min_purchase_amount, max_discount_amount)')
            .eq('user_id', user.id)
            .eq('is_used', false)
            .gt('expires_at', nowISO);

        if (error) throw error;

        if (!data || data.length === 0) {
            container.innerHTML = '<p class="text-sm text-gray-500">사용 가능한 쿠폰이 없습니다.</p>';
            return;
        }

        container.innerHTML = data.map(uc => {
            const c = uc.coupons;
            if (!c) return '';
            const discountText = c.discount_type === 'percentage'
                ? `${c.discount_value}%${c.max_discount_amount ? ' (최대 ' + Number(c.max_discount_amount).toLocaleString() + '원)' : ''}`
                : `${Number(c.discount_value).toLocaleString()}원`;
            const code = uc.custom_code || c.code;
            const daysLeft = Math.ceil((new Date(uc.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
            const urgentClass = daysLeft <= 3 ? 'text-red-400' : 'text-gray-500';

            return `
                <button onclick="applyMyCoupon('${code}')"
                        class="w-full text-left p-3 bg-white bg-opacity-5 border border-white border-opacity-10 rounded-xl hover:bg-opacity-10 transition-colors">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-white text-sm font-semibold">${c.name}</p>
                            <p class="text-yellow-400 text-xs font-bold mt-1">${discountText} 할인</p>
                        </div>
                        <div class="text-right">
                            <p class="text-xs ${urgentClass}">${daysLeft}일 남음</p>
                            <p class="text-[10px] text-gray-600 mt-1">${code}</p>
                        </div>
                    </div>
                </button>
            `;
        }).join('');

    } catch (e) {
        console.error('보유 쿠폰 로드 오류:', e);
        container.innerHTML = '';
    }
}

// 보유 쿠폰 클릭 시 자동 적용
function applyMyCoupon(code) {
    document.getElementById('coupon-code').value = code;
    applyCoupon();
}

// 코드 직접 입력 토글
function toggleCouponCodeInput() {
    const area = document.getElementById('coupon-code-input-area');
    area.classList.toggle('hidden');
}

// 쿠폰 적용
async function applyCoupon() {
    const couponCode = document.getElementById('coupon-code').value.trim().toUpperCase();
    
    console.log('[쿠폰 적용 시작] 입력 코드:', couponCode);
    
    if (!couponCode) {
        showCouponMessage('쿠폰 코드를 입력해주세요.', false);
        return;
    }
    
    try {
        const user = await getCurrentUser();

        if (!user) {
            showCouponMessage('로그인이 필요합니다.', false);
            return;
        }
        
        // 쿠폰 코드로 사용 가능한 쿠폰 찾기 (custom_code 포함)
        const nowISO = new Date().toISOString();

        // 사용 가능한 쿠폰만 조회
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
        
        console.log('[사용 가능 쿠폰 조회]', {
            사용가능개수: userCoupons?.length,
            사용가능목록: userCoupons?.map(uc => ({
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
            
            console.log('[매칭 시도]', {
                ucId: uc.id,
                custom_code: uc.custom_code,
                db_code: uc.coupons?.code,
                effective_code: effectiveCode,
                입력코드: couponCode,
                매칭여부: effectiveCode?.toUpperCase() === couponCode
            });
            
            if (!effectiveCode) {
                console.warn('쿠폰 코드가 없습니다:', uc);
                return false;
            }
            return effectiveCode.toUpperCase() === couponCode;
        });
        
        console.log('[최종 매칭 결과]', {
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
    messageEl.classList.remove('hidden', 'text-red-500', 'text-green-600');
    messageEl.classList.add(isSuccess ? 'text-green-600' : 'text-red-500');
    
    // 3초 후 자동 숨김
    setTimeout(() => {
        messageEl.classList.add('hidden');
    }, 3000);
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', initPaymentPage);
