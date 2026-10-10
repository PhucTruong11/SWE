import { Injectable, NotFoundException } from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertTransition } from '../orders/orders-state.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';

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
}