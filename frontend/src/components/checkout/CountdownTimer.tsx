'use client';

import React from 'react';

export interface CountdownTimerProps {
  timeLeft?: number; // số giây còn lại
  isExpired?: boolean;
  onRenew?: () => void;
  showUI?: boolean; // Mặc định false: chạy ngầm 100%, không hiện thanh
}

/**
 * CountdownTimer chạy ngầm (Headless / Background),
 * đồng bộ trạng thái với nút thanh toán khi hết thời gian.
 */
export function CountdownTimer({
  timeLeft = 0,
  isExpired = false,
  showUI = false,
}: CountdownTimerProps) {
  // Khi chạy ngầm hoặc khi đã hết hạn, không render thanh trên màn hình
  if (!showUI || isExpired) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5 text-sm font-semibold shadow-sm border bg-emerald-50 text-emerald-800 border-emerald-200">
      <span>Thời gian giữ đơn và thanh toán:</span>
      <div className="font-mono text-base font-extrabold tracking-wider">
        {timeFormatted}
      </div>
    </div>
  );
}
