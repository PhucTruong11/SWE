'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useCategories } from '@/hooks/useCategories';
import { useCartStore, useHasCartHydrated } from '@/stores/cart.store';

// Kiểu dữ liệu tối thiểu cho 1 dòng sản phẩm trong popup giỏ hàng
interface CartPreviewItem {
    name: string;
    size: string;
    quantity: number;
    imageUrl?: string;
    toppings?: (string | { name: string })[];
    lineTotal?: number;
    unitPrice?: number;
}

const MenuIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
    </svg>
);

const SearchIcon = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
    </svg>
);

const ChevronIcon = ({ open }: { open: boolean }) => (
    <svg
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`transition-transform ${open ? 'rotate-180' : ''}`}
    >
        <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export function Header() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [isCartHovered, setIsCartHovered] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const hasHydrated = useHasCartHydrated();
    const { user } = useAuth();
    const router = useRouter();

    // Danh mục THẬT lấy từ dữ liệu sản phẩm — không còn mảng demo hardcode
    const { categories } = useCategories();

    const cartItems = useCartStore((s) => s.items) as CartPreviewItem[];
    const cartCount = useCartStore((s) => s.totalItems());
    const cartTotalPrice = useCartStore((s) => s.totalPrice());
    const removeItem = useCartStore((s) => s.removeItem);

    // Giữ ref này để đóng Menu nếu người dùng bấm hẳn ra ngoài trên thiết bị cảm ứng
    // (hover không có tác dụng trên mobile/tablet chạm), hover vẫn là cách mở/đóng chính
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        function handleUnauthorized() {
            router.push('/auth/login');
        }
        window.addEventListener('unauthorized', handleUnauthorized);
        return () => window.removeEventListener('unauthorized', handleUnauthorized);
    }, [router]);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        // FIX: đồng bộ với Sidebar — trỏ về Home, nơi AllDrinksScroll đã dùng
        // đúng parseSearchQuery/matchesProduct từ lib/search.ts
        router.push(`/?q=${encodeURIComponent(q)}`);
    };

    return (
        <>
            <header className="sticky top-0 z-30 flex items-center justify-between gap-4 bg-surface px-4 py-3 shadow-sm lg:px-8">
                <Link href="/" className="shrink-0 text-2xl font-extrabold text-primary">
                    BrewLite
                </Link>

                <div className="hidden flex-1 items-center justify-center gap-6 lg:flex">
                    <nav className="flex items-center gap-6 text-base font-semibold text-text">
                        <Link href="/" className="whitespace-nowrap hover:text-primary">
                            Trang chủ
                        </Link>

                        {/* MỞ BẰNG HOVER — giống hành vi popup giỏ hàng bên dưới, không cần bấm */}
                        <div
                            ref={menuRef}
                            className="relative"
                            onMouseEnter={() => setMenuOpen(true)}
                            onMouseLeave={() => setMenuOpen(false)}
                        >
                            <button
                                className="flex items-center gap-1 whitespace-nowrap hover:text-primary"
                                aria-expanded={isMenuOpen}
                            >
                                Menu
                                <ChevronIcon open={isMenuOpen} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute left-1/2 top-full z-40 w-56 -translate-x-1/2 rounded-xl border border-primary/10 bg-surface p-2 pt-2 shadow-lg">
                                    {/* "Tất cả" dùng ?view=all — khác với "/" trần của Trang chủ/logo,
                                        để HomeSections biết đây là xem list chứ không phải vào Home */}
                                    <Link
                                        href="/?view=all"
                                        onClick={() => setMenuOpen(false)}
                                        className="block rounded-lg px-3 py-2 text-sm font-bold text-primary hover:bg-background"
                                    >
                                        Tất cả
                                    </Link>
                                    {categories.map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            href={`/?category=${encodeURIComponent(cat.slug)}`}
                                            onClick={() => setMenuOpen(false)}
                                            className="block rounded-lg px-3 py-2 text-sm font-medium text-text hover:bg-background hover:text-primary"
                                        >
                                            {cat.label}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </div>

                        <Link href="/orders" className="whitespace-nowrap hover:text-primary">
                            Lịch sử
                        </Link>
                    </nav>

                    <form onSubmit={handleSearchSubmit} className="relative w-full max-w-xs">
                        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text/50">
                            <SearchIcon />
                        </span>
                        <input
                            type="search"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Tìm món, ví dụ: cà phê sữa..."
                            className="w-full rounded-full border border-primary/15 bg-background py-1.5 pl-9 pr-3 text-sm text-text outline-none focus:border-primary"
                        />
                    </form>
                </div>

                <div className="hidden shrink-0 items-center gap-5 lg:flex">
                    <div
                        className="relative py-2"
                        onMouseEnter={() => setIsCartHovered(true)}
                        onMouseLeave={() => setIsCartHovered(false)}
                    >
                        <Link
                            href="/cart"
                            className="flex items-center gap-1.5 text-base font-semibold text-text hover:text-primary"
                        >
                            <span>Giỏ hàng ({hasHydrated ? cartCount : 0})</span>
                        </Link>

                        {isCartHovered && (
                            <div className="absolute right-0 top-full z-50 w-80 rounded-2xl border border-primary/15 bg-surface p-4 shadow-xl transition-all">
                                <h4 className="border-b border-primary/10 pb-2.5 text-sm font-bold text-text">
                                    Sản phẩm đã chọn
                                </h4>

                                {cartItems.length === 0 ? (
                                    <div className="py-8 text-center text-xs font-medium text-text/60">
                                        Giỏ hàng của bạn đang trống
                                    </div>
                                ) : (
                                    <>
                                        <div className="my-2 flex max-h-72 flex-col divide-y divide-primary/10 overflow-y-auto pr-1">
                                            {cartItems.map((item, idx) => (
                                                <div key={idx} className="group/item relative flex items-center gap-3 py-2.5 pr-5">
                                                    <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-primary/10 bg-background">
                                                        {item.imageUrl ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={item.imageUrl}
                                                                alt={item.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <span className="text-xl">☕</span>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 overflow-hidden">
                                                        <h5 className="truncate text-xs font-bold text-text">
                                                            {item.name}
                                                        </h5>
                                                        <p className="text-[11px] font-semibold text-text/60">
                                                            Size {item.size} × {item.quantity}
                                                        </p>

                                                        {item.toppings && item.toppings.length > 0 && (
                                                            <p className="truncate text-[10px] text-text/50">
                                                                + {item.toppings.map((t) => (typeof t === 'string' ? t : t.name)).join(', ')}
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="text-right">
                                                        <span className="text-xs font-black text-primary">
                                                            {(item.lineTotal || (item.unitPrice ?? 0) * item.quantity || 0).toLocaleString('vi-VN')}đ
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            removeItem(idx);
                                                        }}
                                                        aria-label="Xóa sản phẩm"
                                                        className="absolute right-0 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-text/40 transition-colors hover:bg-red-50 hover:text-red-500"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="border-t border-primary/10 pt-3">
                                            <div className="flex items-center justify-between text-xs font-bold text-text mb-3">
                                                <span>Tổng tiền:</span>
                                                <span className="text-sm font-black text-primary">
                                                    {cartTotalPrice.toLocaleString('vi-VN')}đ
                                                </span>
                                            </div>

                                            <button
                                                onClick={() => router.push('/cart')}
                                                className="w-full rounded-full bg-primary py-2 text-center text-xs font-bold text-white shadow-sm transition-colors hover:bg-primary-hover"
                                            >
                                                Thanh toán
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {user ? (
                        <span className="text-base font-semibold text-text">{user.email}</span>
                    ) : (
                        <Link
                            href="/auth/login"
                            className="rounded-full bg-primary px-4 py-1.5 text-base font-semibold text-white hover:bg-primary-hover"
                        >
                            Đăng nhập
                        </Link>
                    )}
                </div>

                <button
                    onClick={() => setSidebarOpen(true)}
                    aria-label="Mở menu"
                    className="shrink-0 text-text lg:hidden"
                >
                    <MenuIcon />
                </button>
            </header>

            <Sidebar isOpen={isSidebarOpen} onClose={() => setSidebarOpen(false)} />
        </>
    );
}