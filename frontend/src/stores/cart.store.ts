'use client';

import { create } from 'zustand';

export interface CartItem {
  id?: string;
  productId?: string;
  name: string;
  size: string;
  quantity: number;
  unitPrice: number;
  basePrice?: number;
  totalToppingPrice?: number;
  imageUrl?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  toppings?: any[];
  lineTotal?: number;
}

interface CartStore {
  items: CartItem[];
  currentUserId: string | null;
  appliedPromo: { code: string; discount: number; description: string } | null;

  initUserCart: (userId: string | null) => void;
  addItem: (item: CartItem) => void;
  removeItem: (index: number) => void;
  updateQuantity: (index: number, quantity: number) => void;
  clearCart: () => void;
  totalPrice: () => number;
  totalItems: () => number;
  applyPromo: (promo: { code: string; discount: number; description: string }) => void;
  removePromo: () => void;
}

// Tạo key localStorage độc lập cho từng user hoặc khách
const getCartKey = (userId: string | null) => {
  return userId ? `brewlite_cart_user_${userId}` : `brewlite_cart_guest`;
};

// Hàm gộp danh sách món từ Khách vào Tài khoản (cộng dồn số lượng nếu trùng món + size)
const mergeCartItems = (existingItems: CartItem[], guestItems: CartItem[]): CartItem[] => {
  const merged = [...existingItems];

  guestItems.forEach((guestItem) => {
    const existingIndex = merged.findIndex(
      (item) => item.name === guestItem.name && item.size === guestItem.size
    );

    if (existingIndex > -1) {
      merged[existingIndex] = {
        ...merged[existingIndex],
        quantity: merged[existingIndex].quantity + guestItem.quantity,
      };
    } else {
      merged.push(guestItem);
    }
  });

  return merged;
};

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
    const guestSaved = localStorage.getItem(guestKey);
    let guestItems: CartItem[] = [];

    if (guestSaved) {
      try {
        guestItems = JSON.parse(guestSaved);
      } catch (e) {
        console.error('Lỗi khi đọc giỏ hàng khách:', e);
      }
    }

    if (userId) {
      // 🟢 NGƯỜI DÙNG ĐĂNG NHẬP
      const userKey = getCartKey(userId);
      const userSaved = localStorage.getItem(userKey);
      let userItems: CartItem[] = [];

      if (userSaved) {
        try {
          userItems = JSON.parse(userSaved);
        } catch (e) {
          console.error('Lỗi khi đọc giỏ hàng người dùng:', e);
        }
      }

      // Nếu có món trong giỏ hàng Khách -> Gộp vào giỏ hàng User và dọn dẹp giỏ khách
      if (guestItems.length > 0) {
        userItems = mergeCartItems(userItems, guestItems);
        localStorage.setItem(userKey, JSON.stringify(userItems));
        localStorage.removeItem(guestKey); // Xóa giỏ hàng khách sau khi đã gộp thành công
      }

      set({ currentUserId: userId, items: userItems });
    } else {
      // ⚪ KHÁCH VẮNG LAI / ĐĂNG XUẤT
      set({ currentUserId: null, items: guestItems });
    }
  },

  addItem: (newItem) => {
    const currentItems = get().items;

    const existingIndex = currentItems.findIndex(
      (item) => item.name === newItem.name && item.size === newItem.size
    );

    let updatedItems: CartItem[];
    if (existingIndex > -1) {
      updatedItems = [...currentItems];
      updatedItems[existingIndex].quantity += newItem.quantity;
    } else {
      updatedItems = [...currentItems, newItem];
    }

    set({ items: updatedItems });
    saveToStorage(get().currentUserId, updatedItems);
  },

  removeItem: (index) => {
    const updatedItems = get().items.filter((_, i) => i !== index);
    set({ items: updatedItems });
    saveToStorage(get().currentUserId, updatedItems);
  },

  updateQuantity: (index, quantity) => {
    if (quantity <= 0) {
      get().removeItem(index);
      return;
    }
    const updatedItems = [...get().items];
    updatedItems[index].quantity = quantity;
    set({ items: updatedItems });
    saveToStorage(get().currentUserId, updatedItems);
  },

  clearCart: () => {
    set({ items: [], appliedPromo: null });
    if (typeof window !== 'undefined') {
      const key = getCartKey(get().currentUserId);
      localStorage.removeItem(key);
    }
  },

  totalPrice: () => {
    return get().items.reduce((total, item) => {
      const itemPrice = item.lineTotal || item.unitPrice * item.quantity;
      return total + itemPrice;
    }, 0);
  },

  totalItems: () => {
    return get().items.reduce((total, item) => total + item.quantity, 0);
  },

  applyPromo: (promo) => set({ appliedPromo: promo }),
  removePromo: () => set({ appliedPromo: null }),
}));

export const useHasCartHydrated = () => true;