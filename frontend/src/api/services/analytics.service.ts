/**
 * Analytics Dashboard API service
 */
import apiClient from '../axiosClient';

export interface DashboardMetrics {
  total_farms: number;
  total_products: number;
  total_orders: number;
  total_revenue: number;
  active_iot_devices: number;
  pending_tasks: number;
  unread_notifications: number;
  recent_activity: Array<{
    id: string;
    type: string;
    description: string;
    timestamp: string;
  }>;
}

export interface FarmPerformance {
  farm_id: string;
  farm_name: string;
  period: string;
  yield_data: Array<{
    crop: string;
    yield_amount: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
  }>;
  productivity_score: number;
  health_score: number;
  efficiency_metrics: {
    water_usage: number;
    fertilizer_usage: number;
    labor_hours: number;
  };
  comparison: {
    previous_period: number;
    change_percentage: number;
  };
}

export interface YieldPrediction {
  farm_id: string;
  crop: string;
  predicted_yield: number;
  unit: string;
  confidence_level: number;
  prediction_date: string;
  harvest_date: string;
  factors: Array<{
    name: string;
    impact: number;
    description: string;
  }>;
  historical_comparison: Array<{
    year: number;
    actual_yield: number;
  }>;
}

export interface WeatherForecast {
  location: {
    latitude: number;
    longitude: number;
    city: string;
  };
  current: {
    temperature: number;
    humidity: number;
    wind_speed: number;
    precipitation: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    date: string;
    temperature_high: number;
    temperature_low: number;
    humidity: number;
    precipitation_chance: number;
    wind_speed: number;
    description: string;
    icon: string;
  }>;
  alerts?: Array<{
    type: string;
    severity: string;
    message: string;
    start_time: string;
    end_time: string;
  }>;
}

export interface CustomReport {
  id: string;
  name: string;
  type: string;
  parameters: Record<string, any>;
  data: any;
  generated_at: string;
}

export interface ReportParams {
  report_type: 'farm_performance' | 'financial' | 'marketplace' | 'iot' | 'custom';
  start_date?: string;
  end_date?: string;
  farm_id?: string;
  format?: 'json' | 'pdf' | 'excel';
  filters?: Record<string, any>;
}

class AnalyticsService {
  private readonly baseUrl = '/analytics';

  /**
   * Get dashboard metrics
   */
  async getDashboard(): Promise<DashboardMetrics> {
    return apiClient.get<DashboardMetrics>(`${this.baseUrl}/dashboard`);
  }

  /**
   * Get farm performance analytics
   */
  async getFarmPerformance(params?: {
    farm_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<FarmPerformance> {
    return apiClient.get<FarmPerformance>(`${this.baseUrl}/farm-performance`, { params });
  }

  /**
   * Get yield predictions
   */
  async getYieldPredictions(params?: {
    farm_id?: string;
    crop?: string;
  }): Promise<YieldPrediction[]> {
    return apiClient.get<YieldPrediction[]>(`${this.baseUrl}/yield-predictions`, { params });
  }

  /**
   * Get weather forecast
   */
  async getWeatherForecast(params?: {
    farm_id?: string;
    latitude?: number;
    longitude?: number;
  }): Promise<WeatherForecast> {
    return apiClient.get<WeatherForecast>(`${this.baseUrl}/weather-forecast`, { params });
  }

  /**
   * Generate custom report
   */
  async generateCustomReport(params: ReportParams): Promise<CustomReport> {
    return apiClient.post<CustomReport>(`${this.baseUrl}/reports/custom`, params);
  }

  /**
   * Get saved reports
   */
  async getReports(): Promise<CustomReport[]> {
    return apiClient.get<CustomReport[]>(`${this.baseUrl}/reports`);
  }

  /**
   * Get report by ID
   */
  async getReport(reportId: string): Promise<CustomReport> {
    return apiClient.get<CustomReport>(`${this.baseUrl}/reports/${reportId}`);
  }

  /**
   * Delete report
   */
  async deleteReport(reportId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/reports/${reportId}`);
  }

  /**
   * Download report
   */
  async downloadReport(reportId: string, format: 'pdf' | 'excel'): Promise<void> {
    return apiClient.downloadFile(
      `${this.baseUrl}/reports/${reportId}/download?format=${format}`,
      `report-${reportId}.${format}`
    );
  }

  /**
   * Get marketplace analytics
   */
  async getMarketplaceAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_sales: number;
    total_revenue: number;
    average_order_value: number;
    top_products: Array<{
      product_id: string;
      product_name: string;
      sales_count: number;
      revenue: number;
    }>;
    sales_by_category: Record<string, number>;
    sales_trend: Array<{
      date: string;
      sales: number;
      revenue: number;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/marketplace`, { params });
  }

  /**
   * Get IoT analytics
   */
  async getIoTAnalytics(params?: {
    farm_id?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_devices: number;
    active_devices: number;
    total_readings: number;
    average_readings_per_day: number;
    sensor_health: Record<string, number>;
    data_trends: Array<{
      date: string;
      temperature: number;
      humidity: number;
      soil_moisture: number;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/iot`, { params });
  }

  /**
   * Get financial analytics
   */
  async getFinancialAnalytics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_income: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    income_trend: Array<{ date: string; amount: number }>;
    expense_trend: Array<{ date: string; amount: number }>;
    top_expense_categories: Array<{ category: string; amount: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/financial`, { params });
  }

  /**
   * Get user activity analytics
   */
  async getUserActivity(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_users: number;
    active_users: number;
    new_users: number;
    user_growth_rate: number;
    activity_by_day: Array<{
      date: string;
      active_users: number;
      new_users: number;
    }>;
    users_by_role: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/user-activity`, { params });
  }
}

export default new AnalyticsService();
