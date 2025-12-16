'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { updateOrderStatus } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    async function confirmPayment() {
      if (!orderId || !paymentKey) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        // 주문 상태 업데이트
        const success = await updateOrderStatus(orderId, 'paid', paymentKey);
        
        if (!success) {
          setError('결제 상태 업데이트에 실패했습니다.');
        }
      } catch (err) {
        console.error('결제 확인 오류:', err);
        setError('결제 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    }

    confirmPayment();
  }, [orderId, paymentKey]);

  if (isProcessing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">결제를 처리하는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">처리 중 문제 발생</h1>
          <p className="text-gray-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            결제는 완료되었을 수 있습니다. 고객센터로 문의해주세요.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-white text-black rounded-xl font-semibold"
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-400 mb-4">결제 완료!</h1>
        <p className="text-gray-400 mb-6">
          결제가 성공적으로 완료되었습니다.<br />
          이제 강의를 수강하실 수 있습니다.
        </p>
        
        <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">주문번호</span>
            <span className="font-mono">{orderId}</span>
          </div>
          {amount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">결제금액</span>
              <span>{Number(amount).toLocaleString()}원</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <a 
            href="/mypage" 
            className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            내 강의 보러가기
          </a>
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}


import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { updateOrderStatus } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    async function confirmPayment() {
      if (!orderId || !paymentKey) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        // 주문 상태 업데이트
        const success = await updateOrderStatus(orderId, 'paid', paymentKey);
        
        if (!success) {
          setError('결제 상태 업데이트에 실패했습니다.');
        }
      } catch (err) {
        console.error('결제 확인 오류:', err);
        setError('결제 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    }

    confirmPayment();
  }, [orderId, paymentKey]);

  if (isProcessing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">결제를 처리하는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">처리 중 문제 발생</h1>
          <p className="text-gray-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            결제는 완료되었을 수 있습니다. 고객센터로 문의해주세요.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-white text-black rounded-xl font-semibold"
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-400 mb-4">결제 완료!</h1>
        <p className="text-gray-400 mb-6">
          결제가 성공적으로 완료되었습니다.<br />
          이제 강의를 수강하실 수 있습니다.
        </p>
        
        <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">주문번호</span>
            <span className="font-mono">{orderId}</span>
          </div>
          {amount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">결제금액</span>
              <span>{Number(amount).toLocaleString()}원</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <a 
            href="/mypage" 
            className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            내 강의 보러가기
          </a>
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}


import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { updateOrderStatus } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    async function confirmPayment() {
      if (!orderId || !paymentKey) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        // 주문 상태 업데이트
        const success = await updateOrderStatus(orderId, 'paid', paymentKey);
        
        if (!success) {
          setError('결제 상태 업데이트에 실패했습니다.');
        }
      } catch (err) {
        console.error('결제 확인 오류:', err);
        setError('결제 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    }

    confirmPayment();
  }, [orderId, paymentKey]);

  if (isProcessing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">결제를 처리하는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">처리 중 문제 발생</h1>
          <p className="text-gray-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            결제는 완료되었을 수 있습니다. 고객센터로 문의해주세요.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-white text-black rounded-xl font-semibold"
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-400 mb-4">결제 완료!</h1>
        <p className="text-gray-400 mb-6">
          결제가 성공적으로 완료되었습니다.<br />
          이제 강의를 수강하실 수 있습니다.
        </p>
        
        <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">주문번호</span>
            <span className="font-mono">{orderId}</span>
          </div>
          {amount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">결제금액</span>
              <span>{Number(amount).toLocaleString()}원</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <a 
            href="/mypage" 
            className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            내 강의 보러가기
          </a>
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}


import { useSearchParams } from 'next/navigation';
import { useEffect, useState, Suspense } from 'react';
import { updateOrderStatus } from '@/lib/supabase';

function SuccessContent() {
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('orderId');
  const paymentKey = searchParams.get('paymentKey');
  const amount = searchParams.get('amount');

  useEffect(() => {
    async function confirmPayment() {
      if (!orderId || !paymentKey) {
        setError('결제 정보가 올바르지 않습니다.');
        setIsProcessing(false);
        return;
      }

      try {
        // 주문 상태 업데이트
        const success = await updateOrderStatus(orderId, 'paid', paymentKey);
        
        if (!success) {
          setError('결제 상태 업데이트에 실패했습니다.');
        }
      } catch (err) {
        console.error('결제 확인 오류:', err);
        setError('결제 처리 중 오류가 발생했습니다.');
      } finally {
        setIsProcessing(false);
      }
    }

    confirmPayment();
  }, [orderId, paymentKey]);

  if (isProcessing) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">결제를 처리하는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold text-yellow-400 mb-4">처리 중 문제 발생</h1>
          <p className="text-gray-400 mb-2">{error}</p>
          <p className="text-sm text-gray-500 mb-6">
            결제는 완료되었을 수 있습니다. 고객센터로 문의해주세요.
          </p>
          <a 
            href="/" 
            className="inline-block px-6 py-3 bg-white text-black rounded-xl font-semibold"
          >
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🎉</div>
        <h1 className="text-3xl font-bold text-green-400 mb-4">결제 완료!</h1>
        <p className="text-gray-400 mb-6">
          결제가 성공적으로 완료되었습니다.<br />
          이제 강의를 수강하실 수 있습니다.
        </p>
        
        <div className="p-6 rounded-2xl bg-white bg-opacity-5 space-y-3 text-left mb-8">
          <div className="flex justify-between text-sm">
            <span className="text-gray-400">주문번호</span>
            <span className="font-mono">{orderId}</span>
          </div>
          {amount && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">결제금액</span>
              <span>{Number(amount).toLocaleString()}원</span>
            </div>
          )}
        </div>

        <div className="space-y-3">
          <a 
            href="/mypage" 
            className="block w-full py-4 bg-white text-black rounded-xl font-semibold hover:bg-gray-100 transition-colors"
          >
            내 강의 보러가기
          </a>
          <a 
            href="/" 
            className="block w-full py-4 bg-transparent text-white rounded-xl font-semibold border border-white border-opacity-20 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            홈으로 돌아가기
          </a>
        </div>
      </div>
    </main>
  );
}

export default function SuccessPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-400">로딩 중...</p>
        </div>
      </main>
    }>
      <SuccessContent />
    </Suspense>
  );
}















