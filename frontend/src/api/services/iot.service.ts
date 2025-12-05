/**
 * IoT Devices API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface IoTDevice {
  id: string;
  farm: string;
  name: string;
  device_type: 'sensor' | 'actuator' | 'camera';
  status: 'online' | 'offline' | 'error';
  battery_level?: number;
  last_seen: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SensorData {
  id: string;
  device: string;
  temperature?: number;
  humidity?: number;
  soil_moisture?: number;
  light_intensity?: number;
  ph_level?: number;
  ec_level?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface DeviceAlert {
  id: string;
  device: string;
  alert_type: 'low_battery' | 'offline' | 'threshold_exceeded' | 'malfunction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  is_acknowledged: boolean;
  created_at: string;
  acknowledged_at?: string;
}

export interface CreateDeviceRequest {
  farm: string;
  name: string;
  device_type: 'sensor' | 'actuator' | 'camera';
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

export interface UpdateDeviceRequest {
  name?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
}

export interface DeviceListParams {
  page?: number;
  page_size?: number;
  farm?: string;
  device_type?: string;
  status?: string;
  ordering?: string;
}

export interface SensorDataParams {
  start_date?: string;
  end_date?: string;
  limit?: number;
  ordering?: string;
}

export interface FirmwareUpdate {
  version: string;
  release_notes: string;
  file_url: string;
  file_size: number;
  checksum: string;
}

class IoTService {
  private readonly baseUrl = '/iot';

  /**
   * Get list of devices
   */
  async getDevices(params?: DeviceListParams): Promise<PaginatedResponse<IoTDevice>> {
    return apiClient.getPaginated<IoTDevice>(`${this.baseUrl}/devices`, params);
  }

  /**
   * Get device by ID
   */
  async getDevice(deviceId: string): Promise<IoTDevice> {
    return apiClient.get<IoTDevice>(`${this.baseUrl}/devices/${deviceId}`);
  }

  /**
   * Register new device
   */
  async registerDevice(data: CreateDeviceRequest): Promise<IoTDevice> {
    return apiClient.post<IoTDevice>(`${this.baseUrl}/devices`, data);
  }

  /**
   * Update device
   */
  async updateDevice(deviceId: string, data: UpdateDeviceRequest): Promise<IoTDevice> {
    return apiClient.patch<IoTDevice>(`${this.baseUrl}/devices/${deviceId}`, data);
  }

  /**
   * Delete device
   */
  async deleteDevice(deviceId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/devices/${deviceId}`);
  }

  /**
   * Get sensor data for device
   */
  async getSensorData(deviceId: string, params?: SensorDataParams): Promise<SensorData[]> {
    return apiClient.get<SensorData[]>(`${this.baseUrl}/devices/${deviceId}/data`, { params });
  }

  /**
   * Get latest sensor reading
   */
  async getLatestReading(deviceId: string): Promise<SensorData> {
    return apiClient.get<SensorData>(`${this.baseUrl}/devices/${deviceId}/data/latest`);
  }

  /**
   * Get device alerts
   */
  async getDeviceAlerts(deviceId: string): Promise<DeviceAlert[]> {
    return apiClient.get<DeviceAlert[]>(`${this.baseUrl}/devices/${deviceId}/alerts`);
  }

  /**
   * Acknowledge alert
   */
  async acknowledgeAlert(deviceId: string, alertId: string): Promise<DeviceAlert> {
    return apiClient.post<DeviceAlert>(
      `${this.baseUrl}/devices/${deviceId}/alerts/${alertId}/acknowledge`
    );
  }

  /**
   * Get firmware information
   */
  async getFirmwareInfo(deviceId: string): Promise<{
    current_version: string;
    latest_version: string;
    update_available: boolean;
  }> {
    return apiClient.get(`${this.baseUrl}/devices/${deviceId}/firmware`);
  }

  /**
   * Update device firmware
   */
  async updateFirmware(deviceId: string, version: string): Promise<{
    message: string;
    update_id: string;
    status: string;
  }> {
    return apiClient.post(`${this.baseUrl}/devices/${deviceId}/firmware`, { version });
  }

  /**
   * Get firmware update status
   */
  async getFirmwareUpdateStatus(deviceId: string, updateId: string): Promise<{
    status: 'pending' | 'downloading' | 'installing' | 'completed' | 'failed';
    progress: number;
    message?: string;
  }> {
    return apiClient.get(`${this.baseUrl}/devices/${deviceId}/firmware/${updateId}/status`);
  }

  /**
   * Reboot device
   */
  async rebootDevice(deviceId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/devices/${deviceId}/reboot`);
  }

  /**
   * Get device statistics
   */
  async getDeviceStatistics(deviceId: string): Promise<{
    uptime: number;
    total_readings: number;
    average_battery_level: number;
    last_maintenance: string;
    data_quality_score: number;
  }> {
    return apiClient.get(`${this.baseUrl}/devices/${deviceId}/statistics`);
  }
}

export default new IoTService();
