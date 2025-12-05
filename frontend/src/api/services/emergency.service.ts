/**
 * Emergency Response API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface EmergencyAlert {
  id: string;
  user: string;
  alert_type: 'fire' | 'flood' | 'drought' | 'pest_outbreak' | 'disease_outbreak' | 'theft' | 'accident' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  affected_area?: number;
  status: 'active' | 'responding' | 'resolved' | 'closed';
  images?: string[];
  contact_info?: {
    phone: string;
    email: string;
  };
  created_at: string;
  updated_at: string;
  resolved_at?: string;
}

export interface Incident {
  id: string;
  alert_id?: string;
  reporter: {
    id: string;
    name: string;
  };
  incident_type: string;
  title: string;
  description: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'responding' | 'resolved';
  images?: string[];
  videos?: string[];
  casualties?: number;
  property_damage?: string;
  responses: IncidentResponse[];
  created_at: string;
  updated_at: string;
}

export interface IncidentResponse {
  id: string;
  incident_id: string;
  responder: {
    id: string;
    name: string;
    role: string;
  };
  response_type: 'assessment' | 'assistance' | 'resolution' | 'update';
  message: string;
  images?: string[];
  created_at: string;
}

export interface EmergencyResource {
  id: string;
  name: string;
  type: 'hospital' | 'fire_station' | 'police_station' | 'veterinary' | 'agricultural_office' | 'ngo' | 'other';
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  availability: '24/7' | 'business_hours' | 'on_call';
  services: string[];
  distance?: number;
}

export interface CreateAlertRequest {
  alert_type: EmergencyAlert['alert_type'];
  severity: EmergencyAlert['severity'];
  title: string;
  description: string;
  location: EmergencyAlert['location'];
  affected_area?: number;
  images?: File[];
  contact_info?: EmergencyAlert['contact_info'];
}

export interface CreateIncidentRequest {
  alert_id?: string;
  incident_type: string;
  title: string;
  description: string;
  location: Incident['location'];
  severity: Incident['severity'];
  images?: File[];
  videos?: File[];
  casualties?: number;
  property_damage?: string;
}

export interface AlertListParams {
  page?: number;
  page_size?: number;
  alert_type?: string;
  severity?: string;
  status?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  ordering?: string;
}

class EmergencyService {
  private readonly baseUrl = '/emergency';

  /**
   * Get list of alerts
   */
  async getAlerts(params?: AlertListParams): Promise<PaginatedResponse<EmergencyAlert>> {
    return apiClient.getPaginated<EmergencyAlert>(`${this.baseUrl}/alerts`, params);
  }

  /**
   * Get alert by ID
   */
  async getAlert(alertId: string): Promise<EmergencyAlert> {
    return apiClient.get<EmergencyAlert>(`${this.baseUrl}/alerts/${alertId}`);
  }

  /**
   * Create emergency alert
   */
  async createAlert(data: CreateAlertRequest): Promise<EmergencyAlert> {
    // Handle file uploads
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          value.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
          });
        } else if (key === 'location' || key === 'contact_info') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return apiClient.post<EmergencyAlert>(`${this.baseUrl}/alerts`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post<EmergencyAlert>(`${this.baseUrl}/alerts`, data);
  }

  /**
   * Update alert
   */
  async updateAlert(alertId: string, data: Partial<CreateAlertRequest>): Promise<EmergencyAlert> {
    return apiClient.patch<EmergencyAlert>(`${this.baseUrl}/alerts/${alertId}`, data);
  }

  /**
   * Close alert
   */
  async closeAlert(alertId: string, resolution_notes?: string): Promise<EmergencyAlert> {
    return apiClient.post<EmergencyAlert>(
      `${this.baseUrl}/alerts/${alertId}/close`,
      { resolution_notes }
    );
  }

  /**
   * Get list of incidents
   */
  async getIncidents(params?: {
    page?: number;
    page_size?: number;
    incident_type?: string;
    severity?: string;
    status?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<Incident>> {
    return apiClient.getPaginated<Incident>(`${this.baseUrl}/incidents`, params);
  }

  /**
   * Get incident by ID
   */
  async getIncident(incidentId: string): Promise<Incident> {
    return apiClient.get<Incident>(`${this.baseUrl}/incidents/${incidentId}`);
  }

  /**
   * Report incident
   */
  async reportIncident(data: CreateIncidentRequest): Promise<Incident> {
    // Handle file uploads
    if ((data.images && data.images.length > 0) || (data.videos && data.videos.length > 0)) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'images' && Array.isArray(value)) {
          value.forEach((file, index) => {
            formData.append(`images[${index}]`, file);
          });
        } else if (key === 'videos' && Array.isArray(value)) {
          value.forEach((file, index) => {
            formData.append(`videos[${index}]`, file);
          });
        } else if (key === 'location') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return apiClient.post<Incident>(`${this.baseUrl}/incidents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post<Incident>(`${this.baseUrl}/incidents`, data);
  }

  /**
   * Respond to incident
   */
  async respondToIncident(incidentId: string, data: {
    response_type: IncidentResponse['response_type'];
    message: string;
    images?: File[];
  }): Promise<IncidentResponse> {
    if (data.images && data.images.length > 0) {
      const formData = new FormData();
      formData.append('response_type', data.response_type);
      formData.append('message', data.message);
      data.images.forEach((file, index) => {
        formData.append(`images[${index}]`, file);
      });

      return apiClient.post<IncidentResponse>(
        `${this.baseUrl}/incidents/${incidentId}/respond`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
    }

    return apiClient.post<IncidentResponse>(
      `${this.baseUrl}/incidents/${incidentId}/respond`,
      data
    );
  }

  /**
   * Get emergency resources
   */
  async getResources(params?: {
    latitude?: number;
    longitude?: number;
    radius?: number;
    type?: string;
  }): Promise<EmergencyResource[]> {
    return apiClient.get<EmergencyResource[]>(`${this.baseUrl}/resources`, { params });
  }

  /**
   * Get resource by ID
   */
  async getResource(resourceId: string): Promise<EmergencyResource> {
    return apiClient.get<EmergencyResource>(`${this.baseUrl}/resources/${resourceId}`);
  }

  /**
   * Get nearby resources
   */
  async getNearbyResources(latitude: number, longitude: number, radius: number = 50): Promise<EmergencyResource[]> {
    return apiClient.get<EmergencyResource[]>(`${this.baseUrl}/resources/nearby`, {
      params: { latitude, longitude, radius },
    });
  }

  /**
   * Get emergency statistics
   */
  async getStatistics(): Promise<{
    active_alerts: number;
    total_incidents: number;
    resolved_incidents: number;
    alerts_by_type: Record<string, number>;
    alerts_by_severity: Record<string, number>;
    recent_alerts: EmergencyAlert[];
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * Get emergency hotlines
   */
  async getHotlines(): Promise<Array<{
    name: string;
    phone: string;
    description: string;
    availability: string;
  }>> {
    return apiClient.get(`${this.baseUrl}/hotlines`);
  }
}

export default new EmergencyService();
