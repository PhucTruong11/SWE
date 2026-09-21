import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/types';

type Size = CartItem['size'];

interface CartState {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, size: Size, toppings: string[]) => void;
  updateQty: (productId: string, size: Size, toppings: string[], qty: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  totalPrice: () => number;
}

/**
 * Tạo unique key cho mỗi item dựa trên productId + size + toppings
 * Vì cùng 1 sản phẩm nhưng khác size/topping thì là item khác nhau
 */
function itemKey(item: Pick<CartItem, 'productId' | 'size' | 'toppings'>): string {
  return `${item.productId}-${item.size}-${[...item.toppings].sort().join(',')}`;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (newItem: CartItem) => {
        set((state) => {
          const key = itemKey(newItem);
          const existingIndex = state.items.findIndex((i) => itemKey(i) === key);

          if (existingIndex >= 0) {
            // Item đã có → tăng số lượng
            const updated = [...state.items];
            updated[existingIndex] = {
              ...updated[existingIndex],
              qty: updated[existingIndex].qty + newItem.qty,
              lineTotal: (updated[existingIndex].qty + newItem.qty) * newItem.unitPrice,
            };
            return { items: updated };
          }

          // Item mới → thêm vào
          return { items: [...state.items, newItem] };
        });
      },

      removeItem: (productId: string, size: Size, toppings: string[]) => {
        set((state) => ({
          items: state.items.filter(
            (i) => itemKey(i) !== itemKey({ productId, size, toppings }),
          ),
        }));
      },

      updateQty: (productId: string, size: Size, toppings: string[], qty: number) => {
        if (qty <= 0) {
          get().removeItem(productId, size, toppings);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            itemKey(i) === itemKey({ productId, size, toppings })
              ? { ...i, qty, lineTotal: qty * i.unitPrice }
              : i,
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => get().items.reduce((sum, i) => sum + i.qty, 0),

      totalPrice: () => get().items.reduce((sum, i) => sum + i.lineTotal, 0),
    }),
    {
      name: 'brewlite-cart', // localStorage key
    },
  ),
);
