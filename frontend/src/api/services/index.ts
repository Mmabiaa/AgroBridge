/**
 * API Services Index
 * 
 * This file exports all API services for easy importing throughout the application.
 */

// Export API client and related utilities
export { default as apiClient } from '../axiosClient';
export { TokenManager, ApiLogger, ApiErrorHandler } from '../axiosClient';

// Export types from axiosClient
export type {
  ApiResponse,
  ClientApiError as ApiError, // Map ClientApiError to ApiError for backward compatibility
  PaginatedResponse,
  ExtendedAxiosRequestConfig
} from '../axiosClient';

// Export services
export { default as authService } from './authService';
export { default as farmsService } from './farmsService';
export { default as marketplaceService } from './marketplaceService';
export { default as aiService } from './aiService';
export { default as cropDetectionService } from './cropDetectionService';

// Export types from services
export type {
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  PasswordResetRequest,
  PasswordResetConfirmRequest,
  ChangePasswordRequest,
} from './authService';

export type {
  Farm,
  CreateFarmRequest,
  UpdateFarmRequest,
  FarmSensor,
  SensorReading,
  FarmAnalytics,
  FarmListParams,
} from './farmsService';

// Export marketplace types
export type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Order,
  CreateOrderRequest,
  UpdateOrderRequest,
  ProductListParams,
  OrderListParams,
  Category,
  MarketplaceAnalytics,
} from './marketplaceService';

export type {
  ChatConversation,
  ChatMessage,
  AIRecommendation,
  VoiceInteraction,
  CreateConversationRequest,
  SendMessageRequest,
  RecommendationFeedbackRequest,
  VoiceTranscriptionRequest,
  VoiceSynthesisRequest,
  AIUsageStatistics,
} from './aiService';

export type {
  Disease,
  Treatment,
  CropScan,
  CreateScanRequest,
  ScanFeedbackRequest,
  ScanHistory,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
} from './cropDetectionService';