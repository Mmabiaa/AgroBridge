/**
 * API Services Index
 * 
 * This file exports all API services for easy importing throughout the application.
 */

// Export API client
export { default as apiClient } from '../axiosClient';
export type { ApiResponse, ApiError, PaginatedResponse } from '../axiosClient';

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

export type {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  Order,
  CreateOrderRequest,
  ProductListParams,
  OrderListParams,
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