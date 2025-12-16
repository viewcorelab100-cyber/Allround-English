'use client';

import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

interface PaymentWidgetProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  customerKey?: string;
}

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa';

export default function PaymentWidget({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
  customerKey,
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        
        // 비회원 결제 또는 회원 결제
        const widgetInstance = tossPayments.widgets({
          customerKey: customerKey || ANONYMOUS,
        });

        // 결제 금액 설정
        await widgetInstance.setAmount({
          currency: 'KRW',
          value: amount,
        });

        setWidgets(widgetInstance);
      } catch (error) {
        console.error('토스페이먼츠 초기화 오류:', error);
      }
    }

    initWidget();
  }, [amount, customerKey]);

  useEffect(() => {
    async function renderWidgets() {
      if (!widgets) return;

      try {
        // 결제 수단 UI 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // 이용약관 UI 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        setIsReady(true);
      } catch (error) {
        console.error('위젯 렌더링 오류:', error);
      }
    }

    renderWidgets();
  }, [widgets]);

  const handlePayment = async () => {
    if (!widgets || !isReady) return;

    setIsLoading(true);

    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('결제 요청 오류:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 주문 정보 */}
      <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-4">
        <h2 className="text-lg font-bold">주문 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">상품명</span>
            <span>{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">구매자</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white border-opacity-10">
            <span>결제 금액</span>
            <span className="text-blue-400">{amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="payment-method" ref={paymentMethodRef} />
      </div>

      {/* 이용약관 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="agreement" ref={agreementRef} />
      </div>

      {/* 결제하기 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!isReady || isLoading}
        className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500 text-center">
        결제 진행 시 토스페이먼츠의 이용약관에 동의하게 됩니다.
      </p>
    </div>
  );
}


import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

interface PaymentWidgetProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  customerKey?: string;
}

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa';

export default function PaymentWidget({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
  customerKey,
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        
        // 비회원 결제 또는 회원 결제
        const widgetInstance = tossPayments.widgets({
          customerKey: customerKey || ANONYMOUS,
        });

        // 결제 금액 설정
        await widgetInstance.setAmount({
          currency: 'KRW',
          value: amount,
        });

        setWidgets(widgetInstance);
      } catch (error) {
        console.error('토스페이먼츠 초기화 오류:', error);
      }
    }

    initWidget();
  }, [amount, customerKey]);

  useEffect(() => {
    async function renderWidgets() {
      if (!widgets) return;

      try {
        // 결제 수단 UI 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // 이용약관 UI 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        setIsReady(true);
      } catch (error) {
        console.error('위젯 렌더링 오류:', error);
      }
    }

    renderWidgets();
  }, [widgets]);

  const handlePayment = async () => {
    if (!widgets || !isReady) return;

    setIsLoading(true);

    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('결제 요청 오류:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 주문 정보 */}
      <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-4">
        <h2 className="text-lg font-bold">주문 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">상품명</span>
            <span>{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">구매자</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white border-opacity-10">
            <span>결제 금액</span>
            <span className="text-blue-400">{amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="payment-method" ref={paymentMethodRef} />
      </div>

      {/* 이용약관 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="agreement" ref={agreementRef} />
      </div>

      {/* 결제하기 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!isReady || isLoading}
        className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500 text-center">
        결제 진행 시 토스페이먼츠의 이용약관에 동의하게 됩니다.
      </p>
    </div>
  );
}


import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

interface PaymentWidgetProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  customerKey?: string;
}

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa';

export default function PaymentWidget({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
  customerKey,
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        
        // 비회원 결제 또는 회원 결제
        const widgetInstance = tossPayments.widgets({
          customerKey: customerKey || ANONYMOUS,
        });

        // 결제 금액 설정
        await widgetInstance.setAmount({
          currency: 'KRW',
          value: amount,
        });

        setWidgets(widgetInstance);
      } catch (error) {
        console.error('토스페이먼츠 초기화 오류:', error);
      }
    }

    initWidget();
  }, [amount, customerKey]);

  useEffect(() => {
    async function renderWidgets() {
      if (!widgets) return;

      try {
        // 결제 수단 UI 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // 이용약관 UI 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        setIsReady(true);
      } catch (error) {
        console.error('위젯 렌더링 오류:', error);
      }
    }

    renderWidgets();
  }, [widgets]);

  const handlePayment = async () => {
    if (!widgets || !isReady) return;

    setIsLoading(true);

    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('결제 요청 오류:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 주문 정보 */}
      <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-4">
        <h2 className="text-lg font-bold">주문 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">상품명</span>
            <span>{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">구매자</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white border-opacity-10">
            <span>결제 금액</span>
            <span className="text-blue-400">{amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="payment-method" ref={paymentMethodRef} />
      </div>

      {/* 이용약관 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="agreement" ref={agreementRef} />
      </div>

      {/* 결제하기 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!isReady || isLoading}
        className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500 text-center">
        결제 진행 시 토스페이먼츠의 이용약관에 동의하게 됩니다.
      </p>
    </div>
  );
}


import { useEffect, useRef, useState } from 'react';
import { loadTossPayments, TossPaymentsWidgets, ANONYMOUS } from '@tosspayments/tosspayments-sdk';

interface PaymentWidgetProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
  customerKey?: string;
}

const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eqa';

export default function PaymentWidget({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
  customerKey,
}: PaymentWidgetProps) {
  const [widgets, setWidgets] = useState<TossPaymentsWidgets | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const paymentMethodRef = useRef<HTMLDivElement>(null);
  const agreementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initWidget() {
      try {
        const tossPayments = await loadTossPayments(clientKey);
        
        // 비회원 결제 또는 회원 결제
        const widgetInstance = tossPayments.widgets({
          customerKey: customerKey || ANONYMOUS,
        });

        // 결제 금액 설정
        await widgetInstance.setAmount({
          currency: 'KRW',
          value: amount,
        });

        setWidgets(widgetInstance);
      } catch (error) {
        console.error('토스페이먼츠 초기화 오류:', error);
      }
    }

    initWidget();
  }, [amount, customerKey]);

  useEffect(() => {
    async function renderWidgets() {
      if (!widgets) return;

      try {
        // 결제 수단 UI 렌더링
        await widgets.renderPaymentMethods({
          selector: '#payment-method',
          variantKey: 'DEFAULT',
        });

        // 이용약관 UI 렌더링
        await widgets.renderAgreement({
          selector: '#agreement',
          variantKey: 'AGREEMENT',
        });

        setIsReady(true);
      } catch (error) {
        console.error('위젯 렌더링 오류:', error);
      }
    }

    renderWidgets();
  }, [widgets]);

  const handlePayment = async () => {
    if (!widgets || !isReady) return;

    setIsLoading(true);

    try {
      await widgets.requestPayment({
        orderId,
        orderName,
        customerName,
        customerEmail,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
      });
    } catch (error) {
      console.error('결제 요청 오류:', error);
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 주문 정보 */}
      <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-4">
        <h2 className="text-lg font-bold">주문 정보</h2>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">상품명</span>
            <span>{orderName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">구매자</span>
            <span>{customerName}</span>
          </div>
          <div className="flex justify-between text-lg font-bold pt-2 border-t border-white border-opacity-10">
            <span>결제 금액</span>
            <span className="text-blue-400">{amount.toLocaleString()}원</span>
          </div>
        </div>
      </div>

      {/* 결제 수단 선택 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="payment-method" ref={paymentMethodRef} />
      </div>

      {/* 이용약관 */}
      <div className="rounded-2xl overflow-hidden bg-white">
        <div id="agreement" ref={agreementRef} />
      </div>

      {/* 결제하기 버튼 */}
      <button
        onClick={handlePayment}
        disabled={!isReady || isLoading}
        className="w-full py-4 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        {isLoading ? '결제 처리 중...' : `${amount.toLocaleString()}원 결제하기`}
      </button>

      {/* 안내 문구 */}
      <p className="text-xs text-gray-500 text-center">
        결제 진행 시 토스페이먼츠의 이용약관에 동의하게 됩니다.
      </p>
    </div>
  );
}















