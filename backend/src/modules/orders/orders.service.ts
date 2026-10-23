import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { PromotionsService } from '../promotions/promotions.service.js';

@Injectable()
export class OrdersService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly promotionsService: PromotionsService
    ) {}

    // POST /orders - Tạo đơn hàng mới từ giỏ hàng Frontend
    async create(dto: CreateOrderDto, userId: string) {
        if (!userId) {
            throw new UnauthorizedException('Vui lòng đăng nhập để đặt hàng');
        }
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Giỏ hàng không được rỗng');
        }

        // Lấy thông tin + giá thực tế của từng sản phẩm từ Database
        const productIds = [...new Set(dto.items.map((item) => item.productId))];
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isAvailable: true },
            include: { prices: true },
        });

        if (products.length !== productIds.length) {
            throw new BadRequestException('Một số sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
        }

        // Tồn kho dùng chung cho mọi size/topping của cùng một sản phẩm.
        const requestedQuantities = new Map<string, number>();
        for (const item of dto.items) {
            requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) ?? 0) + item.qty);
        }
        for (const product of products) {
            const requestedQuantity = requestedQuantities.get(product.id)!;
            if (product.stock < requestedQuantity) {
                throw new BadRequestException(
                    `Sản phẩm "${product.name}" chỉ còn ${product.stock} phần, không đủ ${requestedQuantity} phần yêu cầu`,
                );
            }
        }

        // Lấy tất cả tên topping được yêu cầu trong giỏ hàng
        const requestedToppingNames = dto.items.flatMap(item => item.toppings || []);
        const uniqueToppingNames = [...new Set(requestedToppingNames)];
        
        let toppingsFromDb: any[] = [];
        if (uniqueToppingNames.length > 0) {
            toppingsFromDb = await this.prisma.topping.findMany({
                where: { name: { in: uniqueToppingNames }, isAvailable: true }
            });
            const availableNames = new Set(toppingsFromDb.map((topping) => topping.name));
            const unavailableName = uniqueToppingNames.find((name) => !availableNames.has(name));
            if (unavailableName) {
                throw new BadRequestException(`Topping "${unavailableName}" không tồn tại hoặc đã ngừng bán`);
            }
        }

        // Tính lại tổng tiền từng dòng và tổng đơn hàng
        let calculatedTotal = 0;
        const orderItemsData = dto.items.map((item) => {
            const product = products.find((p) => p.id === item.productId);
            const priceObj = product!.prices.find((p) => p.size === item.size);

            if (!priceObj) {
                throw new BadRequestException(
                    `Sản phẩm "${product!.name}" không có size ${item.size}`,
                );
            }

            // Tính tiền topping
            let toppingTotal = 0;
            if (item.toppings && item.toppings.length > 0) {
                for (const tName of item.toppings) {
                    const dbTopping = toppingsFromDb.find(t => t.name === tName);
                    if (dbTopping) {
                        toppingTotal += dbTopping.price;
                    }
                }
            }

            // Tính thành tiền (Giá size + giá các topping) * số lượng
            const lineTotalFromDb = (priceObj.price + toppingTotal) * item.qty;
            calculatedTotal += lineTotalFromDb;

            return {
                productId: item.productId,
                size: item.size,
                qty: item.qty,
                toppings: item.toppings ?? [],    // Snapshot tên topping
                lineTotal: lineTotalFromDb,
            };
        });

        // Kiểm tra và tính mã giảm giá
        let finalTotal = calculatedTotal;
        let finalDiscount = 0;

        if (dto.promoCode) {
            // Gọi sang service của bạn làm Promo để nó tự xử lý (tách bạch trách nhiệm)
            const promoResult = await this.promotionsService.applyPromotion({
                code: dto.promoCode,
                subtotal: calculatedTotal
            });
            
            finalDiscount = promoResult.discountAmount;
            finalTotal -= finalDiscount;
        }

        // Lưu đơn hàng vào Database bằng Prisma Transaction
        const order = await this.prisma.$transaction(async (tx) => {
            const newOrder = await tx.order.create({
                data: {
                    userId,
                    total: finalTotal,             // Tiền thực tế sau giảm
                    discount: finalDiscount,       // Tiền giảm
                    status: 'PENDING',
                    promoCode: dto.promoCode ?? null,
                    items: {
                        create: orderItemsData,
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

    // GET /orders/me - Lấy danh sách đơn hàng của user đang đăng nhập
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

    // GET /orders/:id - Lấy chi tiết 1 đơn hàng
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

        // Kiểm tra đơn hàng có tồn tại không
        if (!order) {
            throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        }

        return order;
    }
}
