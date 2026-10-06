'use client';

import { useState } from 'react';
import { formatVND } from '@/lib/utils';
import type { CartItem } from '@/types';
import type { AppliedPromo } from '@/lib/voucher';
import { calculateVoucherDiscount } from '@/lib/voucher';

interface OrderSummaryProps {
  items: CartItem[];
  subtotal?: number;
  finalTotal: number;
  pointsEarned: number;
  isSubmitting: boolean;
  isExpired: boolean;
  onCheckout?: () => void;
  onPayment?: () => void;
  onRenew?: () => void;
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
  onCheckout,
  onPayment,
  onRenew,
  appliedPromo,
  onApplyPromo,
  onRemovePromo,
}: OrderSummaryProps) {
  const [voucherInput, setVoucherInput] = useState('');
  const [voucherError, setVoucherError] = useState<string | null>(null);

  const triggerCheckout = onCheckout || onPayment;
  const totalItemsCount = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
  const itemsSubtotal = propSubtotal ?? items.reduce((sum, item) => sum + (item.lineTotal ?? 0), 0);

  const handleApplyVoucher = () => {
    setVoucherError(null);
    const result = calculateVoucherDiscount(voucherInput, itemsSubtotal);
    if (!result.valid) {
      setVoucherError(result.message);
      return;
    }
    if (onApplyPromo) {
      onApplyPromo({
        code: voucherInput.trim().toUpperCase(),
        discount: result.discount,
        description: result.description,
      });
    }
    setVoucherInput('');
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-900/10">
      <h2 className="text-lg font-bold text-[#1E3932] mb-4">
        Chi tiết đơn hàng ({totalItemsCount} món)
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
              {formatVND(item.lineTotal ?? 0)}
            </span>
          </div>
        ))}
      </div>

      {/* Khối Áp dụng Voucher tại Checkout */}
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
          <button
            type="button"
            onClick={onRemovePromo}
            className="text-xs text-red-500 hover:text-red-700 hover:underline font-semibold ml-2"
          >
            Bỏ mã
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Nhập mã ưu đãi của bạn"
              value={voucherInput}
              onChange={(e) => {
                setVoucherInput(e.target.value.toUpperCase());
                if (voucherError) setVoucherError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleApplyVoucher();
              }}
              className={`flex-1 rounded-xl border p-2 text-xs uppercase outline-none transition-colors ${
                voucherError
                  ? 'border-red-400 bg-red-50/40 focus:border-red-500'
                  : 'border-gray-200 bg-[#FAF6EE] focus:border-primary'
              }`}
            />
            <button
              type="button"
              onClick={handleApplyVoucher}
              className="rounded-xl bg-primary px-3.5 py-2 text-xs font-bold text-white hover:bg-primary-hover shadow-sm active:scale-95 transition-all"
            >
              Áp dụng
            </button>
          </div>
          {voucherError && (
            <p className="mt-1 text-[11px] text-red-500 font-medium">⚠️ {voucherError}</p>
          )}
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

      {/* Nút bấm thanh toán chính hoặc Gia hạn khi hết hạn */}
      {isExpired ? (
        <button
          type="button"
          onClick={onRenew}
          className="mt-6 w-full rounded-full py-4 text-center font-bold text-white bg-amber-600 hover:bg-amber-700 shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <span>🔄</span> Làm mới đơn hàng (Gia hạn 3 phút)
        </button>
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
