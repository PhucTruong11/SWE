'use client';

import { useState } from 'react';
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

const NAV_LINKS = [
    { href: '/', label: 'Trang chủ' },
    { href: '/orders', label: 'Lịch sử' },
];

export function Header() {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();
    const cartCount = useCartStore((s) => s.totalItems());
    const router = useRouter();

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
                        {NAV_LINKS.map((item) => (
                            <Link key={item.href} href={item.href} className="whitespace-nowrap hover:text-primary">
                                {item.label}
                            </Link>
                        ))}
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
                        <span className="relative">
                            🛒
                            {cartCount > 0 && (
                                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-orange-600 text-[10px] font-bold text-white">
                                    {cartCount}
                                </span>
                            )}
                        </span>
                        <span>Giỏ hàng</span>
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