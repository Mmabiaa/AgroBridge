/**
 * Basic type definitions to resolve import conflicts
 */

// Basic types
export type LoginCredentials = any;
export type RegisterData = any;
export type User = any;
export type AuthResponse = any;
export type PasswordResetConfirm = any;
export type ChangePasswordData = any;

export type Farm = any;
export type FarmListParams = any;
export type FarmCreateData = any;
export type FarmUpdateData = any;

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