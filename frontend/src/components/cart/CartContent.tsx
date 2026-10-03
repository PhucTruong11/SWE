'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/stores/cart.store';
import { CartItemRow } from './CartItemRow';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, Loader2, AlertCircle, CheckCircle2, ChevronDown, Tag } from 'lucide-react';

interface CartContentProps {
  onClose?: () => void;
}

interface Promotion {
  id: string;
  code: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
}

export function CartContent({ onClose }: CartContentProps) {
  const router = useRouter();
  const { items, totalPrice, totalItems, clearCart } = useCartStore();

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // --- STATE QUẢN LÝ PROMO CODE & DANH SÁCH MÃ ---
  const [promoCode, setPromoCode] = useState('');
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoMsg, setPromoMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [availablePromos, setAvailablePromos] = useState<Promotion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const subtotal = totalPrice();
  const finalTotal = Math.max(0, subtotal - discountAmount);

  // Gọi API lấy danh sách mã ưu đãi đang hoạt động khi component mount
  useEffect(() => {
    const fetchPromos = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${backendUrl}/promotions`);
        if (res.ok) {
          const data = await res.json();
          setAvailablePromos(data);
        }
      } catch (err) {
        console.error('Không thể tải danh sách mã ưu đãi', err);
      }
    };
    fetchPromos();
  }, []);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCheckoutClick = () => {
    if (onClose) onClose();
  };

  // --- HÀM ÁP DỤNG MÃ GIẢM GIÁ ---
  const handleApplyPromo = async (codeToApply?: string) => {
    const targetCode = codeToApply || promoCode;
    if (!targetCode.trim()) {
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
          code: targetCode,
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

      setPromoCode(json.code);
      setDiscountAmount(json.discountAmount);
      setAppliedCode(json.code);
      setPromoMsg({ type: 'success', text: json.message || 'Áp dụng mã ưu đãi thành công!' });
      setShowDropdown(false);
    } catch {
      setDiscountAmount(0);
      setAppliedCode(null);
      setPromoMsg({ type: 'error', text: 'Không thể kết nối đến máy chủ!' });
    } finally {
      setPromoLoading(false);
    }
  };

  // --- HÀM TẠO ĐƠN HÀNG ---
  const handlePlaceOrder = async () => {
    setIsLoading(true);
    setErrorMsg(null);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

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
      {/* 1. Danh sách sản phẩm */}
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

      {/* 2. Khối Mã giảm giá & Tóm tắt đơn hàng */}
      <div className="bg-white p-4 md:p-6 border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        
        {/* Khung nhập mã & Danh sách mã gợi ý */}
        <div className="relative mb-2" ref={dropdownRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Nhập mã ưu đãi hoặc chọn..."
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                onClick={() => setShowDropdown(true)}
                className="w-full border border-gray-200 rounded-xl pl-4 pr-10 py-2.5 text-sm uppercase focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <ChevronDown size={18} />
              </button>
            </div>
            <button
              onClick={() => handleApplyPromo()}
              disabled={promoLoading}
              className="bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-text font-bold px-5 py-2.5 rounded-xl text-sm transition-colors flex items-center gap-1"
            >
              {promoLoading ? <Loader2 size={16} className="animate-spin" /> : 'Áp dụng'}
            </button>
          </div>

          {/* Dropdown danh sách mã ưu đãi có thể chọn */}
          {showDropdown && (
            <div className="absolute left-0 right-0 bottom-full mb-2 bg-white border border-gray-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto z-50 p-2">
              <div className="px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 flex items-center gap-1">
                <Tag size={12} /> Mã ưu đãi khả dụng
              </div>
              {availablePromos.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">Không có mã ưu đãi nào khả dụng</div>
              ) : (
                availablePromos.map((promo) => {
                  const isEligible = subtotal >= promo.minOrderValue;
                  return (
                    <div
                      key={promo.id}
                      onClick={() => {
                        if (isEligible) {
                          handleApplyPromo(promo.code);
                        }
                      }}
                      className={`p-3 rounded-xl transition-all my-1 flex flex-col gap-1 ${
                        isEligible
                          ? 'hover:bg-primary/5 cursor-pointer border border-transparent hover:border-primary/20'
                          : 'opacity-50 bg-gray-50 cursor-not-allowed'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-primary text-sm">{promo.code}</span>
                        <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          {promo.discountType === 'PERCENTAGE' ? `Giảm ${promo.discountValue}%` : `Giảm ${promo.discountValue.toLocaleString('vi-VN')}đ`}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Đơn tối thiểu: {promo.minOrderValue.toLocaleString('vi-VN')}đ
                      </p>
                      {!isEligible && (
                        <p className="text-[10px] text-red-500 font-medium">Chưa đạt giá trị tối thiểu để dùng mã này</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
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

        {errorMsg && (
          <div className="mb-4 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

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