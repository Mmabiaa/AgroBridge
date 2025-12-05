/**
 * Payment Processing API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface PaymentMethod {
  id: string;
  user: string;
  type: 'card' | 'bank_account' | 'mobile_money';
  provider: string;
  last_four: string;
  expiry_month?: number;
  expiry_year?: number;
  is_default: boolean;
  is_verified: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user: string;
  type: 'payment' | 'refund' | 'withdrawal' | 'deposit';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  payment_method?: string;
  reference: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
  completed_at?: string;
}

export interface WalletBalance {
  user: string;
  balance: number;
  currency: string;
  pending_balance: number;
  available_balance: number;
  last_updated: string;
}

export interface InitializePaymentRequest {
  amount: number;
  currency?: string;
  payment_method_id?: string;
  description?: string;
  metadata?: Record<string, any>;
  callback_url?: string;
}

export interface InitializePaymentResponse {
  payment_id: string;
  reference: string;
  authorization_url?: string;
  access_code?: string;
  status: string;
}

export interface VerifyPaymentRequest {
  reference: string;
}

export interface VerifyPaymentResponse {
  status: 'success' | 'failed';
  transaction: Transaction;
  message: string;
}

export interface AddPaymentMethodRequest {
  type: 'card' | 'bank_account' | 'mobile_money';
  provider: string;
  card_number?: string;
  expiry_month?: number;
  expiry_year?: number;
  cvv?: string;
  account_number?: string;
  bank_code?: string;
  phone_number?: string;
}

export interface TransactionListParams {
  page?: number;
  page_size?: number;
  type?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
  ordering?: string;
}

class PaymentService {
  private readonly baseUrl = '/payment';

  /**
   * Initialize payment
   */
  async initializePayment(data: InitializePaymentRequest): Promise<InitializePaymentResponse> {
    return apiClient.post<InitializePaymentResponse>(`${this.baseUrl}/initialize`, data);
  }

  /**
   * Verify payment
   */
  async verifyPayment(data: VerifyPaymentRequest): Promise<VerifyPaymentResponse> {
    return apiClient.post<VerifyPaymentResponse>(`${this.baseUrl}/verify`, data);
  }

  /**
   * Get list of transactions
   */
  async getTransactions(params?: TransactionListParams): Promise<PaginatedResponse<Transaction>> {
    return apiClient.getPaginated<Transaction>(`${this.baseUrl}/transactions`, params);
  }

  /**
   * Get transaction by ID
   */
  async getTransaction(transactionId: string): Promise<Transaction> {
    return apiClient.get<Transaction>(`${this.baseUrl}/transactions/${transactionId}`);
  }

  /**
   * Get payment methods
   */
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    return apiClient.get<PaymentMethod[]>(`${this.baseUrl}/methods`);
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(data: AddPaymentMethodRequest): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>(`${this.baseUrl}/methods`, data);
  }

  /**
   * Delete payment method
   */
  async deletePaymentMethod(methodId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/methods/${methodId}`);
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(methodId: string): Promise<PaymentMethod> {
    return apiClient.post<PaymentMethod>(`${this.baseUrl}/methods/${methodId}/set-default`);
  }

  /**
   * Get wallet balance
   */
  async getBalance(): Promise<WalletBalance> {
    return apiClient.get<WalletBalance>(`${this.baseUrl}/balance`);
  }

  /**
   * Withdraw from wallet
   */
  async withdraw(data: {
    amount: number;
    payment_method_id: string;
    description?: string;
  }): Promise<Transaction> {
    return apiClient.post<Transaction>(`${this.baseUrl}/withdraw`, data);
  }

  /**
   * Deposit to wallet
   */
  async deposit(data: {
    amount: number;
    payment_method_id: string;
    description?: string;
  }): Promise<Transaction> {
    return apiClient.post<Transaction>(`${this.baseUrl}/deposit`, data);
  }

  /**
   * Request refund
   */
  async requestRefund(transactionId: string, reason: string): Promise<{
    message: string;
    refund_id: string;
    status: string;
  }> {
    return apiClient.post(`${this.baseUrl}/transactions/${transactionId}/refund`, { reason });
  }

  /**
   * Get payment providers
   */
  async getProviders(): Promise<Array<{
    id: string;
    name: string;
    type: string;
    logo_url: string;
    is_available: boolean;
  }>> {
    return apiClient.get(`${this.baseUrl}/providers`);
  }

  /**
   * Get transaction receipt
   */
  async getReceipt(transactionId: string): Promise<void> {
    return apiClient.downloadFile(
      `${this.baseUrl}/transactions/${transactionId}/receipt`,
      `receipt-${transactionId}.pdf`
    );
  }

  /**
   * Get payment statistics
   */
  async getStatistics(params?: {
    start_date?: string;
    end_date?: string;
  }): Promise<{
    total_transactions: number;
    total_amount: number;
    successful_transactions: number;
    failed_transactions: number;
    average_transaction_value: number;
    transactions_by_type: Record<string, number>;
    transactions_by_status: Record<string, number>;
  }> {
    return apiClient.get(`${this.baseUrl}/statistics`, { params });
  }
}

export default new PaymentService();
