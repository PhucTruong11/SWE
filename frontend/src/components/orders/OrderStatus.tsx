import type { OrderStatus } from '@/types';

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
  PENDING: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400',
  PAID: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-400',
  PREPARING: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-400',
  READY: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400',
  COMPLETED: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
  PAYMENT_FAILED: 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400',
};

const STEPS: { status: OrderStatus; label: string }[] = [
  { status: 'PENDING', label: 'Đặt đơn' },
  { status: 'PAID', label: 'Đã thanh toán' },
  { status: 'PREPARING', label: 'Đang chuẩn bị' },
  { status: 'READY', label: 'Có thể nhận' },
];

const cn = (...classes: (string | boolean | undefined)[]) =>
  classes.filter(Boolean).join(' ');

function getStepIndex(status: OrderStatus): number {
  if (status === 'COMPLETED') return STEPS.length - 1;
  return STEPS.findIndex((step) => step.status === status);
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_BADGE_CLASS[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function OrderStatusStepper({ status }: { status: OrderStatus }) {
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
