/**
 * Crop Detection API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Disease {
  id: string;
  name: string;
  scientific_name: string;
  common_names: string[];
  category: string;
  description: string;
  symptoms: string;
  visual_indicators: string[];
  affected_crops: string[];
  typical_severity: string;
  spread_rate: string;
  seasonal_pattern: string;
  favorable_conditions: Record<string, any>;
  prevention_methods: string;
  organic_treatments: string;
  chemical_treatments: string;
  reference_images: string[];
  external_links: string[];
  confidence_threshold: number;
  is_active: boolean;
  treatments_count: number;
  created_at: string;
  updated_at: string;
}

export interface Treatment {
  id: string;
  disease: string;
  disease_name: string;
  name: string;
  treatment_type: string;
  method: string;
  description: string;
  detailed_instructions: string;
  application_method: string;
  timing: string;
  frequency: string;
  duration: string;
  materials_needed: string[];
  dosage_instructions: string;
  effectiveness_rating: number;
  safety_precautions: string;
  environmental_impact: string;
  estimated_cost: string;
  availability: string;
  suitable_crops: string[];
  weather_conditions: string;
  growth_stage: string;
  expected_results: string;
  success_indicators: string[];
  is_recommended: boolean;
  requires_expert: boolean;
  created_at: string;
  updated_at: string;
}

export interface CropScan {
  id: string;
  user: string;
  user_name: string;
  image: string;
  image_metadata: Record<string, any>;
  crop_type: string;
  crop_variety: string;
  growth_stage: string;
  location_data: Record<string, any>;
  environmental_conditions: Record<string, any>;
  status: string;
  detected_diseases: Array<{
    disease_id: string;
    disease_name: string;
    confidence_score: number;
    affected_area_percentage: number;
    severity: string;
    location_in_image: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }>;
  health_score: number;
  model_version: string;
  processing_time_ms: number;
  confidence_scores: Record<string, number>;
  recommended_treatments: Treatment[];
  ai_recommendations: Array<{
    type: string;
    priority: string;
    title: string;
    description: string;
    actions: string[];
  }>;
  user_confirmed_disease?: string;
  user_feedback: string;
  accuracy_rating?: number;
  treatment_applied: any[];
  error_message: string;
  created_at: string;
  completed_at?: string;
  primary_disease?: {
    id: string;
    name: string;
    category: string;
    typical_severity: string;
  };
}

export interface CreateScanRequest {
  image: File;
  crop_type?: string;
  crop_variety?: string;
  growth_stage?: string;
  location_data?: Record<string, any>;
  environmental_conditions?: Record<string, any>;
}

export interface ScanFeedbackRequest {
  user_confirmed_disease?: string;
  user_feedback?: string;
  accuracy_rating?: number;
  treatment_applied?: any[];
}

export interface ScanHistory {
  user: string;
  user_name: string;
  total_scans: number;
  successful_scans: number;
  failed_scans: number;
  diseases_detected: Record<string, number>;
  most_common_disease?: string;
  most_common_disease_name?: string;
  crops_scanned: Record<string, number>;
  average_accuracy_rating?: number;
  total_feedback_count: number;
  average_health_score?: number;
  health_trend: string;
  first_scan_date?: string;
  last_scan_date?: string;
  updated_at: string;
}

export interface ImageAnalysisRequest {
  image: File;
  crop_type?: string;
  location?: Record<string, any>;
}

export interface ImageAnalysisResponse {
  success: boolean;
  crop_type: string;
  health_score: number;
  detected_diseases: CropScan['detected_diseases'];
  recommendations: CropScan['ai_recommendations'];
  confidence_scores: Record<string, number>;
  image_info: Record<string, any>;
  model_version: string;
  processing_time_ms: number;
}

class CropDetectionService {
  private readonly baseUrl = '/crop-detection';

  /**
   * Get list of diseases
   */
  async getDiseases(params?: {
    page?: number;
    page_size?: number;
    category?: string;
    typical_severity?: string;
    search?: string;
  }): Promise<PaginatedResponse<Disease>> {
    return apiClient.getPaginated<Disease>(`${this.baseUrl}/diseases/`, params);
  }

  /**
   * Get disease by ID
   */
  async getDisease(diseaseId: string): Promise<Disease> {
    return apiClient.get<Disease>(`${this.baseUrl}/diseases/${diseaseId}/`);
  }

  /**
   * Search diseases
   */
  async searchDiseases(params: {
    query?: string;
    category?: string;
    crop_type?: string;
    severity?: string;
  }): Promise<Disease[]> {
    return apiClient.get<Disease[]>(`${this.baseUrl}/diseases/search/`, { params });
  }

  /**
   * Get disease categories
   */
  async getDiseaseCategories(): Promise<Array<{ category: string; count: number }>> {
    return apiClient.get<Array<{ category: string; count: number }>>(
      `${this.baseUrl}/diseases/categories/`
    );
  }

  /**
   * Get treatments for a disease
   */
  async getDiseaseTreatments(diseaseId: string): Promise<Treatment[]> {
    return apiClient.get<Treatment[]>(`${this.baseUrl}/diseases/${diseaseId}/treatments/`);
  }

  /**
   * Get list of treatments
   */
  async getTreatments(params?: {
    page?: number;
    page_size?: number;
    treatment_type?: string;
    method?: string;
    is_recommended?: boolean;
    requires_expert?: boolean;
    search?: string;
  }): Promise<PaginatedResponse<Treatment>> {
    return apiClient.getPaginated<Treatment>(`${this.baseUrl}/treatments/`, params);
  }

  /**
   * Get treatment by ID
   */
  async getTreatment(treatmentId: string): Promise<Treatment> {
    return apiClient.get<Treatment>(`${this.baseUrl}/treatments/${treatmentId}/`);
  }

  /**
   * Get treatment recommendations
   */
  async getTreatmentRecommendations(params: {
    disease_id: string;
    crop_type?: string;
    organic_only?: boolean;
    growth_stage?: string;
    weather_conditions?: string;
  }): Promise<{
    disease: Disease;
    treatments: Treatment[];
    filters_applied: Record<string, any>;
  }> {
    return apiClient.post<{
      disease: Disease;
      treatments: Treatment[];
      filters_applied: Record<string, any>;
    }>(`${this.baseUrl}/treatments/recommend/`, params);
  }

  /**
   * Get list of scans
   */
  async getScans(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    crop_type?: string;
    accuracy_rating?: number;
  }): Promise<PaginatedResponse<CropScan>> {
    return apiClient.getPaginated<CropScan>(`${this.baseUrl}/scans/`, params);
  }

  /**
   * Get scan by ID
   */
  async getScan(scanId: string): Promise<CropScan> {
    return apiClient.get<CropScan>(`${this.baseUrl}/scans/${scanId}/`);
  }

  /**
   * Create new scan
   */
  async createScan(
    data: CreateScanRequest,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<CropScan> {
    const formData = new FormData();
    formData.append('image', data.image);
    
    if (data.crop_type) {
      formData.append('crop_type', data.crop_type);
    }
    
    if (data.crop_variety) {
      formData.append('crop_variety', data.crop_variety);
    }
    
    if (data.growth_stage) {
      formData.append('growth_stage', data.growth_stage);
    }
    
    if (data.location_data) {
      formData.append('location_data', JSON.stringify(data.location_data));
    }
    
    if (data.environmental_conditions) {
      formData.append('environmental_conditions', JSON.stringify(data.environmental_conditions));
    }

    return apiClient.post<CropScan>(`${this.baseUrl}/scans/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  }

  /**
   * Provide feedback on scan
   */
  async provideScanFeedback(scanId: string, feedback: ScanFeedbackRequest): Promise<{ message: string }> {
    return apiClient.post<{ message: string }>(`${this.baseUrl}/scans/${scanId}/feedback/`, feedback);
  }

  /**
   * Add follow-up scan
   */
  async addFollowUpScan(
    originalScanId: string,
    data: CreateScanRequest,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<CropScan> {
    const formData = new FormData();
    formData.append('image', data.image);
    
    if (data.crop_type) {
      formData.append('crop_type', data.crop_type);
    }
    
    if (data.crop_variety) {
      formData.append('crop_variety', data.crop_variety);
    }
    
    if (data.growth_stage) {
      formData.append('growth_stage', data.growth_stage);
    }
    
    if (data.location_data) {
      formData.append('location_data', JSON.stringify(data.location_data));
    }
    
    if (data.environmental_conditions) {
      formData.append('environmental_conditions', JSON.stringify(data.environmental_conditions));
    }

    return apiClient.post<CropScan>(`${this.baseUrl}/scans/${originalScanId}/add_follow_up/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  }

  /**
   * Get scan statistics
   */
  async getScanStatistics(): Promise<{
    total_scans: number;
    successful_scans: number;
    failed_scans: number;
    success_rate: number;
    average_health_score?: number;
    average_rating?: number;
    crop_distribution: Array<{ crop_type: string; count: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/scans/statistics/`);
  }

  /**
   * Analyze image without saving scan
   */
  async analyzeImage(
    data: ImageAnalysisRequest,
    onUploadProgress?: (progressEvent: any) => void
  ): Promise<ImageAnalysisResponse> {
    const formData = new FormData();
    formData.append('image', data.image);
    
    if (data.crop_type) {
      formData.append('crop_type', data.crop_type);
    }
    
    if (data.location) {
      formData.append('location', JSON.stringify(data.location));
    }

    return apiClient.post<ImageAnalysisResponse>(`${this.baseUrl}/analysis/analyze/`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  }

  /**
   * Get supported crop types
   */
  async getSupportedCrops(): Promise<{ supported_crops: string[] }> {
    return apiClient.get<{ supported_crops: string[] }>(`${this.baseUrl}/analysis/supported_crops/`);
  }

  /**
   * Get scan history
   */
  async getScanHistory(): Promise<ScanHistory> {
    return apiClient.get<ScanHistory>(`${this.baseUrl}/history/summary/`);
  }

  /**
   * Get expert reviews (for experts/admins)
   */
  async getExpertReviews(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    ai_accuracy_assessment?: string;
  }): Promise<PaginatedResponse<{
    id: string;
    scan: string;
    scan_info: {
      id: string;
      crop_type: string;
      user: string;
      created_at: string;
    };
    reviewer: string;
    reviewer_name: string;
    status: string;
    expert_diagnosis?: string;
    expert_diagnosis_name?: string;
    confidence_in_ai: number;
    review_comments: string;
    recommendations: string;
    corrected_health_score?: number;
    ai_accuracy_assessment: string;
    created_at: string;
    reviewed_at: string;
  }>> {
    return apiClient.getPaginated(`${this.baseUrl}/reviews/`, params);
  }

  /**
   * Get pending reviews (for experts/admins)
   */
  async getPendingReviews(): Promise<Array<{
    id: string;
    scan: string;
    scan_info: {
      id: string;
      crop_type: string;
      user: string;
      created_at: string;
    };
    reviewer: string;
    reviewer_name: string;
    status: string;
    created_at: string;
  }>> {
    return apiClient.get(`${this.baseUrl}/reviews/pending/`);
  }

  /**
   * Create expert review
   */
  async createExpertReview(data: {
    scan: string;
    expert_diagnosis?: string;
    confidence_in_ai: number;
    review_comments: string;
    recommendations?: string;
    corrected_health_score?: number;
    ai_accuracy_assessment?: string;
  }): Promise<{
    id: string;
    scan: string;
    status: string;
    expert_diagnosis?: string;
    confidence_in_ai: number;
    review_comments: string;
    recommendations: string;
    corrected_health_score?: number;
    ai_accuracy_assessment: string;
    created_at: string;
  }> {
    return apiClient.post(`${this.baseUrl}/reviews/`, data);
  }

  /**
   * Update expert review
   */
  async updateExpertReview(reviewId: string, data: {
    status?: string;
    expert_diagnosis?: string;
    confidence_in_ai?: number;
    review_comments?: string;
    recommendations?: string;
    corrected_health_score?: number;
    ai_accuracy_assessment?: string;
  }): Promise<{
    id: string;
    scan: string;
    status: string;
    expert_diagnosis?: string;
    confidence_in_ai: number;
    review_comments: string;
    recommendations: string;
    corrected_health_score?: number;
    ai_accuracy_assessment: string;
    created_at: string;
    reviewed_at: string;
  }> {
    return apiClient.patch(`${this.baseUrl}/reviews/${reviewId}/`, data);
  }
}

export default new CropDetectionService();