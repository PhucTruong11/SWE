// Shared TypeScript types for BrewLite Frontend

export interface Product {
  id: string;
  name: string;
  price: number; // VND - base price (size S)
  imageUrl: string | null;
  stock: number;
  isAvailable: boolean;
  category: string | null;
}

export interface ProductDetail extends Product {
  sizes: SizeOption[];
  toppings: ToppingOption[];
}

export interface SizeOption {
  label: 'S' | 'M' | 'L';
  multiplier: number;
}

export interface ToppingOption {
  name: string;
  price: number; // VND
}

export interface CartItem {
  productId: string;
  productName: string;
  productImage: string | null;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  qty: number;
  unitPrice: number; // VND - price after size + toppings
  lineTotal: number; // VND - unitPrice * qty
}

export interface User {
  id: string;
  email: string;
  loyaltyPoints: number;
}

export type OrderStatus =
  | 'PENDING'
  | 'PAID'
  | 'PREPARING'
  | 'READY'
  | 'COMPLETED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED';

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  total: number;
  discount: number;
  promoCode: string | null;
  loyaltyPointsEarned: number;
  items: OrderItem[];
  createdAt: string;
}

export interface OrderItem {
  id: string;
  productId: string;
  size: 'S' | 'M' | 'L';
  toppings: string[];
  qty: number;
  lineTotal: number;
}

export type PaymentMethod = 'EWALLET' | 'CARD';

export interface Payment {
  id: string;
  orderId: string;
  amount: number;
  method: PaymentMethod;
  status: 'PENDING' | 'SUCCESS' | 'FAILED';
}

// API Response wrapper
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  statusCode: number;
  message: string;
  errors?: { field: string; message: string }[];
}
