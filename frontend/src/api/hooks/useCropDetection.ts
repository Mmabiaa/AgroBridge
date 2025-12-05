/**
 * React Query hooks for crop detection with caching and optimization
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import cropDetectionService, {
  Disease,
  Treatment,
  CropScan,
  CreateScanRequest,
  ScanFeedbackRequest,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  ScanHistory,
} from '../services/cropDetectionService';
import { PaginatedResponse } from '../axiosClient';

// Query keys
export const cropDetectionKeys = {
  all: ['crop-detection'] as const,
  diseases: () => [...cropDetectionKeys.all, 'diseases'] as const,
  diseasesList: (params?: any) => [...cropDetectionKeys.diseases(), 'list', params] as const,
  disease: (id: string) => [...cropDetectionKeys.diseases(), 'detail', id] as const,
  diseaseTreatments: (id: string) => [...cropDetectionKeys.diseases(), id, 'treatments'] as const,
  treatments: () => [...cropDetectionKeys.all, 'treatments'] as const,
  treatmentsList: (params?: any) => [...cropDetectionKeys.treatments(), 'list', params] as const,
  treatment: (id: string) => [...cropDetectionKeys.treatments(), 'detail', id] as const,
  scans: () => [...cropDetectionKeys.all, 'scans'] as const,
  scansList: (params?: any) => [...cropDetectionKeys.scans(), 'list', params] as const,
  scan: (id: string) => [...cropDetectionKeys.scans(), 'detail', id] as const,
  scanHistory: () => [...cropDetectionKeys.scans(), 'history'] as const,
  scanStatistics: () => [...cropDetectionKeys.scans(), 'statistics'] as const,
  supportedCrops: () => [...cropDetectionKeys.all, 'supported-crops'] as const,
  diseaseCategories: () => [...cropDetectionKeys.diseases(), 'categories'] as const,
};

// Diseases hooks
export function useDiseases(params?: {
  page?: number;
  page_size?: number;
  category?: string;
  typical_severity?: string;
  search?: string;
}) {
  return useQuery({
    queryKey: cropDetectionKeys.diseasesList(params),
    queryFn: () => cropDetectionService.getDiseases(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useDisease(diseaseId: string) {
  return useQuery({
    queryKey: cropDetectionKeys.disease(diseaseId),
    queryFn: () => cropDetectionService.getDisease(diseaseId),
    enabled: !!diseaseId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDiseaseTreatments(diseaseId: string) {
  return useQuery({
    queryKey: cropDetectionKeys.diseaseTreatments(diseaseId),
    queryFn: () => cropDetectionService.getDiseaseTreatments(diseaseId),
    enabled: !!diseaseId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useDiseaseCategories() {
  return useQuery({
    queryKey: cropDetectionKeys.diseaseCategories(),
    queryFn: () => cropDetectionService.getDiseaseCategories(),
    staleTime: 30 * 60 * 1000, // 30 minutes
  });
}

export function useSearchDiseases() {
  return useMutation({
    mutationFn: (params: {
      query?: string;
      category?: string;
      crop_type?: string;
      severity?: string;
    }) => cropDetectionService.searchDiseases(params),
  });
}

// Treatments hooks
export function useTreatments(params?: {
  page?: number;
  page_size?: number;
  treatment_type?: string;
  method?: string;
  is_recommended?: boolean;
  requires_expert?: boolean;
  search?: string;
}) {
  return useQuery({
    queryKey: cropDetectionKeys.treatmentsList(params),
    queryFn: () => cropDetectionService.getTreatments(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useTreatment(treatmentId: string) {
  return useQuery({
    queryKey: cropDetectionKeys.treatment(treatmentId),
    queryFn: () => cropDetectionService.getTreatment(treatmentId),
    enabled: !!treatmentId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useTreatmentRecommendations() {
  return useMutation({
    mutationFn: (params: {
      disease_id: string;
      crop_type?: string;
      organic_only?: boolean;
      growth_stage?: string;
      weather_conditions?: string;
    }) => cropDetectionService.getTreatmentRecommendations(params),
  });
}

// Scans hooks
export function useScans(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  crop_type?: string;
  accuracy_rating?: number;
}) {
  return useQuery({
    queryKey: cropDetectionKeys.scansList(params),
    queryFn: () => cropDetectionService.getScans(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useScan(scanId: string) {
  return useQuery({
    queryKey: cropDetectionKeys.scan(scanId),
    queryFn: () => cropDetectionService.getScan(scanId),
    enabled: !!scanId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useCreateScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      onUploadProgress,
    }: {
      data: CreateScanRequest;
      onUploadProgress?: (progressEvent: any) => void;
    }) => cropDetectionService.createScan(data, onUploadProgress),
    onSuccess: () => {
      // Invalidate scans list and statistics
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scans() });
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scanStatistics() });
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scanHistory() });
    },
  });
}

export function useScanFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scanId, feedback }: { scanId: string; feedback: ScanFeedbackRequest }) =>
      cropDetectionService.provideScanFeedback(scanId, feedback),
    onSuccess: (_, { scanId }) => {
      // Invalidate specific scan and scans list
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scan(scanId) });
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scans() });
    },
  });
}

export function useFollowUpScan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      originalScanId,
      data,
      onUploadProgress,
    }: {
      originalScanId: string;
      data: CreateScanRequest;
      onUploadProgress?: (progressEvent: any) => void;
    }) => cropDetectionService.addFollowUpScan(originalScanId, data, onUploadProgress),
    onSuccess: () => {
      // Invalidate scans list and statistics
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scans() });
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scanStatistics() });
      queryClient.invalidateQueries({ queryKey: cropDetectionKeys.scanHistory() });
    },
  });
}

export function useScanHistory() {
  return useQuery({
    queryKey: cropDetectionKeys.scanHistory(),
    queryFn: () => cropDetectionService.getScanHistory(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useScanStatistics() {
  return useQuery({
    queryKey: cropDetectionKeys.scanStatistics(),
    queryFn: () => cropDetectionService.getScanStatistics(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Image analysis hooks
export function useAnalyzeImage() {
  return useMutation({
    mutationFn: ({
      data,
      onUploadProgress,
    }: {
      data: ImageAnalysisRequest;
      onUploadProgress?: (progressEvent: any) => void;
    }) => cropDetectionService.analyzeImage(data, onUploadProgress),
  });
}

export function useSupportedCrops() {
  return useQuery({
    queryKey: cropDetectionKeys.supportedCrops(),
    queryFn: () => cropDetectionService.getSupportedCrops(),
    staleTime: 60 * 60 * 1000, // 1 hour
  });
}

// Expert review hooks (for experts/admins)
export function useExpertReviews(params?: {
  page?: number;
  page_size?: number;
  status?: string;
  ai_accuracy_assessment?: string;
}) {
  return useQuery({
    queryKey: [...cropDetectionKeys.all, 'expert-reviews', params],
    queryFn: () => cropDetectionService.getExpertReviews(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function usePendingReviews() {
  return useQuery({
    queryKey: [...cropDetectionKeys.all, 'expert-reviews', 'pending'],
    queryFn: () => cropDetectionService.getPendingReviews(),
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

export function useCreateExpertReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      scan: string;
      expert_diagnosis?: string;
      confidence_in_ai: number;
      review_comments: string;
      recommendations?: string;
      corrected_health_score?: number;
      ai_accuracy_assessment?: string;
    }) => cropDetectionService.createExpertReview(data),
    onSuccess: () => {
      // Invalidate expert reviews
      queryClient.invalidateQueries({ queryKey: [...cropDetectionKeys.all, 'expert-reviews'] });
    },
  });
}

export function useUpdateExpertReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      data,
    }: {
      reviewId: string;
      data: {
        status?: string;
        expert_diagnosis?: string;
        confidence_in_ai?: number;
        review_comments?: string;
        recommendations?: string;
        corrected_health_score?: number;
        ai_accuracy_assessment?: string;
      };
    }) => cropDetectionService.updateExpertReview(reviewId, data),
    onSuccess: () => {
      // Invalidate expert reviews
      queryClient.invalidateQueries({ queryKey: [...cropDetectionKeys.all, 'expert-reviews'] });
    },
  });
}