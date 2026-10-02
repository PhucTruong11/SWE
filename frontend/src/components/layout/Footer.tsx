import Link from 'next/link';

export function Footer() {
    return (
        <footer className="mt-8 border-t border-primary/10 bg-primary px-4 py-8 lg:px-8">
            <div className="mx-auto grid max-w-5xl gap-8 sm:grid-cols-3">
                <div>
                    <p className="text-xl font-extrabold text-background">BrewLite</p>
                    <p className="mt-2 text-sm text-white/70">
                        Đặt cà phê nhanh, không cần tiền mặt.
                    </p>
                </div>

                <div>
                    <p className="mb-2 text-sm font-bold text-white">Chi nhánh</p>
                    <p className="text-sm text-white/70">273 An Dương Vương, Phường Chợ Quán, TP. HCM</p>
                    <p className="text-sm text-white/70">105 Bà Huyện Thanh Quan, Phường Xuân Hòa, TP. HCM</p>
                    <p className="text-sm text-white/70"> 04 Tôn Đức Thắng, Phường Sài Gòn, TP. HCM</p>
                </div>

                <div>
                    <p className="mb-2 text-sm font-bold text-white">Liên hệ</p>
                    {/* TODO: thay bằng thông tin thật của quán khi có */}
                    <p className="text-sm text-white/70">Email: support@brewlite.vn</p>
                    <p className="text-sm text-white/70">Hotline: 1900 xxxx</p>
                </div>
            </div>

            <p className="mx-auto mt-8 max-w-5xl border-t border-background/10 pt-4 text-center text-xs text-white/50">
                © {new Date().getFullYear()} BrewLite. Bài tập lớn môn Công nghệ Phần mềm.
            </p>
        </footer>
    );
}