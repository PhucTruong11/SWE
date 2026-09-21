import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Gửi JWT cookie tự động
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response interceptor - extract data
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý lỗi chung
    if (error.response) {
      const { status } = error.response;
      if (status === 401) {
        // Redirect to login if unauthorized
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
