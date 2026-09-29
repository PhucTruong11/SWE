'use client';

import React from 'react';
import { formatVND } from '@/lib/utils';
import type { CartItem } from '@/types';

interface OrderSummaryProps {
  items: CartItem[];
  finalTotal: number;
  pointsEarned: number;
  isSubmitting: boolean;
  isExpired: boolean;
  onPayment: () => void;
}

export function OrderSummary({
  items,
  finalTotal,
  pointsEarned,
  isSubmitting,
  isExpired,
  onPayment,
}: OrderSummaryProps) {
  const totalItemsCount = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);

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
              {formatVND(item.lineTotal)}
            </span>
          </div>
        ))}
      </div>

      {/* Bảng tính tiền chi tiết */}
      <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-xs">
        <div className="flex justify-between text-gray-600">
          <span>Tạm tính:</span>
          <span className="font-semibold text-gray-900">{formatVND(finalTotal)}</span>
        </div>

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

      {/* Nút bấm thanh toán chính */}
      <button
        type="button"
        disabled={isSubmitting || isExpired}
        onClick={onPayment}
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
    </div>
  );
}
