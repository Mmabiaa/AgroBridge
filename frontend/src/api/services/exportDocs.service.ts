/**
 * Export Documentation API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface ExportDocument {
  id: string;
  user: string;
  document_type: 'phytosanitary' | 'certificate_of_origin' | 'commercial_invoice' | 'packing_list' | 'bill_of_lading';
  document_number: string;
  product_details: {
    product_id: string;
    product_name: string;
    quantity: number;
    unit: string;
    value: number;
    currency: string;
  };
  shipment_details: {
    origin_country: string;
    destination_country: string;
    port_of_loading: string;
    port_of_discharge: string;
    shipping_date: string;
    estimated_arrival: string;
  };
  status: 'draft' | 'pending_approval' | 'approved' | 'issued' | 'rejected';
  document_url?: string;
  verification_code: string;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
  issued_at?: string;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  document_type: string;
  description: string;
  required_fields: string[];
  optional_fields: string[];
  is_active: boolean;
}

export interface GenerateDocumentRequest {
  document_type: ExportDocument['document_type'];
  template_id?: string;
  product_details: ExportDocument['product_details'];
  shipment_details: ExportDocument['shipment_details'];
  additional_info?: Record<string, any>;
}

export interface DocumentListParams {
  page?: number;
  page_size?: number;
  document_type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  ordering?: string;
}

class ExportDocsService {
  private readonly baseUrl = '/export-docs';

  /**
   * Get list of documents
   */
  async getDocuments(params?: DocumentListParams): Promise<PaginatedResponse<ExportDocument>> {
    return apiClient.getPaginated<ExportDocument>(`${this.baseUrl}/documents`, params);
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<ExportDocument> {
    return apiClient.get<ExportDocument>(`${this.baseUrl}/documents/${documentId}`);
  }

  /**
   * Generate new document
   */
  async generateDocument(data: GenerateDocumentRequest): Promise<ExportDocument> {
    return apiClient.post<ExportDocument>(`${this.baseUrl}/generate`, data);
  }

  /**
   * Update document
   */
  async updateDocument(documentId: string, data: Partial<GenerateDocumentRequest>): Promise<ExportDocument> {
    return apiClient.patch<ExportDocument>(`${this.baseUrl}/documents/${documentId}`, data);
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/documents/${documentId}`);
  }

  /**
   * Download document
   */
  async downloadDocument(documentId: string): Promise<void> {
    return apiClient.downloadFile(
      `${this.baseUrl}/documents/${documentId}/download`,
      `export-document-${documentId}.pdf`
    );
  }

  /**
   * Submit document for approval
   */
  async submitForApproval(documentId: string): Promise<ExportDocument> {
    return apiClient.post<ExportDocument>(`${this.baseUrl}/documents/${documentId}/submit`);
  }

  /**
   * Approve document
   */
  async approveDocument(documentId: string, notes?: string): Promise<ExportDocument> {
    return apiClient.post<ExportDocument>(
      `${this.baseUrl}/documents/${documentId}/approve`,
      { notes }
    );
  }

  /**
   * Reject document
   */
  async rejectDocument(documentId: string, reason: string): Promise<ExportDocument> {
    return apiClient.post<ExportDocument>(
      `${this.baseUrl}/documents/${documentId}/reject`,
      { reason }
    );
  }

  /**
   * Verify document
   */
  async verifyDocument(data: {
    document_number?: string;
    verification_code?: string;
    document_hash?: string;
  }): Promise<{
    valid: boolean;
    document?: ExportDocument;
    message: string;
  }> {
    return apiClient.post(`${this.baseUrl}/verify`, data);
  }

  /**
   * Get document templates
   */
  async getTemplates(): Promise<DocumentTemplate[]> {
    return apiClient.get<DocumentTemplate[]>(`${this.baseUrl}/templates`);
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<DocumentTemplate> {
    return apiClient.get<DocumentTemplate>(`${this.baseUrl}/templates/${templateId}`);
  }

  /**
   * Get supported countries
   */
  async getSupportedCountries(): Promise<Array<{
    code: string;
    name: string;
    ports: string[];
  }>> {
    return apiClient.get(`${this.baseUrl}/countries`);
  }

  /**
   * Get document requirements
   */
  async getDocumentRequirements(params: {
    origin_country: string;
    destination_country: string;
    product_type: string;
  }): Promise<{
    required_documents: string[];
    optional_documents: string[];
    regulations: Array<{
      title: string;
      description: string;
      authority: string;
    }>;
  }> {
    return apiClient.get(`${this.baseUrl}/requirements`, { params });
  }

  /**
   * Get document statistics
   */
  async getStatistics(): Promise<{
    total_documents: number;
    pending_approval: number;
    approved_documents: number;
    rejected_documents: number;
    documents_by_type: Record<string, number>;
    documents_by_status: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }
}

export default new ExportDocsService();
