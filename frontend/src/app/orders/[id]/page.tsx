'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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

const ACTIVE_ORDER_STATUSES: Order['status'][] = [
  'PENDING',
  'PAID',
  'PREPARING',
  'READY',
];

function isOrderStatus(value: unknown): value is Order['status'] {
  return [
    ...ACTIVE_ORDER_STATUSES,
    'COMPLETED',
    'PAYMENT_FAILED',
    'CANCELLED',
  ].includes(value as Order['status']);
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

function OrderItemRow({ item }: { item: OrderItem }) {
  return (
    <div className="flex gap-4 border-b border-primary/10 py-3.5 last:border-b-0">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-primary/15 bg-primary/5">
        {item.product.imageUrl ? (
          <Image
            src={item.product.imageUrl}
            alt={item.product.name}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xl">
            ☕
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-bold text-text">
            {item.product.name}{' '}
            <span className="text-xs font-semibold text-text/60">
              (Size {item.size}) x{item.qty}
            </span>
          </p>
          <p className="whitespace-nowrap text-sm font-extrabold text-primary">
            {formatVND(item.lineTotal)}
          </p>
        </div>
        {item.toppings.length > 0 && (
          <p className="mt-1 text-xs text-text/60">{item.toppings.join(', ')}</p>
        )}
      </div>
    </div>
  );
}

function OrderDetailContent() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const orderId = typeof params?.id === 'string' ? params.id : undefined;
  const isConfirmation = searchParams.get('confirmed') === '1';

  const [order, setOrder] = useState<OrderWithItems | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const orderRequestRef = useRef(0);

  const fetchOrder = useCallback(async (id: string) => {
    const requestId = ++orderRequestRef.current;
    try {
      const res = await api.get<{ data: OrderWithItems }>(`/orders/${id}`);
      const nextOrder = res.data.data;
      if (
        requestId !== orderRequestRef.current ||
        !nextOrder ||
        nextOrder.id !== id ||
        !isOrderStatus(nextOrder.status)
      ) {
        return;
      }
      setOrder(nextOrder);
      setError(null);
    } catch (requestError: unknown) {
      if (requestId !== orderRequestRef.current) return;
      const status = (requestError as { response?: { status?: number } }).response?.status;
      setError(
        status === 401 || status === 403
          ? 'Bạn không có quyền xem đơn hàng này.'
          : status === 404
            ? 'Không tìm thấy đơn hàng.'
            : 'Không thể tải thông tin đơn hàng. Vui lòng thử lại.',
      );
    } finally {
      if (requestId === orderRequestRef.current) setLoading(false);
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

  useEffect(() => {
    if (
      !orderId ||
      !order ||
      order.id !== orderId ||
      !ACTIVE_ORDER_STATUSES.includes(order.status)
    ) {
      return;
    }

    let stopped = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const pollOrder = async () => {
      try {
        const res = await api.get<{ data: OrderWithItems }>(`/orders/${orderId}`);
        if (stopped) return;

        const nextOrder = res.data.data;
        if (
          !nextOrder ||
          nextOrder.id !== orderId ||
          !isOrderStatus(nextOrder.status)
        ) {
          stopped = true;
          return;
        }

        setOrder(nextOrder);
        if (ACTIVE_ORDER_STATUSES.includes(nextOrder.status)) {
          timer = setTimeout(pollOrder, 5000);
        }
      } catch (requestError: unknown) {
        if (stopped) return;

        // Mọi lỗi polling đều dừng im lặng, giữ nguyên dữ liệu gần nhất.
        // Lần tải trang tiếp theo vẫn có thể lấy lại trạng thái mới từ backend.
        void requestError;
        stopped = true;
      }
    };

    // Silent polling chỉ bắt đầu sau khi đã tải order hợp lệ lần đầu.
    timer = setTimeout(pollOrder, 5000);
    return () => {
      stopped = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, order]);

  const orderCode = useMemo(
    () => order?.id.slice(0, 8).toUpperCase() ?? '',
    [order?.id],
  );

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-sm font-medium text-text/60">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-2 px-4 text-center">
        <p className="text-sm font-semibold text-rose-600">
          {error ?? 'Không tìm thấy đơn hàng'}
        </p>
      </div>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-6 pb-24 lg:pb-8 lg:px-8">
      {isConfirmation && order.status === 'PAID' && (
        <div className="rounded-2xl border border-primary/20 bg-primary/10 p-4 text-primary">
          <p className="font-bold">Thanh toán thành công</p>
          <p className="mt-1 text-sm text-text/70">
            Đơn hàng đã được backend xác nhận và đang chờ quầy pha chế.
          </p>
        </div>
      )}
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-text">
          Đơn hàng #{orderCode}
        </h1>
        <p className="mt-1 text-sm text-text/70">
          Đặt lúc: {formatVietnameseDateTime(order.createdAt)}
        </p>
      </div>

      <div className="rounded-2xl border border-primary/15 bg-surface p-5 shadow-sm">
        <OrderStatusStepper status={order.status} />
        <OrderStatusBadge status={order.status} />
      </div>

      {(order.status === 'PENDING' || order.status === 'PAYMENT_FAILED') && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 p-5 shadow-sm">
          <p className="text-sm font-bold text-amber-900">
            {order.status === 'PAYMENT_FAILED'
              ? 'Thanh toán thất bại. Bạn có thể thử lại với đơn hàng này.'
              : '⏳ Đơn hàng đang chờ thanh toán'}
          </p>
          <button
            type="button"
            onClick={() => router.push(`/checkout?orderId=${order.id}`)}
            className="w-full rounded-full bg-primary py-3 text-sm font-bold text-white shadow-md transition-all hover:bg-primary-hover active:scale-[0.99]"
          >
            Thanh toán ngay
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-primary/15 bg-surface p-5 shadow-sm">
        <h3 className="mb-2 text-sm font-bold text-text">Món đã đặt</h3>
        {order.items.map((item) => (
          <OrderItemRow key={item.id} item={item} />
        ))}
      </div>

      <div className="flex flex-col gap-3 rounded-2xl border border-primary/15 bg-surface p-5 shadow-sm">
        <div className="flex justify-between items-center text-sm font-medium text-text/75">
          <span>Tạm tính</span>
          <span className="whitespace-nowrap font-bold text-text">{formatVND(order.total + order.discount)}</span>
        </div>
        {order.promoCode && (
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-text/75">Mã khuyến mãi</span>
            <span className="min-w-0 break-all text-right font-mono font-bold text-primary">
              {order.promoCode}
            </span>
          </div>
        )}
        {order.discount > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-text/75">Giảm giá</span>
            <span className="whitespace-nowrap text-rose-600 font-bold">
              - {formatVND(order.discount)}
            </span>
          </div>
        )}
        {order.loyaltyPointsEarned > 0 && (
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium text-text/75">Điểm thưởng</span>
            <span className="whitespace-nowrap text-emerald-700 font-bold">
              + {order.loyaltyPointsEarned} điểm
            </span>
          </div>
        )}
        <div className="my-1 border-t border-dashed border-primary/15" />
        <div className="flex justify-between items-center text-sm gap-4">
          <span className="font-extrabold text-base text-text">Tổng thanh toán</span>
          <span className="whitespace-nowrap font-black text-2xl text-primary">
            {formatVND(order.total)}
          </span>
        </div>
      </div>
      <CartStickyBar />
    </main>
  );
}

export default function OrderDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-text/60">
          Đang tải...
        </div>
      }
    >
      <OrderDetailContent />
    </Suspense>
  );
}
