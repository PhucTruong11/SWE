'use client';

import Link from 'next/link';
import Image from 'next/image';
import { formatVND } from '@/lib/utils';
import type { Product } from '@/types';

interface ProductCardProps {
    product: Product & {
        prices?: { size: string; price: number }[];
        price?: number;
    };
    variant?: 'bestseller' | 'compact';
    priority?: boolean; // Thuộc tính ưu tiên tải ảnh nhanh nếu nằm ở màn hình đầu
}

function getDisplayPrice(product: ProductCardProps['product']): { rawPrice: number; formattedPrice: string } {
    let rawPrice: number | undefined;

    if (product.price !== undefined && product.price !== null) {
        rawPrice = Number(product.price);
    } else if (product.prices && product.prices.length > 0) {
        rawPrice = Number(product.prices[0].price);
    }

    if (rawPrice === undefined || isNaN(rawPrice)) {
        return { rawPrice: 0, formattedPrice: '0đ' };
    }

    const formattedPrice = formatVND ? formatVND(rawPrice) : `${rawPrice.toLocaleString('vi-VN')}đ`;
    return { rawPrice, formattedPrice };
}

export function ProductCard({ product, variant = 'bestseller', priority = false }: ProductCardProps) {
    const href = `/product/${product.id}`;
    const { formattedPrice } = getDisplayPrice(product);

    if (variant === 'compact') {
        return (
            <Link
                href={href}
                className="group flex w-full flex-col items-center gap-2 text-center transition-all duration-300 ease-in-out hover:-translate-y-1"
            >
                <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-surface shadow-sm transition-all duration-300 group-hover:scale-105 group-hover:shadow-md">
                    {product.imageUrl ? (
                        <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            sizes="80px"
                            priority={priority}
                            className="object-cover transition-opacity duration-300"
                        />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center text-2xl">☕</div>
                    )}
                </div>
                <div>
                    <p className="line-clamp-1 text-sm font-medium leading-tight text-text transition-colors group-hover:text-primary">
                        {product.name}
                    </p>
                    <p className="mt-0.5 text-xs text-text/70">{formattedPrice}</p>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className="group relative flex flex-col items-center justify-between gap-3 rounded-2xl border border-primary/15 bg-surface p-4 text-center shadow-sm transition-all duration-300 ease-in-out hover:-translate-y-1.5 hover:border-primary/40 hover:shadow-xl"
        >
            {product.isBestSeller && (
                <span className="absolute -right-1.5 -top-1.5 z-10 rounded-full bg-orange-500 px-2.5 py-0.5 text-[10px] font-bold text-white shadow-md">
                    HOT!
                </span>
            )}

            {/* Khung ảnh cố định với Next Image */}
            <div className="relative h-28 w-28 overflow-hidden rounded-full bg-background shadow-inner transition-transform duration-300 ease-in-out group-hover:scale-105">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        sizes="112px"
                        priority={priority}
                        loading={priority ? 'eager' : undefined}
                        className="object-cover transition-opacity duration-300"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl">☕</div>
                )}
            </div>

            <div className="flex w-full flex-col items-center gap-1">
                <p className="line-clamp-1 text-base font-semibold text-text transition-colors group-hover:text-primary">
                    {product.name}
                </p>
                <p className="text-sm font-bold text-primary">{formattedPrice}</p>
            </div>

            <span
                
                className="w-full rounded-full bg-primary py-2 text-xs font-medium text-white shadow-sm transition-all duration-300 hover:scale-[1.02] group-hover:bg-primary-hover group-hover:shadow-md active:scale-95"
            >
                Chi tiết sản phẩm
            </span>
        </Link>
    );
}