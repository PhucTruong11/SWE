import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ApplyPromotionDto } from './dto/apply-promotion.dto.js';

@Injectable()
export class PromotionsService {
  constructor(private readonly prisma: PrismaService) {}

  async applyPromotion(dto: ApplyPromotionDto) {
    const { code, subtotal } = dto;

    if (!code) {
      throw new BadRequestException('Vui lòng nhập mã ưu đãi');
    }

    // Nếu trong schema.prisma tên model là Voucher thì đổi promo thành voucher
    const promo = await this.prisma.promotion.findUnique({
      where: { code: code.trim().toUpperCase() },
    });

    if (!promo || !promo.isActive) {
      throw new NotFoundException('Mã ưu đãi không tồn tại hoặc đã hết hạn');
    }

    if (subtotal < promo.minOrderValue) {
      throw new BadRequestException(
        `Đơn hàng tối thiểu phải từ ${promo.minOrderValue.toLocaleString('vi-VN')}đ để áp dụng mã này`
      );
    }

    let discountAmount = 0;
    if (promo.discountType === 'PERCENTAGE') {
      discountAmount = (subtotal * promo.discountValue) / 100;
      if (promo.maxDiscount && discountAmount > promo.maxDiscount) {
        discountAmount = promo.maxDiscount;
      }
    } else if (promo.discountType === 'FIXED_AMOUNT') {
      discountAmount = promo.discountValue;
    }

    discountAmount = Math.min(discountAmount, subtotal);

    return {
      success: true,
      code: promo.code,
      discountAmount,
      message: 'Áp dụng mã ưu đãi thành công!',
    };
  }
}