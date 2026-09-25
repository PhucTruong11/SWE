import Link from 'next/link';
import { formatVND } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
    product: Product;
    /**
     * "bestseller": card lớn, có badge HOT, nút "Chọn món" (dùng trong grid 2 cột)
     * "compact": card nhỏ dạng cuộn ngang, hiện kèm giá (dùng trong AllDrinksScroll)
     */
    variant?: 'bestseller' | 'compact';
}

export function ProductCard({ product, variant = 'bestseller' }: ProductCardProps) {
    const href = `/product/${product.id}`;

    if (variant === 'compact') {
        return (
            <Link
                href={href}
                className="flex w-24 flex-shrink-0 flex-col items-center gap-2 text-center lg:w-full"
            >
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-surface shadow-sm">
                    {product.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element -- domain ảnh remote chưa khai báo trong next.config.ts
                        <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                    ) : (
                        // Placeholder khi chưa có ảnh, tránh vỡ layout
                        <div className="flex h-full w-full items-center justify-center text-2xl">☕</div>
                    )}
                </div>
                <div>
                    <p className="text-sm font-medium leading-tight text-text">{product.name}</p>
                    <p className="text-xs text-text/70">{formatVND(product.price)}</p>
                </div>
            </Link>
        );
    }

    // variant "bestseller" — card lớn cho grid Món Bán Chạy
    return (
        <div className="relative flex flex-col items-center gap-2 rounded-xl border border-primary/15 bg-surface p-4 text-center">
            {product.isBestSeller && (
                <span className="absolute -right-2 -top-2 rounded-full bg-orange-500 px-2 py-1 text-[10px] font-bold text-white shadow">
                    HOT!
                </span>
            )}
            <div className="relative h-20 w-20 overflow-hidden rounded-full bg-background">
                {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- domain ảnh remote chưa khai báo trong next.config.ts
                    <img src={product.imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">☕</div>
                )}
            </div>
            <p className="text-sm font-semibold text-text">{product.name}</p>
            <Link
                href={href}
                className="w-full rounded-full bg-primary py-1.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
                Chọn món
            </Link>
        </div>
    );
}