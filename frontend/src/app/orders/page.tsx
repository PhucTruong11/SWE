'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import {
  OrderStatusBadge,
  OrderStatusStepper,
} from '@/components/orders/OrderStatus';
import { formatVND } from '@/lib/utils';
import type { Order } from '@/types';

const ACTIVE_STATUSES: Order['status'][] = ['PENDING', 'PAID', 'PREPARING'];
const PAST_STATUSES: Order['status'][] = [
  'COMPLETED',
  'CANCELLED',
  'PAYMENT_FAILED',
  'READY',
];

function formatVietnameseDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getOrderCode(order: Order): string {
  return order.id.slice(0, 8).toUpperCase();
}

function getItemCount(order: Order): number {
  return order.items.reduce((sum, item) => sum + item.qty, 0);
}

export default function OrderHistoryPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get<{ data: Order[] }>('/orders/me');
      setOrders(res.data.data);
    } catch {
      setError('Không thể tải lịch sử đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrders();
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Đang tải lịch sử đơn hàng...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error}
        </p>
      </div>
    );
  }

  const activeOrders = orders.filter((order) => ACTIVE_STATUSES.includes(order.status));
  const pastOrders = orders.filter((order) => PAST_STATUSES.includes(order.status));
  const activeOrder = activeOrders[0];

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 pb-24 lg:px-8 lg:pb-8">
      <h1 className="text-lg font-semibold text-text">Đơn hàng của tôi</h1>

      {activeOrder && (
        <section className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-text">Đơn hàng đang xử lý</h2>
          <div className="rounded-xl border border-primary/20 bg-white p-4 shadow-sm dark:border-primary/40">
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-text">
                    #{getOrderCode(activeOrder)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatVietnameseDateTime(activeOrder.createdAt)}
                  </p>
                </div>
                <OrderStatusBadge status={activeOrder.status} />
              </div>
              <OrderStatusStepper status={activeOrder.status} />
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 dark:border-gray-800">
                <span className="text-sm text-gray-500">
                  {getItemCount(activeOrder)} món
                </span>
                <span className="text-base font-bold text-text">
                  {formatVND(activeOrder.total)}
                </span>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/orders/${activeOrder.id}`)}
                className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover"
              >
                Xem chi tiết
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-text">Lịch sử đơn hàng</h2>
        <div className="overflow-y-auto max-h-[500px] border border-gray-100 rounded-xl bg-white shadow-sm">
          {pastOrders.length === 0 ? (
            <div className="flex min-h-32 items-center justify-center px-4 text-center">
              <p className="text-sm text-gray-500">Chưa có đơn hàng trong lịch sử</p>
            </div>
          ) : (
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="sticky top-0 bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 font-semibold">Mã đơn</th>
                  <th className="px-4 py-3 font-semibold">Thời gian</th>
                  <th className="px-4 py-3 font-semibold">Số món</th>
                  <th className="px-4 py-3 font-semibold">Trạng thái</th>
                  <th className="px-4 py-3 font-semibold">Tổng tiền</th>
                  <th className="px-4 py-3 font-semibold">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {pastOrders.map((order) => (
                  <tr key={order.id} className="text-text">
                    <td className="whitespace-nowrap px-4 py-3 font-medium">
                      #{getOrderCode(order)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-gray-500">
                      {formatVietnameseDateTime(order.createdAt)}
                    </td>
                    <td className="px-4 py-3">{getItemCount(order)}</td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={order.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-semibold">
                      {formatVND(order.total)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => router.push(`/orders/${order.id}`)}
                        className="whitespace-nowrap font-semibold text-primary hover:underline"
                      >
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      <CartStickyBar />
    </main>
  );
}
