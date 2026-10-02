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
        // FIX: api.ts không phải React component nên không dùng được useRouter() trực tiếp.
        // Thay vì window.location.href (load lại toàn bộ trang, rất chậm),
        // bắn ra một CustomEvent để component <AuthRedirectListener /> (mount ở layout gốc)
        // lắng nghe và tự điều hướng bằng router.push('/auth/login') - không reload trang.
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('unauthorized'));
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;