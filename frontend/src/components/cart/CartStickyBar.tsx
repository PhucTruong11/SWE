'use client';

import Link from 'next/link';
import { useCartStore, useHasCartHydrated } from '@/stores/cart.store';

export function CartStickyBar() {
    const count = useCartStore((s) => s.totalItems());
    // FIX HYDRATION: server luôn coi giỏ hàng rỗng (không render thanh này).
    // Nếu chưa đọc xong localStorage mà đã hiển thị thanh dựa trên count thật,
    // client sẽ render khác với server -> lỗi "Hydration failed".
    const hasHydrated = useHasCartHydrated();

    // Ẩn hẳn khi giỏ hàng trống, tránh chiếm chỗ vô ích ở đáy màn hình
    // Đồng thời ẩn cho tới khi store hydrate xong để khớp với server
    if (!hasHydrated || count === 0) return null;

    return (
        <Link
            href="/cart"
            className="fixed inset-x-4 bottom-4 z-30 flex items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-center font-semibold text-white shadow-lg transition-colors hover:bg-primary-hover lg:hidden"
        >
            <span>🛒</span>
            Xem giỏ hàng ({count})
        </Link>
    );
}