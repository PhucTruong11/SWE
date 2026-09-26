'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';
import { formatVND } from '@/lib/utils';
import type { CartItem } from '@/types';
import {
  ReceiptInvoice,
  CountdownTimer,
  PaymentMethods,
  VoucherSection,
  type ReceiptData,
  type CardFormData,
} from '@/components/payment';

// Món demo nếu người dùng truy cập trực tiếp trang thanh toán khi giỏ rỗng
const DEFAULT_DEMO_ITEMS: CartItem[] = [
  {
    productId: 'demo-1',
    productName: 'Phin Sữa Đá Đậm Đà',
    productImage: null,
    size: 'M',
    toppings: ['Trân châu hoàng kim'],
    qty: 1,
    unitPrice: 45000,
    lineTotal: 45000,
  },
  {
    productId: 'demo-2',
    productName: 'Trà Sen Vàng Hạt Sen',
    productImage: null,
    size: 'L',
    toppings: ['Thạch củ năng'],
    qty: 1,
    unitPrice: 55000,
    lineTotal: 55000,
  },
];

export default function PaymentPage() {
  const { items: cartItems, clearCart } = useCartStore();

  // Sử dụng items từ giỏ hàng hoặc fallback sang items demo
  const [items, setItems] = useState<CartItem[]>(DEFAULT_DEMO_ITEMS);
  const [isUsingDemo, setIsUsingDemo] = useState(false);

  useEffect(() => {
    if (cartItems.length > 0) {
      setItems(cartItems);
      setIsUsingDemo(false);
    } else {
      setItems(DEFAULT_DEMO_ITEMS);
      setIsUsingDemo(true);
    }
  }, [cartItems]);

  // Phương thức thanh toán: EWALLET (MoMo) | CARD (Thẻ ngân hàng)
  const [method, setMethod] = useState<'EWALLET' | 'CARD'>('EWALLET');

  // Trạng thái Voucher
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
    message: string;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);

  // Thông tin form thẻ ngân hàng
  const [cardInfo, setCardInfo] = useState<CardFormData>({
    cardNumber: '9704 2200 8888 6666',
    cardHolder: 'NGUYEN VAN A',
    expiry: '12/28',
    cvv: '888',
  });

  // Đồng hồ đếm ngược 3 phút (180 giây)
  const [timeLeft, setTimeLeft] = useState(180);
  const [isExpired, setIsExpired] = useState(false);

  // Trạng thái xử lý thanh toán
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Dữ liệu HÓA ĐƠN XUẤT SAU KHI THANH TOÁN THÀNH CÔNG
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  // Bộ đếm thời gian
  useEffect(() => {
    if (timeLeft <= 0) {
      setIsExpired(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Tính toán số tiền
  const subtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const pointsEarned = Math.floor(finalTotal / 1000); // 1.000đ = 1 điểm

  // Áp dụng voucher
  const handleApplyVoucher = (codeToApply?: string) => {
    const code = (codeToApply || voucherInput).trim().toUpperCase();
    setVoucherError(null);

    if (!code) {
      setVoucherError('Vui lòng nhập mã giảm giá');
      return;
    }

    if (code === 'CHAOBAN') {
      if (subtotal < 40000) {
        setVoucherError('Mã CHAOBAN yêu cầu đơn hàng từ 40.000đ trở lên');
        return;
      }
      setAppliedVoucher({
        code: 'CHAOBAN',
        discount: 15000,
        message: 'Đã giảm 15.000đ từ mã CHAOBAN',
      });
      setVoucherInput('CHAOBAN');
    } else if (code === 'BREW10') {
      const disc = Math.min(25000, Math.floor(subtotal * 0.1));
      setAppliedVoucher({
        code: 'BREW10',
        discount: disc,
        message: `Đã giảm 10% (${formatVND(disc)}) từ mã BREW10`,
      });
      setVoucherInput('BREW10');
    } else if (code === 'FREESHIP') {
      setAppliedVoucher({
        code: 'FREESHIP',
        discount: 10000,
        message: 'Đã giảm 10.000đ từ mã FREESHIP',
      });
      setVoucherInput('FREESHIP');
    } else if (code === 'TRIAN') {
      setAppliedVoucher({
        code: 'TRIAN',
        discount: subtotal,
        message: 'Đã áp mã tri ân giảm 100% (Miễn phí)',
      });
      setVoucherInput('TRIAN');
    } else {
      setVoucherError(`Mã giảm giá "${code}" không tồn tại hoặc đã hết hạn`);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setVoucherInput('');
    setVoucherError(null);
  };

  // Xử lý thanh toán và Xuất Hóa Đơn
  const handlePayment = async () => {
    if (isExpired) {
      setErrorMessage('Đơn hàng đã quá hạn thanh toán (quá 3 phút). Vui lòng đặt lại đơn mới.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // Giả lập độ trễ giao dịch ngân hàng
      await new Promise((r) => setTimeout(r, 700));

      const now = new Date();
      const invoiceNo = `BL-${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;
      const paymentRef = `GW-${method}-${Date.now().toString().slice(-6)}`;

      // Xuất hóa đơn ra màn hình
      setReceiptData({
        orderId: `ORD-${Date.now().toString().slice(-6)}`,
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
        subtotal,
        discount: discountAmount,
        promoCode: appliedVoucher ? appliedVoucher.code : null,
        finalTotal,
        pointsEarned,
        method,
      });

      // Clear giỏ hàng sau khi hoàn tất
      clearCart();
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Có lỗi xảy ra khi thanh toán. Vui lòng thử lại!');
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

  // GIAO DIỆN THANH TOÁN (MÀN HÌNH 4 TRONG WIREFRAME)
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 pb-20 lg:px-8">
      {/* 1. Component Đồng hồ đếm ngược 3 phút */}
      <CountdownTimer timeLeft={timeLeft} isExpired={isExpired} />

      {/* Thông báo nếu đang dùng món mẫu */}
      {isUsingDemo && (
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 border border-amber-200 flex items-center justify-between">
          <span>
            💡 <strong>Chế độ thử nghiệm:</strong> Giỏ hàng hiện tại đang trống, hệ thống đang dùng 2 món mẫu để bạn kiểm tra giao diện và tính năng thanh toán.
          </span>
          <Link href="/" className="font-bold underline ml-2 shrink-0">
            Xem Menu
          </Link>
        </div>
      )}

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

        {/* CỘT PHẢI: Tóm tắt đơn hàng + 3. Component Voucher + Nút xác nhận (5 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-900/10">
            <h2 className="text-lg font-bold text-[#1E3932] mb-4">
              Chi tiết đơn hàng ({items.reduce((s, i) => s + i.qty, 0)} món)
            </h2>

            {/* Danh sách món tóm tắt */}
            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
              {items.map((item, idx) => (
                <div key={idx} className="py-2.5 flex items-start justify-between text-xs">
                  <div>
                    <span className="font-bold text-[#1E3932]">
                      {item.qty}x {item.productName}
                    </span>
                    <p className="text-gray-500 mt-0.5">
                      Size {item.size} {item.toppings.length > 0 ? `• ${item.toppings.join(', ')}` : ''}
                    </p>
                  </div>
                  <span className="font-semibold text-[#1E3932]">
                    {formatVND(item.lineTotal)}
                  </span>
                </div>
              ))}
            </div>

            {/* 3. Component Nhập mã giảm giá Voucher */}
            <VoucherSection
              voucherInput={voucherInput}
              onVoucherInputChange={setVoucherInput}
              onApplyVoucher={handleApplyVoucher}
              onRemoveVoucher={handleRemoveVoucher}
              appliedVoucher={appliedVoucher}
              voucherError={voucherError}
            />

            {/* Bảng tính tiền chi tiết */}
            <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Tạm tính:</span>
                <span className="font-semibold text-gray-900">{formatVND(subtotal)}</span>
              </div>

              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700 font-medium">
                  <span>Mã giảm giá ({appliedVoucher?.code}):</span>
                  <span>-{formatVND(discountAmount)}</span>
                </div>
              )}

              <div className="flex justify-between text-emerald-900 pt-1">
                <span>Tích lũy điểm (1.000đ = 1đ):</span>
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

            <p className="mt-3 text-center text-[11px] text-gray-500">
              🔒 Giao dịch được bảo mật bởi Mock Payment Gateway & ACID Transaction
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
