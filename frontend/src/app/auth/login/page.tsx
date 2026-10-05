'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isNotRegistered, setIsNotRegistered] = useState(false); // Trạng thái chưa có tài khoản
  const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsNotRegistered(false);
    setUnverifiedEmail(null);
    setLoading(true);

    try {
      await api.post('/auth/login', { email, password });
      window.location.href = redirectUrl;
    } catch (err: any) {
      const status = err.response?.status;
      const errData = err.response?.data;
      const message = errData?.message || '';

      // Kiểm tra nếu Backend trả về 404 hoặc thông báo không tìm thấy tài khoản
      if (status === 404 || message.includes('not found') || message.includes('không tồn tại')) {
        setIsNotRegistered(true);
        setError('Tài khoản này chưa được đăng ký trong hệ thống.');
      } else if (errData?.code === 'EMAIL_NOT_VERIFIED' || message?.code === 'EMAIL_NOT_VERIFIED') {
        const targetEmail = errData?.email || message?.email || email;
        setUnverifiedEmail(targetEmail);
        setError('Tài khoản của bạn chưa được xác minh email.');
      } else {
        setError(typeof message === 'string' ? message : 'Email hoặc mật khẩu không chính xác.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-amber-50/40 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg p-8 border border-amber-100">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-amber-900">☕ BrewLite</h1>
          <p className="text-gray-500 mt-2 text-sm">Đăng nhập để tiếp tục</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg border border-red-200">
            {error}
            
            {/* Gợi ý chuyển sang Đăng ký nếu Email chưa tồn tại */}
            {isNotRegistered && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <Link
                  href={`/auth/register?email=${encodeURIComponent(email)}`}
                  className="font-bold underline text-primary hover:text-primary-hover flex items-center gap-1"
                >
                  👉 Bạn có muốn đăng ký tài khoản mới với email này?
                </Link>
              </div>
            )}

            {unverifiedEmail && (
              <div className="mt-2 pt-2 border-t border-red-200">
                <Link
                  href={`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                  className="font-semibold underline hover:text-red-800"
                >
                  👉 Nhấn vào đây để nhập mã OTP xác minh
                </Link>
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nhap@email.com"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-semibold rounded-xl transition disabled:opacity-50"
          >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6">
          Chưa có tài khoản?{' '}
          <Link
            href={`/auth/register${redirectUrl !== '/' ? `?redirect=${encodeURIComponent(redirectUrl)}` : ''}`}
            className="text-primary font-semibold hover:underline"
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center p-8">Đang tải...</div>}>
      <LoginForm />
    </Suspense>
  );
}