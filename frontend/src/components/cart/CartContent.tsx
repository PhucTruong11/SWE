'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';
import { CartItemRow } from './CartItemRow';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';

interface CartContentProps {
  onClose?: () => void;
}

export function CartContent({ onClose }: CartContentProps) {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();

  // State quản lý loading và lỗi khi tạo đơn hàng
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- STATE QUẢN LÝ PROMO CODE ---
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const subtotal = totalPrice();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  const handleCheckoutClick = () => {
    if (onClose) onClose();
  };

  // --- HÀM ÁP DỤNG MÃ GIẢM GIÁ ---
  const handleApplyPromo = async () => {
    if (!promoCode.trim()) {
      setPromoMsg({ type: 'error', text: 'Vui lòng nhập mã ưu đãi!' });
      return;
    }

    setPromoLoading(true);
    setPromoMsg(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${backendUrl}/promotions/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCode,
          subtotal: subtotal,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setDiscountAmount(0);
        setAppliedCode(null);
        setPromoMsg({ type: 'error', text: json.message || 'Mã ưu đãi không hợp lệ' });
        return;
      }

      setDiscountAmount(json.discountAmount);
      setAppliedCode(json.code);
      setPromoMsg({ type: 'success', text: json.message || 'Áp dụng mã ưu đãi thành công!' });
    } catch {
      setDiscountAmount(0);
      setAppliedCode(null);
      setPromoMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ!' });
    } finally {
      setPromoLoading(false);
    }
  };

  // --- HÀM TẠO ĐƠN HÀNG (POST /api/orders) ---
  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      // Đóng gói dữ liệu bao gồm cả mã promoCode đã áp dụng thành công (nếu có)
      const payload = {
        items: items.map((item) => ({
          productId: item.productId,
          size: item.size,
          qty: item.quantity,
          toppings: item.toppings?.map((t) => t.name) ?? [],
          lineTotal: item.lineTotal,
        })),
        promoCode: appliedCode,
      };

      const res = await fetch(`${backendUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMsg(json.message || 'Có lỗi xảy ra, vui lòng thử lại!');
        return;
      }

      // Thành công: xóa giỏ hàng và chuyển sang trang xác nhận
      const orderId = json.data?.id;
      clearCart();
      router.push(`/order-success?orderId=${orderId}`);
    } catch {
      setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại kết nối!');
    } finally {
      setIsLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-text mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-8 max-w-xs">
          Bạn chưa chọn món nào. Hãy xem menu để chọn những thức uống tuyệt ngon nhé!
        </p>
        <Link
          href="/"
          onClick={handleCheckoutClick}
          className="bg-primary hover:bg-primary-hover text-white px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95 mb-4 block"
        >
          Khám phá Thực đơn
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-surface">
      {/* 1. Danh sách sản phẩm (Có thể cuộn) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-background/50">
        <h2 className="font-bold text-lg text-text mb-4">
          Món đã chọn ({totalItems()})
        </h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {items.map((item, index) => (
            <CartItemRow key={index} item={item} index={index} />
          ))}
        </div>
      </div>

      {/* 2. Khối Mã giảm giá & Tóm tắt đơn hàng (Cố định ở dưới) */}
      <div className="bg-white p-4 md:p-6 border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        {/* Promo Code Input */}
        <div className="mb-2 flex gap-2">
          <input
            type="text"
            placeholder="Nhập mã ưu đãi (Promo)"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <button
            onClick={handleApplyPromo}
            disabled={promoLoading}
            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-text font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1"
          >
            {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Áp dụng'}
          </button>
        </div>

        {/* Thông báo kết quả Áp dụng Mã giảm giá */}
        {promoMsg && (
          <div
            className={`mb-4 flex items-center gap-1.5 text-xs font-medium ${
              promoMsg.type === 'success' ? 'text-green-600' : 'text-red-500'
            }`}
          >
            {promoMsg.type === 'success' ? (
              <CheckCircle2 size={14} className="flex-shrink-0" />
            ) : (
              <AlertCircle size={14} className="flex-shrink-0" />
            )}
            <span>{promoMsg.text}</span>
          </div>
        )}

        {/* Bảng tính tiền */}
        <div className="space-y-3 mb-6 text-sm text-text mt-4">
          <div className="flex justify-between">
            <span className="text-gray-500">Tạm tính</span>
            <span className="font-bold">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Giảm giá</span>
            <span className="font-bold text-red-500">
              - {discountAmount.toLocaleString('vi-VN')}đ
            </span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-end">
            <span className="font-bold text-base">Tổng cộng</span>
            <span className="font-bold text-2xl text-primary">
              {finalTotal.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* Thông báo lỗi khi Đặt hàng không thành công */}
        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Nút Tiến hành Thanh toán */}
        <button
          onClick={handlePlaceOrder}
          disabled={isLoading}
          className="w-full bg-primary hover:bg-primary-hover disabled:bg-primary/60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          {isLoading ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Đang xử lý...
            </>
          ) : (
            <>
              Tiến hành Thanh toán <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}