/**
 * Basic type definitions for the application
 */

// Auth types
export type LoginCredentials = {
  username: string;
  password: string;
};

export type RegisterData = {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
};

export type User = {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  permissions?: string[];
};

export type AuthResponse = {
  message: string;
  user: User;
  tokens: {
    access: string;
    refresh: string;
  };
};

export type PasswordResetConfirm = {
  token: string;
  password: string;
  password_confirm: string;
};

export type ChangePasswordData = {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
};

// Marketplace types
export interface Category {
  id: number;
  name: string;
  description?: string;
  is_active: boolean;
  parent?: number;
  sort_order?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price_per_unit: number;
  unit_type: string;
  quantity_available: number;
  is_active: boolean;
  status: string;
  seller?: any;
  category?: Category | number;
  images?: any[];
  created_at?: string;
  updated_at?: string;
  view_count?: number;
  inquiry_count?: number;
  is_featured?: boolean;
  tags?: string[];
  quality_grade?: string;
  location?: string;
  delivery_available?: boolean;
  pickup_available?: boolean;
  organic?: boolean;
  organic_certified?: boolean;
}

export interface ProductCreateData {
  name: string;
  description: string;
  price_per_unit: number;
  unit_type: string;
  quantity_available: number;
  category?: number;
  status?: string;
  is_active?: boolean;
  tags?: string[];
  quality_grade?: string;
  location?: string;
  delivery_available?: boolean;
  pickup_available?: boolean;
  organic?: boolean;
  [key: string]: any;
}

export interface ProductUpdateData {
  name?: string;
  description?: string;
  price_per_unit?: number;
  unit_type?: string;
  quantity_available?: number;
  category?: number;
  status?: string;
  is_active?: boolean;
  [key: string]: any;
}

export interface Order {
  id: string;
  order_number?: string;
  product_name: string;
  quantity: number;
  unit: string;
  total_price: number;
  total_amount?: number;
  status: string;
  seller_name: string;
  buyer?: any;
  seller?: any;
  items?: OrderItem[];
  created_at: string;
  confirmed_at?: string;
  delivered_at?: string;
  cancelled_at?: string;
  delivery_method?: string;
  delivery_address?: any;
  delivery_notes?: string;
  buyer_phone?: string;
  buyer_email?: string;
  buyer_notes?: string;
  subtotal?: number;
  delivery_cost?: number;
  tax_amount?: number;
}

export interface OrderItem {
  id: string;
  product: Product;
  product_name: string;
  unit_price: number;
  quantity: number;
  unit_type: string;
  line_total: number;
  quality_grade?: string;
  special_instructions?: string;
}

export interface OrderCreateData {
  items: Array<{
    product_id: string;
    quantity: number;
    special_instructions?: string;
  }>;
  delivery_method?: string;
  delivery_address?: any;
  delivery_notes?: string;
  buyer_phone?: string;
  buyer_email?: string;
  buyer_notes?: string;
  [key: string]: any;
}

export interface OrderUpdateData {
  status?: string;
  [key: string]: any;
}

// Pagination and params
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ProductListParams {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
  min_price?: number;
  max_price?: number;
  location?: string;
  quality_grade?: string;
  organic_only?: boolean;
  delivery_available?: boolean;
  pickup_available?: boolean;
  available_only?: boolean;
  min_rating?: number;
  sort?: string;
  [key: string]: any;
}

export interface OrderListParams {
  status?: string;
  page?: number;
  limit?: number;
  [key: string]: any;
}

// Other types (placeholders for now)
export type Farm = any;
export type FarmListParams = any;
export type FarmCreateData = any;
export type FarmUpdateData = any;
export type Conversation = any;
export type ConversationListParams = any;
export type ConversationCreateData = any;
export type Message = any;
export type SendMessageData = any;

export interface FarmAnalytics {
  total_area: number;
  crop_distribution: Record<string, number>;
  productivity_metrics: {
    yield_per_hectare: number;
    revenue_per_hectare?: number;
    cost_per_hectare?: number;
  };
  seasonal_data: Array<{
    season: string;
    year: number;
    yield: number;
    revenue?: number;
  }>;
  weather_data?: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
}