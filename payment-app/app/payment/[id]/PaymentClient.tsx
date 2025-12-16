'use client';

import PaymentWidget from '@/components/PaymentWidget';

interface PaymentClientProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
}

export default function PaymentClient({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
}: PaymentClientProps) {
  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <a href="/" className="text-2xl font-bold tracking-wider">ALLROUND</a>
          <p className="text-gray-400 mt-2">안전한 결제를 진행해주세요</p>
        </header>

        {/* 결제 위젯 */}
        <PaymentWidget
          orderId={orderId}
          orderName={orderName}
          customerName={customerName}
          customerEmail={customerEmail}
          amount={amount}
        />
      </div>
    </main>
  );
}


import PaymentWidget from '@/components/PaymentWidget';

interface PaymentClientProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
}

export default function PaymentClient({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
}: PaymentClientProps) {
  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <a href="/" className="text-2xl font-bold tracking-wider">ALLROUND</a>
          <p className="text-gray-400 mt-2">안전한 결제를 진행해주세요</p>
        </header>

        {/* 결제 위젯 */}
        <PaymentWidget
          orderId={orderId}
          orderName={orderName}
          customerName={customerName}
          customerEmail={customerEmail}
          amount={amount}
        />
      </div>
    </main>
  );
}


import PaymentWidget from '@/components/PaymentWidget';

interface PaymentClientProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
}

export default function PaymentClient({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
}: PaymentClientProps) {
  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <a href="/" className="text-2xl font-bold tracking-wider">ALLROUND</a>
          <p className="text-gray-400 mt-2">안전한 결제를 진행해주세요</p>
        </header>

        {/* 결제 위젯 */}
        <PaymentWidget
          orderId={orderId}
          orderName={orderName}
          customerName={customerName}
          customerEmail={customerEmail}
          amount={amount}
        />
      </div>
    </main>
  );
}


import PaymentWidget from '@/components/PaymentWidget';

interface PaymentClientProps {
  orderId: string;
  orderName: string;
  customerName: string;
  customerEmail?: string;
  amount: number;
}

export default function PaymentClient({
  orderId,
  orderName,
  customerName,
  customerEmail,
  amount,
}: PaymentClientProps) {
  return (
    <main className="min-h-screen py-8 px-6">
      <div className="max-w-lg mx-auto">
        {/* 헤더 */}
        <header className="text-center mb-8">
          <a href="/" className="text-2xl font-bold tracking-wider">ALLROUND</a>
          <p className="text-gray-400 mt-2">안전한 결제를 진행해주세요</p>
        </header>

        {/* 결제 위젯 */}
        <PaymentWidget
          orderId={orderId}
          orderName={orderName}
          customerName={customerName}
          customerEmail={customerEmail}
          amount={amount}
        />
      </div>
    </main>
  );
}















