import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { PromotionsModule } from '../promotions/promotions.module.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
  imports: [PromotionsModule, AuthModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
