'use client';

import React from 'react';
import { formatVND } from '@/lib/utils';

export interface CardFormData {
  cardNumber: string;
  cardHolder: string;
  expiry: string;
  cvv: string;
}

interface PaymentMethodsProps {
  method: 'EWALLET' | 'CARD';
  onMethodChange: (method: 'EWALLET' | 'CARD') => void;
  finalTotal: number;
  qrUrl: string;
  cardInfo: CardFormData;
  onCardInfoChange: (data: CardFormData) => void;
}

export function PaymentMethods({
  method,
  onMethodChange,
  finalTotal,
  qrUrl,
  cardInfo,
  onCardInfoChange,
}: PaymentMethodsProps) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-emerald-900/10">
      <h2 className="text-lg font-bold text-[#1E3932] mb-4">
        Chọn phương thức thanh toán
      </h2>

      {/* Tabs chuyển đổi */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => onMethodChange('EWALLET')}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 border-2 transition-all ${
            method === 'EWALLET'
              ? 'border-primary bg-emerald-50/50 text-primary font-bold shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="text-2xl">📱</span>
          <span className="text-sm">Ví MoMo / VietQR</span>
        </button>

        <button
          type="button"
          onClick={() => onMethodChange('CARD')}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl p-4 border-2 transition-all ${
            method === 'CARD'
              ? 'border-primary bg-emerald-50/50 text-primary font-bold shadow-sm'
              : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
        >
          <span className="text-2xl">💳</span>
          <span className="text-sm">Thẻ ngân hàng</span>
        </button>
      </div>

      {/* Chi tiết cho Tab Ví MoMo */}
      {method === 'EWALLET' && (
        <div className="flex flex-col items-center rounded-xl bg-emerald-50/40 p-6 border border-emerald-100 text-center">
          <p className="text-xs uppercase tracking-wider font-extrabold text-primary mb-3">
            Quét mã QR MoMo / Ngân Hàng
          </p>

          <div className="relative rounded-2xl bg-white p-4 shadow-md border-2 border-primary/20">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={qrUrl}
              alt="Mã QR thanh toán BrewLite"
              className="h-48 w-48 object-contain rounded-lg"
            />
            <div className="mt-2 text-[11px] font-semibold text-gray-500">
              Số tiền: <strong className="text-primary">{formatVND(finalTotal)}</strong>
            </div>
          </div>

          <p className="text-xs text-gray-600 mt-4 max-w-xs">
            Mở ứng dụng <strong>MoMo</strong> hoặc bất kỳ <strong>App Ngân Hàng</strong> để quét mã, hoặc bấm nút <strong className="text-primary">Xác nhận thanh toán</strong> bên dưới để hoàn tất ngay.
          </p>
        </div>
      )}

      {/* Chi tiết cho Tab Thẻ ngân hàng */}
      {method === 'CARD' && (
        <div className="flex flex-col gap-4">
          {/* Thẻ ATM/Visa mô phỏng */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-tr from-[#004d33] via-[#006241] to-[#1E5631] p-5 text-white shadow-lg">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold tracking-widest opacity-80 uppercase">
                BrewLite Platinum Card
              </span>
              <span className="text-xl font-black italic">VISA</span>
            </div>
            <div className="my-5 font-mono text-lg tracking-widest">
              {cardInfo.cardNumber}
            </div>
            <div className="flex justify-between text-xs opacity-90">
              <div>
                <span className="text-[10px] block opacity-70">CHỦ THẺ</span>
                <strong className="tracking-wider">{cardInfo.cardHolder}</strong>
              </div>
              <div>
                <span className="text-[10px] block opacity-70">HẾT HẠN</span>
                <strong>{cardInfo.expiry}</strong>
              </div>
            </div>
          </div>

          {/* Form nhập thẻ */}
          <div className="space-y-3 text-xs text-[#1E3932] mt-2">
            <div>
              <label className="font-semibold block mb-1">Số thẻ (Demo):</label>
              <input
                type="text"
                value={cardInfo.cardNumber}
                onChange={(e) =>
                  onCardInfoChange({ ...cardInfo, cardNumber: e.target.value })
                }
                className="w-full rounded-xl border border-gray-200 bg-[#FAF6EE] p-2.5 text-sm font-mono outline-none focus:border-primary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold block mb-1">Họ tên chủ thẻ:</label>
                <input
                  type="text"
                  value={cardInfo.cardHolder}
                  onChange={(e) =>
                    onCardInfoChange({ ...cardInfo, cardHolder: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-[#FAF6EE] p-2.5 text-sm uppercase outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Ngày hết hạn (MM/YY):</label>
                <input
                  type="text"
                  value={cardInfo.expiry}
                  onChange={(e) =>
                    onCardInfoChange({ ...cardInfo, expiry: e.target.value })
                  }
                  className="w-full rounded-xl border border-gray-200 bg-[#FAF6EE] p-2.5 text-sm font-mono outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
