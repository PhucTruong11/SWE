import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import type { ApiResponse, Product } from '@/types';

interface UseProductsParams {
    category?: string;
}

export function useProducts(params: UseProductsParams = {}) {
    return useQuery({
        // queryKey chứa params để cache riêng theo từng bộ lọc
        queryKey: ['products', params],
        queryFn: async () => {
            const res = await api.get<ApiResponse<Product[]>>('/products', { params });
            return res.data.data;
        },
    });
}