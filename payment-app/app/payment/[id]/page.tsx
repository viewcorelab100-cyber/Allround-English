import { getOrderById } from '@/lib/supabase';
import PaymentClient from './PaymentClient';

interface PageProps {
  params: { id: string };
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-400">유효하지 않은 주문 ID입니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  if (order.status === 'paid') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-400 mb-4">이미 결제된 주문입니다</h1>
          <p className="text-gray-400">해당 주문은 이미 결제가 완료되었습니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <PaymentClient
      orderId={order.id}
      orderName={order.order_name}
      customerName={order.customer_name}
      customerEmail={order.customer_email}
      amount={order.amount}
    />
  );
}

import PaymentClient from './PaymentClient';

interface PageProps {
  params: { id: string };
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-400">유효하지 않은 주문 ID입니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  if (order.status === 'paid') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-400 mb-4">이미 결제된 주문입니다</h1>
          <p className="text-gray-400">해당 주문은 이미 결제가 완료되었습니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <PaymentClient
      orderId={order.id}
      orderName={order.order_name}
      customerName={order.customer_name}
      customerEmail={order.customer_email}
      amount={order.amount}
    />
  );
}

import PaymentClient from './PaymentClient';

interface PageProps {
  params: { id: string };
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-400">유효하지 않은 주문 ID입니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  if (order.status === 'paid') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-400 mb-4">이미 결제된 주문입니다</h1>
          <p className="text-gray-400">해당 주문은 이미 결제가 완료되었습니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <PaymentClient
      orderId={order.id}
      orderName={order.order_name}
      customerName={order.customer_name}
      customerEmail={order.customer_email}
      amount={order.amount}
    />
  );
}

import PaymentClient from './PaymentClient';

interface PageProps {
  params: { id: string };
}

export default async function PaymentPage({ params }: PageProps) {
  const { id } = params;
  const order = await getOrderById(id);

  if (!order) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-400 mb-4">주문을 찾을 수 없습니다</h1>
          <p className="text-gray-400">유효하지 않은 주문 ID입니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  if (order.status === 'paid') {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-green-400 mb-4">이미 결제된 주문입니다</h1>
          <p className="text-gray-400">해당 주문은 이미 결제가 완료되었습니다.</p>
          <a href="/" className="inline-block mt-6 px-6 py-3 bg-white text-black rounded-xl font-semibold">
            홈으로 돌아가기
          </a>
        </div>
      </main>
    );
  }

  return (
    <PaymentClient
      orderId={order.id}
      orderName={order.order_name}
      customerName={order.customer_name}
      customerEmail={order.customer_email}
      amount={order.amount}
    />
  );
}















