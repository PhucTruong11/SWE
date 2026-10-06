export interface AppliedPromo {
  code: string;
  discount: number;
  description: string;
}

export function calculateVoucherDiscount(code: string, subtotal: number): {
  valid: boolean;
  discount: number;
  message: string;
  description: string;
} {
  const clean = code.trim().toUpperCase();
  if (!clean) return { valid: false, discount: 0, message: 'Vui lòng nhập mã', description: '' };

  if (clean === 'WELCOME10') {
    if (subtotal < 30000) return { valid: false, discount: 0, message: 'Đơn từ 30k trở lên', description: 'Giảm 10%' };
    return { valid: true, discount: Math.min(15000, Math.floor(subtotal * 0.1)), message: 'Thành công', description: 'Giảm 10%' };
  }

  if (clean === 'FREESHIP') {
    if (subtotal < 30000) return { valid: false, discount: 0, message: 'Đơn từ 30k trở lên', description: 'Giảm 10k' };
    return { valid: true, discount: 10000, message: 'Thành công (-10k)', description: 'Giảm 10.000đ' };
  }

  return { valid: false, discount: 0, message: 'Mã không tồn tại', description: '' };
}
