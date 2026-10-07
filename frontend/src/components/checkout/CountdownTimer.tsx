'use client';

import React from 'react';

interface CountdownTimerProps {
  timeLeft: number; // số giây còn lại
  isExpired: boolean;
  onRenew?: () => void;
}

export function CountdownTimer({ timeLeft, isExpired, onRenew }: CountdownTimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = timeLeft > 0 && timeLeft < 45;

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-sm transition-colors border ${
        isExpired
          ? 'bg-red-50 text-red-700 border-red-200'
          : isWarning
          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">{isExpired ? '⚠️' : '⏱️'}</span>
        <span>
          {isExpired
            ? 'Đã hết thời hạn thanh toán (quá 3 phút)!'
            : 'Thời gian giữ đơn và thanh toán:'}
        </span>
      </div>
      <div className="flex items-center gap-3">
        <div className="font-mono text-base font-extrabold tracking-wider">
          {isExpired ? '00:00 (Hết hạn)' : timeFormatted}
        </div>
        {isExpired && onRenew && (
          <button
            type="button"
            onClick={onRenew}
            className="rounded-xl bg-red-600 hover:bg-red-700 text-white px-3.5 py-1.5 text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-1.5"
          >
            <span>🔄</span> Gia hạn (3 phút)
          </button>
        )}
      </div>
    </div>
  );
}
