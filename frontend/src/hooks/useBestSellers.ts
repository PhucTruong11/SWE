import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Product } from '@/types';

const MAX_BEST_SELLERS = 4; // khớp layout 2x2 trong thiết kế

export function useBestSellers() {
    return useQuery({
        queryKey: ['products', 'best-sellers'],
        queryFn: async () => {
            const res = await api.get<ApiResponse<Product[]>>('/products');
            const all = res.data.data;

            // Ưu tiên sản phẩm có isBestSeller === true; nếu BE chưa gắn field này
            // cho sản phẩm nào, tạm lấy 4 sản phẩm đầu tiên để UI không bị trống.
            const flagged = all.filter((p) => p.isBestSeller);
            const fallback = flagged.length > 0 ? flagged : all;

            return fallback.slice(0, MAX_BEST_SELLERS);
        },
    });
}