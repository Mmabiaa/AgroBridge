/**
 * Farms API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Farm {
  id: string;
  name: string;
  description: string;
  location: {
    address: string;
    city: string;
    state: string;
    country: string;
    postal_code: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  size_hectares: number;
  farm_type: string;
  crops: string[];
  owner: string;
  owner_name: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateFarmRequest {
  name: string;
  description?: string;
  location: Farm['location'];
  size_hectares: number;
  farm_type: string;
  crops: string[];
}

export interface UpdateFarmRequest extends Partial<CreateFarmRequest> {}

export interface FarmSensor {
  id: string;
  farm: string;
  sensor_type: string;
  name: string;
  location: string;
  is_active: boolean;
  last_reading: {
    timestamp: string;
    value: number;
    unit: string;
  } | null;
  created_at: string;
}

export interface SensorReading {
  id: string;
  sensor: string;
  value: number;
  unit: string;
  timestamp: string;
  metadata: Record<string, any>;
}

export interface FarmAnalytics {
  farm_id: string;
  period: string;
  metrics: {
    total_sensors: number;
    active_sensors: number;
    total_readings: number;
    average_soil_moisture: number;
    average_temperature: number;
    average_humidity: number;
  };
  trends: {
    soil_moisture: Array<{ date: string; value: number }>;
    temperature: Array<{ date: string; value: number }>;
    humidity: Array<{ date: string; value: number }>;
  };
  alerts: Array<{
    id: string;
    type: string;
    message: string;
    severity: string;
    timestamp: string;
  }>;
}

export interface FarmListParams {
  page?: number;
  page_size?: number;
  search?: string;
  farm_type?: string;
  crops?: string;
  location?: string;
  ordering?: string;
}

class FarmsService {
  private readonly baseUrl = '/farms';

  /**
   * Get list of farms
   */
  async getFarms(params?: FarmListParams): Promise<PaginatedResponse<Farm>> {
    return apiClient.getPaginated<Farm>(`${this.baseUrl}/`, params);
  }

  /**
   * Get farm by ID
   */
  async getFarm(farmId: string): Promise<Farm> {
    return apiClient.get<Farm>(`${this.baseUrl}/${farmId}/`);
  }

  /**
   * Create new farm
   */
  async createFarm(farmData: CreateFarmRequest): Promise<Farm> {
    return apiClient.post<Farm>(`${this.baseUrl}/`, farmData);
  }

  /**
   * Update farm
   */
  async updateFarm(farmId: string, farmData: UpdateFarmRequest): Promise<Farm> {
    return apiClient.patch<Farm>(`${this.baseUrl}/${farmId}/`, farmData);
  }

  /**
   * Delete farm
   */
  async deleteFarm(farmId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${farmId}/`);
  }

  /**
   * Get farm sensors
   */
  async getFarmSensors(farmId: string): Promise<FarmSensor[]> {
    return apiClient.get<FarmSensor[]>(`${this.baseUrl}/${farmId}/sensors/`);
  }

  /**
   * Add sensor to farm
   */
  async addSensor(farmId: string, sensorData: Omit<FarmSensor, 'id' | 'farm' | 'created_at' | 'last_reading'>): Promise<FarmSensor> {
    return apiClient.post<FarmSensor>(`${this.baseUrl}/${farmId}/sensors/`, sensorData);
  }

  /**
   * Update sensor
   */
  async updateSensor(farmId: string, sensorId: string, sensorData: Partial<FarmSensor>): Promise<FarmSensor> {
    return apiClient.patch<FarmSensor>(`${this.baseUrl}/${farmId}/sensors/${sensorId}/`, sensorData);
  }

  /**
   * Delete sensor
   */
  async deleteSensor(farmId: string, sensorId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/${farmId}/sensors/${sensorId}/`);
  }

  /**
   * Get sensor readings
   */
  async getSensorReadings(
    farmId: string, 
    sensorId: string, 
    params?: {
      start_date?: string;
      end_date?: string;
      limit?: number;
    }
  ): Promise<SensorReading[]> {
    return apiClient.get<SensorReading[]>(
      `${this.baseUrl}/${farmId}/sensors/${sensorId}/readings/`,
      { params }
    );
  }

  /**
   * Add sensor reading
   */
  async addSensorReading(
    farmId: string, 
    sensorId: string, 
    reading: Omit<SensorReading, 'id' | 'sensor' | 'timestamp'>
  ): Promise<SensorReading> {
    return apiClient.post<SensorReading>(
      `${this.baseUrl}/${farmId}/sensors/${sensorId}/readings/`,
      reading
    );
  }

  /**
   * Get farm analytics
   */
  async getFarmAnalytics(
    farmId: string, 
    params?: {
      period?: 'day' | 'week' | 'month' | 'year';
      start_date?: string;
      end_date?: string;
    }
  ): Promise<FarmAnalytics> {
    return apiClient.get<FarmAnalytics>(
      `${this.baseUrl}/${farmId}/analytics/`,
      { params }
    );
  }

  /**
   * Get farm alerts
   */
  async getFarmAlerts(farmId: string): Promise<FarmAnalytics['alerts']> {
    return apiClient.get<FarmAnalytics['alerts']>(`${this.baseUrl}/${farmId}/alerts/`);
  }

  /**
   * Mark alert as read
   */
  async markAlertAsRead(farmId: string, alertId: string): Promise<void> {
    return apiClient.post(`${this.baseUrl}/${farmId}/alerts/${alertId}/mark-read/`);
  }

  /**
   * Get farm weather data
   */
  async getFarmWeather(farmId: string): Promise<{
    current: {
      temperature: number;
      humidity: number;
      wind_speed: number;
      precipitation: number;
      description: string;
    };
    forecast: Array<{
      date: string;
      temperature_high: number;
      temperature_low: number;
      humidity: number;
      precipitation_chance: number;
      description: string;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/${farmId}/weather/`);
  }

  /**
   * Export farm data
   */
  async exportFarmData(
    farmId: string, 
    format: 'csv' | 'json' | 'pdf',
    params?: {
      start_date?: string;
      end_date?: string;
      include_sensors?: boolean;
      include_analytics?: boolean;
    }
  ): Promise<void> {
    return apiClient.downloadFile(
      `${this.baseUrl}/${farmId}/export/`,
      `farm-${farmId}-data.${format}`
    );
  }

  /**
   * Get user's farms
   */
  async getMyFarms(): Promise<Farm[]> {
    return apiClient.get<Farm[]>(`${this.baseUrl}/my-farms/`);
  }

  /**
   * Get farm statistics
   */
  async getFarmStatistics(): Promise<{
    total_farms: number;
    total_sensors: number;
    active_sensors: number;
    total_readings_today: number;
    farms_by_type: Record<string, number>;
    recent_activity: Array<{
      farm_name: string;
      activity: string;
      timestamp: string;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics/`);
  }
}

export default new FarmsService();