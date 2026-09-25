'use client';

import { useEffect, useState } from 'react';

interface Slide {
    emoji: string;
    title: string;
    description: string;
}

const SLIDES: Slide[] = [
    {
        emoji: '🍉',
        title: 'Ưu đãi hè!',
        description: 'Nhận ngay 20k cho đơn hàng đầu tiên.',
    },
    {
        emoji: '☕',
        title: 'Mua 2 tặng 1',
        description: 'Áp dụng cho dòng cà phê phin mỗi thứ 2 hàng tuần.',
    },
];

const AUTO_SLIDE_INTERVAL_MS = 4000;

export function PromoCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);

    // Tự động chuyển slide, dừng lại nếu chỉ có 1 slide
    useEffect(() => {
        if (SLIDES.length <= 1) return;
        const timer = setInterval(() => {
            setActiveIndex((i) => (i + 1) % SLIDES.length);
        }, AUTO_SLIDE_INTERVAL_MS);
        return () => clearInterval(timer);
    }, []);

    const slide = SLIDES[activeIndex];

    return (
        <div className="relative overflow-hidden rounded-2xl bg-primary px-5 py-6 text-white">
            <div className="flex items-center gap-4">
                <span className="text-4xl">{slide.emoji}</span>
                <div>
                    <p className="text-lg font-bold">{slide.title}</p>
                    <p className="text-sm text-white/90">{slide.description}</p>
                </div>
            </div>

            {/* Dot indicator — bấm để chuyển slide thủ công */}
            {SLIDES.length > 1 && (
                <div className="mt-4 flex justify-center gap-1.5">
                    {SLIDES.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveIndex(i)}
                            aria-label={`Xem banner ${i + 1}`}
                            className={`h-1.5 rounded-full transition-all ${i === activeIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}