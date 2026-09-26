'use client';

import React from 'react';

const QUICK_VOUCHERS = [
  { code: 'CHAOBAN', label: 'Giảm 15k (Đơn từ 40k)', desc: '15.000đ' },
  { code: 'BREW10', label: 'Giảm 10%', desc: '10%' },
  { code: 'FREESHIP', label: 'Giảm 10k', desc: '10.000đ' },
];

interface VoucherSectionProps {
  voucherInput: string;
  onVoucherInputChange: (value: string) => void;
  onApplyVoucher: (code?: string) => void;
  onRemoveVoucher: () => void;
  appliedVoucher: { code: string; discount: number; message: string } | null;
  voucherError: string | null;
}

export function VoucherSection({
  voucherInput,
  onVoucherInputChange,
  onApplyVoucher,
  onRemoveVoucher,
  appliedVoucher,
  voucherError,
}: VoucherSectionProps) {
  return (
    <div className="pt-4 border-t border-gray-100">
      <label className="text-xs font-bold text-[#1E3932] block mb-2">
        🎟️ Áp mã giảm giá (Voucher):
      </label>

      <div className="flex gap-2">
        <input
          type="text"
          value={voucherInput}
          onChange={(e) => onVoucherInputChange(e.target.value.toUpperCase())}
          placeholder="Nhập mã: CHAOBAN..."
          className="flex-1 rounded-xl border border-gray-200 bg-[#FAF6EE] px-3 py-2 text-xs font-bold tracking-wider text-[#1E3932] uppercase outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={() => onApplyVoucher()}
          className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary-hover transition-colors"
        >
          Áp dụng
        </button>
      </div>

      {/* Gợi ý mã nhanh */}
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {QUICK_VOUCHERS.map((v) => (
          <button
            key={v.code}
            type="button"
            onClick={() => onApplyVoucher(v.code)}
            className="rounded-lg border border-primary/20 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary hover:text-white transition-colors"
          >
            {v.code} ({v.desc})
          </button>
        ))}
      </div>

      {voucherError && (
        <p className="mt-2 text-xs text-red-600 font-medium">⚠️ {voucherError}</p>
      )}

      {appliedVoucher && (
        <div className="mt-2 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-800 border border-emerald-200">
          <span>✅ {appliedVoucher.message}</span>
          <button
            type="button"
            onClick={onRemoveVoucher}
            className="font-bold text-red-600 hover:underline ml-2"
          >
            Gỡ
          </button>
        </div>
      )}
    </div>
  );
}
