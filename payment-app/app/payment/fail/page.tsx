'use client';

import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // 에러 코드별 사용자 친화적 메시지
  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 문제가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다. 다른 카드로 시도해주세요.';
      case 'INVALID_CARD_NUMBER':
        return '카드 번호가 올바르지 않습니다.';
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.';
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😢</div>
        <h1 className="text-3xl font-bold text-red-400 mb-4">결제 실패</h1>
        <p className="text-gray-400 mb-6">
          {getErrorDescription(errorCode)}
        </p>
        
        {(errorCode || orderId) && (
          <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8 text-sm">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-400">주문번호</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
            {errorCode && (
              <div className="flex justify-between">
                <span className="text-gray-400">에러코드</span>
                <span className="font-mono text-red-400">{errorCode}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {orderId && (
            <a 
              href={`/payment/${orderId}`}
              className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              다시 결제하기
            </a>
          )}
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          문제가 지속되면 고객센터로 문의해주세요.
        </p>
      </div>
    </main>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <FailContent />
    </Suspense>
  );
}


import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // 에러 코드별 사용자 친화적 메시지
  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 문제가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다. 다른 카드로 시도해주세요.';
      case 'INVALID_CARD_NUMBER':
        return '카드 번호가 올바르지 않습니다.';
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.';
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😢</div>
        <h1 className="text-3xl font-bold text-red-400 mb-4">결제 실패</h1>
        <p className="text-gray-400 mb-6">
          {getErrorDescription(errorCode)}
        </p>
        
        {(errorCode || orderId) && (
          <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8 text-sm">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-400">주문번호</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
            {errorCode && (
              <div className="flex justify-between">
                <span className="text-gray-400">에러코드</span>
                <span className="font-mono text-red-400">{errorCode}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {orderId && (
            <a 
              href={`/payment/${orderId}`}
              className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              다시 결제하기
            </a>
          )}
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          문제가 지속되면 고객센터로 문의해주세요.
        </p>
      </div>
    </main>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <FailContent />
    </Suspense>
  );
}


import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // 에러 코드별 사용자 친화적 메시지
  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 문제가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다. 다른 카드로 시도해주세요.';
      case 'INVALID_CARD_NUMBER':
        return '카드 번호가 올바르지 않습니다.';
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.';
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😢</div>
        <h1 className="text-3xl font-bold text-red-400 mb-4">결제 실패</h1>
        <p className="text-gray-400 mb-6">
          {getErrorDescription(errorCode)}
        </p>
        
        {(errorCode || orderId) && (
          <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8 text-sm">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-400">주문번호</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
            {errorCode && (
              <div className="flex justify-between">
                <span className="text-gray-400">에러코드</span>
                <span className="font-mono text-red-400">{errorCode}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {orderId && (
            <a 
              href={`/payment/${orderId}`}
              className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              다시 결제하기
            </a>
          )}
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          문제가 지속되면 고객센터로 문의해주세요.
        </p>
      </div>
    </main>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <FailContent />
    </Suspense>
  );
}


import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function FailContent() {
  const searchParams = useSearchParams();
  
  const errorCode = searchParams.get('code');
  const errorMessage = searchParams.get('message');
  const orderId = searchParams.get('orderId');

  // 에러 코드별 사용자 친화적 메시지
  const getErrorDescription = (code: string | null) => {
    switch (code) {
      case 'PAY_PROCESS_CANCELED':
        return '결제가 취소되었습니다.';
      case 'PAY_PROCESS_ABORTED':
        return '결제 진행 중 문제가 발생했습니다.';
      case 'REJECT_CARD_COMPANY':
        return '카드사에서 결제를 거부했습니다. 다른 카드로 시도해주세요.';
      case 'INVALID_CARD_NUMBER':
        return '카드 번호가 올바르지 않습니다.';
      case 'EXCEED_MAX_DAILY_PAYMENT_COUNT':
        return '일일 결제 한도를 초과했습니다.';
      case 'EXCEED_MAX_PAYMENT_AMOUNT':
        return '결제 금액 한도를 초과했습니다.';
      default:
        return errorMessage || '결제 처리 중 오류가 발생했습니다.';
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">😢</div>
        <h1 className="text-3xl font-bold text-red-400 mb-4">결제 실패</h1>
        <p className="text-gray-400 mb-6">
          {getErrorDescription(errorCode)}
        </p>
        
        {(errorCode || orderId) && (
          <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8 text-sm">
            {orderId && (
              <div className="flex justify-between">
                <span className="text-gray-400">주문번호</span>
                <span className="font-mono">{orderId}</span>
              </div>
            )}
            {errorCode && (
              <div className="flex justify-between">
                <span className="text-gray-400">에러코드</span>
                <span className="font-mono text-red-400">{errorCode}</span>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          {orderId && (
            <a 
              href={`/payment/${orderId}`}
              className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
            >
              다시 결제하기
            </a>
          )}
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          문제가 지속되면 고객센터로 문의해주세요.
        </p>
      </div>
    </main>
  );
}

export default function FailPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <FailContent />
    </Suspense>
  );
}















