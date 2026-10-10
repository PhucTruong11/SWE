import {
    Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

// TODO(Role): sau này thêm RolesGuard + @Roles('ADMIN')
@Controller('admin')
@UseGuards(JwtAuthGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // GET /api/admin/orders/counts
    @Get('orders/counts')
    async getCounts() {
        return { data: await this.adminService.getCounts() };
    }

    // GET /api/admin/orders?status=PAID,PREPARING&range=today&search=abc&page=1
    @Get('orders')
    async listOrders(@Query() query: ListOrdersQueryDto) {
        return { data: await this.adminService.listOrders(query) };
    }

    // PATCH /api/admin/orders/:id/status
    @Patch('orders/:id/status')
    async updateStatus(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateOrderStatusDto,
    ) {
        return { data: await this.adminService.updateStatus(id, dto.status) };
    }
}