'use client';

import { useSearchParams } from 'next/navigation';
import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { CATEGORIES } from '@/components/layout/Header'; // sửa lại đúng đường dẫn nếu khác

export function AllDrinksScroll() {
    const searchParams = useSearchParams();
    const categorySlug = searchParams.get('category');

    // FIX: để backend lọc sẵn qua GET /products?category=... (controller đã hỗ trợ),
    // không tải hết sản phẩm về rồi lọc ở client nữa. queryKey trong useProducts có chứa params
    // nên mỗi category được cache riêng.
    const { data: filteredProducts, isLoading, isError } = useProducts({
        category: categorySlug ?? undefined,
    });

    const activeLabel = CATEGORIES.find((c) => c.slug === categorySlug)?.label;

    return (
        <section className="mt-6">
            <h2 className="mb-4 text-lg font-bold text-text">
                {activeLabel ? activeLabel : 'Tất cả đồ uống'}
            </h2>

            {isLoading && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface" />
                    ))}
                </div>
            )}

            {isError && (
                <p className="rounded-xl bg-surface p-4 text-sm text-text/70">
                    Không tải được danh sách đồ uống. Vui lòng thử lại sau.
                </p>
            )}

            {filteredProducts && filteredProducts.length === 0 && (
                <p className="rounded-xl bg-surface p-4 text-sm text-text/70">
                    Hiện chưa có sản phẩm nào{activeLabel ? ` trong mục "${activeLabel}"` : ''}.
                </p>
            )}

            {filteredProducts && filteredProducts.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {filteredProducts.map((product) => (
                        <ProductCard key={product.id} product={product} variant="bestseller" />
                    ))}
                </div>
            )}
        </section>
    );
}