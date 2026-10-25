import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PromotionsService } from '../promotions/promotions.service.js';
import { RewardsService } from '../rewards/rewards.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';

describe('OrdersService - Cart & Order Processing', () => {
    let service: OrdersService;
    let prisma: {
        product: { findMany: ReturnType<typeof vi.fn> };
        topping: { findMany: ReturnType<typeof vi.fn> };
        order: { findMany: ReturnType<typeof vi.fn>; findUnique: ReturnType<typeof vi.fn> };
        $transaction: ReturnType<typeof vi.fn>;
    };
    let promotionsService: {
        applyPromotion: ReturnType<typeof vi.fn>;
    };
    let rewardsService: {
        assertVoucherUsable: ReturnType<typeof vi.fn>;
    };

    const mockProduct1 = {
        id: 'prod-1',
        name: 'Trà Sữa Oolong',
        stock: 10,
        isAvailable: true,
        prices: [
            { id: 'price-1', size: 'M', price: 30000 },
            { id: 'price-2', size: 'L', price: 38000 },
        ],
    };

    const mockProduct2 = {
        id: 'prod-2',
        name: 'Cà Phê Muối',
        stock: 5,
        isAvailable: true,
        prices: [
            { id: 'price-3', size: 'M', price: 25000 },
        ],
    };

    const mockTopping1 = {
        id: 'top-1',
        name: 'Trân Châu Trắng',
        price: 10000,
        isAvailable: true,
    };

    const mockTopping2 = {
        id: 'top-2',
        name: 'Thạch Đào',
        price: 8000,
        isAvailable: true,
    };

    beforeEach(async () => {
        prisma = {
            product: { findMany: vi.fn() },
            topping: { findMany: vi.fn() },
            order: { findMany: vi.fn(), findUnique: vi.fn() },
            $transaction: vi.fn(),
        };

        promotionsService = {
            applyPromotion: vi.fn(),
        };
        rewardsService = {
            assertVoucherUsable: vi.fn().mockResolvedValue(undefined),
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                OrdersService,
                { provide: PrismaService, useValue: prisma },
                { provide: PromotionsService, useValue: promotionsService },
                { provide: RewardsService, useValue: rewardsService },
            ],
        }).compile();

        service = module.get<OrdersService>(OrdersService);
    });

    // Nghiệp vụ Cart: server nhận giỏ hàng, kiểm tra lại toàn bộ rồi mới tạo đơn.
    describe('create (Tạo đơn hàng từ giỏ hàng)', () => {
        // [Xác thực] Không có userId (chưa đăng nhập) thì không được đặt hàng -> 401.
        it('phải chặn khi chưa đăng nhập (thiếu userId)', async () => {
            const dto: CreateOrderDto = {
                items: [{ productId: 'prod-1', size: 'M', qty: 1, lineTotal: 30000 }],
            };

            await expect(service.create(dto, '')).rejects.toThrow(UnauthorizedException);
            await expect(service.create(dto, '')).rejects.toThrow('Vui lòng đăng nhập để đặt hàng');
        });

        // [Giỏ rỗng] items = [] thì không tạo đơn -> 400.
        it('phải chặn khi giỏ hàng rỗng (items rỗng hoặc không có)', async () => {
            const emptyDto = { items: [] } as unknown as CreateOrderDto;

            await expect(service.create(emptyDto, 'user-1')).rejects.toThrow(BadRequestException);
            await expect(service.create(emptyDto, 'user-1')).rejects.toThrow('Giỏ hàng không được rỗng');
        });

        // [Sản phẩm] Sản phẩm không có trong DB hoặc isAvailable = false thì bị từ chối.
        it('phải chặn khi sản phẩm trong giỏ không tồn tại hoặc đã ngừng kinh doanh', async () => {
            const dto: CreateOrderDto = {
                items: [{ productId: 'prod-unknown', size: 'M', qty: 1, lineTotal: 30000 }],
            };
            prisma.product.findMany.mockResolvedValue([]);

            await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                'Một số sản phẩm không tồn tại hoặc đã ngừng kinh doanh',
            );
        });

        // [Tồn kho] Số lượng đặt lớn hơn stock của sản phẩm thì bị từ chối.
        it('phải chặn khi số lượng đặt vượt quá tồn kho của sản phẩm', async () => {
            const dto: CreateOrderDto = {
                items: [{ productId: 'prod-2', size: 'M', qty: 10, lineTotal: 250000 }],
            };
            prisma.product.findMany.mockResolvedValue([mockProduct2]); // stock = 5

            await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                'Sản phẩm "Cà Phê Muối" chỉ còn 5 phần, không đủ 10 phần yêu cầu',
            );
        });

        // [Tồn kho] Tồn kho dùng chung cho mọi dòng cùng sản phẩm: phải cộng dồn qty các dòng rồi mới so với stock.
        it('phải cộng dồn tổng số lượng khi cùng một sản phẩm được thêm nhiều lần với các size/topping khác nhau', async () => {
            // Khách chọn prod-2 2 lần: 1 ly size M qty 3 và 1 ly size M qty 3 => Tổng cần 6 ly, trong khi kho chỉ có 5
            const dto: CreateOrderDto = {
                items: [
                    { productId: 'prod-2', size: 'M', qty: 3, lineTotal: 75000 },
                    { productId: 'prod-2', size: 'M', qty: 3, lineTotal: 75000 },
                ],
            };
            prisma.product.findMany.mockResolvedValue([mockProduct2]); // stock = 5

            await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                'Sản phẩm "Cà Phê Muối" chỉ còn 5 phần, không đủ 6 phần yêu cầu',
            );
        });

        // [Topping] Tên topping phải tồn tại và đang bán trong bảng Topping.
        it('phải chặn khi topping được chọn không tồn tại hoặc ngừng kinh doanh', async () => {
            const dto: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-1',
                        size: 'M',
                        qty: 1,
                        toppings: ['Trân Châu Đen Không Tồn Tại'],
                        lineTotal: 40000,
                    },
                ],
            };
            prisma.product.findMany.mockResolvedValue([mockProduct1]);
            prisma.topping.findMany.mockResolvedValue([]); // Không tìm thấy trong DB

            await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                'Topping "Trân Châu Đen Không Tồn Tại" không tồn tại hoặc đã ngừng bán',
            );
        });

        // [Size] Sản phẩm không có giá cho size được chọn thì bị từ chối.
        it('phải chặn khi sản phẩm không hỗ trợ size được yêu cầu', async () => {
            const dto: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-2', // prod-2 chỉ có size M
                        size: 'L',
                        qty: 1,
                        lineTotal: 35000,
                    },
                ],
            };
            prisma.product.findMany.mockResolvedValue([mockProduct2]);

            await expect(service.create(dto, 'user-1')).rejects.toThrow(BadRequestException);
            await expect(service.create(dto, 'user-1')).rejects.toThrow(
                'Sản phẩm "Cà Phê Muối" không có size L',
            );
        });

        // [Giá tính lại từ DB] Bỏ qua lineTotal client gửi; tổng = sum((giá size + giá topping) * qty) lấy từ DB.
        // Đơn tạo ra có status PENDING, không có giảm giá.
        it('phải tính toán chính xác giá từ DB và tạo đơn thành công không kèm mã giảm giá', async () => {
            const dto: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-1',
                        size: 'M', // 30,000
                        qty: 2,
                        toppings: ['Trân Châu Trắng', 'Thạch Đào'], // 10,000 + 8,000 = 18,000
                        lineTotal: 1, // Giá client bị sửa; server phải tính lại: (30,000 + 18,000) * 2 = 96,000
                    },
                    {
                        productId: 'prod-2',
                        size: 'M', // 25,000
                        qty: 1,
                        toppings: [],
                        lineTotal: 25000, // (25,000 + 0) * 1 = 25,000
                    },
                ],
            };

            prisma.product.findMany.mockResolvedValue([mockProduct1, mockProduct2]);
            prisma.topping.findMany.mockResolvedValue([mockTopping1, mockTopping2]);

            let capturedOrderData: any = null;
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    order: {
                        create: vi.fn().mockImplementation(async ({ data }: any) => {
                            capturedOrderData = data;
                            return {
                                id: 'order-success-1',
                                ...data,
                                createdAt: new Date(),
                            };
                        }),
                    },
                };
                return callback(mockTx);
            });

            const result = await service.create(dto, 'user-123');

            expect(result).toBeDefined();
            expect(result.id).toBe('order-success-1');
            // Tổng tiền tính lại: 96,000 + 25,000 = 121,000
            expect(capturedOrderData.total).toBe(121000);
            expect(capturedOrderData.discount).toBe(0);
            expect(capturedOrderData.status).toBe('PENDING');
            expect(capturedOrderData.promoCode).toBeNull();
            expect(capturedOrderData.userId).toBe('user-123');
            expect(capturedOrderData.items.create).toHaveLength(2);
            expect(capturedOrderData.items.create[0]).toEqual({
                productId: 'prod-1',
                size: 'M',
                qty: 2,
                toppings: ['Trân Châu Trắng', 'Thạch Đào'],
                lineTotal: 96000,
            });
            expect(capturedOrderData.items.create[1]).toEqual({
                productId: 'prod-2',
                size: 'M',
                qty: 1,
                toppings: [],
                lineTotal: 25000,
            });
        });

        // [Promo] Gọi PromotionsService với subtotal tính từ DB; total = subtotal - discount, lưu promoCode.
        it('phải áp dụng mã giảm giá và trừ tiền chính xác khi có promoCode hợp lệ', async () => {
            const dto: CreateOrderDto = {
                items: [
                    {
                        productId: 'prod-1',
                        size: 'M', // 30,000 * 2 = 60,000
                        qty: 2,
                        lineTotal: 60000,
                    },
                ],
                promoCode: 'GIAM20K',
            };

            prisma.product.findMany.mockResolvedValue([mockProduct1]);
            promotionsService.applyPromotion.mockResolvedValue({
                discountAmount: 20000,
                finalTotal: 40000,
            });

            let capturedOrderData: any = null;
            prisma.$transaction.mockImplementation(async (callback: any) => {
                const mockTx = {
                    order: {
                        create: vi.fn().mockImplementation(async ({ data }: any) => {
                            capturedOrderData = data;
                            return { id: 'order-promo-1', ...data };
                        }),
                    },
                };
                return callback(mockTx);
            });

            const result = await service.create(dto, 'user-123');

            expect(promotionsService.applyPromotion).toHaveBeenCalledWith({
                code: 'GIAM20K',
                subtotal: 60000,
            });
            expect(rewardsService.assertVoucherUsable).toHaveBeenCalledWith('user-123', 'GIAM20K');
            expect(capturedOrderData.total).toBe(40000); // 60,000 - 20,000
            expect(capturedOrderData.discount).toBe(20000);
            expect(capturedOrderData.promoCode).toBe('GIAM20K');
            expect(result.id).toBe('order-promo-1');
        });
    });

    describe('findAllByUser & findOne', () => {
        it('findAllByUser phải ném UnauthorizedException nếu thiếu userId', async () => {
            await expect(service.findAllByUser('')).rejects.toThrow(UnauthorizedException);
        });

        it('findAllByUser trả về danh sách đơn hàng của user sắp xếp mới nhất', async () => {
            const mockOrders = [{ id: 'order-1', userId: 'u1' }];
            prisma.order.findMany.mockResolvedValue(mockOrders);

            const res = await service.findAllByUser('u1');
            expect(res).toEqual(mockOrders);
            expect(prisma.order.findMany).toHaveBeenCalledWith({
                where: { userId: 'u1' },
                orderBy: { createdAt: 'desc' },
                include: {
                    items: {
                        include: { product: { select: { name: true, imageUrl: true } } },
                    },
                },
            });
        });

        it('findOne ném NotFoundException nếu không tìm thấy đơn hàng', async () => {
            prisma.order.findUnique.mockResolvedValue(null);

            await expect(service.findOne('order-999', 'u1')).rejects.toThrow(NotFoundException);
            await expect(service.findOne('order-999', 'u1')).rejects.toThrow(
                'Không tìm thấy đơn hàng #order-999',
            );
        });
    });
});
