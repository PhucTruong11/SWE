import { PromoCarousel } from '@/components/home/PromoCarousel';
import { BestSellers } from '@/components/home/BestSellers';
import { AllDrinksScroll } from '@/components/home/AllDrinksScroll';
import { CartStickyBar } from '@/components/cart/CartStickyBar';

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-4 py-4 pb-24 lg:pb-8 lg:px-8">
      <PromoCarousel />
      <BestSellers />
      <AllDrinksScroll />

      {/* Fixed ở đáy màn hình, tự ẩn khi giỏ hàng trống */}
      <CartStickyBar />
    </main>
  );
}