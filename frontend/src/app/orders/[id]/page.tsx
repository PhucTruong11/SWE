'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { formatVND } from '@/lib/utils';

const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

import { useCartStore } from '@/stores/cart.store';
import type { Order } from '@/types';

interface OrderItem {
  id: string;
  productId: string;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  qty: number;
  lineTotal: number;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

type OrderWithItems = Omit<Order, 'items'> & { items: OrderItem[] };

type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED';

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Đặt đơn' },
  { status: 'PAID', label: 'Đã thanh toán' },
  { status: 'PREPARING', label: 'Đang chuẩn bị' },
  { status: 'READY', label: 'Có thể nhận' },
];

function getStepIndex(status: OrderStatus): number {
  if (status === 'COMPLETED') return STEPS.length - 1;
  const idx = STEPS.findIndex((s) => s.status === status);
  return idx === -1 ? -1 : idx;
}

function formatVietnameseDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

function OrderStatusStepper({ status }: { status: OrderStatus }) {
  if (status === 'CANCELLED' || status === 'PAYMENT_FAILED') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-400">
        {status === 'CANCELLED' ? 'Đơn hàng đã bị hủy' : 'Thanh toán thất bại'}
      </div>
    );
  }

  const currentIndex = getStepIndex(status);

  return (
    <div className="flex items-center justify-between">
      {STEPS.map((step, index) => {
        const isCompleted = index <= currentIndex;
        const isLast = index === STEPS.length - 1;

        return (
          <div key={step.status} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold',
                  isCompleted
                    ? 'bg-primary text-white'
                    : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'whitespace-nowrap text-[11px]',
                  isCompleted
                    ? 'font-medium text-text'
                    : 'text-gray-400 dark:text-gray-500',
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'mx-1 h-0.5 flex-1',
                  index < currentIndex
                    ? 'bg-primary'
                    : 'bg-gray-200 dark:bg-gray-800',
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function OrderItemRow({ item }: { item: OrderItem }) {
    return (
    <div className="flex gap-3 border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-800">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md bg-gray-100 dark:bg-gray-800">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
            Không có ảnh
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-text">
            {item.product.name}{' '}
            <span className="text-gray-400">
              ({item.size}) x{item.qty}
            </span>
          </p>
          <p className="whitespace-nowrap text-sm font-semibold text-text">
            {formatVND(item.lineTotal)}
          </p>
        </div>
        {item.toppings.length > 0 && (
          <p className="text-sm text-gray-500">{item.toppings.join(', ')}</p>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const clearCart = useCartStore((state) => state.clearCart);

  const orderId = typeof params?.id === 'string' ? params.id : undefined;

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<{ data: OrderWithItems }>(`/orders/${id}`);
      setOrder(res.data.data);
    } catch {
      setError('Không thể tải thông tin đơn hàng');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      setError('Mã đơn hàng không hợp lệ');
      return;
    }
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

  useEffect(() => {
    if (order?.status === 'PENDING') {
      clearCart();
    }
  }, [order?.status, clearCart]);

  const orderCode = useMemo(
    () => order?.id.slice(0, 8).toUpperCase() ?? '',
    [order?.id],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm text-gray-500">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {error ?? 'Không tìm thấy đơn hàng'}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 pb-24 lg:pb-8 lg:px-8">
      <div>
        <h1 className="text-lg font-semibold text-text">
          Đơn hàng #{orderCode}
        </h1>
        <p className="text-sm text-gray-500">
          {formatVietnameseDateTime(order.createdAt)}
        </p>
      </div>

      <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <OrderStatusStepper status={order.status} />
      </div>

      {order.status === 'PENDING' && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            Đơn hàng đang chờ thanh toán
          </p>
          <button
            type="button"
            onClick={() => router.push(`/checkout?orderId=${order.id}`)}
            className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white"
          >
            Thanh toán ngay
          </button>
        </div>
      )}

      <div className="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        {order.items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-gray-100 p-4 dark:border-gray-800">
        <div className="flex flex-col gap-1">
          {order.promoCode && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-500">Mã khuyến mãi</span>
              <span className="font-medium text-text">{order.promoCode}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div className="flex items-center justify-between gap-4 text-sm text-red-600 dark:text-red-400">
              <span>Số tiền giảm</span>
              <span>-{formatVND(order.discount)}</span>
            </div>
          )}
          {order.loyaltyPointsEarned > 0 && (
            <div className="flex items-center justify-between gap-4 text-sm">
              <span className="text-gray-500">Điểm thưởng nhận được</span>
              <span className="font-medium text-text">
                + {order.loyaltyPointsEarned} điểm
              </span>
            </div>
          )}
          <div className="mt-1 flex items-center justify-between gap-4 border-t border-gray-100 pt-2 dark:border-gray-800">
            <span className="text-sm font-medium text-gray-500">Tổng cộng</span>
            <span className="text-lg font-bold text-text">
              {formatVND(order.total)}
            </span>
          </div>
        </div>
      </div>
      <CartStickyBar />
    </main>
  );
}
