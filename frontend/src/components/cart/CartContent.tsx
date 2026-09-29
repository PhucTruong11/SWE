'use client';

import { useState } from 'react';
import { useCartStore, calculateVoucherDiscount } from '@/stores/cart.store';
import { CartItemRow } from './CartItemRow';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface CartContentProps {
  onClose?: () => void; // Dùng khi đang ở trong Modal (nhấn Thanh toán thì đóng Modal)
}

export function CartContent({ onClose }: CartContentProps) {
  const { items, totalPrice, totalItems, appliedPromo, applyPromo, removePromo } = useCartStore();
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState<string | null>(null);

  const handleCheckoutClick = () => {
    if (onClose) onClose();
  };

  const handleApplyPromo = () => {
    setPromoError(null);
    const subtotal = totalPrice();
    const result = calculateVoucherDiscount(promoInput, subtotal);
    if (!result.valid) {
      setPromoError(result.message);
      return;
    }
    applyPromo({
      code: promoInput.trim().toUpperCase(),
      discount: result.discount,
      description: result.description,
    });
    setPromoInput('');
  };

  const handleRemovePromo = () => {
    removePromo();
    setPromoError(null);
  };

  const subtotal = totalPrice();
  const discountAmount = appliedPromo ? appliedPromo.discount : 0;
  const finalPrice = Math.max(0, subtotal - discountAmount);

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
            <CartItemRow 
              key={index} 
              item={item}
              index={index}
            />
          ))}
        </div>
      </div>

      {/* 2. Khối Mã giảm giá & Tóm tắt đơn hàng (Cố định ở dưới) */}
      <div className="bg-white p-4 md:p-6 border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        
        {/* Khối nhập mã giảm giá / Đã áp dụng mã */}
        {appliedPromo ? (
          <div className="mb-5 flex items-center justify-between bg-emerald-50/80 border border-emerald-200 rounded-xl px-4 py-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base">🎟️</span>
                <span className="font-bold text-emerald-900 text-sm">{appliedPromo.code}</span>
                <span className="text-xs font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  -{appliedPromo.discount.toLocaleString('vi-VN')}đ
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 mt-0.5 ml-6">
                {appliedPromo.description}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemovePromo}
              className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold ml-2 shrink-0"
            >
              Bỏ mã
            </button>
          </div>
        ) : (
          <div className="mb-5">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nhập mã ưu đãi (Ví dụ: CHAOBAN, BREW10...)"
                value={promoInput}
                onChange={(e) => {
                  setPromoInput(e.target.value.toUpperCase());
                  if (promoError) setPromoError(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleApplyPromo();
                }}
                className={`flex-1 border rounded-xl px-4 py-2.5 text-sm uppercase focus:outline-none transition-all ${
                  promoError
                    ? 'border-red-400 bg-red-50/30 focus:border-red-500'
                    : 'border-gray-200 focus:border-primary focus:ring-1 focus:ring-primary/20'
                }`}
              />
              <button
                type="button"
                onClick={handleApplyPromo}
                className="bg-primary hover:bg-primary-hover text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors shadow-sm active:scale-95"
              >
                Áp dụng
              </button>
            </div>
            {promoError && (
              <p className="mt-1.5 text-xs text-red-500 font-medium">⚠️ {promoError}</p>
            )}
          </div>
        )}

        {/* Bảng tính tiền */}
        <div className="space-y-3 mb-6 text-sm text-text">
          <div className="flex justify-between">
            <span className="text-gray-500">Tạm tính</span>
            <span className="font-bold">{subtotal.toLocaleString('vi-VN')}đ</span>
          </div>

          {appliedPromo && (
            <div className="flex justify-between text-emerald-700 font-medium">
              <span>Mã giảm giá ({appliedPromo.code})</span>
              <span className="font-bold">-{discountAmount.toLocaleString('vi-VN')}đ</span>
            </div>
          )}

          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-end">
            <span className="font-bold text-base">Tổng cộng</span>
            <span className="font-bold text-2xl text-primary">
              {finalPrice.toLocaleString('vi-VN')}đ
            </span>
          </div>
        </div>

        {/* Nút thanh toán */}
        <Link 
          href="/checkout"
          onClick={handleCheckoutClick}
          className="w-full bg-primary hover:bg-primary-hover text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md hover:shadow-lg active:scale-95"
        >
          Tiến hành Thanh toán <ArrowRight size={20} />
        </Link>
      </div>
    </div>
  );
}
