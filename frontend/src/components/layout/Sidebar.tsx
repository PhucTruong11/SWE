'use client';

import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useCartStore } from '@/stores/cart.store';

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

const HomeIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 12l9-9 9 9M5 10v10a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V10" />
    </svg>
);
const HistoryIcon = () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 8v4l3 3M21 12a9 9 0 11-3-6.7M21 3v6h-6" />
    </svg>
);

const NAV_ITEMS = [
    { href: '/', label: 'Trang chủ', icon: HomeIcon },
    { href: '/orders', label: 'Lịch sử', icon: HistoryIcon },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
    const { user } = useAuth();
    const cartCount = useCartStore((s) => s.totalItems());

    return (
        <>
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={onClose}
                    aria-hidden="true"
                />
            )}

            <aside
                className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-primary text-white transition-transform duration-300 lg:hidden ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between p-4">
                    <span className="text-xl font-bold">BrewLite</span>
                    <button onClick={onClose} aria-label="Đóng menu" className="text-2xl leading-none">
                        ×
                    </button>
                </div>

                <div className="flex flex-col items-center gap-2 border-b border-white/15 pb-6">
                    <div className="h-16 w-16 rounded-full bg-white/20" />
                    {user ? (
                        <>
                            <p className="font-semibold">{user.email}</p>
                            <p className="text-sm text-white/80">{user.loyaltyPoints} điểm tích lũy</p>
                            <button onClick={onClose} className="text-sm underline">
                                Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <p className="font-semibold">Xin chào, Khách!</p>
                            <Link href="/auth/login" onClick={onClose} className="text-sm underline">
                                Đăng nhập
                            </Link>
                        </>
                    )}
                </div>

                <nav className="flex flex-1 flex-col gap-1 p-4 text-base font-semibold">
                    {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
                        <Link
                            key={href}
                            href={href}
                            onClick={onClose}
                            className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/10"
                        >
                            <Icon />
                            <span>{label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-2">
                    <div className="overflow-hidden rounded-xl bg-[#ed4b2f] text-white shadow-lg">
                        <div className="flex items-center gap-3 px-4 py-3">
                            <span className="relative flex h-10 w-10 items-center justify-center">
                                <svg
                                    width="30"
                                    height="30"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <circle cx="9" cy="20" r="1" />
                                    <circle cx="19" cy="20" r="1" />
                                    <path d="M3 4h2l2.4 11.5a2 2 0 0 0 2 1.5h7.8a2 2 0 0 0 2-1.5L21 8H6" />
                                    <path d="M9 8l2 3 2-3 2 3 2-3" />
                                </svg>
                                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-[#ed4b2f]">
                                    {cartCount}
                                </span>
                            </span>

                            <p className="text-base font-bold">
                                Giỏ hàng ({cartCount})
                            </p>
                        </div>

                        <Link
                            href="/checkout"
                            onClick={onClose}
                            className="mx-2 mb-2 block rounded-lg bg-[#087f5b] py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-[#066b4d]"
                        >
                            Thanh toán ngay
                        </Link>
                    </div>
                </div>
            </aside>
        </>
    );
}