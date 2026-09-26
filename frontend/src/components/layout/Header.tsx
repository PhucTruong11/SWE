'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart.store';

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

// Icon mũi tên nhỏ, xoay khi dropdown mở
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

// TODO(BE): thay bằng data thật khi có endpoint GET /categories.
// Hiện Product.category là string tự do, chưa có danh sách chuẩn hoá.
export const CATEGORIES = [
    { slug: 'ca-phe', label: 'Cà phê' },
    { slug: 'tra', label: 'Trà' },
    { slug: 'da-xay', label: 'Đá xay' },
    { slug: 'banh', label: 'Bánh ngọt' },
    { slug: 'topping', label: 'Topping thêm' },
];

export function Header() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [isMenuOpen, setMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    const cartCount = useCartStore((s) => s.totalItems());
    const router = useRouter();

    // Ref bọc quanh nút "Menu" + dropdown, để biết click có nằm trong hay ngoài khu vực này
    const menuRef = useRef<HTMLDivElement>(null);

    // Tự đóng dropdown khi người dùng click ra ngoài khu vực Menu
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const q = searchQuery.trim();
        if (!q) return;
        router.push(`/search?q=${encodeURIComponent(q)}`);
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

                        <div ref={menuRef} className="relative">
                            <button
                                onClick={() => setMenuOpen((v) => !v)}
                                className="flex items-center gap-1 whitespace-nowrap hover:text-primary"
                                aria-expanded={isMenuOpen}
                            >
                                Menu
                                <ChevronIcon open={isMenuOpen} />
                            </button>

                            {isMenuOpen && (
                                <div className="absolute left-1/2 top-full z-40 mt-2 w-56 -translate-x-1/2 rounded-xl border border-primary/10 bg-surface p-2 shadow-lg">
                                    {CATEGORIES.map((cat) => (
                                        <Link
                                            key={cat.slug}
                                            href={`/menu?category=${cat.slug}`}
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
                    <Link
                        href="/cart"
                        className="flex items-center gap-1.5 text-base font-semibold text-text hover:text-primary"
                    >
                        {/* <span className="relative">
                            🛒
                            {cartCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </span> */}
                        <span>Giỏ hàng ({cartCount})</span>
                    </Link>

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