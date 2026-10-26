import {
    Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { RolesGuard } from '../auth/guards/roles.guard.js';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminController {
    constructor(private readonly adminService: AdminService) { }

    // ĐƠN HÀNG & THỐNG KÊ (ORDERS & STATS)
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

    // QUẢN LÝ KHO (INVENTORY / STOCK)
    // GET /api/admin/products?category=tra&search=olong
    @Get('products')
    async listProducts(
        @Query('category') category?: string,
        @Query('search') search?: string,
    ) {
        return { data: await this.adminService.listProducts(category, search) };
    }

    // PATCH /api/admin/products/:id/stock
    @Patch('products/:id/stock')
    async updateStock(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() dto: UpdateStockDto,
    ) {
        return { data: await this.adminService.updateStock(id, dto) };
    }

    // PATCH /api/admin/products/:id/availability
    @Patch('products/:id/availability')
    async toggleAvailability(@Param('id', ParseUUIDPipe) id: string) {
        return { data: await this.adminService.toggleProductAvailability(id) };
    }

    // GET /api/admin/promotions - danh sách voucher
    @Get('promotions')
    async listPromotions() {
        return { data: await this.adminService.listPromotions() };
    }

    // PATCH /api/admin/promotions/:id/active - bật / tắt voucher
    @Patch('promotions/:id/active')
    async togglePromotion(@Param('id', ParseUUIDPipe) id: string) {
        return { data: await this.adminService.togglePromotionActive(id) };
    }

    // POST /api/admin/promotions
    @Post('promotions')
    async createPromotion(
        @Body() dto: CreatePromotionDto) {
        const result = await this.adminService.createPromotion(dto);
        return { message: 'Tạo mã voucher thành công!', data: result, };
    }
}