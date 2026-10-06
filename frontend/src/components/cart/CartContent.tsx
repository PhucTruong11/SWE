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
  description?: string;
  discountType: string;
  discountValue: number;
  minOrderValue: number;
  maxDiscount?: number;
}

export function CartContent({ onClose }: CartContentProps) {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { items, totalPrice, totalItems } = useCartStore();
  
  const [showLoginModal, setShowLoginModal] = useState(false);
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
        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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
      // Không đóng panel - người dùng có thể muốn đổi sang mã khác
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
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

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

      const res = await fetch(`${backendUrl}/orders`, {
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
    <>
      {/* Wrapper layout ngoài cùng (chiếm full màn hình) */}
      <div className="flex w-full md:justify-center transition-all duration-300 items-stretch relative z-20">
        
        {/* Wrapper vừa khít 2 cột - Gắn ref vào đây để click 2 bên trái/phải sẽ báo là click ra ngoài */}
        <div ref={dropdownRef} className="flex items-stretch">
      
      {/* 1. CỘT TRÁI: GIỎ HÀNG CHÍNH */}
      <div 
        className="flex flex-col bg-surface md:bg-white h-full md:h-auto w-full md:w-[650px] md:rounded-3xl md:shadow-xl md:border md:border-gray-100 md:overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0"
      >
        {/* Danh sách sản phẩm */}
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

        {/* Khối Mã giảm giá & Tóm tắt đơn hàng */}
        <div className="bg-white p-4 md:p-6 border-t border-gray-100 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          
          {/* Khung nhập mã */}
          <div className="relative mb-2">
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
                  className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-transform duration-300 ${showDropdown ? 'rotate-180 md:rotate-90' : ''}`}
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

            {/* DÀNH CHO MOBILE: Hiển thị danh sách mã inline (Bên dưới ô nhập) */}
            <div className={`md:hidden overflow-hidden transition-all duration-300 ${showDropdown ? 'max-h-[300px] mt-4 opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Tag size={12} /> Mã khả dụng
              </div>
              <div className="overflow-y-auto max-h-[250px] pr-1 space-y-2">
                {availablePromos.length === 0 ? (
                  <p className="text-sm text-gray-500">Không có mã ưu đãi</p>
                ) : (
                  availablePromos.map((promo) => {
                    const isEligible = subtotal >= promo.minOrderValue;
                    return (
                      <div
                        key={promo.id}
                        onClick={() => { if (isEligible) handleApplyPromo(promo.code); }}
                        className={`p-3 rounded-xl border transition-all ${isEligible ? 'bg-white border-gray-200 cursor-pointer active:border-primary' : 'bg-gray-50 border-transparent opacity-60'}`}
                      >
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-bold text-primary">{promo.code}</span>
                          <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
                            {promo.discountType === 'PERCENTAGE' ? `-${promo.discountValue}%` : `-${promo.discountValue / 1000}k`}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500">Đơn tối thiểu {promo.minOrderValue.toLocaleString()}đ</p>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
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

      {/* 2. CỘT PHẢI: BẢNG PROMO SLIDE-IN (Chỉ dành cho Desktop) */}
      <div 
        className={`hidden md:flex flex-col bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] shrink-0 ${
          showDropdown ? 'w-[340px] opacity-100 translate-x-0 ml-6' : 'w-0 opacity-0 -translate-x-10 pointer-events-none ml-0 border-0'
        }`}
      >
        <div className="bg-white p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-text text-lg whitespace-nowrap">Kho Voucher</h3>
          </div>
          <p className="text-xs text-gray-500 mt-1 whitespace-nowrap">Chọn mã phù hợp để tiết kiệm hơn nhé!</p>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-background/50">
          <div className="space-y-3 w-[288px]">
            {availablePromos.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Tag size={40} className="mx-auto mb-2 opacity-50" />
                <p className="text-sm">Hiện chưa có ưu đãi nào</p>
              </div>
            ) : (
              availablePromos.map((promo) => {
                const isEligible = subtotal >= promo.minOrderValue;
                return (
                  <div
                    key={promo.id}
                    onClick={() => { 
                      if (!isEligible) return;
                      // Toggle click: Bỏ chọn nếu đang dùng, áp dụng nếu chưa dùng
                      if (appliedCode === promo.code) {
                        setAppliedCode(null);
                        setDiscountAmount(0);
                        setPromoCode('');
                        setPromoMsg(null);
                      } else {
                        handleApplyPromo(promo.code); 
                      }
                    }}
                    className={`relative overflow-hidden p-4 rounded-2xl border-2 transition-all select-none ${
                      appliedCode === promo.code
                        ? 'bg-primary/5 border-primary shadow-md'
                        : isEligible 
                        ? 'bg-white border-gray-200 hover:border-primary/40 hover:shadow-md cursor-pointer' 
                        : 'bg-gray-100 border-gray-100 opacity-60 cursor-not-allowed'
                    }`}
                  >
                    {/* Tick mark nếu đang áp dụng */}
                    {appliedCode === promo.code && (
                      <div className="absolute -right-6 -top-6 bg-primary w-12 h-12 rotate-45 flex items-end justify-center pb-1 shadow-sm">
                        <CheckCircle2 size={12} className="text-white -rotate-45 mb-1" />
                      </div>
                    )}

                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="font-black text-lg text-primary uppercase tracking-tight">{promo.code}</div>
                        <div className="text-xs font-medium text-text/80 mt-0.5">{promo.description || 'Ưu đãi đặc biệt'}</div>
                      </div>
                      <div className="bg-orange-100 text-orange-600 text-xs font-bold px-2 py-1 rounded-lg whitespace-nowrap">
                        {promo.discountType === 'PERCENTAGE' ? `-${promo.discountValue}%` : `-${promo.discountValue / 1000}k`}
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-dashed border-gray-200">
                      <p className="text-xs text-gray-500">Đơn tối thiểu: <span className="font-semibold text-gray-700">{promo.minOrderValue.toLocaleString('vi-VN')}đ</span></p>
                      {promo.maxDiscount && (
                        <p className="text-[10px] text-gray-400 mt-0.5">Giảm tối đa {promo.maxDiscount.toLocaleString('vi-VN')}đ</p>
                      )}
                      
                      {!isEligible && (
                        <div className="mt-2 text-[10px] font-bold text-red-500 bg-red-50 px-2 py-1 rounded-md w-max">
                          Mua thêm {(promo.minOrderValue - subtotal).toLocaleString('vi-VN')}đ để dùng
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
    </div>
    </>
  );
}