'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { formatVND } from '@/lib/utils';
import {
  ReceiptInvoice,
  CountdownTimer,
  PaymentMethods,
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
    if (isExpired) {
      return;
    }
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

  // NẾU ĐÃ THANH TOÁN THÀNH CÔNG → HIỂN THỊ HÓA ĐƠN ĐIỆN TỬ
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

  // NẾU GIỎ HÀNG TRỐNG → HIỂN THỊ THÔNG BÁO VỀ MENU
  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-4 py-16 text-center">
        <div className="rounded-full bg-emerald-50 p-6 text-primary mb-4 text-4xl">
          ☕
        </div>
        <h2 className="text-xl font-bold text-[#1E3932] mb-2">
          Chưa có món nào để thanh toán
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Giỏ hàng của bạn đang trống. Vui lòng chọn những thức uống tuyệt ngon từ menu trước khi tiến hành thanh toán nhé!
        </p>
        <Link
          href="/"
          className="rounded-full bg-primary hover:bg-primary-hover px-6 py-3 font-bold text-white transition-all shadow-md active:scale-95"
        >
          Khám phá thực đơn
        </Link>
      </main>
    );
  }

  // GIAO DIỆN THANH TOÁN (CHECKOUT & PAYMENT)
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 pb-20 lg:px-8">
      {/* 1. Component Đồng hồ đếm ngược 3 phút */}
      <CountdownTimer timeLeft={timeLeft} isExpired={isExpired} />

      {errorMessage && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI: 2. Component Phương thức thanh toán (7 cols) */}
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

        {/* CỘT PHẢI: Tóm tắt đơn hàng + Nút xác nhận (5 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-900/10">
            <h2 className="text-lg font-bold text-[#1E3932] mb-4">
              Chi tiết đơn hàng ({items.reduce((s, i) => s + (Number(i.quantity) || 1), 0)} món)
            </h2>

            {/* Danh sách món tóm tắt */}
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1E3932]">
                      {item.quantity}x {item.name}
                    </span>
                    <p className="text-gray-500 mt-0.5">
                      Size {item.size} {item.toppings && item.toppings.length > 0 ? `• ${item.toppings.map((t) => t.name).join(', ')}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-[#1E3932]">
                    {formatVND(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* Bảng tính tiền chi tiết */}
            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-900">{formatVND(finalTotal)}</span>
              </div>

              <div className="flex justify-between text-emerald-900 pt-1">
                <span>Tích lũy điểm (1.000đ = 1 điểm):</span>
                <span className="font-bold">+{pointsEarned} điểm</span>
              </div>

              <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-extrabold text-[#1E3932]">
                <span>TỔNG THANH TOÁN:</span>
                <span className="text-xl text-primary font-black">
                  {formatVND(finalTotal)}
                </span>
              </div>
            </div>

            {/* Nút bấm thanh toán chính */}
            <button
              type="button"
              disabled={isSubmitting || isExpired}
              onClick={handlePayment}
              className={`mt-6 w-full rounded-full py-4 text-center font-bold text-white shadow-lg transition-all ${
                isExpired
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isSubmitting
                  ? 'bg-primary/70 cursor-wait'
                  : 'bg-primary hover:bg-primary-hover active:scale-[0.99]'
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-5 w-5 animate-spin text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Đang xử lý thanh toán...
                </span>
              ) : isExpired ? (
                'Đơn hàng đã hết hạn'
              ) : (
                `Xác nhận trả ${formatVND(finalTotal)}`
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
