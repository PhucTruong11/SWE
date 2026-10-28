import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PromotionsService } from '../promotions/promotions.service.js';
import { RewardsService } from '../rewards/rewards.service.js';
import { InventoryService, RESERVATION_DURATION_MS } from '../inventory/inventory.service.js';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly promotionsService: PromotionsService,
        private readonly rewardsService: RewardsService,
        private readonly inventory: InventoryService,
    ) { }

    /**
     * Tạo đơn từ giỏ của người đã đăng nhập. Giá và nguyên liệu được tính lại từ cơ sở dữ liệu,
     * không tin số tiền do trình duyệt gửi lên. Đơn mới chờ thanh toán và giữ nguyên liệu hai phút.
     */
    async create(dto: CreateOrderDto, userId: string) {
        if (!userId) {
            throw new UnauthorizedException('Vui lòng đăng nhập để đặt hàng');
        }
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Giỏ hàng không được rỗng');
        }

        // Kiểm tra sớm để báo nguyên liệu thiếu trước khi bắt đầu giao dịch tạo đơn.
        const preview = await this.inventory.prepareCart(dto.items);
        if (preview.shortages.length) {
            throw new BadRequestException(`Không đủ nguyên liệu: ${preview.shortages.map((entry) => entry.ingredientName).join(', ')}`);
        }
        const calculatedTotal = preview.subtotal;

        // Kiểm tra mã giảm giá và tính lại số tiền phải trả.
        let finalTotal = calculatedTotal;
        let finalDiscount = 0;

        if (dto.promoCode) {
            await this.rewardsService.assertVoucherUsable(userId, dto.promoCode);
            const promoResult = await this.promotionsService.applyPromotion({
                code: dto.promoCode,
                subtotal: calculatedTotal
            });

            finalDiscount = promoResult.discountAmount;
            finalTotal -= finalDiscount;
        }

        // Kiểm tra lại ngay trong giao dịch: khách khác có thể vừa giữ nguyên liệu sau lần kiểm tra đầu.
        // Nếu giữ nguyên liệu hoặc lưu đơn thất bại, cả hai thay đổi đều được hoàn tác.
        const order = await this.prisma.$transaction(async (tx) => {
            const cart = await this.inventory.prepareCart(dto.items, tx);
            if (cart.subtotal !== calculatedTotal) {
                throw new BadRequestException('Giá món vừa thay đổi, vui lòng kiểm tra lại giỏ hàng');
            }
            await this.inventory.reserve(tx, cart);
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    total: finalTotal,
                    discount: finalDiscount,
                    status: 'PENDING',
                    inventoryState: 'RESERVED',
                    reservationExpiresAt: new Date(Date.now() + RESERVATION_DURATION_MS),
                    promoCode: dto.promoCode ?? null,
                    items: {
                        create: cart.orderItems,
                    },
                },
                include: {
                    items: {
                        include: { product: { select: { name: true, imageUrl: true } } },
                    },
                },
            });
            return newOrder;
        });

        return order;
    }

    /** Chỉ lấy lịch sử đơn của tài khoản đang đăng nhập, mới nhất trước. */
    async findAllByUser(userId: string) {
        if (!userId) {
            throw new UnauthorizedException('Vui lòng đăng nhập để xem đơn hàng');
        }

        return this.prisma.order.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' }, // Đơn mới nhất lên đầu
            include: {
                items: {
                    include: { product: { select: { name: true, imageUrl: true } } },
                },
            },
        });
    }

    /** Lấy chi tiết đơn và thanh toán sau khi xác nhận đơn thuộc về tài khoản này. */
    async findOne(id: string, userId: string) {
        if (!userId) {
            throw new UnauthorizedException('Vui lòng đăng nhập để xem đơn hàng');
        }
        const order = await this.prisma.order.findUnique({
            where: { id, userId },
            include: {
                items: {
                    include: { product: { select: { name: true, imageUrl: true } } },
                },
                payments: true,
            },
        });

        if (!order) {
            throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        }

        return order;
    }
}
