import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdminService } from './admin.service.js';

describe('AdminService', () => {
    // tx giả dùng trong $transaction
    const tx = {
        order: { findUnique: vi.fn(), update: vi.fn() },
        product: { update: vi.fn() },
        user: { findUnique: vi.fn(), update: vi.fn() },
        pointTransaction: { create: vi.fn() },
    };
    const prisma = {
        $transaction: vi.fn((cb: (t: typeof tx) => unknown) => cb(tx)),
        product: { findUnique: vi.fn(), updateMany: vi.fn() },
    };
    const service = new AdminService(prisma as never);

    beforeEach(() => vi.clearAllMocks());

    it('chặn admin đặt trạng thái PAID', async () => {
        await expect(service.updateStatus('o1', 'PAID' as never)).rejects.toThrow(BadRequestException);
    });

    it('chặn chuyển trạng thái không hợp lệ (COMPLETED -> PREPARING)', async () => {
        tx.order.findUnique.mockResolvedValue({ id: 'o1', status: 'COMPLETED', items: [] });
        await expect(service.updateStatus('o1', 'PREPARING' as never)).rejects.toThrow(BadRequestException);
    });

    it('hủy đơn PAID: hoàn kho, thu hồi điểm, ghi sổ điểm', async () => {
        tx.order.findUnique.mockResolvedValue({
            id: 'o1', status: 'PAID', userId: 'u1', loyaltyPointsEarned: 3,
            items: [{ productId: 'p1', qty: 2 }],
        });
        tx.user.findUnique.mockResolvedValue({ loyaltyPoints: 10 });
        tx.user.update.mockResolvedValue({ loyaltyPoints: 7 });

        await service.updateStatus('o1', 'CANCELLED' as never);

        expect(tx.product.update).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ stock: { increment: 2 } }) }),
        );
        expect(tx.pointTransaction.create).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ type: 'REFUND', points: -3 }) }),
        );
    });

    it('updateStock: cộng thêm dùng increment', async () => {
        prisma.product.updateMany.mockResolvedValue({ count: 1 });
        prisma.product.findUnique.mockResolvedValue({ id: 'p1', stock: 15 });
        await service.updateStock('p1', { quantityToAdd: 5 });
        expect(prisma.product.updateMany).toHaveBeenCalledWith(
            expect.objectContaining({ data: expect.objectContaining({ stock: { increment: 5 } }) }),
        );
    });

    it('updateStock: đặt lại báo 409 khi version đã đổi', async () => {
        prisma.product.findUnique.mockResolvedValue({ id: 'p1', version: 3 });
        prisma.product.updateMany.mockResolvedValue({ count: 0 });
        await expect(service.updateStock('p1', { stock: 20 })).rejects.toThrow(ConflictException);
    });

    it('updateStock: gửi cả hai trường thì lỗi 400', async () => {
        await expect(service.updateStock('p1', { stock: 1, quantityToAdd: 1 })).rejects.toThrow(BadRequestException);
    });
});