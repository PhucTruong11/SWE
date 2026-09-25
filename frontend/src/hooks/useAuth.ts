// File CHUNG (thuộc Task Auth) — đây là bản MOCK tạm thời để Sidebar chạy được
// ngay bây giờ. Khi người làm Auth code xong, họ chỉ cần thay nội dung hàm bên
// trong, giữ nguyên tên export + shape trả về (user, isLoading, login, logout)
// để Sidebar không phải sửa gì cả.

import type { User } from '@/types';

interface UseAuthReturn {
    user: User | null;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
    // TODO(Task Auth): thay bằng logic thật — đọc user từ /auth/me hoặc context thật
    return {
        user: null, // null = chưa đăng nhập → Sidebar hiện "Xin chào, Khách!"
        isLoading: false,
        login: async () => {
            throw new Error('useAuth.login chưa được implement (chờ Task Auth)');
        },
        logout: async () => {
            throw new Error('useAuth.logout chưa được implement (chờ Task Auth)');
        },
    };
}