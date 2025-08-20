import { 
  User, 
  Product, 
  Order, 
  Farm, 
  Crop, 
  Sensor, 
  SensorReading, 
  WeatherData, 
  ChatMessage, 
  ChatSession, 
  CropAnalysis, 
  AnalyticsData, 
  FinancialRecord, 
  Budget, 
  Task, 
  Schedule, 
  CommunityPost, 
  Comment, 
  LearningContent, 
  SystemLog, 
  SystemMetrics,
  Notification
} from './index';
import { faker } from '@faker-js/faker';

// Helper function to generate random IDs
const generateId = () => faker.string.uuid();

// Helper function to generate random dates
const generateDate = (start?: Date, end?: Date) => {
  const startDate = start || new Date('2024-01-01');
  const endDate = end || new Date();
  return faker.date.between({ from: startDate, to: endDate }).toISOString();
};

// Helper function to pick random items from arrays
const randomPick = <T>(array: T[]): T => array[Math.floor(Math.random() * array.length)];

// Helper function to generate random array items
const randomArray = <T>(array: T[], min: number, max: number): T[] => {
  const count = faker.number.int({ min, max });
  return faker.helpers.arrayElements(array, count);
};

// User Factories
export const makeUser = (overrides: Partial<User> = {}): User => {
  const role = overrides.role || randomPick(['farmer', 'buyer', 'poultry_keeper', 'ngo', 'admin']);
  
  return {
    id: generateId(),
    email: faker.internet.email(),
    name: faker.person.fullName(),
    role,
    isAuthenticated: true,
    permissions: getDefaultPermissions(role),
    accessibleRoutes: getDefaultRoutes(role),
    profileData: makeUserProfile(),
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

export const makeUserProfile = () => ({
  avatar: faker.image.avatar(),
  phone: faker.phone.number(),
  location: `${faker.location.city()}, ${faker.location.country()}`,
  bio: faker.lorem.paragraph(),
  farmSize: faker.number.float({ min: 1, max: 1000, precision: 0.1 }),
  farmType: randomPick(['arable', 'livestock', 'mixed', 'horticulture', 'poultry']),
  experience: faker.number.int({ min: 1, max: 30 }),
  certifications: randomArray(['Organic Certified', 'GAP Certified', 'ISO 9001'], 0, 3),
  preferences: {
    language: randomPick(['en', 'fr', 'es', 'pt']),
    currency: randomPick(['USD', 'EUR', 'GBP', 'GHS']),
    timezone: randomPick(['UTC', 'GMT', 'EST', 'PST']),
    notifications: {
      email: faker.datatype.boolean(),
      push: faker.datatype.boolean(),
      sms: faker.datatype.boolean(),
      marketplace: faker.datatype.boolean(),
      alerts: faker.datatype.boolean(),
      updates: faker.datatype.boolean()
    },
    theme: randomPick(['light', 'dark', 'system'])
  }
});

// Helper functions for permissions and routes (matching AuthContext)
const getDefaultPermissions = (role: string): string[] => {
  const rolePermissions: Record<string, string[]> = {
    farmer: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'use_crop_detection', 'use_voice_commands', 'view_marketplace',
      'place_orders', 'view_orders', 'view_learning', 'view_community',
      'use_satellite_integration', 'use_iot_sensors', 'use_drone_integration',
      'use_ar_visualization', 'view_financial_planning', 'create_plans',
      'view_smart_scheduling'
    ],
    buyer: [
      'view_dashboard', 'view_marketplace', 'place_orders', 'view_orders',
      'view_learning', 'view_community', 'view_financial_planning', 'use_voice_commands'
    ],
    ngo: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'view_marketplace', 'view_learning', 'view_community', 'moderate_community',
      'create_content', 'edit_content', 'use_satellite_integration',
      'use_iot_sensors', 'view_financial_planning', 'manage_content', 'use_voice_commands'
    ],
    admin: [
      'view_dashboard', 'view_analytics', 'view_monitoring', 'use_agrigpt',
      'use_crop_detection', 'use_voice_commands', 'view_marketplace',
      'create_product', 'edit_product', 'delete_product', 'view_orders',
      'view_learning', 'create_content', 'edit_content', 'delete_content',
      'view_community', 'moderate_community', 'use_satellite_integration',
      'use_iot_sensors', 'use_drone_integration', 'use_ar_visualization',
      'use_blockchain', 'view_financial_planning', 'create_plans',
      'view_smart_scheduling', 'manage_users', 'manage_system',
      'view_admin_dashboard', 'manage_content', 'view_logs'
    ]
  };
  return rolePermissions[role] || [];
};

