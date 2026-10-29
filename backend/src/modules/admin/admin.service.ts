import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { OrderStatus, PointTransactionType, Prisma, ProductSize } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { assertTransition } from '../orders/orders-state.js';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto.js';
import { UpdateStockDto } from './dto/update-stock.dto.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js'
import { InventoryService } from '../inventory/inventory.service.js';

// Các trạng thái đã thanh toán thành công (tính vào doanh thu)
const REVENUE_STATUSES: OrderStatus[] = ['PAID', 'PREPARING', 'READY', 'COMPLETED'];
// Admin chỉ thấy đơn đã thanh toán; đơn hủy chỉ hiện nếu trước đó thanh toán thành công.
const ADMIN_VISIBLE_ORDERS: Prisma.OrderWhereInput = {
    OR: [
        { status: { in: REVENUE_STATUSES } },
        { status: OrderStatus.CANCELLED, payments: { some: { status: 'SUCCESS' } } },
    ],
};
const ADMIN_FORBIDDEN_TARGETS: OrderStatus[] = [
    OrderStatus.PAID, OrderStatus.PAYMENT_FAILED, OrderStatus.PENDING,
];

// 00:00 hôm nay theo giờ của server
function startOfToday(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
}

@Injectable()
export class AdminService {
    constructor(private readonly prisma: PrismaService, private readonly inventory: InventoryService) { }

    // Danh sách đơn: lọc trạng thái / ngày / tìm kiếm + phân trang
    async listOrders(q: ListOrdersQueryDto) {
        const page = q.page ?? 1;
        const limit = q.limit ?? 20;

        const where: Prisma.OrderWhereInput = { AND: [ADMIN_VISIBLE_ORDERS] };

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

        return {
            items: items.map((order) => ({
                ...order,
                items: order.items.map((item) => ({
                    ...item,
                    product: item.product ?? { name: item.productName },
                })),
            })),
            total, page, limit,
        };
    }

    // Số đơn theo từng trạng thái + doanh thu hôm nay (cho tab và trang Tổng quan)
    async getCounts() {
        const grouped = await this.prisma.order.groupBy({
            by: ['status'],
            where: ADMIN_VISIBLE_ORDERS,
            _count: { _all: true },
        });

        // Trạng thái nào chưa có đơn thì mặc định 0
        const counts = Object.fromEntries(
            Object.values(OrderStatus).map((s) => [s, 0]),
        ) as Record<OrderStatus, number>;
        for (const g of grouped) counts[g.status] = g._count._all;

        const today = startOfToday();
        const todayOrders = await this.prisma.order.count({
            where: { createdAt: { gte: today }, status: { in: REVENUE_STATUSES } },
        });
        const revenue = await this.prisma.order.aggregate({
            _sum: { total: true },
            where: { createdAt: { gte: today }, status: { in: REVENUE_STATUSES } },
        });

        return { counts, todayOrders, todayRevenue: revenue._sum.total ?? 0 };
    }

    // Đổi trạng thái đơn (giữ nguyên như cũ)
    async updateStatus(id: string, next: OrderStatus) {
        if (ADMIN_FORBIDDEN_TARGETS.includes(next)) {
            throw new BadRequestException(`Admin không được chuyển đơn sang ${next}`);
        }

        return this.prisma.$transaction(async (tx) => {
            await tx.$queryRaw`SELECT "id" FROM "orders" WHERE "id" = ${id} FOR UPDATE`;
            const order = await tx.order.findUnique({
                where: { id },
                include: { items: true },
            });
            if (!order) throw new NotFoundException(`Không tìm thấy đơn ${id}`);

            assertTransition(order.status, next);

            // Hủy đơn đã thanh toán -> hoàn kho + thu hồi điểm
            if (next === OrderStatus.CANCELLED && order.status === OrderStatus.PAID) {
                if (order.inventoryState === 'CONSUMED') {
                    await this.inventory.restore(tx, order);
                } else if (order.inventoryState === 'LEGACY') {
                    for (const item of order.items) {
                        if (!item.productId) continue; // Món cũ đã xóa chỉ còn bản chụp trong lịch sử.
                        await tx.product.update({
                            where: { id: item.productId },
                            data: { stock: { increment: item.qty }, version: { increment: 1 } },
                        });
                    }
                }
                if (order.loyaltyPointsEarned > 0) {
                    // Không để số dư điểm âm nếu khách đã dùng điểm
                    const u = await tx.user.findUnique({ where: { id: order.userId }, select: { loyaltyPoints: true } });
                    const refund = Math.min(order.loyaltyPointsEarned, u?.loyaltyPoints ?? 0);
                    if (refund > 0) {
                        const updated = await tx.user.update({
                            where: { id: order.userId },
                            data: { loyaltyPoints: { decrement: refund } },
                            select: { loyaltyPoints: true },
                        });
                        // Ghi sổ điểm để lịch sử khớp số dư
                        await tx.pointTransaction.create({
                            data: {
                                userId: order.userId,
                                type: PointTransactionType.REFUND,
                                points: -refund,
                                balanceAfter: updated.loyaltyPoints,
                                orderId: order.id,
                            },
                        });
                    }
                }
            }

            return tx.order.update({ where: { id }, data: { status: next } });
        });
    }

