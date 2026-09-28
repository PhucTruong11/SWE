import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@prisma/client';

const ALLOWED_TRANSITIONS: Record<OrderStatus, readonly OrderStatus[]> = {
  [OrderStatus.PENDING]: [
    OrderStatus.PAID,
    OrderStatus.PAYMENT_FAILED,
    OrderStatus.CANCELLED,
  ],
  [OrderStatus.PAYMENT_FAILED]: [OrderStatus.PAID, OrderStatus.CANCELLED],
  [OrderStatus.PAID]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [OrderStatus.COMPLETED],
  [OrderStatus.COMPLETED]: [], // trạng thái cuối
  [OrderStatus.CANCELLED]: [], // trạng thái cuối
};

export function assertTransition(
  currentStatus: OrderStatus,
  nextStatus: OrderStatus,
): void {
  if (!ALLOWED_TRANSITIONS[currentStatus].includes(nextStatus)) {
    throw new BadRequestException(
      `Không thể chuyển trạng thái đơn hàng từ ${currentStatus} sang ${nextStatus}`,
    );
  }
}