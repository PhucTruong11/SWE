import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service.js';
import { PaymentMethod, OrderStatus, PaymentStatus } from '@prisma/client';

// Thời hạn thanh toán cho mỗi đơn hàng: 3 phút (180,000 ms)
export const PAYMENT_TIMEOUT_MS = 3 * 60 * 1000;

// ============================================================
// Danh mục Voucher hợp lệ trong hệ thống
// ============================================================
export interface VoucherRule {
  code: string;
  description: string;
  discountType: 'FIXED' | 'PERCENT';
  discountValue: number; // 15000 (VND) hoặc 10 (%)
  minOrderValue: number; // Giá trị đơn tối thiểu để dùng
  maxDiscount?: number;  // Giảm tối đa nếu là PERCENT
}

export const VALID_VOUCHERS: Record<string, VoucherRule> = {
  CHAOBAN: {
    code: 'CHAOBAN',
    description: 'Giảm 15.000đ cho đơn từ 40.000đ',
    discountType: 'FIXED',
    discountValue: 15000,
    minOrderValue: 40000,
  },
  BREW10: {
    code: 'BREW10',
    description: 'Giảm 10% (tối đa 25.000đ) cho mọi đơn',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderValue: 0,
    maxDiscount: 25000,
  },
  FREESHIP: {
    code: 'FREESHIP',
    description: 'Giảm 10.000đ',
    discountType: 'FIXED',
    discountValue: 10000,
    minOrderValue: 30000,
  },
  TRIAN: {
    code: 'TRIAN',
    description: 'Tặng 1 ly nước miễn phí (giảm 100%)',
    discountType: 'PERCENT',
    discountValue: 100,
    minOrderValue: 0,
  },
};

// ============================================================
// Mock Payment Gateway - Giả lập cổng thanh toán bên ngoài
// Trong thực tế, đây sẽ là lời gọi đến MoMo/VNPay/Stripe...
// ============================================================
async function callMockGateway(
  amount: number,
  method: PaymentMethod,
): Promise<{ success: boolean; gatewayRef: string }> {
  // Giả lập độ trễ mạng ngắn (100ms)
  await new Promise((r) => setTimeout(r, 100));

  // Mặc định thành công để luồng test và phát triển luôn ổn định
  const success = true;

  return {
    success,
    gatewayRef: `GW-${method}-${Date.now()}`, // Mã tham chiếu từ cổng thanh toán
  };
}

