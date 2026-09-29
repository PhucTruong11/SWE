import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export interface CartTopping {
    id: string;
    name: string;
    price: number;
    quantity: number;
}

export interface CartItem {
    productId: string;
    name: string;
    size: 'S' | 'M' | 'L';
    basePrice: number;
    toppings?: CartTopping[];
    totalToppingPrice?: number;
    unitPrice: number;
    quantity: number;
    lineTotal: number;
    imageUrl?: string;
}

interface CartState {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (index: number) => void;
    updateQuantity: (index: number, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
    // FIX HYDRATION: cờ đánh dấu store đã đọc xong dữ liệu từ localStorage hay chưa.
    // Server luôn có _hasHydrated = false (vì server không có localStorage),
    // client cũng bắt đầu bằng false ở lần render đầu tiên -> khớp với server,
    // sau đó zustand tự đọc xong localStorage rồi mới bật thành true.
    _hasHydrated: boolean;
    setHasHydrated: (state: boolean) => void;
}

export const useCartStore = create<CartState>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem: CartItem) => {
                const currentItems = get().items;

                // Kiểm tra xem món trùng sản phẩm, trùng size và trùng danh sách topping không
                const existingIndex = currentItems.findIndex((item) => {
                    if (item.productId !== newItem.productId || item.size !== newItem.size) return false;
                    
                    const itemToppings = item.toppings || [];
                    const newItemToppings = newItem.toppings || [];

                    if (itemToppings.length !== newItemToppings.length) return false;

                    return itemToppings.every((t, i) => 
                        t.id === newItemToppings[i]?.id && t.quantity === newItemToppings[i]?.quantity
                    );
                });

                if (existingIndex > -1) {
                    const updatedItems = [...currentItems];
                    const existingItem = updatedItems[existingIndex];
                    const newQty = existingItem.quantity + newItem.quantity;
                    const unitPrice = Number(existingItem.unitPrice) || 0;

                    updatedItems[existingIndex] = {
                        ...existingItem,
                        quantity: newQty,
                        lineTotal: unitPrice * newQty,
                    };

                    set({ items: updatedItems });
                } else {
                    const validQty = Number(newItem.quantity) || 1;
                    const validUnitPrice = Number(newItem.unitPrice) || 0;

                    set({
                        items: [
                            ...currentItems,
                            {
                                ...newItem,
                                quantity: validQty,
                                unitPrice: validUnitPrice,
                                lineTotal: validUnitPrice * validQty,
                            },
                        ],
                    });
                }
            },

            removeItem: (index: number) => {
                set((state) => ({
                    items: state.items.filter((_, i) => i !== index),
                }));
            },

            updateQuantity: (index: number, newQuantity: number) => {
                if (newQuantity <= 0) {
                    get().removeItem(index);
                    return;
                }

                set((state) => {
                    const updatedItems = [...state.items];
                    const targetItem = updatedItems[index];

                    if (targetItem) {
                        const unitPrice = Number(targetItem.unitPrice) || 0;
                        updatedItems[index] = {
                            ...targetItem,
                            quantity: newQuantity,
                            lineTotal: unitPrice * newQuantity,
                        };
                    }

                    return { items: updatedItems };
                });
            },

            clearCart: () => set({ items: [] }),

            totalItems: () =>
                get().items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),

            totalPrice: () =>
                get().items.reduce((sum, item) => {
                    const line = Number(item.lineTotal);
                    const unit = Number(item.unitPrice);
                    const qty = Number(item.quantity) || 1;
                    const itemTotal = !isNaN(line) && line > 0 ? line : unit * qty;
                    return sum + (isNaN(itemTotal) ? 0 : itemTotal);
                }, 0),

            _hasHydrated: false,
            setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),
        }),
        {
            name: 'brewlite-cart-storage',
            storage: createJSONStorage(() => localStorage),
            // FIX HYDRATION: báo cho store biết ngay khi đọc xong dữ liệu localStorage
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

// Hook dùng chung: mọi nơi hiển thị số lượng/tổng tiền giỏ hàng nên dùng hook này
// để tránh lỗi Hydration failed khi giỏ hàng đã có sản phẩm từ trước.
export const useHasCartHydrated = () => useCartStore((s) => s._hasHydrated);