/**
 * Admin Panel API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface AdminUser {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_active: boolean;
  is_verified: boolean;
  date_joined: string;
  last_login?: string;
  farms_count?: number;
  products_count?: number;
  orders_count?: number;
}

export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  services: Array<{
    name: string;
    status: 'up' | 'down' | 'degraded';
    response_time: number;
    last_checked: string;
    error_message?: string;
  }>;
  database: {
    status: 'connected' | 'disconnected';
    connections: number;
    max_connections: number;
  };
  cache: {
    status: 'connected' | 'disconnected';
    hit_rate: number;
    memory_usage: number;
  };
  storage: {
    total_space: number;
    used_space: number;
    available_space: number;
  };
}

export interface SystemMetrics {
  users: {
    total: number;
    active: number;
    new_today: number;
    new_this_week: number;
    new_this_month: number;
    by_role: Record<string, number>;
  };
  farms: {
    total: number;
    active: number;
    by_type: Record<string, number>;
  };
  marketplace: {
    total_products: number;
    active_products: number;
    total_orders: number;
    pending_orders: number;
    total_revenue: number;
  };
  iot: {
    total_devices: number;
    online_devices: number;
    offline_devices: number;
    total_readings_today: number;
  };
  performance: {
    avg_response_time: number;
    requests_per_minute: number;
    error_rate: number;
    uptime_percentage: number;
  };
}

export interface AuditLog {
  id: string;
  user: {
    id: string;
    username: string;
  };
  action: string;
  resource_type: string;
  resource_id?: string;
  changes?: Record<string, any>;
  ip_address: string;
  user_agent: string;
  timestamp: string;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  search?: string;
  role?: string;
  is_active?: boolean;
  is_verified?: boolean;
  ordering?: string;
}

export interface AuditLogParams {
  page?: number;
  page_size?: number;
  user_id?: string;
  action?: string;
  resource_type?: string;
  start_date?: string;
  end_date?: string;
  ordering?: string;
}

class AdminService {
  private readonly baseUrl = '/admin';

  /**
   * Get list of users
   */
  async getUsers(params?: UserListParams): Promise<PaginatedResponse<AdminUser>> {
    return apiClient.getPaginated<AdminUser>(`${this.baseUrl}/users`, params);
  }

  /**
   * Get user by ID
   */
  async getUser(userId: string): Promise<AdminUser> {
    return apiClient.get<AdminUser>(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * Update user
   */
  async updateUser(userId: string, data: Partial<AdminUser>): Promise<AdminUser> {
    return apiClient.patch<AdminUser>(`${this.baseUrl}/users/${userId}`, data);
  }

  /**
   * Suspend user
   */
  async suspendUser(userId: string, reason: string, duration?: number): Promise<{
    message: string;
    suspended_until?: string;
  }> {
    return apiClient.post(`${this.baseUrl}/users/${userId}/suspend`, {
      reason,
      duration,
    });
  }

  /**
   * Activate user
   */
  async activateUser(userId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/users/${userId}/activate`);
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/users/${userId}`);
  }

  /**
   * Verify user
   */
  async verifyUser(userId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/users/${userId}/verify`);
  }

  /**
   * Reset user password
   */
  async resetUserPassword(userId: string): Promise<{
    message: string;
    temporary_password: string;
  }> {
    return apiClient.post(`${this.baseUrl}/users/${userId}/reset-password`);
  }

  /**
   * Get system health
   */
  async getSystemHealth(): Promise<SystemHealth> {
    return apiClient.get<SystemHealth>(`${this.baseUrl}/system/health`);
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<SystemMetrics> {
    return apiClient.get<SystemMetrics>(`${this.baseUrl}/system/metrics`, { params });
  }

  /**
   * Get audit trail
   */
  async getAuditTrail(params?: AuditLogParams): Promise<PaginatedResponse<AuditLog>> {
    return apiClient.getPaginated<AuditLog>(`${this.baseUrl}/audit-trail`, params);
  }

  /**
   * Export audit logs
   */
  async exportAuditLogs(params?: {
    start_date?: string;
    end_date?: string;
    format?: 'csv' | 'excel';
  }): Promise<void> {
    const format = params?.format || 'csv';
    return apiClient.downloadFile(
      `${this.baseUrl}/audit-trail/export`,
      `audit-logs-${new Date().toISOString().split('T')[0]}.${format}`
    );
  }

  /**
   * Moderate content
   */
  async moderateContent(data: {
    content_type: 'post' | 'comment' | 'product' | 'review';
    content_id: string;
    action: 'approve' | 'reject' | 'flag' | 'remove';
    reason?: string;
  }): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/content/moderate`, data);
  }

  /**
   * Get flagged content
   */
  async getFlaggedContent(params?: {
    page?: number;
    page_size?: number;
    content_type?: string;
    status?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    content_type: string;
    content_id: string;
    content_preview: string;
    reporter: {
      id: string;
      username: string;
    };
    reason: string;
    status: 'pending' | 'reviewed' | 'resolved';
    created_at: string;
  }>> {
    return apiClient.getPaginated(`${this.baseUrl}/content/flagged`, params);
  }

  /**
   * Get system settings
   */
  async getSettings(): Promise<Record<string, any>> {
    return apiClient.get(`${this.baseUrl}/settings`);
  }

  /**
   * Update system settings
   */
  async updateSettings(settings: Record<string, any>): Promise<{
    message: string;
    settings: Record<string, any>;
  }> {
    return apiClient.put(`${this.baseUrl}/settings`, settings);
  }

  /**
   * Send system notification
   */
  async sendSystemNotification(data: {
    title: string;
    message: string;
    target: 'all' | 'role' | 'user';
    target_value?: string;
    priority: 'low' | 'medium' | 'high';
  }): Promise<{ message: string; sent_count: number }> {
    return apiClient.post(`${this.baseUrl}/notifications/send`, data);
  }

  /**
   * Get system logs
   */
  async getSystemLogs(params?: {
    page?: number;
    page_size?: number;
    level?: 'debug' | 'info' | 'warning' | 'error' | 'critical';
    start_date?: string;
    end_date?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    level: string;
    message: string;
    source: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>> {
    return apiClient.getPaginated(`${this.baseUrl}/logs`, params);
  }

  /**
   * Clear cache
   */
  async clearCache(cache_type?: 'all' | 'query' | 'session' | 'static'): Promise<{
    message: string;
    cleared_items: number;
  }> {
    return apiClient.post(`${this.baseUrl}/cache/clear`, { cache_type: cache_type || 'all' });
  }

  /**
   * Run database maintenance
   */
  async runDatabaseMaintenance(): Promise<{
    message: string;
    tasks_completed: string[];
  }> {
    return apiClient.post(`${this.baseUrl}/database/maintenance`);
  }

  /**
   * Get backup status
   */
  async getBackupStatus(): Promise<{
    last_backup: string;
    next_scheduled_backup: string;
    backup_size: number;
    status: 'success' | 'failed' | 'in_progress';
  }> {
    return apiClient.get(`${this.baseUrl}/backup/status`);
  }

  /**
   * Create backup
   */
  async createBackup(): Promise<{
    message: string;
    backup_id: string;
    status: string;
  }> {
    return apiClient.post(`${this.baseUrl}/backup/create`);
  }
}

export default new AdminService();