// ============================================================
// PaymentsService - Toàn bộ logic nghiệp vụ thanh toán
// ============================================================
@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ----------------------------------------------------------
  // applyVoucher: Áp dụng mã giảm giá cho đơn hàng PENDING
  // ----------------------------------------------------------
  async applyVoucher(orderId: string, promoCode: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể áp dụng mã giảm giá khi đơn hàng đang chờ thanh toán',
      );
    }

    const cleanCode = promoCode.trim().toUpperCase();
    const rule = VALID_VOUCHERS[cleanCode];

    if (!rule) {
      throw new BadRequestException(
        `Mã giảm giá "${promoCode}" không tồn tại hoặc đã hết hạn`,
      );
    }

    // Giá trị đơn ban đầu (trước khi trừ giảm giá cũ nếu có)
    const baseTotal = order.total + order.discount;

    if (baseTotal < rule.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng cần đạt tối thiểu ${rule.minOrderValue.toLocaleString('vi-VN')}đ để sử dụng mã "${rule.code}".`,
      );
    }

    // Tính toán số tiền được giảm
    let discountAmount = 0;
    if (rule.discountType === 'FIXED') {
      discountAmount = rule.discountValue;
    } else {
      discountAmount = Math.floor((baseTotal * rule.discountValue) / 100);
      if (rule.maxDiscount && discountAmount > rule.maxDiscount) {
        discountAmount = rule.maxDiscount;
      }
    }

    discountAmount = Math.min(discountAmount, baseTotal);
    const finalTotal = Math.max(0, baseTotal - discountAmount);

    // Cập nhật lại đơn hàng
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        promoCode: rule.code,
        discount: discountAmount,
        total: finalTotal,
      },
    });

    return {
      success: true,
      promoCode: rule.code,
      description: rule.description,
      discount: discountAmount,
      originalTotal: baseTotal,
      finalTotal,
      message: `Áp dụng thành công mã "${rule.code}"! Bạn được giảm ${discountAmount.toLocaleString('vi-VN')}đ.`,
    };
  }

  // ----------------------------------------------------------
  // processPayment: Hàm chính xử lý thanh toán
  // ----------------------------------------------------------
  async processPayment(
    orderId: string,
    method: PaymentMethod,
    idempotencyKey: string,
    promoCode?: string,
  ) {
    // Nếu có truyền kèm mã giảm giá, áp dụng trước
    if (promoCode) {
      await this.applyVoucher(orderId, promoCode);
    }
    // ── Bước 1: Chống thanh toán trùng lặp (Idempotency Guard) ──
    const existingPayment = await this.prisma.payment.findUnique({
      where: { idempotencyKey },
    });

    if (existingPayment) {
      return {
        isDuplicate: true,
        payment: existingPayment,
        message: 'Thanh toán này đã được xử lý trước đó',
      };
    }

    // ── Bước 2: Kiểm tra đơn hàng tồn tại & lấy chi tiết sản phẩm để trừ kho ──
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        items: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với id: ${orderId}`);
    }

    // ── Bước 2b: Kiểm tra đơn hàng có sản phẩm hay không (Chặn đơn rỗng) ──
    if (!order.items || order.items.length === 0) {
      throw new BadRequestException('Đơn hàng không có sản phẩm nào để thanh toán');
    }

    // ── Bước 3: Kiểm tra trạng thái đơn hàng (State Machine Guard) ──
    // Cho phép thanh toán khi đơn đang ở trạng thái PENDING hoặc PAYMENT_FAILED (khách thử lại theo PDF)
    const ALLOWED_STATUSES: OrderStatus[] = [
      OrderStatus.PENDING,
      OrderStatus.PAYMENT_FAILED,
    ];

    if (!ALLOWED_STATUSES.includes(order.status)) {
      const statusMessages: Record<string, string> = {
        PAID: 'Đơn hàng đã được thanh toán rồi',
        CANCELLED: 'Đơn hàng đã bị hủy hoặc hết hạn thanh toán, không thể thanh toán',
        PREPARING: 'Đơn hàng đang được pha chế',
        READY: 'Đơn hàng đã sẵn sàng',
        COMPLETED: 'Đơn hàng đã hoàn tất',
      };

      throw new BadRequestException(
        statusMessages[order.status] ??
          `Đơn hàng đang ở trạng thái ${order.status}, không thể thanh toán`,
      );
    }

    // ── Bước 3b: Kiểm tra Hết hạn thanh toán (Timeout Guard 3 phút) ──
    const elapsedMs = Date.now() - order.createdAt.getTime();
    if (elapsedMs > PAYMENT_TIMEOUT_MS) {
      // Đơn hàng đã quá hạn 3 phút -> Tự động cập nhật thành CANCELLED
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });

      throw new BadRequestException(
        'Đơn hàng đã quá hạn thanh toán (quá 3 phút) và đã tự động bị hủy.',
      );
    }

    // ── Bước 4: Gọi cổng thanh toán (Mock) ──
    // Nếu đơn hàng 0đ (do voucher giảm 100%), tự động hoàn tất mà không cần gọi cổng thanh toán
    const gatewayResult =
      order.total === 0
        ? { success: true, gatewayRef: `FREE-VOUCHER-${Date.now()}` }
        : await callMockGateway(order.total, method);

    // ── Bước 5: Tính điểm thưởng (1,000đ = 1 điểm) ──
    const pointsEarned = gatewayResult.success
      ? Math.floor(order.total / 1000)
      : 0;

    // ── Bước 6: Ghi vào Database với Cơ chế Khóa Chống Race Condition ──
    const payment = await this.prisma.$transaction(async (tx) => {
      // 🔒 6a: Khóa dòng Order (Pessimistic Lock: SELECT FOR UPDATE)
      // Ngăn chặn 2 request đồng thời cho cùng 1 đơn hàng lọt qua cùng lúc
      await tx.$executeRaw`SELECT 1 FROM "orders" WHERE "id" = ${orderId} FOR UPDATE`;

      // Kiểm tra lại trạng thái đơn hàng sau khi có lock (phòng trường hợp request trước vừa cập nhật)
      const lockedOrder = await tx.order.findUnique({
        where: { id: orderId },
        select: { status: true },
      });

      if (!lockedOrder || !ALLOWED_STATUSES.includes(lockedOrder.status)) {
        throw new ConflictException('Đơn hàng đã được xử lý bởi một phiên giao dịch khác');
      }

      if (gatewayResult.success) {
        // 🔒 6b: Optimistic Locking - Trừ tồn kho và chống bán lố (Overselling)
        // Nếu 2 người cùng tranh mua 1 ly nước cuối cùng, chỉ 1 người thành công
        for (const item of order.items) {
          if (!item.product) continue;

          // Kiểm tra và trừ kho nguyên tử (Atomic Update)
          const updateStock = await tx.product.updateMany({
            where: {
              id: item.productId,
              stock: { gte: item.qty }, // Chỉ trừ khi còn đủ số lượng
              version: item.product.version, // Optimistic Lock version check
            },
            data: {
              stock: { decrement: item.qty },
              version: { increment: 1 },
            },
          });

          // Nếu count === 0 nghĩa là vừa bị người khác mua mất hoặc hết hàng
          if (updateStock.count === 0) {
            throw new ConflictException(
              `Sản phẩm "${item.product.name}" vừa hết hàng hoặc không đủ số lượng tồn kho!`,
            );
          }
        }
      }

      // 6c: Tạo bản ghi Payment
      const newPayment = await tx.payment.create({
        data: {
          orderId,
          idempotencyKey,
          amount: order.total,
          method,
          status: gatewayResult.success
            ? PaymentStatus.SUCCESS
            : PaymentStatus.FAILED,
        },
      });

      if (gatewayResult.success) {
        // 6d: Cập nhật đơn hàng → PAID
        await tx.order.update({
          where: { id: orderId },
          data: {
            status: OrderStatus.PAID,
            loyaltyPointsEarned: pointsEarned,
          },
        });

        // 6e: Cộng điểm thưởng cho người dùng
        if (order.userId) {
          await tx.user.update({
            where: { id: order.userId },
            data: {
              loyaltyPoints: { increment: pointsEarned },
            },
          });
        }
      } else {
        await tx.order.update({
          where: { id: orderId },
          data: { status: OrderStatus.PAYMENT_FAILED },
        });
      }

      return newPayment;
    });

    // ── Bước 7: Trả về kết quả ──
    return {
      isDuplicate: false,
      success: gatewayResult.success,
      payment,
      pointsEarned,
      message: gatewayResult.success
        ? `Thanh toán thành công! Bạn được cộng ${pointsEarned} điểm thưởng.`
        : 'Thanh toán thất bại. Vui lòng thử lại hoặc chọn phương thức khác.',
    };
  }

  // ----------------------------------------------------------
  // getPaymentsByOrder: Lấy lịch sử thanh toán của 1 đơn hàng
  // ----------------------------------------------------------
  async getPaymentsByOrder(orderId: string) {
    return this.prisma.payment.findMany({
      where: { orderId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ----------------------------------------------------------
  // getOrderPaymentStatus: Lấy thông tin thanh toán & đếm ngược thời gian còn lại (GUI cần)
  // ----------------------------------------------------------
  async getOrderPaymentStatus(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payments: true },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng: ${orderId}`);
    }

    const expiresAt = new Date(order.createdAt.getTime() + PAYMENT_TIMEOUT_MS);
    const remainingSeconds = Math.max(
      0,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    // Nếu đã hết hạn mà đơn vẫn đang PENDING -> tự động đổi sang CANCELLED
    if (remainingSeconds === 0 && order.status === OrderStatus.PENDING) {
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      order.status = OrderStatus.CANCELLED;
    }

    const originalTotal = order.total + order.discount;
    // URL mã VietQR / MoMo chuẩn hiển thị cho GUI
    const cleanOrderId = order.id.replace(/-/g, '').slice(0, 8).toUpperCase();
    const qrCodeUrl = `https://api.vietqr.io/image/970422-0909090909-compact2.png?amount=${order.total}&addInfo=BREWLITE%20${cleanOrderId}&accountName=BREWLITE%20COFFEE`;

    return {
      orderId: order.id,
      status: order.status,
      originalTotal,
      discount: order.discount,
      promoCode: order.promoCode,
      total: order.total,
      qrCodeUrl,
      createdAt: order.createdAt,
      expiresAt,
      remainingSeconds,
      isExpired: remainingSeconds === 0,
      payments: order.payments,
    };
  }

  // ----------------------------------------------------------
  // Cron Job: Chạy mỗi 30 giây để quét và hủy các đơn PENDING quá 3 phút
  // Giúp dọn dẹp hệ thống ngay cả khi user tắt trình duyệt
  // ----------------------------------------------------------
  @Cron('*/30 * * * * *')
  async handleExpiredOrders() {
    const expirationThreshold = new Date(Date.now() - PAYMENT_TIMEOUT_MS);

    const expiredOrders = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.PENDING,
        createdAt: { lt: expirationThreshold },
      },
      data: {
        status: OrderStatus.CANCELLED,
      },
    });

    if (expiredOrders.count > 0) {
      this.logger.warn(
        `⏰ [CronJob] Đã tự động hủy ${expiredOrders.count} đơn hàng PENDING do quá hạn 3 phút!`,
      );
    }
  }
}
