'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import api from '@/lib/api';
import { CartStickyBar } from '@/components/cart/CartStickyBar';
import { OrderStatusBadge, OrderStatusStepper } from '@/components/orders/OrderStatus';
import { formatVND } from '@/lib/utils';

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

function formatVietnameseDateTime(iso: string): string {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
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
  const searchParams = useSearchParams();

  const orderId = typeof params?.id === 'string' ? params.id : undefined;
  const isConfirmation = searchParams.get('confirmed') === '1';

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrder = useCallback(async (id: string) => {
    try {
      const res = await api.get<{ data: OrderWithItems }>(`/orders/${id}`);
      setOrder(res.data.data);
    } catch (requestError: unknown) {
      const status = (requestError as { response?: { status?: number } }).response?.status;
      setError(
        status === 401 || status === 403
          ? 'Bạn không có quyền xem đơn hàng này.'
          : status === 404
            ? 'Không tìm thấy đơn hàng.'
            : 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!orderId || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(orderId)) {
      Promise.resolve().then(() => {
        setLoading(false);
        setError('Mã đơn hàng không hợp lệ');
      });
      return;
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchOrder(orderId);
  }, [orderId, fetchOrder]);

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
      {isConfirmation && order.status === 'PAID' && (
        <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-primary">
          <p className="font-semibold">Thanh toán thành công</p>
          <p className="mt-1 text-sm text-text/70">
            Đơn hàng đã được backend xác nhận và đang chờ quầy pha chế.
          </p>
        </div>
      )}
      <div>
        <h1 className="text-lg font-semibold text-text">
          Đơn hàng #{orderCode}
        </h1>
        <p className="text-sm text-gray-500">
          {formatVietnameseDateTime(order.createdAt)}
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/15 bg-surface p-4">
        <OrderStatusStepper status={order.status} />
        <OrderStatusBadge status={order.status} />
      </div>

      {(order.status === 'PENDING' || order.status === 'PAYMENT_FAILED') && (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
            {order.status === 'PAYMENT_FAILED'
              ? 'Thanh toán thất bại. Bạn có thể thử lại với đơn hàng này.'
              : 'Đơn hàng đang chờ thanh toán'}
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

      <div className="rounded-xl border border-primary/15 bg-surface p-4">
        {order.items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-primary/15 bg-surface p-5 shadow-sm">
        <div className="flex justify-between items-center text-sm">
          <span>Tạm tính</span>
          <span className="whitespace-nowrap">{formatVND(order.total + order.discount)}</span>
        </div>
        {order.promoCode && (
          <div className="flex justify-between items-center text-sm">
            <span>Mã khuyến mãi</span>
            <span className="min-w-0 break-all text-right font-bold">
              {order.promoCode}
            </span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span>Giảm giá</span>
            <span className="whitespace-nowrap text-red-500 font-medium">
              - {formatVND(order.discount)}
            </span>
          </div>
        )}
        {order.loyaltyPointsEarned > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span>Điểm thưởng</span>
            <span className="whitespace-nowrap text-primary font-medium">
              + {order.loyaltyPointsEarned} điểm
            </span>
          </div>
        )}
        <div className="my-1 border-t border-dashed border-gray-200 dark:border-gray-700" />
        <div className="flex justify-between items-center text-sm gap-4">
          <span className="font-bold text-base">Tổng thanh toán</span>
          <span className="whitespace-nowrap font-black text-xl text-primary">
            {formatVND(order.total)}
          </span>
        </div>
      </div>
      <CartStickyBar />
    </main>
  );
}
