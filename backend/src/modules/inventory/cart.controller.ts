import { Body, Controller, Post } from '@nestjs/common';
import { InventoryService } from './inventory.service.js';
import { CreateOrderDto } from '../orders/dto/create-order.dto.js';

@Controller('cart')
export class CartController {
  constructor(private readonly inventory: InventoryService) {}

  // Giỏ gọi API này để đối chiếu giá và nguyên liệu; không tạo đơn hoặc giữ kho.
  @Post('validate')
  validate(@Body() dto: CreateOrderDto) {
    return this.inventory.validateCart(dto.items);
  }
}
