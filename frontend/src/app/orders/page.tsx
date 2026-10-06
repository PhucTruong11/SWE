'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { formatVND } from '@/lib/utils';

// Giữ cùng cách định nghĩa helper như trang chi tiết đơn hàng (order/[id]/page.tsx)

function formatVietnameseDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

import type { Order } from '@/types';

type OrderStatus = Order['status'];

const STATUS_LABEL: Record<OrderStatus, string> = {
  PENDING: 'Chờ thanh toán',
  PAID: 'Đã thanh toán',
  PREPARING: 'Đang chuẩn bị',
  READY: 'Có thể nhận',
  COMPLETED: 'Hoàn tất',
  CANCELLED: 'Đã hủy',
  PAYMENT_FAILED: 'Thanh toán thất bại',
};

const STATUS_BADGE_CLASS: Record<OrderStatus, string> = {
  PENDING:
    'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
  PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
  PREPARING:
    'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
  READY:
    'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
  COMPLETED:
    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  PAYMENT_FAILED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

function OrderCard({
  order,
  onClick,
}: {
  order: Order;
  onClick: () => void;
}) {
  const totalQty = order.items.reduce((sum, item) => sum + item.qty, 0);

  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full flex-col gap-2 rounded-xl border border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-text">
            #{order.id.slice(0, 8).toUpperCase()}
          </p>
          <p className="text-sm text-gray-500">
            {formatVietnameseDateTime(order.createdAt)}
          </p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">{totalQty} món</span>
        <span className="text-base font-bold text-text">
          {formatVND(order.total)}
        </span>
      </div>
    </button>
  );
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

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 pb-24 lg:pb-8 lg:px-8">
      <h1 className="text-lg font-semibold text-text">
        Lịch sử đơn hàng
      </h1>

      {orders.length === 0 ? (
        <div className="flex min-h-[40vh] flex-col items-center justify-center gap-2 text-center">
          <p className="text-sm text-gray-500">Bạn chưa có đơn hàng nào</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              onClick={() => router.push(`/order/${order.id}`)}
            />
          ))}
        </div>
      )}
      <CartStickyBar />
    </main>
  );
}
