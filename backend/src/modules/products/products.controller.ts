import { Controller, Get, Param, NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async findAll() {
    const products = await this.productsService.findAll();
    return { data: products };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const product = await this.productsService.findOne(id);
    if (!product) {
      throw new NotFoundException(`Product with id "${id}" not found`);
    }
    return { data: product };
  }
}
