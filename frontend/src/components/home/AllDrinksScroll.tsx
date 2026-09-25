'use client';

import { useProducts } from '@/hooks/useProducts';
import { ProductCard } from '@/components/product/ProductCard';

export function AllDrinksScroll() {
    const { data: products, isLoading, isError } = useProducts();

    return (
        <section>
            <h2 className="mb-3 text-lg font-bold text-text">Tất cả đồ uống</h2>

            {isLoading && (
                <div className="flex gap-3 overflow-x-auto pb-1 lg:grid lg:grid-cols-6 lg:overflow-visible">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="h-32 w-24 flex-shrink-0 animate-pulse rounded-2xl bg-surface" />
                    ))}
                </div>
            )}

            {isError && (
                <p className="rounded-xl bg-surface p-4 text-sm text-text/70">
                    Không tải được danh sách đồ uống. Vui lòng thử lại sau.
                </p>
            )}

            {products && products.length === 0 && (
                <p className="rounded-xl bg-surface p-4 text-sm text-text/70">
                    Hiện chưa có sản phẩm nào.
                </p>
            )}

            {products && products.length > 0 && (
                // overflow-x-auto tạo cuộn ngang, -mx-4 px-4 để item đầu/cuối không bị cắt sát mép
                <div className="-mx-4 flex gap-4 overflow-x-auto px-4 pb-1 lg:mx-0 lg:grid lg:grid-cols-6 lg:overflow-visible lg:px-0">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} variant="compact" />
                    ))}
                </div>
            )}
        </section>
    );
}