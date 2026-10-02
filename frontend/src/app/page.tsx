import { Suspense } from 'react';
import { PromoCarousel } from '@/components/home/PromoCarousel';
import { BestSellers } from '@/components/home/BestSellers';
import { AllDrinksScroll } from '@/components/home/AllDrinksScroll';
import { CartStickyBar } from '@/components/cart/CartStickyBar';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 pb-24 lg:pb-8 lg:px-8">
      <PromoCarousel />
      <BestSellers />

      {/* FIX: AllDrinksScroll dùng useSearchParams() để lọc theo ?category=...,
          Next.js bắt buộc phải bọc Suspense mới prerender/build được trang "/" */}
      <Suspense fallback={<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-surface" />
        ))}
      </div>}>
        <AllDrinksScroll />
      </Suspense>

      {/* Fixed ở đáy màn hình, tự ẩn khi giỏ hàng trống */}
      <CartStickyBar />
    </main>
  );
}