/**
 * Blockchain Certificates API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface Certificate {
  id: string;
  user: string;
  product_id: string;
  product_name: string;
  certificate_type: 'origin' | 'quality' | 'organic' | 'export';
  certificate_number: string;
  blockchain_hash: string;
  blockchain_network: string;
  transaction_id: string;
  metadata: {
    farm_name?: string;
    harvest_date?: string;
    quality_grade?: string;
    certifications?: string[];
    [key: string]: any;
  };
  qr_code_url: string;
  pdf_url?: string;
  status: 'pending' | 'issued' | 'verified' | 'revoked';
  issued_at: string;
  expires_at?: string;
  created_at: string;
}

export interface SupplyChainEvent {
  id: string;
  product_id: string;
  event_type: 'harvest' | 'processing' | 'packaging' | 'transport' | 'storage' | 'delivery';
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  timestamp: string;
  actor: {
    id: string;
    name: string;
    role: string;
  };
  metadata: Record<string, any>;
  blockchain_hash: string;
  transaction_id: string;
}

export interface BlockchainTransaction {
  id: string;
  transaction_hash: string;
  block_number: number;
  network: string;
  from_address: string;
  to_address?: string;
  gas_used: number;
  gas_price: string;
  status: 'pending' | 'confirmed' | 'failed';
  timestamp: string;
  metadata: Record<string, any>;
}

export interface IssueCertificateRequest {
  product_id: string;
  certificate_type: 'origin' | 'quality' | 'organic' | 'export';
  metadata: {
    farm_name?: string;
    harvest_date?: string;
    quality_grade?: string;
    certifications?: string[];
    [key: string]: any;
  };
  expires_at?: string;
}

export interface VerifyCertificateRequest {
  certificate_number?: string;
  blockchain_hash?: string;
  qr_code_data?: string;
}

export interface CertificateListParams {
  page?: number;
  page_size?: number;
  certificate_type?: string;
  status?: string;
  product_id?: string;
  ordering?: string;
}

class BlockchainService {
  private readonly baseUrl = '/blockchain';

  /**
   * Get list of certificates
   */
  async getCertificates(params?: CertificateListParams): Promise<PaginatedResponse<Certificate>> {
    return apiClient.getPaginated<Certificate>(`${this.baseUrl}/certificates`, params);
  }

  /**
   * Get certificate by ID
   */
  async getCertificate(certificateId: string): Promise<Certificate> {
    return apiClient.get<Certificate>(`${this.baseUrl}/certificates/${certificateId}`);
  }

  /**
   * Issue new certificate
   */
  async issueCertificate(data: IssueCertificateRequest): Promise<Certificate> {
    return apiClient.post<Certificate>(`${this.baseUrl}/certificates`, data);
  }

  /**
   * Verify certificate
   */
  async verifyCertificate(data: VerifyCertificateRequest): Promise<{
    valid: boolean;
    certificate?: Certificate;
    blockchain_verified: boolean;
    message: string;
  }> {
    return apiClient.post(`${this.baseUrl}/certificates/verify`, data);
  }

  /**
   * Download certificate PDF
   */
  async downloadCertificate(certificateId: string): Promise<void> {
    return apiClient.downloadFile(
      `${this.baseUrl}/certificates/${certificateId}/download`,
      `certificate-${certificateId}.pdf`
    );
  }

  /**
   * Revoke certificate
   */
  async revokeCertificate(certificateId: string, reason: string): Promise<Certificate> {
    return apiClient.post<Certificate>(
      `${this.baseUrl}/certificates/${certificateId}/revoke`,
      { reason }
    );
  }

  /**
   * Get supply chain history
   */
  async getSupplyChain(productId: string): Promise<SupplyChainEvent[]> {
    return apiClient.get<SupplyChainEvent[]>(`${this.baseUrl}/supply-chain/${productId}`);
  }

  /**
   * Add supply chain event
   */
  async addSupplyChainEvent(data: {
    product_id: string;
    event_type: SupplyChainEvent['event_type'];
    location: SupplyChainEvent['location'];
    metadata?: Record<string, any>;
  }): Promise<SupplyChainEvent> {
    return apiClient.post<SupplyChainEvent>(`${this.baseUrl}/supply-chain`, data);
  }

  /**
   * Get blockchain transactions
   */
  async getTransactions(params?: {
    page?: number;
    page_size?: number;
    status?: string;
    ordering?: string;
  }): Promise<PaginatedResponse<BlockchainTransaction>> {
    return apiClient.getPaginated<BlockchainTransaction>(`${this.baseUrl}/transactions`, params);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<BlockchainTransaction> {
    return apiClient.get<BlockchainTransaction>(`${this.baseUrl}/transactions/${transactionId}`);
  }

  /**
   * Get blockchain network status
   */
  async getNetworkStatus(): Promise<{
    network: string;
    is_connected: boolean;
    block_height: number;
    gas_price: string;
    last_updated: string;
  }> {
    return apiClient.get(`${this.baseUrl}/network/status`);
  }

  /**
   * Get certificate statistics
   */
  async getStatistics(): Promise<{
    total_certificates: number;
    issued_certificates: number;
    verified_certificates: number;
    revoked_certificates: number;
    certificates_by_type: Record<string, number>;
    recent_certificates: Certificate[];
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`);
  }

  /**
   * Verify product authenticity
   */
  async verifyProductAuthenticity(productId: string): Promise<{
    authentic: boolean;
    certificates: Certificate[];
    supply_chain_verified: boolean;
    trust_score: number;
    message: string;
  }> {
    return apiClient.get(`${this.baseUrl}/verify-product/${productId}`);
  }
}

export default new BlockchainService();
