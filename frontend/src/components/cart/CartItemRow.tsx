'use client';

import Image from 'next/image';
import { Trash2, Minus, Plus } from 'lucide-react';
import { useCartStore, type CartItem } from '@/stores/cart.store';

interface CartItemRowProps {
  item: CartItem;
  index: number;
}

export function CartItemRow({ item, index }: CartItemRowProps) {
  const { updateQuantity, removeItem } = useCartStore();

  const handleDecrease = () => {
    updateQuantity(index, item.quantity - 1);
  };

  const handleIncrease = () => {
    updateQuantity(index, item.quantity + 1);
  };

  const handleRemove = () => {
    removeItem(index);
  };

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-gray-100 last:border-0">
      {/* 1. Hình ảnh */}
      <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100 border border-gray-100 shadow-sm">
        {item.imageUrl ? (
          <Image
            src={item.imageUrl}
            alt={item.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300 font-bold text-xs">
            IMG
          </div>
        )}
      </div>

      {/* 2. Thông tin chi tiết (Tên, Size, Topping) */}
      <div className="flex-1 flex flex-col justify-between h-20">
        <div>
          <h3 className="font-bold text-text text-base leading-tight line-clamp-1">
            {item.name}
          </h3>
          <p className="mt-0.5 text-sm font-medium text-gray-500">Size {item.size}</p>

          {item.toppings && item.toppings.length > 0 && (
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1" title={item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}>
              + {item.toppings.map(t => typeof t === 'string' ? t : t.name).join(', ')}
            </p>
          )}
        </div>

        {/* 3. Giá tiền của dòng này */}
        <p className="font-bold text-primary text-lg">
          {(item.lineTotal || (item.unitPrice * item.quantity)).toLocaleString('vi-VN')}đ
        </p>
      </div>

      {/* 4. Nhóm điều khiển: Số lượng & Nút Xóa */}
      <div className="flex flex-col items-end gap-3 h-20 justify-between">
        <button
          onClick={handleRemove}
          className="text-gray-300 hover:text-red-500 transition-colors p-1"
          title="Xóa món này"
        >
          <Trash2 size={20} />
        </button>

        <div className="flex items-center gap-3 bg-white rounded-full px-1.5 py-1.5 border border-gray-200 shadow-sm">
          <button
            onClick={handleDecrease}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-text hover:bg-gray-200 transition-colors"
          >
            <Minus size={14} />
          </button>

          <span className="w-4 text-center text-sm font-bold text-text">
            {item.quantity}
          </span>

          <button
            onClick={handleIncrease}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 text-text hover:bg-gray-200 transition-colors"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}