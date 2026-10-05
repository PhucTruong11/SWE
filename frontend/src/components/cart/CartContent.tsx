'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart.store';
import { CartItemRow } from './CartItemRow';
import Link from 'next/link';
import { ShoppingBag, ArrowRight, LogIn } from 'lucide-react';

interface CartContentProps {
  onClose?: () => void;
}

export function CartContent({ onClose }: CartContentProps) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, totalPrice, totalItems } = useCartStore();
  
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleCheckoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isAuthenticated) {
      setShowLoginModal(true); // Mở modal khi chưa đăng nhập
    } else {
      if (onClose) onClose();
      router.push('/checkout');
    }
  };

  const confirmLogin = () => {
    setShowLoginModal(false);
    if (onClose) onClose();
    router.push('/auth/login?redirect=/cart');
  };

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <ShoppingBag size={48} className="text-gray-300" />
        </div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Giỏ hàng trống</h2>
        <p className="text-gray-500 mb-8 max-w-xs">Bạn chưa chọn món nào. Hãy xem menu để chọn thức uống nhé!</p>
        <Link href="/" onClick={() => { if (onClose) onClose(); }} className="bg-amber-600 hover:bg-amber-700 text-white px-8 py-3 rounded-full font-bold transition-all shadow-md active:scale-95 mb-4 block">
          Khám phá Thực đơn
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/50">
        <h2 className="font-bold text-lg text-gray-800 mb-4">Món đã chọn ({totalItems()})</h2>
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          {items.map((item, index) => (
            <CartItemRow key={index} item={item} index={index} />
          ))}
        </div>
      </div>

      <div className="bg-white p-4 md:p-6 border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
        <div className="space-y-3 mb-6 text-sm text-gray-800">
          <div className="flex justify-between">
            <span className="text-gray-500">Tạm tính</span>
            <span className="font-bold">{totalPrice().toLocaleString('vi-VN')}đ</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-3 flex justify-between items-end">
            <span className="font-bold text-base">Tổng cộng</span>
            <span className="font-bold text-2xl text-amber-600">{totalPrice().toLocaleString('vi-VN')}đ</span>
          </div>
        </div>

        <button onClick={handleCheckoutClick} className="w-full bg-amber-600 hover:bg-amber-700 text-white py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-md active:scale-95">
          {authLoading ? 'Đang kiểm tra...' : 'Tiến hành Thanh toán'} <ArrowRight size={20} />
        </button>
      </div>

      {/* MODAL THÔNG BÁO */}
      {showLoginModal && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border border-gray-100">
            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn size={24} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Yêu cầu đăng nhập</h3>
            <p className="text-sm text-gray-500 mb-6">Bạn cần đăng nhập để tiếp tục thanh toán. Bạn có muốn đăng nhập ngay không?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLoginModal(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-50">Hủy</button>
              <button onClick={confirmLogin} className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold">Đăng nhập</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}