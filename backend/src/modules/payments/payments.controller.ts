import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { ApplyVoucherDto } from './dto/apply-voucher.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ----------------------------------------------------------
  // POST /api/payments/apply-voucher
  // Áp dụng mã giảm giá cho đơn hàng (cho GUI gọi kiểm tra trước)
  // ----------------------------------------------------------
  @Post('apply-voucher')
  @HttpCode(HttpStatus.OK)
  async applyVoucher(@Body() dto: ApplyVoucherDto) {
    return this.paymentsService.applyVoucher(dto.orderId, dto.promoCode);
  }

  // ----------------------------------------------------------
  // POST /api/payments
  // Xử lý thanh toán đơn hàng
  // ----------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processPayment(
    @Body() dto: CreatePaymentDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    // Bắt buộc phải có Idempotency-Key để chống thanh toán trùng lặp
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Header "Idempotency-Key" là bắt buộc. ' +
        'Hãy gửi một UUID duy nhất cho mỗi lần bấm nút thanh toán.',
      );
    }

    return this.paymentsService.processPayment(
      dto.orderId,
      dto.method,
      idempotencyKey,
      dto.promoCode,
    );
  }

  // ----------------------------------------------------------
  // GET /api/payments/order/:orderId
  // Lấy lịch sử thanh toán của 1 đơn hàng
  // ----------------------------------------------------------
  @Get('order/:orderId')
  async getPaymentsByOrder(@Param('orderId') orderId: string) {
    return this.paymentsService.getPaymentsByOrder(orderId);
  }

  // ----------------------------------------------------------
  // GET /api/payments/status/:orderId
  // Lấy trạng thái đơn hàng & đếm ngược số giây còn lại trước khi hết hạn (cho GUI)
  // ----------------------------------------------------------
  @Get('status/:orderId')
  async getOrderPaymentStatus(@Param('orderId') orderId: string) {
    return this.paymentsService.getOrderPaymentStatus(orderId);
  }
}
