'use client';

import { useCartStore } from '@/stores/cart.store';
import { CartItemRow } from './CartItemRow';
import Link from 'next/link';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface CartContentProps {
  onClose?: () => void; // Dùng khi đang ở trong Modal (nhấn Thanh toán thì đóng Modal)
}

export function CartContent({ onClose }: CartContentProps) {
  const { items, totalPrice, totalItems } = useCartStore();

  const handleCheckoutClick = () => {
    if (onClose) onClose();
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
        
        {/* Promo Code Input (Giành phần cho bạn khác làm logic sau) */}
        <div className="mb-6 flex gap-2">
          <input 
            type="text" 
            placeholder="Nhập mã ưu đãi (Promo)" 
            className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
          />
          <button className="bg-gray-100 hover:bg-gray-200 text-text font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
            Áp dụng
          </button>
        </div>

        {/* Bảng tính tiền */}
        <div className="space-y-3 mb-6 text-sm text-text">
          <div className="flex justify-between">
            <span className="text-gray-500">Tạm tính</span>
            <span className="font-bold">{totalPrice().toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Giảm giá</span>
            <span className="font-bold text-red-500">- 0đ</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-end">
            <span className="font-bold text-base">Tổng cộng</span>
            <span className="font-bold text-2xl text-primary">
              {totalPrice().toLocaleString('vi-VN')}đ
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
