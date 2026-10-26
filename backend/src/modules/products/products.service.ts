import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.product.findMany({
      where: { isAvailable: true },
      include: { prices: { orderBy: { size: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.product.findUnique({
      where: { id },
      include: { prices: { orderBy: { size: 'asc' } } },
    });
  }

  async findByCategory(category: string) {
    return this.prisma.product.findMany({
      where: { isAvailable: true, category },
      include: { prices: { orderBy: { size: 'asc' } } },
      orderBy: { name: 'asc' },
    });
  }

  async findAllToppings() {
    return this.prisma.topping.findMany({
      where: { isAvailable: true },
      orderBy: { price: 'asc' },
    });
  }

  async getBestSellers(limit = 4) {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 ngày gần nhất
    const include = { prices: { orderBy: { size: 'asc' as const } } };

    // 1. Xếp hạng theo doanh số thật, chỉ tính món còn bán
    const sales = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        product: { isAvailable: true, stock: { gt: 0 } },
        order: {
          status: { in: ['PAID', 'PREPARING', 'READY', 'COMPLETED'] },
          createdAt: { gte: since },
        },
      },
      _sum: { qty: true },
      orderBy: { _sum: { qty: 'desc' } },
      take: limit,
    });

    const ids = sales.map((s) => s.productId);

    const topProducts =
      ids.length > 0
        ? await this.prisma.product.findMany({
            where: { id: { in: ids }, isAvailable: true },
            include,
          })
        : [];

    // Giữ đúng thứ tự theo doanh số
    const byId = new Map(topProducts.map((p) => [p.id, p]));
    const ranked = ids
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => !!p)
      .slice(0, limit)
      .map((p) => ({ ...p, isBestSeller: true })); // hiện badge HOT

    if (ranked.length >= limit) return ranked;

    // 2. Chưa đủ thì bổ sung món mặc định (không trùng, còn hàng)
    const fallback = await this.prisma.product.findMany({
      where: {
        isAvailable: true,
        stock: { gt: 0 },
        id: { notIn: ranked.map((p) => p.id) },
      },
      include,
      orderBy: { createdAt: 'desc' }, // có thể đổi thành { name: 'asc' }
      take: limit - ranked.length,
    });

    // isBestSeller
    return [...ranked, ...fallback.map((p) => ({ ...p, isBestSeller: true }))];
  }
}
