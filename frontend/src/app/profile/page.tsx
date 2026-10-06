'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Address {
  id: string;
  recipientName: string;
  phone: string;
  detailAddress: string;
  ward?: string;
  district?: string;
  city?: string;
  isDefault: boolean;
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  phone?: string;
  loyaltyPoints: number;
  addresses: Address[];
}

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  // Form Thông tin cá nhân
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal Thêm Địa chỉ
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addingAddress, setAddingAddress] = useState(false);
  const [newAddr, setNewAddr] = useState({
    recipientName: '',
    phone: '',
    detailAddress: '',
    ward: '',
    district: '',
    city: '',
    isDefault: false,
  });

  // Helper hàm lấy Header xác thực
  const getAuthHeaders = () => {
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('token') || localStorage.getItem('accessToken')
        : null;
    return {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  };

  // 1. Tải thông tin Profile từ Backend
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/auth/me', {
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (res.status === 401) {
        router.push('/auth/login');
        return;
      }

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || 'Không thể tải thông tin cá nhân');
      }

      const data: UserProfile = await res.json();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhone(data.phone || '');
    } catch (err: any) {
      console.error('Fetch Profile Error:', err);
      setProfileMsg({ type: 'error', text: err.message || 'Không thể kết nối đến máy chủ' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  // 2. Cập nhật Họ tên & SĐT
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg(null);

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify({ fullName, phone }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Cập nhật thất bại, vui lòng thử lại');
      }

      setProfile(data);
      setProfileMsg({ type: 'success', text: 'Đã lưu thông tin cá nhân thành công!' });
    } catch (err: any) {
      setProfileMsg({ type: 'error', text: err.message || 'Có lỗi xảy ra' });
    } finally {
      setSavingProfile(false);
    }
  };

  // 3. Thêm địa chỉ mới
  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddingAddress(true);

    try {
      const res = await fetch('/api/auth/addresses', {
        method: 'POST',
        headers: getAuthHeaders(),
        credentials: 'include',
        body: JSON.stringify(newAddr),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || 'Không thể thêm địa chỉ mới');
      }

      setShowAddressModal(false);
      setNewAddr({
        recipientName: '',
        phone: '',
        detailAddress: '',
        ward: '',
        district: '',
        city: '',
        isDefault: false,
      });
      fetchProfile();
    } catch (err: any) {
      alert(err.message || 'Lỗi khi thêm địa chỉ');
    } finally {
      setAddingAddress(false);
    }
  };

  // 4. Đặt địa chỉ làm mặc định
  const handleSetDefaultAddress = async (addressId: string) => {
    try {
      const res = await fetch(`/api/auth/addresses/${addressId}/default`, {
        method: 'PATCH',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Cập nhật thất bại');
      }
      fetchProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 5. Xóa địa chỉ
  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) return;

    try {
      const res = await fetch(`/api/auth/addresses/${addressId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
        credentials: 'include',
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || 'Xóa địa chỉ thất bại');
      }
      fetchProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-8">
      {/* HEADER BẢNG ĐIỀU KHIỂN */}
      <div className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight lg:text-3xl">Tài khoản của tôi</h1>
          <p className="mt-1 text-sm font-normal text-text/70">Quản lý thông tin cá nhân và sổ địa chỉ giao hàng</p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center text-sm font-semibold text-primary hover:underline"
        >
          ← Quay lại trang chủ
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* CỘT TRÁI: THÔNG TIN TỔNG QUAN */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-primary/15 bg-surface p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-xl font-black text-primary">
                {profile?.fullName ? profile.fullName.charAt(0).toUpperCase() : '☕'}
              </div>
              <div className="overflow-hidden">
                <h2 className="truncate text-base font-bold text-text">{profile?.fullName || 'Thành viên BrewLite'}</h2>
                <p className="truncate text-xs font-normal text-text/60">{profile?.email}</p>
              </div>
            </div>

            <div className="mt-4 border-t border-primary/10 pt-4">
              <div className="flex items-center justify-between rounded-2xl bg-background p-4 border border-primary/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-text">Điểm tích lũy</span>
                </div>
                <span className="text-base font-black text-primary">{profile?.loyaltyPoints || 0} điểm</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: FORM CẬP NHẬT & SỔ ĐỊA CHỈ */}
        <div className="space-y-8 lg:col-span-2">
          {/* PHẦN 1: THÔNG TIN CÁ NHÂN */}
          <div className="rounded-3xl border border-primary/15 bg-surface p-6 shadow-sm">
            <h3 className="mb-5 border-b border-primary/10 pb-3 text-lg font-bold text-text">
              Thông tin cá nhân
            </h3>

            {profileMsg && (
              <div
                className={`mb-5 rounded-xl p-3.5 text-sm font-medium ${
                  profileMsg.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}
              >
                {profileMsg.text}
              </div>
            )}

            <form onSubmit={handleUpdateProfile} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-text/80">Địa chỉ Email</label>
                <input
                  type="email"
                  disabled
                  value={profile?.email || ''}
                  className="w-full rounded-xl border border-primary/10 bg-background/60 px-4 py-2.5 text-sm text-text/60 outline-none cursor-not-allowed select-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text/80">Họ và tên</label>
                  <input
                    type="text"
                    placeholder="Nhập họ và tên..."
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-text outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text/80">Số điện thoại</label>
                  <input
                    type="tel"
                    placeholder="Nhập số điện thoại..."
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-xl border border-primary/20 bg-background px-4 py-2.5 text-sm text-text outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                  />
                </div>
              </div>

              <div className="pt-2 text-right">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary-hover active:scale-[0.98] disabled:opacity-50"
                >
                  {savingProfile ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
              </div>
            </form>
          </div>

          {/* PHẦN 2: QUẢN LÝ ĐỊA CHỈ */}
          <div className="rounded-3xl border border-primary/15 bg-surface p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between border-b border-primary/10 pb-3">
              <h3 className="text-lg font-bold text-text">Sổ địa chỉ giao hàng</h3>
              <button
                type="button"
                onClick={() => setShowAddressModal(true)}
                className="rounded-xl border border-primary/20 px-4 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                + Thêm địa chỉ mới
              </button>
            </div>

            {profile?.addresses && profile.addresses.length > 0 ? (
              <div className="space-y-3.5">
                {profile.addresses.map((addr, index) => (
                  <div
                    key={addr.id}
                    className={`relative rounded-2xl border p-4 transition-all ${
                      addr.isDefault
                        ? 'border-primary/40 bg-primary/[0.02]'
                        : 'border-primary/10 bg-background'
                    }`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primary">
                          Địa chỉ {index + 1}
                        </span>
                        {addr.isDefault && (
                          <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary">
                            Mặc định
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        {!addr.isDefault && (
                          <button
                            type="button"
                            onClick={() => handleSetDefaultAddress(addr.id)}
                            className="text-xs font-medium text-text/60 hover:text-primary"
                          >
                            Thiết lập mặc định
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteAddress(addr.id)}
                          className="text-xs font-medium text-red-500 hover:text-red-700"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>

                    <p className="text-sm font-semibold text-text">
                      {addr.recipientName} <span className="font-normal text-text/60">({addr.phone})</span>
                    </p>
                    <p className="mt-1 text-xs text-text/70 leading-relaxed">
                      {[addr.detailAddress, addr.ward, addr.district, addr.city].filter(Boolean).join(', ')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-sm font-normal text-text/60">
                Bạn chưa lưu địa chỉ nào. Bấm nút bên trên để thêm địa chỉ giao hàng đầu tiên!
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL THÊM ĐỊA CHỈ MỚI */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl border border-primary/15 bg-surface p-6 shadow-2xl">
            <h3 className="mb-4 text-lg font-bold text-text">Thêm địa chỉ giao hàng mới</h3>

            <form onSubmit={handleAddAddress} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-text/80">Tên người nhận *</label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    value={newAddr.recipientName}
                    onChange={(e) => setNewAddr({ ...newAddr, recipientName: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-background px-3.5 py-2 text-xs text-text outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-text/80">Số điện thoại *</label>
                  <input
                    type="tel"
                    required
                    placeholder="0901234567"
                    value={newAddr.phone}
                    onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-background px-3.5 py-2 text-xs text-text outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-text/80">Địa chỉ chi tiết (Số nhà, tên đường) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: 123 Nguyễn Huệ, Tòa nhà Bitexco..."
                  value={newAddr.detailAddress}
                  onChange={(e) => setNewAddr({ ...newAddr, detailAddress: e.target.value })}
                  className="w-full rounded-xl border border-primary/20 bg-background px-3.5 py-2 text-xs text-text outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text/80">Phường / Xã</label>
                  <input
                    type="text"
                    placeholder="Phường Bến Nghé"
                    value={newAddr.ward}
                    onChange={(e) => setNewAddr({ ...newAddr, ward: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-background px-3 py-2 text-xs text-text outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text/80">Quận / Huyện</label>
                  <input
                    type="text"
                    placeholder="Quận 1"
                    value={newAddr.district}
                    onChange={(e) => setNewAddr({ ...newAddr, district: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-background px-3 py-2 text-xs text-text outline-none focus:border-primary"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[11px] font-medium text-text/80">Tỉnh / Thành phố</label>
                  <input
                    type="text"
                    placeholder="TP. Hồ Chí Minh"
                    value={newAddr.city}
                    onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                    className="w-full rounded-xl border border-primary/20 bg-background px-3 py-2 text-xs text-text outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={newAddr.isDefault}
                  onChange={(e) => setNewAddr({ ...newAddr, isDefault: e.target.checked })}
                  className="h-4 w-4 rounded border-primary/20 text-primary focus:ring-primary cursor-pointer"
                />
                <label htmlFor="isDefault" className="text-xs font-medium text-text/80 cursor-pointer">
                  Đặt làm địa chỉ mặc định
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddressModal(false)}
                  className="flex-1 rounded-xl border border-primary/20 py-2.5 text-xs font-semibold text-text hover:bg-background"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={addingAddress}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
                >
                  {addingAddress ? 'Đang lưu...' : 'Thêm địa chỉ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}