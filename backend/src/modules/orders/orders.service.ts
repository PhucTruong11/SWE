import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto, CreateOrderItemDto } from './create-order.dto.js';

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const orderItems: Prisma.OrderItemCreateWithoutOrderInput[] = [];
      let total = 0;

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
          discount: 0,
          promoCode: dto.promoCode ?? null,
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

    let basePrice = product.price;
    let toppingsTotal = 0;
    if (item.toppings && item.toppings.length > 0) {
      toppingsTotal = item.toppings.length * 10000;
    }

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

    return (basePrice + toppingsTotal) * item.qty;
  }
}
