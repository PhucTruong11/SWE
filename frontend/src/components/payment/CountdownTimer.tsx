'use client';

import React from 'react';

interface CountdownTimerProps {
  timeLeft: number; // số giây còn lại
  isExpired: boolean;
}

export function CountdownTimer({ timeLeft, isExpired }: CountdownTimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  const isWarning = timeLeft > 0 && timeLeft < 45;

  return (
    <div
      className={`flex items-center justify-between rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-sm transition-colors border ${
        isExpired
          ? 'bg-red-50 text-red-700 border-red-200'
          : isWarning
          ? 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse'
          : 'bg-emerald-50 text-emerald-800 border-emerald-200'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-xl">⏱️</span>
        <span>
          {isExpired
            ? 'Đã hết thời hạn thanh toán (quá 3 phút)!'
            : 'Thời gian giữ đơn và thanh toán:'}
        </span>
      </div>
      <div className="font-mono text-base font-extrabold tracking-wider">
        {isExpired ? '00:00 (Hết hạn)' : timeFormatted}
      </div>
    </div>
  );
}
