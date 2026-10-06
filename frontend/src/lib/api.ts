import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Gửi và nhận HttpOnly Cookie JWT
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor xử lý lỗi 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl = error.config?.url?.split('?')[0];
    if (
      error.response?.status === 401 &&
      typeof window !== 'undefined' &&
      !requestUrl?.endsWith('/auth/me')
    ) {
      window.dispatchEvent(new Event('unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;