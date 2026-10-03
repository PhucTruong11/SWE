'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Slide {
    imageUrl: string;
    alt: string;
}

const SLIDES: Slide[] = [
    { imageUrl: '/images/banner_gioi_thieu.jpg', alt: 'Gioi thieu' },
    { imageUrl: '/images/banner_san_pham.jpg', alt: 'San pham' },
    { imageUrl: '/images/banner_khuyen_mai.jpg', alt: 'Khuyen mai' },
    { imageUrl: '/images/banner_cham_soc.jpg', alt: 'Cham soc' },
];

const AUTO_SLIDE_INTERVAL_MS = 4000;

export function PromoCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        if (SLIDES.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIndex((i) => (i + 1) % SLIDES.length);
        }, AUTO_SLIDE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, []);

    return (
        <div className="relative overflow-hidden rounded-2xl">
            <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
                {SLIDES.map((slide, i) => (
                    <div
                        key={i}
                        className="relative aspect-square w-full shrink-0 bg-primary md:aspect-[3/1]"
                    >
                        <Image
                            src={slide.imageUrl}
                            alt={slide.alt}
                            fill
                            priority={i === 0}
                            sizes="(max-width: 768px) 100vw, 1024px"
                            className="object-fill"
                        />
                    </div>
                ))}
            </div>

            {/* Dot indicator — bấm để chuyển slide thủ công */}
            {SLIDES.length > 1 && (
                <div className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            aria-label={`Xem banner ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/50'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}