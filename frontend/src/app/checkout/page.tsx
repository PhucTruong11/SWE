'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useHasCartHydrated } from '@/stores/cart.store';
import api from '@/lib/api';
import {
  CountdownTimer,
  CheckoutMethods,
  OrderSummary,
  EmptyCheckout,
  type CardFormData,
  type CardFormErrors,
} from '@/components/checkout';
import type { AppliedPromo } from '@/lib/voucher';

export default function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart, appliedPromo, applyPromo, removePromo } = useCartStore();
  const currentPromo: AppliedPromo | null = appliedPromo;
  const hasHydrated = useHasCartHydrated();

  // Phương thức thanh toán: EWALLET (MoMo) | CARD (Thẻ ngân hàng)
  const [method, setMethod] = useState<'EWALLET' | 'CARD'>('EWALLET');

  // Thông tin form thẻ ngân hàng (mặc định điền sẵn thẻ mẫu Sandbox để test thanh toán ảo nhanh)
  const [cardInfo, setCardInfo] = useState<CardFormData>({
    cardNumber: '9704 2200 8888 6666',
    cardHolder: 'NGUYEN VAN A',
    expiry: '12/28',
    cvv: '888',
  });
  const [cardErrors, setCardErrors] = useState<CardFormErrors>({});

  // Thời lượng giữ đơn và thanh toán chạy ngầm: 2 phút (120 giây)
  const CHECKOUT_DURATION_SECONDS = 120;
  const CHECKOUT_DEADLINE_KEY = 'brewlite_checkout_deadline';
  const CHECKOUT_RENEW_COUNT_KEY = 'brewlite_checkout_renew_count';
  const MAX_RENEWALS = 1; // Chỉ cho phép gia hạn tối đa 1 lần duy nhất

  // Đồng hồ đếm ngược chạy ngầm (không hiển thị thanh ra ngoài giao diện)
  const [timeLeft, setTimeLeft] = useState(CHECKOUT_DURATION_SECONDS);
  const isExpired = timeLeft <= 0;

  // Số lần đã gia hạn (khởi tạo đọc từ localStorage)
  const [renewCount, setRenewCount] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const savedRenewCount = localStorage.getItem('brewlite_checkout_renew_count');
      return savedRenewCount ? parseInt(savedRenewCount, 10) || 0 : 0;
    }
    return 0;
  });
  const canRenew = renewCount < MAX_RENEWALS;

  // Trạng thái xử lý thanh toán
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Giữ order/key trong suốt vòng đời thao tác để retry do timeout không tạo request mới.
  const [orderId, setOrderId] = useState<string | null>(
    searchParams.get('orderId'),
  );
  const paymentAttemptRef = useRef<string | null>(null);

  // Bộ đếm thời gian được đồng bộ qua localStorage và chạy hoàn toàn ngầm
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const syncTimer = () => {
      const saved = localStorage.getItem(CHECKOUT_DEADLINE_KEY);
      let targetDeadline: number;

      if (!saved) {
        targetDeadline = Date.now() + CHECKOUT_DURATION_SECONDS * 1000;
        localStorage.setItem(CHECKOUT_DEADLINE_KEY, targetDeadline.toString());
      } else {
        targetDeadline = parseInt(saved, 10);
        // Nếu deadline cũ lưu thời gian xa hơn CHECKOUT_DURATION_SECONDS, tự động reset lại 2 phút
        if (isNaN(targetDeadline) || targetDeadline - Date.now() > CHECKOUT_DURATION_SECONDS * 1000) {
          targetDeadline = Date.now() + CHECKOUT_DURATION_SECONDS * 1000;
          localStorage.setItem(CHECKOUT_DEADLINE_KEY, targetDeadline.toString());
        }
      }

      const remaining = Math.max(0, Math.floor((targetDeadline - Date.now()) / 1000));
      setTimeLeft(remaining);
    };

    syncTimer();
    const timer = setInterval(syncTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  // Xóa deadline & số lần gia hạn khi giỏ hàng trống
  useEffect(() => {
    if (items.length === 0 && typeof window !== 'undefined') {
      localStorage.removeItem(CHECKOUT_DEADLINE_KEY);
      localStorage.removeItem(CHECKOUT_RENEW_COUNT_KEY);
    }
  }, [items.length]);

  // Tự động thu hồi mã giảm giá nếu hết hạn cả 2 cơ hội thanh toán (2 phút đầu + 1 lần gia hạn)
  useEffect(() => {
    if (isExpired && !canRenew && currentPromo) {
      const timer = setTimeout(() => {
        removePromo();
        setErrorMessage('Đơn hàng đã hết hạn thanh toán qua 2 cơ hội. Mã ưu đãi đã tự động bị thu hồi.');
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isExpired, canRenew, currentPromo, removePromo]);

  // Tính toán số tiền thực tế từ giỏ hàng kèm giảm giá Voucher
  const subtotal = items.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);
  const pointsEarned = Math.floor(finalTotal / 10000); // 10.000đ = 1 điểm (đồng bộ với backend)

  // Kiểm tra tính hợp lệ của Form thẻ ngân hàng
  const validateCardForm = (): boolean => {
    const errors: CardFormErrors = {};
    const cleanNumber = cardInfo.cardNumber.replace(/\s+/g, '');

    if (!cleanNumber) {
      errors.cardNumber = 'Vui lòng nhập số thẻ ngân hàng.';
    } else if (cleanNumber.length !== 16) {
      errors.cardNumber = 'Số thẻ không hợp lệ (cần đúng 16 chữ số).';
    }

    if (!cardInfo.cardHolder.trim()) {
      errors.cardHolder = 'Vui lòng nhập họ tên chủ thẻ.';
    }

    if (!cardInfo.expiry.trim()) {
      errors.expiry = 'Vui lòng nhập ngày hết hạn.';
    } else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(cardInfo.expiry.trim())) {
      errors.expiry = 'Định dạng MM/YY không đúng (Ví dụ: 12/28).';
    }

    if (!cardInfo.cvv.trim()) {
      errors.cvv = 'Vui lòng nhập mã bảo mật CVV.';
    } else if (cardInfo.cvv.trim().length < 3) {
      errors.cvv = 'Mã CVV phải có từ 3 đến 4 chữ số.';
    }

    setCardErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Làm mới đơn hàng khi hết hạn (Chỉ được gia hạn tối đa 1 lần)
  const handleRenewOrder = () => {
    if (renewCount >= MAX_RENEWALS) {
      setErrorMessage('Đơn hàng đã hết số lần gia hạn cho phép (tối đa 1 lần). Vui lòng tạo lại đơn mới.');
      return;
    }

    const nextRenewCount = renewCount + 1;
    setRenewCount(nextRenewCount);

    const newDeadline = Date.now() + CHECKOUT_DURATION_SECONDS * 1000;
    if (typeof window !== 'undefined') {
      localStorage.setItem(CHECKOUT_DEADLINE_KEY, newDeadline.toString());
      localStorage.setItem(CHECKOUT_RENEW_COUNT_KEY, nextRenewCount.toString());
    }
    setTimeLeft(CHECKOUT_DURATION_SECONDS);
    setErrorMessage(null);
  };

  // Điền thẻ mẫu Demo
  const handleFillDemoCard = () => {
    setCardInfo({
      cardNumber: '9704 2200 8888 6666',
      cardHolder: 'NGUYEN VAN A',
      expiry: '12/28',
      cvv: '888',
    });
    setCardErrors({});
    setErrorMessage(null);
  };

  // Xóa trắng form thẻ
  const handleClearCard = () => {
    setCardInfo({
      cardNumber: '',
      cardHolder: '',
      expiry: '',
      cvv: '',
    });
    setCardErrors({});
  };

  // Cập nhật thông tin thẻ
  const handleCardInfoChange = (data: CardFormData) => {
    setCardInfo(data);
    if (Object.keys(cardErrors).length > 0) {
      setCardErrors({});
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  // Xử lý tạo đơn hàng và thanh toán (Checkout Flow)
  const handleCheckout = async () => {
    if (isExpired) {
      setErrorMessage('Đơn hàng đã quá hạn thanh toán. Vui lòng bấm "Làm mới đơn hàng" để tiếp tục.');
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Giỏ hàng trống. Vui lòng chọn món trước khi thanh toán.');
      return;
    }

    // Nếu chọn thanh toán bằng thẻ, kiểm tra thông tin thẻ trước
    if (method === 'CARD') {
      const isValid = validateCardForm();
      if (!isValid) {
        setErrorMessage('Thông tin thẻ chưa hợp lệ. Vui lòng kiểm tra các trường màu đỏ bên dưới.');
        return;
      }
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Chỉ tạo order một lần. Khi retry thanh toán, dùng lại order hiện có.
      let currentOrderId = orderId;
      if (!currentOrderId) {
        const orderRes = await api.post('/orders', {
          items: items.map((item) => ({
            productId: item.productId,
            size: item.size,
            qty: item.quantity,
            toppings: item.toppings?.flatMap((t) =>
              Array(t.quantity).fill(t.name),
            ) || [],
            lineTotal: item.lineTotal,
          })),
          ...(appliedPromo?.code ? { promoCode: appliedPromo.code } : {}),
        });
        currentOrderId = orderRes.data.data?.id;
        if (!currentOrderId) {
          throw new Error('Không thể khởi tạo đơn hàng từ máy chủ.');
        }
        setOrderId(currentOrderId);
      }

      // 2. Cùng một thao tác thanh toán luôn dùng cùng key, kể cả khi request timeout.
      if (!paymentAttemptRef.current) {
        paymentAttemptRef.current =
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `checkout-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      }

      // 3. Contract hiện có là POST /checkout (CheckoutController), không phải /payments.
      const paymentRes = await api.post(
        '/checkout',
        {
          orderId: currentOrderId,
          method,
          ...(appliedPromo?.code ? { promoCode: appliedPromo.code } : {}),
        },
        {
          headers: {
            'Idempotency-Key': paymentAttemptRef.current,
          },
        },
      );

      const paymentData = paymentRes.data as {
        success?: boolean;
        isDuplicate?: boolean;
        message?: string;
      };
      const orderRes = await api.get(`/orders/${currentOrderId}`);
      const confirmedOrder = orderRes.data.data;

      // Response duplicate không có field success; xác minh trạng thái order là nguồn sự thật.
      if (paymentData.success !== true && confirmedOrder?.status !== 'PAID') {
        // Một response thất bại đã được backend xác nhận là một attempt mới ở lần retry sau.
        if (paymentData.success === false || confirmedOrder?.status === 'PAYMENT_FAILED') {
          paymentAttemptRef.current = null;
        }
        throw new Error(paymentData.message || 'Giao dịch thanh toán không thành công.');
      }

      const now = new Date();
      const datePrefix = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}`;

      // 4. Xuất hóa đơn điện tử thực tế từ dữ liệu trả về của Server
      setReceiptData({
        orderId: createdOrder.id,
        invoiceNo: `BL-${datePrefix}-${createdOrder.id.slice(-6).toUpperCase()}`,
        paymentId: paymentData.payment?.id || `PAY-${createdOrder.id.slice(-6).toUpperCase()}`,
        paidAt: new Date(paymentData.payment?.createdAt || now).toLocaleString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        }),
        items: [...items],
        subtotal,
        discount: discountAmount,
        promoCode: appliedPromo?.code || createdOrder.promoCode || null,
        finalTotal: paymentData.payment?.amount ?? finalTotal,
        pointsEarned: paymentData.pointsEarned ?? Math.floor(finalTotal / 1000),
        method,
      });

      // 5. Dọn dẹp giỏ hàng, deadline và lượt gia hạn sau khi hoàn tất
      if (typeof window !== 'undefined') {
        localStorage.removeItem(CHECKOUT_DEADLINE_KEY);
        localStorage.removeItem(CHECKOUT_RENEW_COUNT_KEY);
      }
      clearCart();
      router.push(`/orders/${currentOrderId}?confirmed=1`);
    } catch (err: unknown) {
      let message = 'Có lỗi xảy ra trong quá trình thanh toán đơn hàng. Vui lòng thử lại!';
      if (
        typeof err === 'object' &&
        err !== null &&
        'response' in err &&
        typeof (err as { response?: unknown }).response === 'object'
      ) {
        const resData = (err as { response?: { data?: { message?: unknown } } }).response?.data;
        if (resData?.message) {
          message = Array.isArray(resData.message)
            ? resData.message.join(', ')
            : String(resData.message);
        }
      } else if (err instanceof Error) {
        message = err.message;
      }

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
            if (typeof window !== 'undefined') {
              localStorage.removeItem(CHECKOUT_DEADLINE_KEY);
              localStorage.removeItem(CHECKOUT_RENEW_COUNT_KEY);
            }
            setReceiptData(null);
            clearCart();
          }}
        />
      </main>
    );
  }

  // Chờ đọc xong dữ liệu giỏ hàng từ localStorage để tránh giật giao diện
  if (!hasHydrated) {
    return (
      <main className="mx-auto flex w-full max-w-md flex-1 items-center justify-center px-4 py-24">
        <div className="flex flex-col items-center gap-3 text-sm text-gray-500 font-medium">
          <svg className="h-7 w-7 animate-spin text-primary" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
          Đang tải thông tin đơn hàng...
        </div>
      </main>
    );
  }

  // 2. NẾU GIỎ HÀNG TRỐNG → HIỂN THỊ COMPONENT THÔNG BÁO VỀ MENU
  if (items.length === 0) {
    return <EmptyCheckout />;
  }

  // 3. GIAO DIỆN CHECKOUT CHÍNH
  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-6 px-4 py-6 pb-20 lg:px-8">
      {/* Đồng hồ đếm ngược chạy ngầm đồng bộ với nút thanh toán */}
      <CountdownTimer
        timeLeft={timeLeft}
        isExpired={isExpired}
        showUI={false}
      />

      {errorMessage && (
        <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-200">
          ⚠️ {errorMessage}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* CỘT TRÁI: Phương thức thanh toán (7 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          <CheckoutMethods
            method={method}
            onMethodChange={setMethod}
            finalTotal={finalTotal}
            qrUrl={vietQrUrl}
            cardInfo={cardInfo}
            onCardInfoChange={handleCardInfoChange}
            cardErrors={cardErrors}
            onFillDemoCard={handleFillDemoCard}
            onClearCard={handleClearCard}
          />
        </div>

        {/* CỘT PHẢI: Tóm tắt đơn hàng + Bảng tính tiền + Nút thanh toán (5 cols) */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <OrderSummary
            items={items}
            subtotal={subtotal}
            finalTotal={finalTotal}
            pointsEarned={pointsEarned}
            isSubmitting={isSubmitting}
            isExpired={isExpired}
            canRenew={canRenew}
            durationSeconds={CHECKOUT_DURATION_SECONDS}
            onCheckout={handleCheckout}
            onPayment={handleCheckout}
            onRenew={handleRenewOrder}
            onReturnToCart={() => router.push('/cart')}
            appliedPromo={appliedPromo}
            onApplyPromo={applyPromo}
            onRemovePromo={removePromo}
          />
        </div>
      </div>
    </main>
  );
}
