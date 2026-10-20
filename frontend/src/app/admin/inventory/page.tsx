'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatVND } from '@/lib/utils';

interface ProductPrice {
    id: string;
    size: 'S' | 'M' | 'L';
    price: number;
}

interface ProductItem {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    category: string;
    stock: number;
    version: number;
    isAvailable: boolean;
    prices: ProductPrice[];
}

const CATEGORIES = [
    { key: 'all', label: 'Tất cả' },
    { key: 'phin', label: 'Cà phê Phin' },
    { key: 'phindi', label: 'PhinDi' },
    { key: 'tra', label: 'Trà' },
    { key: 'freeze', label: 'Freeze' },
    { key: 'espresso', label: 'Espresso' },
    { key: 'other', label: 'Khác' },
];

export default function AdminInventoryPage() {
    const queryClient = useQueryClient();
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [modalProduct, setModalProduct] = useState<ProductItem | null>(null);
    const [customQty, setCustomQty] = useState('');
    const [customMode, setCustomMode] = useState<'add' | 'set'>('add');

    // Fetch danh sách sản phẩm
    const { data: products = [], isLoading } = useQuery({
        queryKey: ['admin-products', selectedCategory],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (selectedCategory !== 'all') params.append('category', selectedCategory);
            const res = await api.get<{ data: ProductItem[] }>(`/admin/products?${params.toString()}`);
            return res.data.data;
        },
    });

    // Mutation cập nhật tồn kho (cộng thêm hoặc gán mới)
    const updateStockMutation = useMutation({
        mutationFn: async ({
            id,
            quantityToAdd,
            stock,
        }: {
            id: string;
            quantityToAdd?: number;
            stock?: number;
        }) => {
            return api.patch(`/admin/products/${id}/stock`, { quantityToAdd, stock });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
            setModalProduct(null);
            setCustomQty('');
        },
    });

    // Mutation bật / tắt mở bán
    const toggleAvailabilityMutation = useMutation({
        mutationFn: async (id: string) => {
            return api.patch(`/admin/products/${id}/availability`);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        },
    });

    // Thống kê nhanh
    const totalProducts = products.length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const inStock = products.filter((p) => p.stock > 10).length;

    const handleCustomSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!modalProduct) return;
        const num = parseInt(customQty, 10);
        if (isNaN(num)) return;

        if (customMode === 'add') {
            updateStockMutation.mutate({ id: modalProduct.id, quantityToAdd: num });
        } else {
            updateStockMutation.mutate({ id: modalProduct.id, stock: num });
        }
    };

    return (
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 lg:px-8">
            {/* Header - Không dùng icon */}
            <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-text">
                    Quản lý tồn kho
                </h1>
                <p className="mt-1 text-sm text-text/70">
                    Theo dõi lượng hàng sẵn có và nhập thêm số lượng cho từng món đồ uống.
                </p>
            </div>

            {/* Thẻ thống kê - Không dùng icon */}
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-2xl border border-primary/15 bg-surface p-4 shadow-sm">
                    <p className="text-xs font-semibold text-text/60">Tổng sản phẩm</p>
                    <p className="mt-2 text-2xl font-black text-text">{isLoading ? '...' : totalProducts}</p>
                </div>

                <div className="rounded-2xl border border-emerald-500/20 bg-emerald-50/50 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-emerald-800">Còn dồi dào</p>
                    <p className="mt-2 text-2xl font-black text-emerald-700">{isLoading ? '...' : inStock}</p>
                </div>

                <div className="rounded-2xl border border-amber-500/20 bg-amber-50/50 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-amber-800">Sắp hết hàng (≤10)</p>
                    <p className="mt-2 text-2xl font-black text-amber-700">{isLoading ? '...' : lowStock}</p>
                </div>

                <div className="rounded-2xl border border-rose-500/20 bg-rose-50/50 p-4 shadow-sm">
                    <p className="text-xs font-semibold text-rose-800">Đã hết hàng (0)</p>
                    <p className="mt-2 text-2xl font-black text-rose-700">{isLoading ? '...' : outOfStock}</p>
                </div>
            </div>

            {/* Danh mục pills */}
            <div className="mt-6 flex flex-wrap gap-1.5">
                {CATEGORIES.map((c) => (
                    <button
                        key={c.key}
                        type="button"
                        onClick={() => setSelectedCategory(c.key)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition-all ${selectedCategory === c.key
                                ? 'bg-primary text-white shadow-sm'
                                : 'bg-surface text-text/70 hover:bg-primary/10 hover:text-primary'
                            }`}
                    >
                        {c.label}
                    </button>
                ))}
            </div>

            {/* Bảng danh sách tồn kho */}
            <div className="mt-4 overflow-hidden rounded-2xl border border-primary/15 bg-surface shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-text">
                        <thead className="border-b border-primary/10 bg-primary/5 text-xs font-bold uppercase tracking-wider text-text/70">
                            <tr>
                                <th className="px-5 py-3.5">Sản phẩm</th>
                                <th className="px-4 py-3.5">Danh mục</th>
                                <th className="px-4 py-3.5">Giá theo Size</th>
                                <th className="px-4 py-3.5 text-center">Tồn kho hiện tại</th>
                                <th className="px-5 py-3.5 text-right">Thao tác nhập kho</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/10">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-text/50">
                                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                                        <p className="mt-2 text-xs">Đang tải dữ liệu tồn kho...</p>
                                    </td>
                                </tr>
                            ) : products.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-12 text-center text-text/50">
                                        Không tìm thấy sản phẩm nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                products.map((item) => {
                                    const isOut = item.stock === 0;
                                    const isLow = item.stock > 0 && item.stock <= 10;

                                    return (
                                        <tr
                                            key={item.id}
                                            className={`transition-colors hover:bg-primary/[0.02] ${!item.isAvailable ? 'opacity-60 bg-gray-50/50' : ''
                                                }`}
                                        >
                                            {/* Tên & Ảnh */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    {item.imageUrl ? (
                                                        <Image
                                                            src={item.imageUrl}
                                                            alt={item.name}
                                                            width={48}
                                                            height={48}
                                                            className="h-12 w-12 rounded-xl object-cover border border-primary/10"
                                                        />
                                                    ) : (
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary text-xs font-bold">
                                                            {item.name.slice(0, 2).toUpperCase()}
                                                        </div>
                                                    )}
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <p className="font-bold text-text">{item.name}</p>
                                                            {!item.isAvailable && (
                                                                <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                                                                    Ngừng bán
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-text/50">ID: {item.id.slice(0, 8)}...</p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Danh mục */}
                                            <td className="px-4 py-4">
                                                <span className="rounded-lg bg-primary/10 px-2.5 py-1 text-xs font-semibold uppercase text-primary">
                                                    {item.category}
                                                </span>
                                            </td>

                                            {/* Giá */}
                                            <td className="px-4 py-4 text-xs">
                                                {item.prices && item.prices.length > 0 ? (
                                                    <div className="flex flex-col gap-0.5">
                                                        {item.prices.map((p) => (
                                                            <span key={p.size} className="text-text/75">
                                                                Size <strong className="text-text">{p.size}</strong>:{' '}
                                                                {formatVND(p.price)}
                                                            </span>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <span className="text-text/40">Chưa cấu hình</span>
                                                )}
                                            </td>

                                            {/* Số lượng tồn kho */}
                                            <td className="px-4 py-4 text-center">
                                                <div className="inline-flex flex-col items-center">
                                                    <span
                                                        className={`text-xl font-black ${isOut
                                                                ? 'text-rose-600'
                                                                : isLow
                                                                    ? 'text-amber-600'
                                                                    : 'text-emerald-700'
                                                            }`}
                                                    >
                                                        {item.stock}
                                                    </span>
                                                    <span
                                                        className={`mt-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold ${isOut
                                                                ? 'bg-rose-100 text-rose-700'
                                                                : isLow
                                                                    ? 'bg-amber-100 text-amber-700'
                                                                    : 'bg-emerald-100 text-emerald-700'
                                                            }`}
                                                    >
                                                        {isOut ? 'Hết hàng' : isLow ? 'Sắp hết' : 'Còn hàng'}
                                                    </span>
                                                </div>
                                            </td>

                                            {/* Thao tác: Bỏ +10, +50; chỉ còn Nhập kho và Tạm ngưng */}
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Nhập kho */}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setModalProduct(item);
                                                            setCustomQty('20');
                                                            setCustomMode('add');
                                                        }}
                                                        className="rounded-lg bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary-hover transition-colors"
                                                    >
                                                        Nhập kho
                                                    </button>

                                                    {/* Bật/tắt mở bán */}
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleAvailabilityMutation.mutate(item.id)}
                                                        disabled={toggleAvailabilityMutation.isPending}
                                                        className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors ${item.isAvailable
                                                                ? 'border border-rose-300 text-rose-700 hover:bg-rose-50'
                                                                : 'border border-emerald-400 text-emerald-700 hover:bg-emerald-50'
                                                            }`}
                                                        title={item.isAvailable ? 'Nhấn để tạm dừng bán' : 'Nhấn để mở bán lại'}
                                                    >
                                                        {item.isAvailable ? 'Tạm ngưng' : 'Mở bán'}
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Nhập kho số lượng tùy ý */}
            {modalProduct && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-surface p-6 shadow-xl border border-primary/20">
                        <h3 className="text-lg font-bold text-text">
                            Nhập kho cho: <span className="text-primary">{modalProduct.name}</span>
                        </h3>
                        <p className="mt-1 text-xs text-text/60">
                            Số lượng tồn hiện tại: <strong className="text-text">{modalProduct.stock}</strong> món.
                        </p>

                        <form onSubmit={handleCustomSubmit} className="mt-4 space-y-4">
                            {/* Mode: Cộng dồn hoặc Đặt lại */}
                            <div className="grid grid-cols-2 gap-2 rounded-xl bg-primary/5 p-1 text-xs font-bold">
                                <button
                                    type="button"
                                    onClick={() => setCustomMode('add')}
                                    className={`rounded-lg py-2 transition-all ${customMode === 'add'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-text/70 hover:text-primary'
                                        }`}
                                >
                                    Cộng thêm (+)
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCustomMode('set')}
                                    className={`rounded-lg py-2 transition-all ${customMode === 'set'
                                            ? 'bg-primary text-white shadow-sm'
                                            : 'text-text/70 hover:text-primary'
                                        }`}
                                >
                                    Đặt lại số tồn
                                </button>
                            </div>

                            {/* Input */}
                            <div>
                                <label className="block text-xs font-semibold text-text/70">
                                    {customMode === 'add'
                                        ? 'Số lượng muốn cộng thêm (+)'
                                        : 'Số lượng tồn kho mới'}
                                </label>
                                <input
                                    type="number"
                                    min={customMode === 'add' ? 1 : 0}
                                    value={customQty}
                                    onChange={(e) => setCustomQty(e.target.value)}
                                    placeholder="Ví dụ: 50"
                                    required
                                    className="mt-1.5 w-full rounded-xl border border-primary/20 bg-background px-4 py-2 text-base font-bold text-text shadow-sm focus:border-primary focus:outline-none"
                                />
                                {customMode === 'add' && customQty && !isNaN(parseInt(customQty, 10)) && (
                                    <p className="mt-1 text-xs text-emerald-600 font-semibold">
                                        → Tồn kho sau khi cập nhật: {modalProduct.stock + parseInt(customQty, 10)} món
                                    </p>
                                )}
                            </div>

                            {/* Buttons */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setModalProduct(null)}
                                    className="rounded-full px-4 py-2 text-xs font-bold text-text/70 hover:bg-black/5"
                                >
                                    Hủy bỏ
                                </button>
                                <button
                                    type="submit"
                                    disabled={updateStockMutation.isPending}
                                    className="rounded-full bg-primary px-5 py-2 text-xs font-bold text-white shadow hover:bg-primary-hover disabled:opacity-50"
                                >
                                    {updateStockMutation.isPending ? 'Đang lưu...' : 'Xác nhận cập nhật'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
