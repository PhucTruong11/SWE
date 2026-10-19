'use client';

import { useState } from 'react';
import { Gift, Award, Star, ArrowRight, CheckCircle2, Ticket, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface VoucherOption {
  id: string;
  code: string;
  description: string;
  pointsRequired: number;
  discountValue: string;
}

export default function RewardsPage() {
  const [points, setPoints] = useState<number>(120);
  const [redeemingId, setRedeemingId] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [vouchers] = useState<VoucherOption[]>([
    {
      id: '1',
      code: 'REWARD10K',
      description: 'Giảm 10.000đ cho đơn hàng bất kỳ',
      pointsRequired: 40,
      discountValue: '10.000đ',
    },
    {
      id: '2',
      code: 'COFFEE20K',
      description: 'Giảm 20.000đ cho đơn từ 70.000đ',
      pointsRequired: 80,
      discountValue: '20.000đ',
    },
    {
      id: '3',
      code: 'FREESHIP',
      description: 'Miễn phí giao hàng cho đơn từ 50.000đ',
      pointsRequired: 100,
      discountValue: 'Freeship',
    },
    {
      id: '4',
      code: 'SPECIAL50K',
      description: 'Giảm 50.000đ cho đơn từ 150.000đ',
      pointsRequired: 180,
      discountValue: '50.000đ',
    },
  ]);

  const handleRedeem = (voucher: VoucherOption) => {
    if (points < voucher.pointsRequired) {
      setMsg({ type: 'error', text: 'Số điểm của bạn chưa đủ để đổi voucher này!' });
      return;
    }

    setRedeemingId(voucher.id);
    setMsg(null);

    setTimeout(() => {
      setPoints((prev) => prev - voucher.pointsRequired);
      setRedeemingId(null);
      setMsg({
        type: 'success',
        text: `Đổi thành công mã ${voucher.code}! Mã đã sẵn sàng để sử dụng tại trang Giỏ hàng.`,
      });
    }, 800);
  };

  return (
    <div className="min-h-screen bg-surface py-8 px-4 md:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text flex items-center gap-2">
              <Award className="text-primary" size={28} />
              Tích Điểm & Đổi Quà
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Mỗi 1.000đ thanh toán đơn hàng thành công = 1 điểm tích lũy
            </p>
          </div>
          <Link
            href="/"
            className="text-sm font-semibold text-primary hover:underline flex items-center gap-1"
          >
            Quay lại Thực đơn <ArrowRight size={16} />
          </Link>
        </div>

        <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
          <div className="space-y-2 z-10">
            <div className="flex items-center gap-2 text-emerald-200 text-sm font-medium">
              <Star className="fill-emerald-400 text-emerald-400" size={18} />
              <span>Số điểm hiện có của bạn</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-black tracking-tight">{points.toLocaleString('vi-VN')}</span>
              <span className="text-lg text-emerald-200 font-semibold">điểm</span>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-xs text-emerald-100 space-y-1 z-10">
            <p className="font-bold text-white text-sm">💡 Thể lệ tích điểm:</p>
            <p>• Điểm được cộng tự động sau khi thanh toán hóa đơn.</p>
            <p>• Dùng điểm để đổi mã giảm giá trực tiếp cho các đơn hàng sau.</p>
          </div>

          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        </div>

        {msg && (
          <div
            className={`p-4 rounded-2xl flex items-center gap-2 text-sm font-medium ${
              msg.type === 'success'
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-red-50 text-red-600 border border-red-200'
            }`}
          >
            <CheckCircle2 size={18} className="shrink-0" />
            <span>{msg.text}</span>
          </div>
        )}

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-text flex items-center gap-2">
            <Gift className="text-primary" size={20} />
            Kho Ưu Đãi Đổi Điểm
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {vouchers.map((v) => {
              const canRedeem = points >= v.pointsRequired;
              return (
                <div
                  key={v.id}
                  className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex justify-between items-center gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="bg-emerald-100 text-primary border border-emerald-200 text-xs font-bold px-2.5 py-0.5 rounded-lg uppercase">
                        {v.code}
                      </span>
                      <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                        <Clock size={12} /> Hạn dùng 30 ngày
                      </span>
                    </div>
                    <p className="font-bold text-text text-base">{v.description}</p>
                    <div className="flex items-center gap-1 text-primary text-xs font-bold">
                      <Ticket size={14} />
                      <span>Cần {v.pointsRequired} điểm</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRedeem(v)}
                    disabled={!canRedeem || redeemingId === v.id}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                      canRedeem
                        ? 'bg-primary text-white hover:bg-primary-hover shadow-sm active:scale-95'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {redeemingId === v.id ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : canRedeem ? (
                      'Đổi ngay'
                    ) : (
                      'Chưa đủ điểm'
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}