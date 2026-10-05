'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/stores/cart.store';

export interface User {
  id?: string;
  email: string;
  name?: string;
  role?: string;
  [key: string]: any;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const initUserCart = useCartStore((s) => s.initUserCart);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/auth/me');
      const userData = res.data?.data || res.data;
      setUser(userData);

      // Khi đăng nhập thành công: Tải giỏ hàng riêng của User ID / Email này
      const userId = userData.id || userData.email;
      initUserCart(userId);
    } catch (error) {
      // Khi chưa đăng nhập hoặc lỗi 401: Trả về trạng thái Khách vãng lai
      setUser(null);
      initUserCart(null);
    } finally {
      setLoading(false);
    }
  }, [initUserCart]);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Lỗi khi đăng xuất:', error);
    } finally {
      setUser(null);
      // Khi Đăng xuất: Đưa giỏ hàng active về Khách vãng lai (Giỏ hàng của tài khoản vừa rồi vẫn cất an toàn)
      initUserCart(null);
      window.location.href = '/auth/login';
    }
  };

  return {
    user,
    loading,
    logout,
    isAuthenticated: !!user,
    refetchUser: fetchMe,
  };
}