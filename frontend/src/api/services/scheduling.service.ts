/**
 * Task Scheduling API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Task {
  id: string;
  user: string;
  farm?: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  category: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    end_date?: string;
  };
  reminders?: Array<{
    time: string;
    sent: boolean;
  }>;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'task' | 'event' | 'reminder';
  priority?: string;
  status?: string;
}

export interface TaskSuggestion {
  id: string;
  title: string;
  description: string;
  suggested_date: string;
  priority: string;
  category: string;
  reason: string;
  confidence: number;
}

export interface CreateTaskRequest {
  farm?: string;
  title: string;
  description?: string;
  due_date: string;
  due_time?: string;
  priority: 'low' | 'medium' | 'high';
  category: string;
  recurrence?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    end_date?: string;
  };
  reminders?: string[];
}

export interface TaskListParams {
  page?: number;
  page_size?: number;
  status?: string;
  priority?: string;
  category?: string;
  farm?: string;
  start_date?: string;
  end_date?: string;
  ordering?: string;
}

class SchedulingService {
  private readonly baseUrl = '/scheduling';

  /**
   * Get list of tasks
   */
  async getTasks(params?: TaskListParams): Promise<PaginatedResponse<Task>> {
    return apiClient.getPaginated<Task>(`${this.baseUrl}/tasks/`, params);
  }

  /**
   * Get task by ID
   */
  async getTask(taskId: string): Promise<Task> {
    return apiClient.get<Task>(`${this.baseUrl}/tasks/${taskId}/`);
  }

  /**
   * Create task
   */
  async createTask(data: CreateTaskRequest): Promise<Task> {
    return apiClient.post<Task>(`${this.baseUrl}/tasks/`, data);
  }

  /**
   * Update task
   */
  async updateTask(taskId: string, data: Partial<CreateTaskRequest>): Promise<Task> {
    return apiClient.patch<Task>(`${this.baseUrl}/tasks/${taskId}/`, data);
  }

  /**
   * Delete task
   */
  async deleteTask(taskId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/tasks/${taskId}/`);
  }

  /**
   * Mark task as complete
   */
  async completeTask(taskId: string): Promise<Task> {
    return apiClient.post<Task>(`${this.baseUrl}/tasks/${taskId}/complete/`);
  }

  /**
   * Snooze task
   */
  async snoozeTask(taskId: string, snooze_until: string): Promise<Task> {
    return apiClient.post<Task>(`${this.baseUrl}/tasks/${taskId}/snooze/`, { snooze_until });
  }

  /**
   * Get calendar events
   */
  async getCalendar(params?: {
    start_date?: string;
    end_date?: string;
    view?: 'month' | 'week' | 'day';
  }): Promise<CalendarEvent[]> {
    return apiClient.get<CalendarEvent[]>(`${this.baseUrl}/calendar/`, { params });
  }

  /**
   * Get AI task suggestions
   */
  async getSuggestions(): Promise<TaskSuggestion[]> {
    return apiClient.get<TaskSuggestion[]>(`${this.baseUrl}/suggestions/`);
  }

  /**
   * Accept task suggestion
   */
  async acceptSuggestion(suggestionId: string): Promise<Task> {
    return apiClient.post<Task>(`${this.baseUrl}/suggestions/${suggestionId}/accept/`);
  }

  /**
   * Dismiss task suggestion
   */
  async dismissSuggestion(suggestionId: string): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(
      `${this.baseUrl}/suggestions/${suggestionId}/dismiss/`
    );
  }

  /**
   * Get task categories
   */
  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>(`${this.baseUrl}/categories/`);
  }

  /**
   * Get upcoming tasks
   */
  async getUpcomingTasks(days?: number): Promise<Task[]> {
    return apiClient.get<Task[]>(`${this.baseUrl}/tasks/upcoming/`, {
      params: { days: days || 7 },
    });
  }

  /**
   * Get overdue tasks
   */
  async getOverdueTasks(): Promise<Task[]> {
    return apiClient.get<Task[]>(`${this.baseUrl}/tasks/overdue/`);
  }

  /**
   * Get task statistics
   */
  async getStatistics(): Promise<{
    total_tasks: number;
    completed_tasks: number;
    pending_tasks: number;
    overdue_tasks: number;
    completion_rate: number;
    tasks_by_priority: Record<string, number>;
    tasks_by_category: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics/`);
  }
}

export default new SchedulingService();
