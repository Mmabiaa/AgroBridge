/**
 * Learning Platform API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  instructor: {
    id: string;
    name: string;
    avatar?: string;
  };
  thumbnail?: string;
  duration_hours: number;
  lessons_count: number;
  enrolled_count: number;
  rating: number;
  reviews_count: number;
  price: number;
  currency: string;
  is_free: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: string;
  course: string;
  title: string;
  description: string;
  order: number;
  content_type: 'video' | 'text' | 'quiz' | 'assignment';
  content_url?: string;
  duration_minutes: number;
  is_preview: boolean;
  is_completed?: boolean;
  created_at: string;
}

export interface Enrollment {
  id: string;
  user: string;
  course: string;
  course_title: string;
  progress: number;
  completed_lessons: number;
  total_lessons: number;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
  completed_at?: string;
  last_accessed: string;
}

export interface Certificate {
  id: string;
  user: string;
  course: string;
  course_title: string;
  certificate_url: string;
  verification_code: string;
  issued_at: string;
}

export interface CourseListParams {
  page?: number;
  page_size?: number;
  search?: string;
  category?: string;
  level?: string;
  is_free?: boolean;
  ordering?: string;
}

class LearningService {
  private readonly baseUrl = '/learning';

  /**
   * Get list of courses
   */
  async getCourses(params?: CourseListParams): Promise<PaginatedResponse<Course>> {
    return apiClient.getPaginated<Course>(`${this.baseUrl}/courses`, params);
  }

  /**
   * Get course by ID
   */
  async getCourse(courseId: string): Promise<Course> {
    return apiClient.get<Course>(`${this.baseUrl}/courses/${courseId}`);
  }

  /**
   * Enroll in course
   */
  async enrollInCourse(courseId: string): Promise<Enrollment> {
    return apiClient.post<Enrollment>(`${this.baseUrl}/courses/${courseId}/enroll`);
  }

  /**
   * Get user enrollments
   */
  async getEnrollments(): Promise<Enrollment[]> {
    return apiClient.get<Enrollment[]>(`${this.baseUrl}/enrollments`);
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollment(enrollmentId: string): Promise<Enrollment> {
    return apiClient.get<Enrollment>(`${this.baseUrl}/enrollments/${enrollmentId}`);
  }

  /**
   * Get course lessons
   */
  async getLessons(courseId: string): Promise<Lesson[]> {
    return apiClient.get<Lesson[]>(`${this.baseUrl}/courses/${courseId}/lessons`);
  }

  /**
   * Get lesson by ID
   */
  async getLesson(lessonId: string): Promise<Lesson> {
    return apiClient.get<Lesson>(`${this.baseUrl}/lessons/${lessonId}`);
  }

  /**
   * Mark lesson as complete
   */
  async completeLesson(lessonId: string): Promise<{ message: string; progress: number }> {
    return apiClient.post<{ message: string; progress: number }>(
      `${this.baseUrl}/lessons/${lessonId}/complete`
    );
  }

  /**
   * Get user certificates
   */
  async getCertificates(): Promise<Certificate[]> {
    return apiClient.get<Certificate[]>(`${this.baseUrl}/certificates`);
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(certificateId: string): Promise<Certificate> {
    return apiClient.get<Certificate>(`${this.baseUrl}/certificates/${certificateId}`);
  }

  /**
   * Download certificate
   */
  async downloadCertificate(certificateId: string): Promise<void> {
    return apiClient.downloadFile(
      `${this.baseUrl}/certificates/${certificateId}/download`,
      `certificate-${certificateId}.pdf`
    );
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(verificationCode: string): Promise<{
    valid: boolean;
    certificate?: Certificate;
    message: string;
  }> {
    return apiClient.post(`${this.baseUrl}/certificates/verify`, { verification_code: verificationCode });
  }

  /**
   * Get course categories
   */
  async getCategories(): Promise<string[]> {
    return apiClient.get<string[]>(`${this.baseUrl}/categories`);
  }

  /**
   * Get recommended courses
   */
  async getRecommendedCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>(`${this.baseUrl}/courses/recommended`);
  }

  /**
   * Get popular courses
   */
  async getPopularCourses(): Promise<Course[]> {
    return apiClient.get<Course[]>(`${this.baseUrl}/courses/popular`);
  }
}

export default new LearningService();
