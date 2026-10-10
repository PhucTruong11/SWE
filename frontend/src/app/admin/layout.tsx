'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, ClipboardList, Store, LogOut, Menu, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const NAV_ITEMS = [
    { href: '/admin', label: 'Trang chủ', icon: LayoutDashboard, exact: true },
    { href: '/admin/orders', label: 'Đơn hàng', icon: ClipboardList, exact: false },
];

function MenuContent({
    pathname,
    onNavigate,
    onLogout,
    showLogout,
}: {
    pathname: string;
    onNavigate?: () => void;
    onLogout: () => void;
    showLogout: boolean;
}) {
    return (
        <div className="flex h-full flex-col">
            <nav className="flex flex-col gap-1 p-4 text-base font-semibold">
                {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
                    // Mục đang mở thì tô sáng
                    const active = exact ? pathname === href : pathname.startsWith(href);
                    return (
                        <Link
                            key={href}
                            href={href}
                            onClick={onNavigate}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-white/10 ${active ? 'bg-white/15' : ''
                                }`}
                        >
                            <Icon size={18} />
                            <span>{label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="mt-auto flex flex-col gap-1 border-t border-white/15 p-4 text-sm font-semibold">
                <Link
                    href="/"
                    onClick={onNavigate}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-white/85 hover:bg-white/10"
                >
                    <Store size={18} />
                    <span>Về trang khách</span>
                </Link>
                {showLogout && (
                    <button
                        type="button"
                        onClick={onLogout}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-white/85 hover:bg-white/10"
                    >
                        <LogOut size={18} />
                        <span>Đăng xuất</span>
                    </button>
                )}
            </div>
        </div>
    );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, loading, logout } = useAuth();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Chưa đăng nhập thì chuyển về trang login (áp dụng cho mọi trang /admin/*)
    // TODO(Role): đổi thành kiểm tra user.role === 'ADMIN'
    useEffect(() => {
        if (!loading && !user) router.push('/auth/login?redirect=/admin');
    }, [loading, user, router]);

    if (loading || !user) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="flex min-h-screen flex-col">
            <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-surface px-4 shadow-sm lg:px-8">
                <Link href="/admin" className="flex items-center gap-2 text-2xl font-extrabold text-primary">
                    BrewLite
                    <span className="rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                        Admin
                    </span>
                </Link>

                <div className="hidden items-center gap-4 lg:flex">
                    <span className="max-w-[220px] truncate text-sm text-text/70" title={user.email}>
                        {user.email}
                    </span>
                    <button
                        type="button"
                        onClick={logout}
                        className="flex items-center gap-1.5 rounded-full border border-primary/20 px-4 py-1.5 text-sm font-semibold text-text hover:bg-background hover:text-primary"
                    >
                        <LogOut size={14} /> Đăng xuất
                    </button>
                </div>

                <button
                    onClick={() => setDrawerOpen(true)}
                    aria-label="Mở menu"
                    className="text-text lg:hidden"
                >
                    <Menu size={24} />
                </button>
            </header>

            <div className="flex flex-1">
                <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] w-60 shrink-0 bg-primary text-white lg:block">
                    <MenuContent pathname={pathname} onLogout={logout} showLogout={false} />
                </aside>

                <div className="flex min-w-0 flex-1 flex-col">{children}</div>
            </div>

            {drawerOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/40 lg:hidden"
                    onClick={() => setDrawerOpen(false)}
                    aria-hidden="true"
                />
            )}
            <aside
                className={`fixed right-0 top-0 z-50 flex h-full w-72 flex-col bg-primary text-white transition-transform duration-300 lg:hidden ${drawerOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                <div className="flex items-center justify-between border-b border-white/15 p-4">
                    <p className="truncate text-sm font-semibold">{user.email}</p>
                    <button onClick={() => setDrawerOpen(false)} aria-label="Đóng menu">
                        <X size={22} />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <MenuContent
                        pathname={pathname}
                        onNavigate={() => setDrawerOpen(false)}
                        onLogout={logout}
                        showLogout
                    />
                </div>
            </aside>
        </div>
    );
}