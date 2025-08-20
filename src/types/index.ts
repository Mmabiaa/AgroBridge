// Core User Types
export type UserRole = 'farmer' | 'buyer' | 'poultry_keeper' | 'ngo' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isAuthenticated: boolean;
  permissions: string[];
  accessibleRoutes: string[];
  profileData?: UserProfile;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  avatar?: string;
  phone?: string;
  location?: string;
  bio?: string;
  farmSize?: number;
  farmType?: string;
  experience?: number;
  certifications?: string[];
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language: string;
  currency: string;
  timezone: string;
  notifications: NotificationSettings;
  theme: 'light' | 'dark' | 'system';
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  sms: boolean;
  marketplace: boolean;
  alerts: boolean;
  updates: boolean;
}

// Marketplace Types
export interface Product {
  id: string;
  name: string;
  farmer: string;
  farmerId: string;
  location: string;
  price: number;
  previousPrice?: number;
  unit: string;
  quantity: number;
  rating: number;
  image: string;
  category: string;
  isOrganic: boolean;
  harvestDate: string;
  deliveryOptions: string[];
  description?: string;
  minOrder?: number;
  maxOrder?: number;
  stockStatus: 'in-stock' | 'low-stock' | 'out-of-stock';
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  productId: string;
  productName: string;
  farmer: string;
  farmerId: string;
  buyerId: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  orderDate: string;
  expectedDelivery: string;
  actualDelivery?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  deliveryAddress: Address;
  notes?: string;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface CartItem {
  productId: string;
  product: Product;
  quantity: number;
  addedAt: string;
}

// Farming & Monitoring Types
export interface Farm {
  id: string;
  name: string;
  ownerId: string;
  location: Address;
  size: number;
  sizeUnit: string;
  type: string;
  crops: Crop[];
  sensors: Sensor[];
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export interface Crop {
  id: string;
  name: string;
  variety: string;
  plantedDate: string;
  expectedHarvestDate: string;
  status: 'growing' | 'ready' | 'harvested' | 'failed';
  health: number; // 0-100
  area: number;
  areaUnit: string;
  yield?: number;
  yieldUnit?: string;
}

export interface Sensor {
  id: string;
  name: string;
  type: 'temperature' | 'humidity' | 'soil_moisture' | 'light' | 'ph' | 'nutrients';
  location: string;
  status: 'active' | 'inactive' | 'error';
  lastReading: SensorReading;
  batteryLevel: number;
  lastMaintenance: string;
  nextMaintenance: string;
}

export interface SensorReading {
  value: number;
  unit: string;
  timestamp: string;
  quality: 'good' | 'fair' | 'poor';
}

export interface WeatherData {
  current: {
    temp: number;
    humidity: number;
    condition: string;
    rainfall: number;
    windSpeed: number;
    pressure: number;
    visibility: number;
    uvIndex: number;
  };
  forecast: WeatherForecast[];
  alerts: WeatherAlert[];
}

export interface WeatherForecast {
  day: string;
  temp: string;
  icon: string;
  rain: string;
  humidity: number;
  windSpeed: number;
}

export interface WeatherAlert {
  type: 'warning' | 'watch' | 'advisory';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'extreme';
  startTime: string;
  endTime: string;
}

// AI & Analytics Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  metadata?: {
    queryType?: string;
    confidence?: number;
    sources?: string[];
  };
}

export interface ChatSession {
  id: string;
  userId: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface CropAnalysis {
  id: string;
  cropId: string;
  imageUrl: string;
  analysisDate: string;
  diseaseDetected?: string;
  confidence: number;
  recommendations: string[];
  severity: 'low' | 'medium' | 'high';
  treatment: string[];
  prevention: string[];
}

export interface AnalyticsData {
  period: string;
  metrics: {
    revenue: number;
    expenses: number;
    profit: number;
    cropYield: number;
    waterUsage: number;
    energyUsage: number;
  };
  trends: {
    revenue: 'up' | 'down' | 'stable';
    expenses: 'up' | 'down' | 'stable';
    cropYield: 'up' | 'down' | 'stable';
  };
}

// Financial Types
export interface FinancialRecord {
  id: string;
  type: 'income' | 'expense' | 'investment';
  category: string;
  amount: number;
  currency: string;
  date: string;
  description: string;
  relatedTo?: string; // crop, equipment, etc.
  tags?: string[];
  receipt?: string;
}

export interface Budget {
  id: string;
  name: string;
  period: string;
  totalAmount: number;
  spentAmount: number;
  categories: BudgetCategory[];
  status: 'on-track' | 'over-budget' | 'under-budget';
}

export interface BudgetCategory {
  name: string;
  allocated: number;
  spent: number;
  remaining: number;
}

// Planning & Scheduling Types
export interface Task {
  id: string;
  title: string;
  description: string;
  type: 'planting' | 'harvesting' | 'maintenance' | 'irrigation' | 'fertilization' | 'pest-control';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  assignedTo?: string;
  dueDate: string;
  completedDate?: string;
  estimatedDuration: number; // in hours
  actualDuration?: number;
  dependencies?: string[];
  location?: string;
  notes?: string;
}

export interface Schedule {
  id: string;
  name: string;
  farmId: string;
  period: string;
  tasks: Task[];
  recurring: boolean;
  recurrencePattern?: string;
  createdAt: string;
  updatedAt: string;
}

// Community & Learning Types
export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  title: string;
  content: string;
  type: 'question' | 'story' | 'tip' | 'news';
  tags: string[];
  likes: number;
  comments: Comment[];
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  likes: number;
  createdAt: string;
}

export interface LearningContent {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'video' | 'course' | 'guide';
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // in minutes
  author: string;
  tags: string[];
  content: string;
  resources?: string[];
  createdAt: string;
  updatedAt: string;
}

// System & Admin Types
export interface SystemLog {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  category: string;
  message: string;
  userId?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface SystemMetrics {
  totalUsers: number;
  activeUsers: number;
  systemUptime: string;
  storageUsed: string;
  storageTotal: string;
  apiRequests: number;
  errorRate: number;
  lastUpdated: string;
}

// API Response Types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
  timestamp: string;
}

// Filter & Search Types
export interface FilterOptions {
  category?: string;
  priceRange?: [number, number];
  location?: string;
  organic?: boolean;
  rating?: number;
  availability?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface SearchQuery {
  query: string;
  filters: FilterOptions;
  page: number;
  limit: number;
}

// Notification Types
export interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  read: boolean;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

// Export Types
export interface ExportOptions {
  format: 'csv' | 'pdf' | 'excel';
  dataType: string;
  dateRange?: [string, string];
  filters?: Record<string, any>;
}

export interface ExportJob {
  id: string;
  userId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  options: ExportOptions;
  downloadUrl?: string;
  errorMessage?: string;
  createdAt: string;
  completedAt?: string;
} 