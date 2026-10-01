import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { CreateOrderDto } from './create-order.dto.js';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  create(@Body() createOrderDto: CreateOrderDto) {
    const user = { id: 'mock-id-123', email: 'test@test.com' };
    return this.ordersService.create(user.id, createOrderDto);
  }

  @Get('me')
  findMine() {
    const user = { id: 'mock-id-123', email: 'test@test.com' };
    return this.ordersService.findMine(user.id);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    const user = { id: 'mock-id-123', email: 'test@test.com' };
    return this.ordersService.findOne(user.id, id);
  }
}
