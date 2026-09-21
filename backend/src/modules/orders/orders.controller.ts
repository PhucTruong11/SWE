import { Controller } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // TODO: Sprint 2 - Task 6
  // POST /orders
  // GET /orders/me
  // GET /orders/:id
}
