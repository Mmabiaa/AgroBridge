/**
 * TypeScript type definitions for API responses
 */

// Common types
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  address: string;
  city: string;
  state: string;
  country?: string;
  postal_code?: string;
  coordinates: Coordinates;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Authentication types
export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: 'farmer' | 'buyer' | 'expert' | 'admin';
  is_active: boolean;
  date_joined?: string;
  last_login?: string;
  profile_picture?: string;
  phone_number?: string;
  bio?: string;
  location?: Location;
  verified_email?: boolean;
  verified_phone?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  password_confirm: string;
  first_name: string;
  last_name: string;
  role: 'farmer' | 'buyer' | 'expert';
  phone_number?: string;
}

export interface AuthResponse {
  access: string;
  refresh: string;
  user: User;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
  password_confirm: string;
}

export interface ChangePassword {
  old_password: string;
  new_password: string;
  new_password_confirm: string;
}

// Farm types
export interface Farm {
  id: string;
  name: string;
  description: string;
  location: Location;
  size_hectares: number;
  farm_type: 'crop' | 'livestock' | 'mixed' | 'organic' | 'hydroponic';
  crops: string[];
  owner: string;
  owner_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  images?: string[];
  certifications?: string[];
  soil_type?: string;
  irrigation_system?: string;
  climate_zone?: string;
}

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

export interface FarmSearchParams {
  search?: string;
  farm_type?: string;
  location?: string;
  size_min?: number;
  size_max?: number;
  crops?: string[];
  page?: number;
  page_size?: number;
  ordering?: string;
}

// Marketplace types
export interface Product {
  id: string;
  seller: string;
  seller_name: string;
  name: string;
  description: string;
  category: string;
  price: number;
  unit: string;
  quantity_available: number;
  location: Location;
  images: string[];
  quality_grade: 'A' | 'B' | 'C';
  harvest_date: string;
  expiry_date: string;
  organic_certified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  nutritional_info?: Record<string, string>;
  storage_instructions?: string;
  shipping_options?: string[];
}

export interface ProductSearchParams {
  search?: string;
  category?: string;
  location?: string;
  price_min?: number;
  price_max?: number;
  quality_grade?: string;
  organic_certified?: boolean;
  available_only?: boolean;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface Order {
  id: string;
  buyer: string;
  buyer_name: string;
  seller: string;
  seller_name: string;
  product: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: Location;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  delivery_date?: string;
  tracking_number?: string;
  notes?: string;
}

// AI Assistant types
export interface Conversation {
  id: string;
  title: string;
  conversation_type: 'farming_advice' | 'crop_diagnosis' | 'market_analysis' | 'general';
  status: 'active' | 'archived' | 'deleted';
  context_data: Record<string, string>;
  language: string;
  voice_enabled: boolean;
  message_count: number;
  total_tokens_used: number;
  created_at: string;
  updated_at: string;
  last_activity: string;
}

export interface Message {
  id: string;
  conversation: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, string>;
  timestamp: string;
  tokens_used?: number;
  attachments?: Array<{
    type: 'image' | 'document' | 'audio';
    url: string;
    filename: string;
  }>;
}

export interface ConversationSearchParams {
  search?: string;
  conversation_type?: string;
  status?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

export interface SendMessageRequest {
  content: string;
  attachments?: File[];
  voice_input?: boolean;
  context_data?: Record<string, string>;
}

export interface SendMessageResponse {
  user_message: Message;
  assistant_message: Message;
  conversation_updated: boolean;
}

// Crop Detection types
export interface Disease {
  id: string;
  name: string;
  scientific_name: string;
  common_names: string[];
  category: 'fungal' | 'bacterial' | 'viral' | 'pest' | 'nutritional' | 'environmental';
  description: string;
  symptoms: string;
  visual_indicators: string[];
  affected_crops: string[];
  typical_severity: 'low' | 'medium' | 'high' | 'critical';
  spread_rate: 'slow' | 'moderate' | 'fast';
  seasonal_pattern: string;
  favorable_conditions: Record<string, string>;
  prevention_methods: string;
  organic_treatments: string;
  chemical_treatments: string;
  reference_images: string[];
  external_links: string[];
  confidence_threshold: number;
  is_active: boolean;
  treatments_count: number;
  created_at: string;
  updated_at: string;
}

export interface CropScan {
  id: string;
  user: string;
  image_url: string;
  crop_type: string;
  detected_diseases: Array<{
    disease_id: string;
    disease_name: string;
    confidence: number;
    severity: string;
    affected_area_percentage: number;
  }>;
  health_score: number;
  recommendations: Array<{
    type: 'treatment' | 'prevention' | 'monitoring';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimated_cost?: number;
  }>;
  analysis_metadata: {
    processing_time_ms: number;
    model_version: string;
    confidence_scores: Record<string, number>;
  };
  location?: Location;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ImageAnalysisRequest {
  image: File;
  crop_type?: string;
  location?: Coordinates;
  additional_info?: string;
}

export interface ImageAnalysisResponse {
  success: boolean;
  scan_id?: string;
  crop_type: string;
  health_score: number;
  detected_diseases: Array<{
    disease_id: string;
    disease_name: string;
    confidence: number;
    severity: string;
    affected_area_percentage: number;
  }>;
  recommendations: Array<{
    type: 'treatment' | 'prevention' | 'monitoring';
    priority: 'low' | 'medium' | 'high';
    description: string;
    estimated_cost?: number;
  }>;
  confidence_scores: Record<string, number>;
  processing_time_ms: number;
  error_message?: string;
}

export interface DiseaseSearchParams {
  search?: string;
  category?: string;
  affected_crops?: string[];
  severity?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}

// Error types
export interface ApiError {
  message: string;
  status: number;
  details?: string;
  errors?: Record<string, string[]>;
}

export interface ValidationError {
  field: string;
  messages: string[];
}

// Notification types
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
  action_text?: string;
}

// WebSocket message types
export interface WebSocketMessage {
  type: 'notification' | 'cache_invalidation' | 'data_update' | 'auth' | 'heartbeat';
  data?: string;
  timestamp?: string;
}

// File upload types
export interface FileUploadResponse {
  id: string;
  url: string;
  filename: string;
  size: number;
  content_type: string;
  uploaded_at: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Search and filter types
export interface SearchFilters {
  query?: string;
  category?: string;
  location?: string;
  price_range?: [number, number];
  date_range?: [string, string];
  tags?: string[];
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

// Analytics types
export interface AnalyticsData {
  period: string;
  metrics: Record<string, number>;
  trends: Array<{
    date: string;
    value: number;
  }>;
  comparisons?: Record<string, {
    current: number;
    previous: number;
    change_percentage: number;
  }>;
}

// All types are already exported above