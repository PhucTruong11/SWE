import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';

describe('OrdersService ingredient reservation', () => {
  const item = { productId: 'coffee', size: 'M' as const, qty: 2, lineTotal: 1 };
  const cart = {
    subtotal: 78_000,
    shortages: [],
    orderItems: [{ productId: 'coffee', size: 'M', qty: 2, toppings: [], lineTotal: 78_000,
      recipeSnapshot: [{ ingredientId: 'beans', quantity: '48.000' }] }],
  };
  const prisma = {
    order: { create: vi.fn(), findMany: vi.fn(), findUnique: vi.fn() },
    $transaction: vi.fn(),
  };
  const promotions = { applyPromotion: vi.fn() };
  const rewards = { assertVoucherUsable: vi.fn() };
  const inventory = { prepareCart: vi.fn(), reserve: vi.fn() };
  const service = new OrdersService(prisma as never, promotions as never, rewards as never, inventory as never);

  beforeEach(() => {
    vi.clearAllMocks();
    inventory.prepareCart.mockResolvedValue(cart);
    inventory.reserve.mockResolvedValue(undefined);
    prisma.order.create.mockImplementation(async ({ data }) => ({ id: 'o1', ...data }));
    prisma.$transaction.mockImplementation(async (callback) => callback(prisma));
    rewards.assertVoucherUsable.mockResolvedValue(undefined);
  });

  it('requires login and at least one item', async () => {
    await expect(service.create({ items: [item] }, '')).rejects.toThrow(UnauthorizedException);
    await expect(service.create({ items: [] }, 'u1')).rejects.toThrow(BadRequestException);
    expect(inventory.prepareCart).not.toHaveBeenCalled();
  });

  it('rejects an ingredient shortage without creating an order', async () => {
    inventory.prepareCart.mockResolvedValueOnce({ ...cart, shortages: [{ ingredientName: 'Hạt cà phê' }] });
    await expect(service.create({ items: [item] }, 'u1')).rejects.toThrow('Không đủ nguyên liệu: Hạt cà phê');
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('reserves ingredients and snapshots the recipe before creating PENDING order', async () => {
    const result = await service.create({ items: [item] }, 'u1');
    expect(inventory.prepareCart).toHaveBeenCalledTimes(2);
    expect(inventory.reserve).toHaveBeenCalledWith(prisma, cart);
    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: 'u1', total: 78_000, status: 'PENDING', inventoryState: 'RESERVED',
        reservationExpiresAt: expect.any(Date),
        items: { create: cart.orderItems },
      }),
    }));
    expect(result.id).toBe('o1');
  });

  it('rolls back if the price changes between preview and reservation', async () => {
    inventory.prepareCart.mockResolvedValueOnce(cart).mockResolvedValueOnce({ ...cart, subtotal: 80_000 });
    await expect(service.create({ items: [item] }, 'u1')).rejects.toThrow('Giá món vừa thay đổi');
    expect(inventory.reserve).not.toHaveBeenCalled();
  });

  it('calculates voucher from the server subtotal', async () => {
    promotions.applyPromotion.mockResolvedValue({ discountAmount: 10_000 });
    await service.create({ items: [item], promoCode: 'BREW10' }, 'u1');
    expect(promotions.applyPromotion).toHaveBeenCalledWith({ code: 'BREW10', subtotal: 78_000 });
    expect(prisma.order.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ total: 68_000, discount: 10_000, promoCode: 'BREW10' }),
    }));
  });
});
