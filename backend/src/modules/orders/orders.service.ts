import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto, CreateOrderItemDto } from './create-order.dto';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx) => {
      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let total = 0;

      // Xử lý tuần tự để mỗi item đọc đúng version mới nhất trong transaction
      for (const item of dto.items) {
        const lineTotal = await this.processItem(tx, item);
        total += lineTotal;

        orderItems.push({
          product: { connect: { id: item.productId } },
          size: item.size,
          toppings: item.toppings,
          qty: item.qty,
          lineTotal,
        });
      }

      return tx.order.create({
        data: {
          userId,
          total,
          discount: 0, // Chưa có rule promo trong dự án nên không áp dụng giảm giá
          promoCode: dto.promoCode ?? null, // Chỉ lưu lại mã, không tính toán
          items: { create: orderItems },
        },
        include: { items: true },
      });
    });
  }

  async findMine(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
  }

  async findOne(userId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: { include: { product: true } } },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }
    if (order.userId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập đơn hàng này');
    }
    return order;
  }

  /**
   * Validate + tính giá + trừ kho (optimistic locking) cho một item.
   * Trả về lineTotal do backend tính.
   */
  private async processItem(
    tx: Prisma.TransactionClient,
    item: CreateOrderItemDto,
  ): Promise<number> {
    const product = await tx.product.findUnique({
      where: { id: item.productId },
    });
    if (!product) {
      throw new NotFoundException(`Không tìm thấy sản phẩm ${item.productId}`);
    }
    if (!product.isAvailable) {
      throw new BadRequestException(`Sản phẩm ${product.name} hiện không bán`);
    }

    const price = await tx.productPrice.findFirst({
      where: { productId: product.id, size: item.size },
    });
    if (!price) {
      throw new NotFoundException(
        `Sản phẩm ${product.name} không có giá cho size ${item.size}`,
      );
    }

    let toppingsTotal = 0;
    if (item.toppings.length > 0) {
      if (!product.allowToppings) {
        throw new BadRequestException(
          `Sản phẩm ${product.name} không cho phép thêm topping`,
        );
      }

      const uniqueNames = [...new Set(item.toppings)];
      const toppings = await tx.topping.findMany({
        where: { name: { in: uniqueNames } },
      });
      const priceByName = new Map(toppings.map((t) => [t.name, t.price]));

      for (const name of item.toppings) {
        const toppingPrice = priceByName.get(name);
        if (toppingPrice === undefined) {
          throw new NotFoundException(`Không tìm thấy topping ${name}`);
        }
        toppingsTotal += toppingPrice;
      }
    }

    // Optimistic locking + stock guard: chỉ trừ kho khi version chưa đổi và đủ hàng
    const updated = await tx.product.updateMany({
      where: {
        id: product.id,
        stock: { gte: item.qty },
        version: product.version,
      },
      data: {
        stock: { decrement: item.qty },
        version: { increment: 1 },
      },
    });
    if (updated.count === 0) {
      throw new ConflictException('Sản phẩm đã hết hàng hoặc trạng thái thay đổi');
    }

    return (price.price + toppingsTotal) * item.qty;
  }
}