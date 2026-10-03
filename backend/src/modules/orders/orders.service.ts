import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
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
        if (!dto.items || dto.items.length === 0) {
            throw new BadRequestException('Giỏ hàng không được rỗng');
        }

        // Tự động gán user hợp lệ trong DB nếu là khách chưa đăng nhập (guest)
        if (userId === 'guest-user-placeholder') {
            const defaultUser = await this.prisma.user.findFirst();
            if (defaultUser) {
                userId = defaultUser.id;
            }
        }

        // Lấy thông tin + giá thực tế của từng sản phẩm từ Database
        // (Mục đích: Không tin giá Frontend gửi lên, phải tự tính lại để chống gian lận)
        const productIds = dto.items.map((item) => item.productId);
        const products = await this.prisma.product.findMany({
            where: { id: { in: productIds }, isAvailable: true },
            include: { prices: true },
        });

        // Kiểm tra xem tất cả sản phẩm có còn hoạt động không
        if (products.length !== productIds.length) {
            throw new BadRequestException('Một số sản phẩm không tồn tại hoặc đã ngừng kinh doanh');
        }

        // Kiểm tra tồn kho đủ số lượng không
        for (const item of dto.items) {
            const product = products.find((p) => p.id === item.productId);
            if (product!.stock < item.qty) {
                throw new BadRequestException(
                    `Sản phẩm "${product!.name}" chỉ còn ${product!.stock} phần, không đủ ${item.qty} phần yêu cầu`,
                );
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

            // Tính thành tiền
            // Topping giá tính theo snapshot từ Frontend
            const lineTotalFromDb = priceObj.price * item.qty;
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
        // (Transaction = "làm tất cả hoặc không làm gì" - nếu lỡ lỗi giữa chừng thì hoàn tác hết)
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
        const order = await this.prisma.order.findUnique({
            where: { id },
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

        // Kiểm tra đơn hàng có thuộc về user này không (chống xem đơn của người khác)
        if (order.userId !== userId) {
            throw new NotFoundException(`Không tìm thấy đơn hàng #${id}`);
        }

        return order;
    }
}
