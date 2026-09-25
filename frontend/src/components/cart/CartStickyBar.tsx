'use client';

import Link from 'next/link';
import { useCartStore } from '@/stores/cart.store';

export function CartStickyBar() {
    const count = useCartStore((s) => s.totalItems());

    // Ẩn hẳn khi giỏ hàng trống, tránh chiếm chỗ vô ích ở đáy màn hình
    if (count === 0) return null;

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