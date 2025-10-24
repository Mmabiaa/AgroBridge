/**
 * Basic type definitions to resolve import conflicts
 */

// Basic types
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



export type Farm = any;
export type FarmListParams = any;
export type FarmCreateData = any;
export type FarmUpdateData = any;

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

export type Product = any;
export type ProductListParams = any;
export type ProductCreateData = any;
export type ProductUpdateData = any;

export type Order = any;
export type OrderListParams = any;
export type OrderCreateData = any;
export type OrderUpdateData = any;

export type Conversation = any;
export type ConversationListParams = any;
export type ConversationCreateData = any;
export type Message = any;
export type SendMessageData = any;

export type PaginatedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};