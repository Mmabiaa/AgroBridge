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
export { default as usersService } from './users.service';
export { default as farmsService } from './farmsService';
export { default as marketplaceService } from './marketplaceService';
export { default as aiService } from './aiService';
export { default as cropDetectionService } from './cropDetectionService';
export { default as iotService } from './iot.service';
export { default as notificationsService } from './notifications.service';
export { default as financialService } from './financial.service';
export { default as learningService } from './learning.service';
export { default as communityService } from './community.service';
export { default as schedulingService } from './scheduling.service';
export { default as analyticsService } from './analytics.service';
export { default as paymentService } from './payment.service';
export { default as blockchainService } from './blockchain.service';
export { default as exportDocsService } from './exportDocs.service';
export { default as emergencyService } from './emergency.service';
export { default as adminService } from './admin.service';

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

// AI service types are exported from types/ai.ts

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

// Export types from new services
export type {
  UserProfile,
  UpdateProfileRequest,
  UserPreferences,
  UserListParams,
} from './users.service';

export type {
  IoTDevice,
  SensorData,
  DeviceAlert,
  CreateDeviceRequest,
  UpdateDeviceRequest,
  DeviceListParams,
  SensorDataParams,
  FirmwareUpdate,
} from './iot.service';

export type {
  Notification,
  NotificationPreferences,
  NotificationListParams,
  PushSubscription,
} from './notifications.service';

export type {
  FinancialRecord,
  Budget,
  BudgetCategory,
  FinancialReport,
  CashFlowReport,
  CreateRecordRequest,
  CreateBudgetRequest,
  RecordListParams,
  ExportParams,
} from './financial.service';

export type {
  Course,
  Lesson,
  Enrollment,
  Certificate,
  CourseListParams,
} from './learning.service';

export type {
  Post,
  Comment,
  Message,
  Conversation,
  CreatePostRequest,
  PostListParams,
} from './community.service';

export type {
  Task,
  CalendarEvent,
  TaskSuggestion,
  CreateTaskRequest,
  TaskListParams,
} from './scheduling.service';

export type {
  DashboardMetrics,
  FarmPerformance,
  YieldPrediction,
  WeatherForecast,
  CustomReport,
  ReportParams,
} from './analytics.service';

export type {
  PaymentMethod,
  Transaction,
  WalletBalance,
  InitializePaymentRequest,
  InitializePaymentResponse,
  VerifyPaymentRequest,
  VerifyPaymentResponse,
  AddPaymentMethodRequest,
  TransactionListParams,
} from './payment.service';

export type {
  Certificate as BlockchainCertificate,
  SupplyChainEvent,
  BlockchainTransaction,
  IssueCertificateRequest,
  VerifyCertificateRequest,
  CertificateListParams,
} from './blockchain.service';

export type {
  ExportDocument,
  DocumentTemplate,
  GenerateDocumentRequest,
  DocumentListParams,
} from './exportDocs.service';

export type {
  EmergencyAlert,
  Incident,
  IncidentResponse,
  EmergencyResource,
  CreateAlertRequest,
  CreateIncidentRequest,
  AlertListParams,
} from './emergency.service';

export type {
  AdminUser,
  SystemHealth,
  SystemMetrics,
  AuditLog,
  UserListParams as AdminUserListParams,
  AuditLogParams,
} from './admin.service';