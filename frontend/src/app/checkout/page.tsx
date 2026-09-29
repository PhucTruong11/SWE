'use client';

import React, { useState, useEffect } from 'react';
import { useCartStore } from '@/stores/cart.store';
import {
  ReceiptInvoice,
  CountdownTimer,
  PaymentMethods,
  OrderSummary,
  EmptyCheckout,
  type ReceiptData,
  type CardFormData,
} from '@/components/payment';

function generatePaymentIds(method: 'EWALLET' | 'CARD', now: Date) {
  const datePrefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;
  const uniqueSuffix = now.getTime().toString().slice(-6);

  return {
    invoiceNo: `BL-${datePrefix}-${uniqueSuffix}`,
    paymentRef: `GW-${method}-${uniqueSuffix}`,
    orderId: `ORD-${uniqueSuffix}`,
  };
}

export default function CheckoutPage() {
  const { items, clearCart } = useCartStore();

  // Phương thức thanh toán: EWALLET (MoMo) | CARD (Thẻ ngân hàng)
  const [method, setMethod] = useState<'EWALLET' | 'CARD'>('EWALLET');

  // Thông tin form thẻ ngân hàng
  const [cardInfo, setCardInfo] = useState<CardFormData>({
    cardNumber: '9704 2200 8888 6666',
    cardHolder: 'NGUYEN VAN A',
    expiry: '12/28',
    cvv: '888',
  });

  // Đồng hồ đếm ngược 3 phút (180 giây)
  const [timeLeft, setTimeLeft] = useState(180);
  const isExpired = timeLeft <= 0;

  // Trạng thái xử lý thanh toán
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dữ liệu HÓA ĐƠN XUẤT SAU KHI THANH TOÁN THÀNH CÔNG
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Bộ đếm thời gian
  useEffect(() => {
    if (isExpired) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isExpired]);

  // Tính toán số tiền thực tế từ giỏ hàng
  const finalTotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const pointsEarned = Math.floor(finalTotal / 1000); // 1.000đ = 1 điểm

  // Xử lý thanh toán và Xuất Hóa Đơn
  const handlePayment = async () => {
    if (isExpired) {
      setErrorMessage('Đơn hàng đã quá hạn thanh toán (quá 3 phút). Vui lòng đặt lại đơn mới.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng trống. Vui lòng chọn món trước khi thanh toán.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Giả lập độ trễ giao dịch ngân hàng
      await new Promise((r) => setTimeout(r, 700));

      const now = new Date();
      const { invoiceNo, paymentRef, orderId } = generatePaymentIds(method, now);

      // Xuất hóa đơn ra màn hình
      setReceiptData({
        orderId,
        invoiceNo,
        paymentId: paymentRef,
        paidAt: now.toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        items,
        subtotal: finalTotal,
        discount: 0,
        promoCode: null,
        finalTotal,
        pointsEarned,
        method,
      });

      // Clear giỏ hàng sau khi hoàn tất
      clearCart();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof err.response === 'object' &&
        err.response !== null &&
        'data' in err.response &&
        typeof err.response.data === 'object' &&
        err.response.data !== null &&
        'message' in err.response.data &&
        typeof err.response.data.message === 'string'
          ? err.response.data.message
          : 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại!';

      setErrorMessage(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // URL QR MoMo / VietQR động
  const vietQrUrl = `https://api.vietqr.io/image/970422-0909090909-compact2.png?amount=${finalTotal}&addInfo=BREWLITE%20CAFE&accountName=BREWLITE%20COFFEE`;

  // 1. NẾU ĐÃ THANH TOÁN THÀNH CÔNG → HIỂN THỊ HÓA ĐƠN ĐIỆN TỬ
  if (receiptData) {
    return (
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center px-4 py-8">
        <ReceiptInvoice
          data={receiptData}
          onReset={() => {
            setReceiptData(null);
            clearCart();
          }}
        />
      </main>
    );
  }

  // 2. NẾU GIỎ HÀNG TRỐNG → HIỂN THỊ COMPONENT THÔNG BÁO VỀ MENU
  if (items.length === 0) {
    return <EmptyCheckout />;
  }

  // 3. GIAO DIỆN THANH TOÁN CHÍNH (CHECKOUT & PAYMENT)
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 pb-20 lg:px-8">
      {/* Đồng hồ đếm ngược 3 phút */}
      <CountdownTimer timeLeft={timeLeft} isExpired={isExpired} />

      {errorMessage && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI: Phương thức thanh toán (7 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <PaymentMethods
            method={method}
            onMethodChange={setMethod}
            finalTotal={finalTotal}
            qrUrl={vietQrUrl}
            cardInfo={cardInfo}
            onCardInfoChange={setCardInfo}
          />
        </div>

        {/* CỘT PHẢI: Tóm tắt đơn hàng + Bảng tính tiền + Nút thanh toán (5 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <OrderSummary
            items={items}
            finalTotal={finalTotal}
            pointsEarned={pointsEarned}
            isSubmitting={isSubmitting}
            isExpired={isExpired}
            onPayment={handlePayment}
          />
        </div>
      </div>
    </main>
  );
}
