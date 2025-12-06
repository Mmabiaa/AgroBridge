/**
 * React Query hooks for Learning Platform
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import learningService, {
  Course,
  Lesson,
  Enrollment,
  Certificate,
  CourseListParams,
} from '../services/learning.service';

// Query keys for cache management
export const learningKeys = {
  all: ['learning'] as const,
  courses: () => [...learningKeys.all, 'courses'] as const,
  coursesList: (params?: CourseListParams) => [...learningKeys.courses(), 'list', params] as const,
  course: (id: string) => [...learningKeys.courses(), 'detail', id] as const,
  lessons: (courseId: string) => [...learningKeys.all, 'lessons', courseId] as const,
  lesson: (id: string) => [...learningKeys.all, 'lesson', id] as const,
  enrollments: () => [...learningKeys.all, 'enrollments'] as const,
  enrollment: (id: string) => [...learningKeys.enrollments(), id] as const,
  certificates: () => [...learningKeys.all, 'certificates'] as const,
  certificate: (id: string) => [...learningKeys.certificates(), id] as const,
  categories: () => [...learningKeys.all, 'categories'] as const,
  recommended: () => [...learningKeys.courses(), 'recommended'] as const,
  popular: () => [...learningKeys.courses(), 'popular'] as const,
};

/**
 * Get list of courses with pagination and filters
 */
export function useCourses(params?: CourseListParams) {
  return useQuery({
    queryKey: learningKeys.coursesList(params),
    queryFn: () => learningService.getCourses(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get course by ID
 */
export function useCourse(courseId: string) {
  return useQuery({
    queryKey: learningKeys.course(courseId),
    queryFn: () => learningService.getCourse(courseId),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Get course lessons
 */
export function useLessons(courseId: string) {
  return useQuery({
    queryKey: learningKeys.lessons(courseId),
    queryFn: () => learningService.getLessons(courseId),
    enabled: !!courseId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get lesson by ID
 */
export function useLesson(lessonId: string) {
  return useQuery({
    queryKey: learningKeys.lesson(lessonId),
    queryFn: () => learningService.getLesson(lessonId),
    enabled: !!lessonId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get user enrollments
 */
export function useEnrollments() {
  return useQuery({
    queryKey: learningKeys.enrollments(),
    queryFn: () => learningService.getEnrollments(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get enrollment by ID
 */
export function useEnrollment(enrollmentId: string) {
  return useQuery({
    queryKey: learningKeys.enrollment(enrollmentId),
    queryFn: () => learningService.getEnrollment(enrollmentId),
    enabled: !!enrollmentId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get user certificates
 */
export function useCertificates() {
  return useQuery({
    queryKey: learningKeys.certificates(),
    queryFn: () => learningService.getCertificates(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get certificate by ID
 */
export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: learningKeys.certificate(certificateId),
    queryFn: () => learningService.getCertificate(certificateId),
    enabled: !!certificateId,
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get course categories
 */
export function useCategories() {
  return useQuery({
    queryKey: learningKeys.categories(),
    queryFn: () => learningService.getCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes - categories don't change often
  });
}

/**
 * Get recommended courses
 */
export function useRecommendedCourses() {
  return useQuery({
    queryKey: learningKeys.recommended(),
    queryFn: () => learningService.getRecommendedCourses(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Get popular courses
 */
export function usePopularCourses() {
  return useQuery({
    queryKey: learningKeys.popular(),
    queryFn: () => learningService.getPopularCourses(),
    staleTime: 10 * 60 * 1000,
  });
}

/**
 * Enroll in course mutation
 */
export function useEnrollInCourse() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => learningService.enrollInCourse(courseId),
    onSuccess: (data, courseId) => {
      // Invalidate enrollments list
      queryClient.invalidateQueries({ queryKey: learningKeys.enrollments() });
      // Invalidate course details to update enrollment status
      queryClient.invalidateQueries({ queryKey: learningKeys.course(courseId) });
    },
  });
}

/**
 * Complete lesson mutation
 */
export function useCompleteLesson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (lessonId: string) => learningService.completeLesson(lessonId),
    onSuccess: (data, lessonId) => {
      // Invalidate lesson to update completion status
      queryClient.invalidateQueries({ queryKey: learningKeys.lesson(lessonId) });
      // Invalidate enrollments to update progress
      queryClient.invalidateQueries({ queryKey: learningKeys.enrollments() });
    },
  });
}

/**
 * Download certificate mutation
 */
export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (certificateId: string) => learningService.downloadCertificate(certificateId),
  });
}

/**
 * Verify certificate mutation
 */
export function useVerifyCertificate() {
  return useMutation({
    mutationFn: (verificationCode: string) => learningService.verifyCertificate(verificationCode),
  });
}
