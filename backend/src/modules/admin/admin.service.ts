import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertTransition } from '../orders/orders-state.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js'

// Các trạng thái đã thanh toán thành công (tính vào doanh thu)
const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];

// 00:00 hôm nay theo giờ của server
function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService) { }

    // Danh sách đơn: lọc trạng thái / ngày / tìm kiếm + phân trang
    async listOrders(q: ListOrdersQueryDto) {
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;

        const where: Prisma.OrderWhereInput = {};

        if (q.status?.length) where.status = { in: q.status };

        // Lọc theo ngày
        if (q.range === 'today') {
            where.createdAt = { gte: startOfToday() };
        } else if (q.range === '7d') {
            const from = startOfToday();
            from.setDate(from.getDate() - 6); // hôm nay + 6 ngày trước
            where.createdAt = { gte: from };
        }

        // Tìm theo mã đơn (đầu uuid) hoặc email khách
        const keyword = q.search?.trim();
        if (keyword) {
            where.OR = [
                { id: { startsWith: keyword.toLowerCase() } },
                { user: { email: { contains: keyword, mode: 'insensitive' } } },
            ];
        }

        // $transaction chạy đồng thời: lấy dữ liệu trang + tổng số đơn
        const [items, total] = await this.prisma.$transaction([
            this.prisma.order.findMany({
                where,
                orderBy: { createdAt: q.sort ?? 'desc' },
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    user: { select: { email: true } },
                    items: { include: { product: { select: { name: true } } } },
                },
            }),
            this.prisma.order.count({ where }),
        ]);

        return { items, total, page, limit };
    }

    // Số đơn theo từng trạng thái + doanh thu hôm nay (cho tab và trang Tổng quan)
    async getCounts() {
        const grouped = await this.prisma.order.groupBy({
            by: ['status'],
            _count: { _all: true },
        });

        // Trạng thái nào chưa có đơn thì mặc định 0
        const counts = Object.fromEntries(
            Object.values(OrderStatus).map((s) => [s, 0]),
        ) as Record<OrderStatus, number>;
        for (const g of grouped) counts[g.status] = g._count._all;

        const today = startOfToday();
        const todayOrders = await this.prisma.order.count({
            where: { createdAt: { gte: today } },
        });
        const revenue = await this.prisma.order.aggregate({
            _sum: { total: true },
            where: { createdAt: { gte: today }, status: { in: REVENUE_STATUSES } },
        });

        return { counts, todayOrders, todayRevenue: revenue._sum.total ?? 0 };
    }

    // Đổi trạng thái đơn (giữ nguyên như cũ)
    async updateStatus(id: string, next: OrderStatus) {
        return this.prisma.$transaction(async (tx) => {
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!order) throw new NotFoundException(`Không tìm thấy đơn ${id}`);

            assertTransition(order.status, next);

            // Hủy đơn đã thanh toán -> hoàn kho + thu hồi điểm
            if (next === OrderStatus.CANCELLED && order.status === OrderStatus.PAID) {
                for (const item of order.items) {
                    await tx.product.update({
                        where: { id: item.productId },
                        data: { stock: { increment: item.qty }, version: { increment: 1 } },
                    });
                }
                if (order.loyaltyPointsEarned > 0) {
                    await tx.user.update({
                        where: { id: order.userId },
                        data: { loyaltyPoints: { decrement: order.loyaltyPointsEarned } },
                    });
                }
            }

            return tx.order.update({ where: { id }, data: { status: next } });
        });
    }

    // QUẢN LÝ KHO (INVENTORY / STOCK)

    // Danh sách toàn bộ sản phẩm cho Admin (kèm tồn kho, size, trạng thái)
    async listProducts(category?: string, search?: string) {
        const where: Prisma.ProductWhereInput = {};
        if (category && category !== 'all') {
            where.category = category;
        }
        if (search?.trim()) {
            where.name = { contains: search.trim(), mode: 'insensitive' };
        }

        return this.prisma.product.findMany({
            where,
            include: {
                prices: { orderBy: { size: 'asc' } },
            },
            orderBy: { name: 'asc' },
        });
    }

    // Cập nhật tồn kho: cộng thêm (+) hoặc gán mới
    async updateStock(id: string, dto: UpdateStockDto) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm ${id}`);

        let newStock = product.stock;
        if (dto.stock !== undefined) {
            newStock = dto.stock;
        } else if (dto.quantityToAdd !== undefined) {
            newStock = product.stock + dto.quantityToAdd;
        }

        if (newStock < 0) {
            throw new BadRequestException('Số lượng tồn kho không được âm');
        }

        return this.prisma.product.update({
            where: { id },
            data: {
                stock: newStock,
                version: { increment: 1 },
            },
        });
    }

    // Bật / tắt trạng thái mở bán sản phẩm
    async toggleProductAvailability(id: string) {
        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm ${id}`);

        return this.prisma.product.update({
            where: { id },
            data: {
                isAvailable: !product.isAvailable,
            },
        });
    }

    async createPromotion(dto: CreatePromotionDto) {
        const formattedCode = dto.code.trim().toUpperCase();

        const existingPromo = await this.prisma.promotion.findUnique({
            where: {code: formattedCode},
        });

        if (existingPromo) {
            throw new BadRequestException('Mã voucher "${formattedCode}" đã tồn tại trên hệ thống');
        }

        if (dto.discountType === 'PERCENTAGE' && dto.discountValue > 100) {
            throw new BadRequestException('Mức giảm theo phần trăm không được vượt quá 100%');
        }

        return this.prisma.promotion.create({
            data: {
                code: formattedCode,
                description: dto.description?.trim() || null,
                discountType: dto.discountType,
                discountValue: dto.discountValue,
                minOrderValue: dto.minOrderValue ?? 0,
                maxDiscount: dto.discountType === 'PERCENTAGE' ? (dto.maxDiscount ?? null) : null,
                startDate: new Date(),
                endDate: dto.endDate ? new Date(dto.endDate) : null,
                isActive: dto.isActive ?? true,
            },
        });
    }
}