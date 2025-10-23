/**
 * API Configuration
 */

// Environment variables with defaults
export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000',
  TIMEOUT: parseInt(import.meta.env.VITE_API_TIMEOUT || '30000', 10),
  RETRY_ATTEMPTS: parseInt(import.meta.env.VITE_API_RETRY_ATTEMPTS || '3', 10),
  RETRY_DELAY: parseInt(import.meta.env.VITE_API_RETRY_DELAY || '1000', 10),
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login/',
    REGISTER: '/auth/register/',
    LOGOUT: '/auth/logout/',
    REFRESH_TOKEN: '/auth/token/refresh/',
    PASSWORD_RESET: '/auth/password-reset/',
    PASSWORD_RESET_CONFIRM: '/auth/password-reset-confirm/',
    CHANGE_PASSWORD: '/auth/change-password/',
    USER_PROFILE: '/auth/user/',
    VERIFY_EMAIL: '/auth/verify-email/',
    RESEND_VERIFICATION: '/auth/resend-verification/',
  },

  // Users
  USERS: {
    LIST: '/users/',
    DETAIL: (id: string) => `/users/${id}/`,
    PROFILE: '/users/profile/',
    UPDATE_PROFILE: '/users/profile/',
  },

  // Farms
  FARMS: {
    LIST: '/farms/',
    DETAIL: (id: string) => `/farms/${id}/`,
    CREATE: '/farms/',
    UPDATE: (id: string) => `/farms/${id}/`,
    DELETE: (id: string) => `/farms/${id}/`,
    SENSORS: (farmId: string) => `/farms/${farmId}/sensors/`,
    SENSOR_DETAIL: (farmId: string, sensorId: string) => `/farms/${farmId}/sensors/${sensorId}/`,
    SENSOR_READINGS: (farmId: string, sensorId: string) => `/farms/${farmId}/sensors/${sensorId}/readings/`,
    ANALYTICS: (farmId: string) => `/farms/${farmId}/analytics/`,
    ALERTS: (farmId: string) => `/farms/${farmId}/alerts/`,
    WEATHER: (farmId: string) => `/farms/${farmId}/weather/`,
    EXPORT: (farmId: string) => `/farms/${farmId}/export/`,
    MY_FARMS: '/farms/my-farms/',
    STATISTICS: '/farms/statistics/',
  },

  // Marketplace
  MARKETPLACE: {
    PRODUCTS: {
      LIST: '/marketplace/products/',
      DETAIL: (id: string) => `/marketplace/products/${id}/`,
      CREATE: '/marketplace/products/',
      UPDATE: (id: string) => `/marketplace/products/${id}/`,
      DELETE: (id: string) => `/marketplace/products/${id}/`,
      IMAGES: (productId: string) => `/marketplace/products/${productId}/images/`,
      IMAGE_DELETE: (productId: string, imageId: string) => `/marketplace/products/${productId}/images/${imageId}/`,
      SEARCH: '/marketplace/products/search/',
      FEATURED: '/marketplace/products/featured/',
      RECOMMENDED: '/marketplace/products/recommended/',
      MY_PRODUCTS: '/marketplace/products/my-products/',
      REPORT: (productId: string) => `/marketplace/products/${productId}/report/`,
      FAVORITE: (productId: string) => `/marketplace/products/${productId}/favorite/`,
      FAVORITES: '/marketplace/products/favorites/',
      PRICE_HISTORY: (productId: string) => `/marketplace/products/${productId}/price-history/`,
    },
    ORDERS: {
      LIST: '/marketplace/orders/',
      DETAIL: (id: string) => `/marketplace/orders/${id}/`,
      CREATE: '/marketplace/orders/',
      UPDATE: (id: string) => `/marketplace/orders/${id}/`,
      CANCEL: (id: string) => `/marketplace/orders/${id}/cancel/`,
      MY_ORDERS: '/marketplace/orders/my-orders/',
      MY_SALES: '/marketplace/orders/my-sales/',
    },
    ANALYTICS: '/marketplace/analytics/',
    CATEGORIES: '/marketplace/categories/',
    STATISTICS: '/marketplace/statistics/',
  },

  // AI Assistant
  AI: {
    CONVERSATIONS: {
      LIST: '/ai/conversations/',
      DETAIL: (id: string) => `/ai/conversations/${id}/`,
      CREATE: '/ai/conversations/',
      UPDATE: (id: string) => `/ai/conversations/${id}/`,
      DELETE: (id: string) => `/ai/conversations/${id}/`,
      ARCHIVE: (id: string) => `/ai/conversations/${id}/archive/`,
      RESTORE: (id: string) => `/ai/conversations/${id}/restore/`,
      SEND_MESSAGE: (id: string) => `/ai/conversations/${id}/send_message/`,
      MESSAGES: (id: string) => `/ai/conversations/${id}/messages/`,
    },
    RECOMMENDATIONS: {
      LIST: '/ai/recommendations/',
      DETAIL: (id: string) => `/ai/recommendations/${id}/`,
      FEEDBACK: (id: string) => `/ai/recommendations/${id}/provide_feedback/`,
      ACTIVE: '/ai/recommendations/active/',
      BY_TYPE: '/ai/recommendations/by_type/',
    },
    VOICE: {
      TRANSCRIBE: '/ai/voice/transcribe/',
      SYNTHESIZE: '/ai/voice/synthesize/',
      PROCESS_COMMAND: '/ai/voice/process_command/',
      SUPPORTED_LANGUAGES: '/ai/voice/supported_languages/',
      VOICE_MODELS: '/ai/voice/voice_models/',
      STATISTICS: '/ai/voice/statistics/',
    },
    KNOWLEDGE: {
      LIST: '/ai/knowledge/',
      DETAIL: (id: string) => `/ai/knowledge/${id}/`,
    },
    STATISTICS: {
      SUMMARY: '/ai/statistics/summary/',
    },
  },

  // Crop Detection
  CROP_DETECTION: {
    DISEASES: {
      LIST: '/crop-detection/diseases/',
      DETAIL: (id: string) => `/crop-detection/diseases/${id}/`,
      SEARCH: '/crop-detection/diseases/search/',
      CATEGORIES: '/crop-detection/diseases/categories/',
      TREATMENTS: (diseaseId: string) => `/crop-detection/diseases/${diseaseId}/treatments/`,
    },
    TREATMENTS: {
      LIST: '/crop-detection/treatments/',
      DETAIL: (id: string) => `/crop-detection/treatments/${id}/`,
      RECOMMEND: '/crop-detection/treatments/recommend/',
    },
    SCANS: {
      LIST: '/crop-detection/scans/',
      DETAIL: (id: string) => `/crop-detection/scans/${id}/`,
      CREATE: '/crop-detection/scans/',
      FEEDBACK: (id: string) => `/crop-detection/scans/${id}/feedback/`,
      FOLLOW_UP: (id: string) => `/crop-detection/scans/${id}/add_follow_up/`,
      STATISTICS: '/crop-detection/scans/statistics/',
    },
    ANALYSIS: {
      ANALYZE: '/crop-detection/analysis/analyze/',
      SUPPORTED_CROPS: '/crop-detection/analysis/supported_crops/',
    },
    HISTORY: {
      SUMMARY: '/crop-detection/history/summary/',
    },
    REVIEWS: {
      LIST: '/crop-detection/reviews/',
      DETAIL: (id: string) => `/crop-detection/reviews/${id}/`,
      CREATE: '/crop-detection/reviews/',
      UPDATE: (id: string) => `/crop-detection/reviews/${id}/`,
      PENDING: '/crop-detection/reviews/pending/',
    },
  },

  // Health Check
  HEALTH: '/health/',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'Authentication required. Please log in.',
  FORBIDDEN: 'Access denied. You don\'t have permission for this action.',
  NOT_FOUND: 'Resource not found.',
  VALIDATION_ERROR: 'Validation error. Please check your input.',
  RATE_LIMITED: 'Too many requests. Please try again later.',
  SERVER_ERROR: 'Server error. Please try again later.',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable. Please try again later.',
  TIMEOUT: 'Request timeout. Please try again.',
  UNKNOWN_ERROR: 'An unexpected error occurred.',
} as const;

// Request Headers
export const REQUEST_HEADERS = {
  CONTENT_TYPE_JSON: 'application/json',
  CONTENT_TYPE_FORM_DATA: 'multipart/form-data',
  ACCEPT_JSON: 'application/json',
  AUTHORIZATION: 'Authorization',
  X_AUTH_TOKEN: 'X-Auth-Token',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// API Response Types
export const RESPONSE_TYPES = {
  JSON: 'json',
  BLOB: 'blob',
  TEXT: 'text',
  ARRAY_BUFFER: 'arraybuffer',
} as const;