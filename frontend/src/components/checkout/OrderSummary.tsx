'use client';

import Link from 'next/link';
import { formatVND } from '@/lib/utils';
import { formatCartToppings, getCartItemKey, getCartLineTotal } from '@/lib/cart';
import type { CartItem } from '@/types';
import type { AppliedPromo } from '@/lib/voucher';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal?: number;
  finalTotal: number;
  pointsEarned: number;
  isSubmitting: boolean;
  isExpired: boolean;
  canRenew?: boolean;
  durationSeconds?: number;
  onCheckout?: () => void;
  onPayment?: () => void;
  onRenew?: () => void;
  onReturnToCart?: () => void;
  appliedPromo?: AppliedPromo | null;
  onApplyPromo?: (promo: AppliedPromo) => void;
  onRemovePromo?: () => void;
}

export function OrderSummary({
  items,
  subtotal: propSubtotal,
  finalTotal,
  pointsEarned,
  isSubmitting,
  isExpired,
  canRenew = true,
  durationSeconds = 120,
  onCheckout,
  onPayment,
  onRenew,
  onReturnToCart,
  appliedPromo,
  onApplyPromo: _onApplyPromo,
  onRemovePromo,
}: OrderSummaryProps) {
  const durationLabel = durationSeconds >= 60 ? `${Math.floor(durationSeconds / 60)} phút` : `${durationSeconds} giây`;
  const triggerCheckout = onCheckout || onPayment;
  const totalItemsCount = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const itemsSubtotal = propSubtotal ?? items.reduce((sum, item) => sum + getCartLineTotal(item), 0);

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-900/10">
      <h2 className="text-lg font-bold text-[#1E3932] mb-4">
        Chi tiết đơn hàng ({totalItemsCount} món)
      </h2>

      {/* Danh sách món tóm tắt */}
      <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto pr-1">
        {items.map((item) => (
          <div key={getCartItemKey(item)} className="py-2.5 flex items-start justify-between text-xs">
            <div>
              <span className="font-bold text-[#1E3932]">
                {item.quantity}x {item.name}
              </span>
              <p className="text-gray-500 mt-0.5">
                Size {item.size} {item.toppings && item.toppings.length > 0 ? `• ${formatCartToppings(item.toppings)}` : ''}
              </p>
            </div>
            <span className="font-semibold text-[#1E3932]">
              {formatVND(getCartLineTotal(item))}
            </span>
          </div>
        ))}
      </div>

      {/* Khối Hiển thị Voucher tại Checkout (Chỉ hiển thị, không cho nhập) */}
      {appliedPromo ? (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-emerald-50/90 border border-emerald-200 px-3.5 py-2.5 text-xs text-emerald-900">
          <div>
            <div className="flex items-center gap-1.5">
              <span>🎟️</span>
              <strong className="font-bold text-primary">{appliedPromo.code}</strong>
              <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full ml-1">
                -{formatVND(appliedPromo.discount)}
              </span>
            </div>
            <p className="text-[10px] text-emerald-700 mt-0.5 ml-5 font-medium">
              {appliedPromo.description}
            </p>
          </div>
          {onRemovePromo && (
            <button
              type="button"
              onClick={onRemovePromo}
              className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold ml-2"
            >
              Bỏ mã
            </button>
          )}
        </div>
      ) : (
        /* Khi chưa có mã: Hiện thông báo và link quay lại giỏ hàng */
        <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 border border-dashed border-gray-200 px-3.5 py-2.5 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <span>🎟️</span>
            <span>Chưa áp dụng mã ưu đãi</span>
          </div>
          <Link
            href="/cart"
            className="text-xs text-primary font-semibold hover:underline flex items-center gap-0.5"
          >
            Chọn mã tại giỏ hàng &rarr;
          </Link>
        </div>
      )}

      {/* Bảng tính tiền chi tiết */}
      <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Tạm tính:</span>
          <span className="font-semibold text-gray-900">{formatVND(itemsSubtotal)}</span>
        </div>

        {appliedPromo && (
          <div className="flex justify-between text-emerald-700 font-medium">
            <span>Giảm giá ({appliedPromo.code}):</span>
            <span className="font-bold">-{formatVND(appliedPromo.discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-emerald-900 pt-1">
          <span>Tích lũy điểm (10.000đ = 1 điểm):</span>
          <span className="font-bold">+{pointsEarned} điểm</span>
        </div>

        <div className="flex items-center justify-between border-t border-gray-200 pt-3 text-base font-extrabold text-[#1E3932]">
          <span>TỔNG THANH TOÁN:</span>
          <span className="text-xl text-primary font-black">
            {formatVND(finalTotal)}
          </span>
        </div>
      </div>

      {/* Nút bấm thanh toán chính hoặc Gia hạn khi hết hạn */}
      {isExpired ? (
        canRenew ? (
          <button
            type="button"
            onClick={onRenew}
            className="mt-6 w-full rounded-full py-4 text-center font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            Làm mới đơn hàng (Gia hạn {durationLabel})
          </button>
        ) : (
          <div className="mt-6 flex flex-col gap-2">
            <button
              type="button"
              disabled
              className="w-full rounded-full py-4 text-center font-bold text-gray-500 bg-gray-200 cursor-not-allowed shadow-sm"
            >
              Đã hết hạn thanh toán
            </button>
            <p className="text-center text-xs text-red-600 font-semibold">
              Đơn hàng đã hết 2 cơ hội thanh toán. Mã ưu đãi (nếu có) đã tự động bị thu hồi. Vui lòng quay lại giỏ hàng để tạo đơn mới.
            </p>
            {onReturnToCart && (
              <button
                type="button"
                onClick={onReturnToCart}
                className="w-full rounded-full border border-primary text-primary hover:bg-primary/5 py-2.5 text-center text-xs font-bold transition-all active:scale-[0.99]"
              >
                Quay lại giỏ hàng
              </button>
            )}
          </div>
        )
      ) : (
        <button
          type="button"
          disabled={isSubmitting}
          onClick={triggerCheckout}
          className={`mt-6 w-full rounded-full py-4 text-center font-bold text-white shadow-lg transition-all ${
            isSubmitting
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
          ) : (
            `Xác nhận trả ${formatVND(finalTotal)}`
          )}
        </button>
      )}
    </div>
  );
}