const getDefaultRoutes = (role: string): string[] => {
  const roleRoutes: Record<string, string[]> = {
    farmer: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/crop-disease-detection', '/voice-commands', '/marketplace',
      '/learning', '/community', '/financial-planning', '/smart-scheduling'
    ],
    buyer: [
      '/dashboard', '/marketplace', '/learning', '/community',
      '/financial-planning', '/voice-commands'
    ],
    ngo: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/marketplace', '/learning', '/community', '/financial-planning', '/voice-commands'
    ],
    admin: [
      '/dashboard', '/analytics', '/monitoring', '/agrigpt',
      '/crop-disease-detection', '/voice-commands', '/marketplace',
      '/learning', '/community', '/financial-planning', '/smart-scheduling',
      '/admin'
    ]
  };
  return roleRoutes[role] || [];
};

// Product Factories
export const makeProduct = (overrides: Partial<Product> = {}): Product => {
  const categories = ['Vegetables', 'Fruits', 'Grains', 'Legumes', 'Roots', 'Herbs'];
  const units = ['kg', 'lb', 'piece', 'bunch', 'bag'];
  const deliveryOptions = ['Pickup', 'Local Delivery', 'Regional Shipping', 'Nationwide Shipping'];
  
  return {
    id: generateId(),
    name: faker.commerce.productName(),
    farmer: faker.person.fullName(),
    farmerId: generateId(),
    location: `${faker.location.city()}, ${faker.location.country()}`,
    price: faker.number.float({ min: 50, max: 5000, precision: 0.01 }),
    previousPrice: faker.number.float({ min: 50, max: 5000, precision: 0.01 }),
    unit: randomPick(units),
    quantity: faker.number.int({ min: 10, max: 10000 }),
    rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
    image: faker.image.urlLoremFlickr({ category: 'food' }),
    category: randomPick(categories),
    isOrganic: faker.datatype.boolean(),
    harvestDate: generateDate(new Date('2024-01-01'), new Date()),
    deliveryOptions: randomArray(deliveryOptions, 1, 3),
    description: faker.lorem.paragraph(),
    minOrder: faker.number.int({ min: 1, max: 10 }),
    maxOrder: faker.number.int({ min: 100, max: 1000 }),
    stockStatus: randomPick(['in-stock', 'low-stock', 'out-of-stock']),
    tags: randomArray(['fresh', 'local', 'seasonal', 'premium'], 0, 3),
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

// Order Factories
export const makeOrder = (overrides: Partial<Order> = {}): Order => {
  const statuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const paymentMethods = ['Mobile Money', 'Bank Transfer', 'Cash', 'Credit Card'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];
  
  return {
    id: generateId(),
    productId: generateId(),
    productName: faker.commerce.productName(),
    farmer: faker.person.fullName(),
    farmerId: generateId(),
    buyerId: generateId(),
    quantity: faker.number.int({ min: 1, max: 1000 }),
    unit: randomPick(['kg', 'lb', 'piece']),
    totalPrice: faker.number.float({ min: 100, max: 50000, precision: 0.01 }),
    status: randomPick(statuses),
    orderDate: generateDate(),
    expectedDelivery: generateDate(new Date(), new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
    actualDelivery: faker.datatype.boolean() ? generateDate() : undefined,
    paymentMethod: randomPick(paymentMethods),
    paymentStatus: randomPick(paymentStatuses),
    deliveryAddress: makeAddress(),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    ...overrides
  };
};

export const makeAddress = () => ({
  street: faker.location.streetAddress(),
  city: faker.location.city(),
  state: faker.location.state(),
  country: faker.location.country(),
  postalCode: faker.location.zipCode(),
  coordinates: faker.datatype.boolean() ? {
    lat: faker.location.latitude(),
    lng: faker.location.longitude()
  } : undefined
});

// Farm Factories
export const makeFarm = (overrides: Partial<Farm> = {}): Farm => {
  const farmTypes = ['arable', 'livestock', 'mixed', 'horticulture', 'poultry', 'aquaculture'];
  const statuses = ['active', 'inactive', 'maintenance'];
  
  return {
    id: generateId(),
    name: `${faker.person.lastName()} Farm`,
    ownerId: generateId(),
    location: makeAddress(),
    size: faker.number.float({ min: 1, max: 1000, precision: 0.1 }),
    sizeUnit: randomPick(['acres', 'hectares', 'sq meters']),
    type: randomPick(farmTypes),
    crops: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, () => makeCrop()),
    sensors: Array.from({ length: faker.number.int({ min: 2, max: 8 }) }, () => makeSensor()),
    status: randomPick(statuses),
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

export const makeCrop = (overrides: Partial<Crop> = {}): Crop => {
  const cropNames = ['Tomatoes', 'Maize', 'Rice', 'Wheat', 'Cassava', 'Yam', 'Plantain'];
  const varieties = ['Hybrid', 'Local', 'Improved', 'Organic'];
  const statuses = ['growing', 'ready', 'harvested', 'failed'];
  
  return {
    id: generateId(),
    name: randomPick(cropNames),
    variety: randomPick(varieties),
    plantedDate: generateDate(new Date('2024-01-01'), new Date()),
    expectedHarvestDate: generateDate(new Date(), new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)),
    status: randomPick(statuses),
    health: faker.number.int({ min: 0, max: 100 }),
    area: faker.number.float({ min: 0.1, max: 100, precision: 0.1 }),
    areaUnit: randomPick(['acres', 'hectares', 'sq meters']),
    yield: faker.datatype.boolean() ? faker.number.float({ min: 100, max: 10000, precision: 0.1 }) : undefined,
    yieldUnit: faker.datatype.boolean() ? randomPick(['kg', 'tons', 'bushels']) : undefined,
    ...overrides
  };
};

export const makeSensor = (overrides: Partial<Sensor> = {}): Sensor => {
  const sensorTypes = ['temperature', 'humidity', 'soil_moisture', 'light', 'ph', 'nutrients'];
  const statuses = ['active', 'inactive', 'error'];
  
  return {
    id: generateId(),
    name: `${randomPick(sensorTypes)} Sensor`,
    type: randomPick(sensorTypes),
    location: randomPick(['Field A', 'Field B', 'Greenhouse', 'Storage', 'Office']),
    status: randomPick(statuses),
    lastReading: makeSensorReading(),
    batteryLevel: faker.number.int({ min: 0, max: 100 }),
    lastMaintenance: generateDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), new Date()),
    nextMaintenance: generateDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    ...overrides
  };
};

export const makeSensorReading = (overrides: Partial<SensorReading> = {}): SensorReading => {
  const qualities = ['good', 'fair', 'poor'];
  
  return {
    value: faker.number.float({ min: 0, max: 100, precision: 0.1 }),
    unit: randomPick(['°C', '%', 'lux', 'pH', 'ppm']),
    timestamp: generateDate(new Date(Date.now() - 24 * 60 * 60 * 1000), new Date()),
    quality: randomPick(qualities),
    ...overrides
  };
};

// Weather Factories
export const makeWeatherData = (overrides: Partial<WeatherData> = {}): WeatherData => {
  return {
    current: {
      temp: faker.number.float({ min: 15, max: 35, precision: 0.1 }),
      humidity: faker.number.int({ min: 30, max: 90 }),
      condition: randomPick(['Sunny', 'Partly Cloudy', 'Cloudy', 'Rainy', 'Stormy']),
      rainfall: faker.number.float({ min: 0, max: 50, precision: 0.1 }),
      windSpeed: faker.number.float({ min: 0, max: 30, precision: 0.1 }),
      pressure: faker.number.float({ min: 980, max: 1020, precision: 0.1 }),
      visibility: faker.number.float({ min: 5, max: 25, precision: 0.1 }),
      uvIndex: faker.number.int({ min: 0, max: 11 })
    },
    forecast: Array.from({ length: 5 }, () => makeWeatherForecast()),
    alerts: Array.from({ length: faker.number.int({ min: 0, max: 3 }) }, () => makeWeatherAlert()),
    ...overrides
  };
};

export const makeWeatherForecast = () => ({
  day: randomPick(['Today', 'Tomorrow', 'Wednesday', 'Thursday', 'Friday']),
  temp: `${faker.number.int({ min: 15, max: 35 })}°C`,
  icon: randomPick(['Sun', 'Cloud', 'CloudRain', 'CloudLightning']),
  rain: `${faker.number.int({ min: 0, max: 100 })}%`,
  humidity: faker.number.int({ min: 30, max: 90 }),
  windSpeed: faker.number.float({ min: 0, max: 30, precision: 0.1 })
});

export const makeWeatherAlert = () => ({
  type: randomPick(['warning', 'watch', 'advisory']),
  title: faker.lorem.sentence(),
  description: faker.lorem.paragraph(),
  severity: randomPick(['low', 'medium', 'high', 'extreme']),
  startTime: generateDate(),
  endTime: generateDate(new Date(), new Date(Date.now() + 24 * 60 * 60 * 1000))
});

// AI & Chat Factories
export const makeChatMessage = (overrides: Partial<ChatMessage> = {}): ChatMessage => {
  const roles = ['user', 'assistant', 'system'];
  
  return {
    id: generateId(),
    role: randomPick(roles),
    content: faker.lorem.paragraph(),
    timestamp: generateDate(),
    metadata: faker.datatype.boolean() ? {
      queryType: randomPick(['general', 'crop', 'weather', 'market', 'technical']),
      confidence: faker.number.float({ min: 0.5, max: 1, precision: 0.01 }),
      sources: randomArray(['AgriGPT Knowledge Base', 'Weather API', 'Market Data'], 0, 3)
    } : undefined,
    ...overrides
  };
};

export const makeChatSession = (overrides: Partial<ChatSession> = {}): ChatSession => {
  return {
    id: generateId(),
    userId: generateId(),
    title: faker.lorem.sentence(),
    messages: Array.from({ length: faker.number.int({ min: 2, max: 10 }) }, () => makeChatMessage()),
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

export const makeCropAnalysis = (overrides: Partial<CropAnalysis> = {}): CropAnalysis => {
  const diseases = ['Leaf Blight', 'Root Rot', 'Powdery Mildew', 'Bacterial Wilt', 'Virus'];
  const severities = ['low', 'medium', 'high'];
  
  return {
    id: generateId(),
    cropId: generateId(),
    imageUrl: faker.image.urlLoremFlickr({ category: 'plants' }),
    analysisDate: generateDate(),
    diseaseDetected: faker.datatype.boolean() ? randomPick(diseases) : undefined,
    confidence: faker.number.float({ min: 0.5, max: 1, precision: 0.01 }),
    recommendations: randomArray([
      'Apply fungicide treatment',
      'Improve soil drainage',
      'Adjust irrigation schedule',
      'Remove infected plants',
      'Use resistant varieties'
    ], 2, 5),
    severity: randomPick(severities),
    treatment: randomArray([
      'Fungicide application',
      'Soil amendment',
      'Crop rotation',
      'Biological control'
    ], 1, 3),
    prevention: randomArray([
      'Regular monitoring',
      'Proper spacing',
      'Crop rotation',
      'Sanitation practices'
    ], 1, 3),
    ...overrides
  };
};

// Analytics Factories
export const makeAnalyticsData = (overrides: Partial<AnalyticsData> = {}): AnalyticsData => {
  const trends = ['up', 'down', 'stable'];
  
  return {
    period: randomPick(['This Week', 'This Month', 'This Quarter', 'This Year']),
    metrics: {
      revenue: faker.number.float({ min: 1000, max: 100000, precision: 0.01 }),
      expenses: faker.number.float({ min: 500, max: 80000, precision: 0.01 }),
      profit: faker.number.float({ min: -10000, max: 50000, precision: 0.01 }),
      cropYield: faker.number.float({ min: 100, max: 10000, precision: 0.1 }),
      waterUsage: faker.number.float({ min: 100, max: 5000, precision: 0.1 }),
      energyUsage: faker.number.float({ min: 50, max: 2000, precision: 0.1 })
    },
    trends: {
      revenue: randomPick(trends),
      expenses: randomPick(trends),
      cropYield: randomPick(trends)
    },
    ...overrides
  };
};

// Financial Factories
export const makeFinancialRecord = (overrides: Partial<FinancialRecord> = {}): FinancialRecord => {
  const types = ['income', 'expense', 'investment'];
  const categories = ['Crop Sales', 'Equipment', 'Fertilizer', 'Labor', 'Transport', 'Utilities'];
  
  return {
    id: generateId(),
    type: randomPick(types),
    category: randomPick(categories),
    amount: faker.number.float({ min: 10, max: 10000, precision: 0.01 }),
    currency: randomPick(['USD', 'EUR', 'GBP', 'GHS']),
    date: generateDate(),
    description: faker.lorem.sentence(),
    relatedTo: faker.datatype.boolean() ? randomPick(['Tomatoes', 'Maize', 'Equipment', 'Labor']) : undefined,
    tags: randomArray(['urgent', 'monthly', 'seasonal'], 0, 3),
    receipt: faker.datatype.boolean() ? faker.image.urlLoremFlickr({ category: 'document' }) : undefined,
    ...overrides
  };
};

export const makeBudget = (overrides: Partial<Budget> = {}): Budget => {
  const statuses = ['on-track', 'over-budget', 'under-budget'];
  
  return {
    id: generateId(),
    name: faker.lorem.words(3),
    period: randomPick(['Monthly', 'Quarterly', 'Annual']),
    totalAmount: faker.number.float({ min: 1000, max: 50000, precision: 0.01 }),
    spentAmount: faker.number.float({ min: 0, max: 50000, precision: 0.01 }),
    categories: Array.from({ length: faker.number.int({ min: 3, max: 8 }) }, () => ({
      name: randomPick(['Labor', 'Equipment', 'Fertilizer', 'Seeds', 'Transport', 'Utilities', 'Marketing']),
      allocated: faker.number.float({ min: 100, max: 10000, precision: 0.01 }),
      spent: faker.number.float({ min: 0, max: 10000, precision: 0.01 }),
      remaining: faker.number.float({ min: 0, max: 10000, precision: 0.01 })
    })),
    status: randomPick(statuses),
    ...overrides
  };
};

// Task & Schedule Factories
export const makeTask = (overrides: Partial<Task> = {}): Task => {
  const types = ['planting', 'harvesting', 'maintenance', 'irrigation', 'fertilization', 'pest-control'];
  const priorities = ['low', 'medium', 'high', 'urgent'];
  const statuses = ['pending', 'in-progress', 'completed', 'cancelled'];
  
  return {
    id: generateId(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    type: randomPick(types),
    priority: randomPick(priorities),
    status: randomPick(statuses),
    assignedTo: faker.datatype.boolean() ? faker.person.fullName() : undefined,
    dueDate: generateDate(new Date(), new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
    completedDate: faker.datatype.boolean() ? generateDate() : undefined,
    estimatedDuration: faker.number.int({ min: 1, max: 24 }),
    actualDuration: faker.datatype.boolean() ? faker.number.int({ min: 1, max: 24 }) : undefined,
    dependencies: randomArray(['Task A', 'Task B', 'Task C'], 0, 2),
    location: randomPick(['Field A', 'Field B', 'Greenhouse', 'Storage']),
    notes: faker.datatype.boolean() ? faker.lorem.sentence() : undefined,
    ...overrides
  };
};

export const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => {
  return {
    id: generateId(),
    name: faker.lorem.words(3),
    farmId: generateId(),
    period: randomPick(['Daily', 'Weekly', 'Monthly', 'Seasonal']),
    tasks: Array.from({ length: faker.number.int({ min: 3, max: 10 }) }, () => makeTask()),
    recurring: faker.datatype.boolean(),
    recurrencePattern: faker.datatype.boolean() ? randomPick(['daily', 'weekly', 'monthly']) : undefined,
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

// Community & Learning Factories
export const makeCommunityPost = (overrides: Partial<CommunityPost> = {}): CommunityPost => {
  const types = ['question', 'story', 'tip', 'news'];
  
  return {
    id: generateId(),
    authorId: generateId(),
    authorName: faker.person.fullName(),
    authorAvatar: faker.datatype.boolean() ? faker.image.avatar() : undefined,
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
    type: randomPick(types),
    tags: randomArray(['farming', 'tips', 'weather', 'market', 'technology'], 1, 4),
    likes: faker.number.int({ min: 0, max: 100 }),
    comments: Array.from({ length: faker.number.int({ min: 0, max: 5 }) }, () => makeComment()),
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

export const makeComment = (overrides: Partial<Comment> = {}): Comment => {
  return {
    id: generateId(),
    authorId: generateId(),
    authorName: faker.person.fullName(),
    authorAvatar: faker.datatype.boolean() ? faker.image.avatar() : undefined,
    content: faker.lorem.paragraph(),
    likes: faker.number.int({ min: 0, max: 20 }),
    createdAt: generateDate(),
    ...overrides
  };
};

export const makeLearningContent = (overrides: Partial<LearningContent> = {}): LearningContent => {
  const types = ['article', 'video', 'course', 'guide'];
  const difficulties = ['beginner', 'intermediate', 'advanced'];
  
  return {
    id: generateId(),
    title: faker.lorem.sentence(),
    description: faker.lorem.paragraph(),
    type: randomPick(types),
    category: randomPick(['Crop Management', 'Soil Health', 'Pest Control', 'Market Access', 'Technology']),
    difficulty: randomPick(difficulties),
    duration: faker.number.int({ min: 5, max: 180 }),
    author: faker.person.fullName(),
    tags: randomArray(['farming', 'education', 'best-practices'], 1, 3),
    content: faker.lorem.paragraphs(5),
    resources: randomArray(['PDF Guide', 'Video Tutorial', 'Interactive Quiz'], 0, 3),
    createdAt: generateDate(),
    updatedAt: generateDate(),
    ...overrides
  };
};

// System & Admin Factories
export const makeSystemLog = (overrides: Partial<SystemLog> = {}): SystemLog => {
  const levels = ['info', 'warning', 'error', 'critical'];
  const categories = ['auth', 'api', 'database', 'system', 'user'];
  
  return {
    id: generateId(),
    level: randomPick(levels),
    category: randomPick(categories),
    message: faker.lorem.sentence(),
    userId: faker.datatype.boolean() ? generateId() : undefined,
    metadata: faker.datatype.boolean() ? {
      ip: faker.internet.ip(),
      userAgent: faker.internet.userAgent(),
      endpoint: faker.internet.url()
    } : undefined,
    timestamp: generateDate(),
    ...overrides
  };
};

export const makeSystemMetrics = (overrides: Partial<SystemMetrics> = {}): SystemMetrics => {
  return {
    totalUsers: faker.number.int({ min: 100, max: 10000 }),
    activeUsers: faker.number.int({ min: 50, max: 5000 }),
    systemUptime: `${faker.number.int({ min: 95, max: 99 })}.${faker.number.int({ min: 0, max: 99 })}%`,
    storageUsed: `${faker.number.int({ min: 10, max: 500 })} GB`,
    storageTotal: `${faker.number.int({ min: 100, max: 1000 })} GB`,
    apiRequests: faker.number.int({ min: 1000, max: 100000 }),
    errorRate: faker.number.float({ min: 0.01, max: 5, precision: 0.01 }),
    lastUpdated: generateDate(),
    ...overrides
  };
};

// Notification Factories
export const makeNotification = (overrides: Partial<Notification> = {}): Notification => {
  const types = ['info', 'success', 'warning', 'error'];
  
  return {
    id: generateId(),
    userId: generateId(),
    type: randomPick(types),
    title: faker.lorem.sentence(),
    message: faker.lorem.paragraph(),
    read: faker.datatype.boolean(),
    actionUrl: faker.datatype.boolean() ? faker.internet.url() : undefined,
    metadata: faker.datatype.boolean() ? {
      source: randomPick(['marketplace', 'monitoring', 'system', 'user']),
      priority: randomPick(['low', 'medium', 'high'])
    } : undefined,
    createdAt: generateDate(),
    ...overrides
  };
};

// Collection Factories
export const makeProductArray = (count: number, overrides: Partial<Product> = {}): Product[] => {
  return Array.from({ length: count }, () => makeProduct(overrides));
};

export const makeOrderArray = (count: number, overrides: Partial<Order> = {}): Order[] => {
  return Array.from({ length: count }, () => makeOrder(overrides));
};

export const makeUserArray = (count: number, overrides: Partial<User> = {}): User[] => {
  return Array.from({ length: count }, () => makeUser(overrides));
};

export const makeFarmArray = (count: number, overrides: Partial<Farm> = {}): Farm[] => {
  return Array.from({ length: count }, () => makeFarm(overrides));
};

export const makeTaskArray = (count: number, overrides: Partial<Task> = {}): Task[] => {
  return Array.from({ length: count }, () => makeTask(overrides));
};

export const makeCommunityPostArray = (count: number, overrides: Partial<CommunityPost> = {}): CommunityPost[] => {
  return Array.from({ length: count }, () => makeCommunityPost(overrides));
}; 