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
import { CheckoutService } from './checkout.service.js';
import { CreateCheckoutDto } from './dto/create-checkout.dto.js';
import { ApplyVoucherDto } from './dto/apply-voucher.dto.js';

@Controller(['checkout', 'payments'])
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  // ----------------------------------------------------------
  // POST /api/checkout/apply-voucher
  // Áp dụng mã giảm giá cho đơn hàng (cho GUI gọi kiểm tra trước)
  // ----------------------------------------------------------
  @Post('apply-voucher')
  @HttpCode(HttpStatus.OK)
  async applyVoucher(@Body() dto: ApplyVoucherDto) {
    return this.checkoutService.applyVoucher(dto.orderId, dto.promoCode);
  }

  // ----------------------------------------------------------
  // POST /api/checkout
  // Xử lý thanh toán đơn hàng
  // ----------------------------------------------------------
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async processCheckout(
    @Body() dto: CreateCheckoutDto,
    @Headers('idempotency-key') idempotencyKey: string,
  ) {
    // Bắt buộc phải có Idempotency-Key để chống thanh toán trùng lặp
    if (!idempotencyKey) {
      throw new BadRequestException(
        'Header "Idempotency-Key" là bắt buộc. ' +
        'Hãy gửi một UUID duy nhất cho mỗi lần bấm nút thanh toán.',
      );
    }

    return this.checkoutService.processCheckout(
      dto.orderId,
      dto.method,
      idempotencyKey,
      dto.promoCode,
    );
  }

  // ----------------------------------------------------------
  // GET /api/checkout/order/:orderId
  // Lấy lịch sử thanh toán của 1 đơn hàng
  // ----------------------------------------------------------
  @Get('order/:orderId')
  async getCheckoutsByOrder(@Param('orderId') orderId: string) {
    return this.checkoutService.getCheckoutsByOrder(orderId);
  }

  // ----------------------------------------------------------
  // GET /api/checkout/status/:orderId
  // Lấy trạng thái đơn hàng & đếm ngược số giây còn lại trước khi hết hạn (cho GUI)
  // ----------------------------------------------------------
  @Get('status/:orderId')
  async getOrderCheckoutStatus(@Param('orderId') orderId: string) {
    return this.checkoutService.getOrderCheckoutStatus(orderId);
  }
}
