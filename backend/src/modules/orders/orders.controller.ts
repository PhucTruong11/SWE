import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

// NOTE: Khi bạn làm Task 7 (Auth) xong, uncomment 2 dòng dưới và xóa GUEST_USER_ID
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
// import { CurrentUser } from '../../common/decorators/current-user.decorator.js';

// Tạm dùng userId cứng để test khi Auth chưa xong.
// Bước 1: Cần có 1 User trong DB với ID này (chạy seed hoặc tạo tay)
// Bước 2: Khi Auth (Task 7) xong -> xóa dòng này và dùng @CurrentUser()
const GUEST_USER_ID = 'guest-user-placeholder';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  // POST /orders - Tạo đơn hàng mới
  // Frontend gửi: { items: [...], promoCode: '...' }
  @Post()
  @HttpCode(HttpStatus.CREATED) // Trả về HTTP 201 khi tạo thành công
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    // Khi Auth xong: thay 2 dòng dưới bằng: @CurrentUser() user: any
    @Request() req: any,
  ) {
    // Lấy userId từ JWT token (khi Auth xong) hoặc dùng tạm GUEST_USER_ID
    const userId = req.user?.id ?? GUEST_USER_ID;
    const order = await this.ordersService.create(createOrderDto, userId);
    return {
      message: 'Tạo đơn hàng thành công',
      data: order,
    };
  }

  // GET /orders/me - Xem lịch sử đơn hàng của mình
  @Get('me')
  async getMyOrders(@Request() req: any) {
    const userId = req.user?.id ?? GUEST_USER_ID;
    const orders = await this.ordersService.findAllByUser(userId);
    return { data: orders };
  }

  // GET /orders/:id - Xem chi tiết 1 đơn hàng
  @Get(':id')
  async getOrderById(@Param('id') id: string, @Request() req: any) {
    const userId = req.user?.id ?? GUEST_USER_ID;
    const order = await this.ordersService.findOne(id, userId);
    return { data: order };
  }
}
