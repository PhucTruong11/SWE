'use client';

import { create } from 'zustand';
import { getCartItemKey, getCartLineTotal, type CartItem } from '../lib/cart';
import { recalculatePromo, type AppliedPromo } from '../lib/voucher';

export type { CartItem } from '../lib/cart';

interface CartStore {
  items: CartItem[];
  currentUserId: string | null;
  appliedPromo: AppliedPromo | null;

  initUserCart: (userId: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  applyPromo: (promo: AppliedPromo) => void;
  removePromo: () => void;
}

// Tạo key localStorage độc lập cho từng user hoặc khách
const getCartKey = (userId: string | null) => {
  return userId ? `brewlite_cart_user_${userId}` : `brewlite_cart_guest`;
};

// Chỉ gộp khi cùng sản phẩm, size và số lượng từng loại topping.
const mergeCartItems = (existingItems: CartItem[], guestItems: CartItem[]): CartItem[] => {
  const merged: CartItem[] = [];

  [...existingItems, ...guestItems].forEach((guestItem) => {
    const existingIndex = merged.findIndex(
      (item) => getCartItemKey(item) === getCartItemKey(guestItem)
    );

    if (existingIndex > -1) {
      const quantity = merged[existingIndex].quantity + guestItem.quantity;
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity,
        lineTotal: getCartLineTotal({ ...merged[existingIndex], quantity }),
      };
    } else {
      merged.push({ ...guestItem, lineTotal: getCartLineTotal(guestItem) });
    }
  });

  return merged;
};

const readCartItems = (key: string): CartItem[] => {
  try {
    const saved = localStorage.getItem(key);
    const parsed: unknown = saved ? JSON.parse(saved) : [];
    if (!Array.isArray(parsed)) return [];

    return mergeCartItems([], parsed.filter((item): item is CartItem =>
      item !== null && typeof item === 'object' &&
      typeof item.name === 'string' && typeof item.size === 'string' &&
      Number.isSafeInteger(item.quantity) && item.quantity > 0 &&
      Number.isFinite(item.unitPrice) && item.unitPrice >= 0 &&
      (item.toppings === undefined || (Array.isArray(item.toppings) &&
        item.toppings.every((topping: unknown) => typeof topping === 'string' ||
          (topping !== null && typeof topping === 'object' &&
            'name' in topping && typeof topping.name === 'string'))))
    ));
  } catch (error) {
    console.error('Lỗi khi đọc giỏ hàng:', error);
    return [];
  }
};

const resetCheckoutTimer = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('brewlite_checkout_deadline');
  localStorage.removeItem('brewlite_checkout_renew_count');
};

const promoForItems = (promo: AppliedPromo | null, items: CartItem[]) =>
  recalculatePromo(promo, items.reduce((total, item) => total + getCartLineTotal(item), 0));

// Hàm lưu dữ liệu vào localStorage
const saveToStorage = (userId: string | null, items: CartItem[]) => {
  if (typeof window !== 'undefined') {
    const key = getCartKey(userId);
    localStorage.setItem(key, JSON.stringify(items));
  }
};

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  currentUserId: null,
  appliedPromo: null,

  initUserCart: (userId: string | null) => {
    if (typeof window === 'undefined') return;

    const guestKey = getCartKey(null);
    const guestItems = readCartItems(guestKey);
    const appliedPromo = get().currentUserId === userId ? get().appliedPromo : null;

    if (userId) {
      // NGƯỜI DÙNG ĐĂNG NHẬP
      const userKey = getCartKey(userId);
      let userItems = readCartItems(userKey);

      // Nếu có món trong giỏ hàng Khách -> Gộp vào giỏ hàng User và dọn dẹp giỏ khách
      if (guestItems.length > 0) {
        userItems = mergeCartItems(userItems, guestItems);
        localStorage.setItem(userKey, JSON.stringify(userItems));
        localStorage.removeItem(guestKey); // Xóa giỏ hàng khách sau khi đã gộp thành công
      }

      set({ currentUserId: userId, items: userItems, appliedPromo: promoForItems(appliedPromo, userItems) });
    } else {
      // KHÁCH VẮNG LAI / ĐĂNG XUẤT
      set({ currentUserId: null, items: guestItems, appliedPromo: promoForItems(appliedPromo, guestItems) });
    }
  },

  addItem: (newItem) => {
    if (!Number.isSafeInteger(newItem.quantity) || newItem.quantity <= 0) return;
    resetCheckoutTimer();
    const updatedItems = mergeCartItems(get().items, [newItem]);

    set({ items: updatedItems, appliedPromo: promoForItems(get().appliedPromo, updatedItems) });
    saveToStorage(get().currentUserId, updatedItems);
  },

  removeItem: (index) => {
    if (!get().items[index]) return;
    resetCheckoutTimer();
    const updatedItems = get().items.filter((_, i) => i !== index);
    set({ items: updatedItems, appliedPromo: promoForItems(get().appliedPromo, updatedItems) });
    saveToStorage(get().currentUserId, updatedItems);
  },

  updateQuantity: (index, quantity) => {
    if (!get().items[index] || !Number.isSafeInteger(quantity)) return;
    if (quantity <= 0) {
      get().removeItem(index);
      return;
    }
    resetCheckoutTimer();
    const updatedItems = get().items.map((item, i) => i === index
      ? { ...item, quantity, lineTotal: getCartLineTotal({ ...item, quantity }) }
      : item);
    set({ items: updatedItems, appliedPromo: promoForItems(get().appliedPromo, updatedItems) });
    saveToStorage(get().currentUserId, updatedItems);
  },

  clearCart: () => {
    resetCheckoutTimer();
    set({ items: [], appliedPromo: null });
    if (typeof window !== 'undefined') {
      const key = getCartKey(get().currentUserId);
      localStorage.removeItem(key);
    }
  },

  totalPrice: () => {
    return get().items.reduce((total, item) => total + getCartLineTotal(item), 0);
  },

  totalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  applyPromo: (promo) => set({ appliedPromo: promoForItems(promo, get().items) }),
  removePromo: () => set({ appliedPromo: null }),
}));

export const useHasCartHydrated = () => true;
