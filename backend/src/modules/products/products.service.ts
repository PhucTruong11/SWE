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
}
