export interface Product {
  id: number;
  name: string;
  description: string | null;
  price: number;
  category: string;
  rating: number;
  stock: number;
  image_url: string | null;
  keywords: string;
  sold: number;
  discount_percent: number;
  shop_name: string;
  shop_city: string;
  created_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  avatar_url: string | null;
  balance: number;
  created_at: string;
}

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  created_at: string;
  product: Product;
}

export type OrderStatus = "pending" | "paid" | "cancelled";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  name_snapshot: string;
  image_snapshot: string | null;
}

export interface Order {
  id: number;
  user_id: number;
  payment_method: string;
  status: OrderStatus;
  total: number;
  created_at: string;
  updated_at: string | null;
  items: OrderItem[];
}
