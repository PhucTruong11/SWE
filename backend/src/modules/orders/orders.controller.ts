import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CreateOrderDto } from './create-order.dto.js';
import { OrdersService } from './orders.service.js';

const JwtAuthGuard = AuthGuard('jwt');

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async create(
    @CurrentUser() user: any,
    @Body() createOrderDto: CreateOrderDto,
  ) {
    const result = await this.ordersService.create(user.id, createOrderDto);
    return { data: result };
  }

  @Get('me')
  async findMine(@CurrentUser() user: any) {
    const result = await this.ordersService.findMine(user.id);
    return { data: result };
  }

  @Get(':id')
  async findOne(
    @CurrentUser() user: any,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    const result = await this.ordersService.findOne(user.id, id);
    return { data: result };
  }
}