    // QUẢN LÝ TỒN KHO SẢN PHẨM CŨ.

    // Nguồn dữ liệu chỉ đọc cho giao diện nguyên liệu và công thức.
    async listIngredients() {
        return this.prisma.ingredient.findMany({ orderBy: { name: 'asc' } });
    }

    async listProductRecipe(productId: string, size: ProductSize) {
        return this.prisma.recipe.findMany({
            where: { productId, size },
            select: { ingredientId: true, quantity: true },
            orderBy: { ingredient: { name: 'asc' } },
        });
    }

    async listToppingRecipe(toppingId: string) {
        return this.prisma.recipe.findMany({
            where: { toppingId },
            select: { ingredientId: true, quantity: true },
            orderBy: { ingredient: { name: 'asc' } },
        });
    }

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
        if ((dto.stock === undefined) === (dto.quantityToAdd === undefined)) {
            throw new BadRequestException('Chỉ gửi một trong hai: stock hoặc quantityToAdd');
        }

        if (dto.quantityToAdd !== undefined) {
            const r = await this.prisma.product.updateMany({
                where: { id },
                data: { stock: { increment: dto.quantityToAdd }, version: { increment: 1 } },
            });
            if (r.count === 0) throw new NotFoundException(`Không tìm thấy sản phẩm ${id}`);
            return this.prisma.product.findUnique({ where: { id } });
        }

        const product = await this.prisma.product.findUnique({ where: { id } });
        if (!product) throw new NotFoundException(`Không tìm thấy sản phẩm ${id}`);

        const r = await this.prisma.product.updateMany({
            where: { id, version: product.version },
            data: { stock: dto.stock, version: { increment: 1 } },
        });
        if (r.count === 0) throw new ConflictException('Tồn kho vừa thay đổi, vui lòng tải lại rồi thử lại');
        return this.prisma.product.findUnique({ where: { id } });
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
        // API nhận cả ngày đơn thuần và ISO có múi giờ; ngày đơn thuần hết hạn cuối ngày Việt Nam.
        const endDate = dto.endDate
            ? new Date(/^\d{4}-\d{2}-\d{2}$/.test(dto.endDate)
                ? `${dto.endDate}T23:59:59+07:00`
                : dto.endDate)
            : null;
        if (endDate && (Number.isNaN(endDate.getTime()) || endDate.getTime() <= Date.now())) {
            throw new BadRequestException('Hạn dùng voucher phải ở trong tương lai theo giờ Việt Nam');
        }

        const existingPromo = await this.prisma.promotion.findUnique({
            where: { code: formattedCode },
        });

        if (existingPromo) {
            // Dùng backtick để ${...} được thay bằng giá trị thật
            throw new BadRequestException(`Mã voucher "${formattedCode}" đã tồn tại trên hệ thống`);
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
                endDate,
                isActive: dto.isActive ?? true,
            },
        });
    }

    // Danh sách toàn bộ voucher cho Admin (kể cả mã đã tắt / đã hết hạn)
    async listPromotions() {
        return this.prisma.promotion.findMany({
            orderBy: { createdAt: 'desc' },
        });
    }

    // Bật / tắt một voucher (mã tắt thì khách không áp dụng được)
    async togglePromotionActive(id: string) {
        const promo = await this.prisma.promotion.findUnique({ where: { id } });
        if (!promo) throw new NotFoundException(`Không tìm thấy voucher ${id}`);

        return this.prisma.promotion.update({
            where: { id },
            data: { isActive: !promo.isActive },
        });
    }
}
