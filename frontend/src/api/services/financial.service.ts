/**
 * Financial Planning API service
 */
import apiClient, { PaginatedResponse } from '../axiosClient';

export interface FinancialRecord {
  id: string;
  user: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency: string;
  description?: string;
  date: string;
  farm?: string;
  receipt_url?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  user: string;
  name: string;
  total_amount: number;
  spent_amount: number;
  currency: string;
  categories: BudgetCategory[];
  start_date: string;
  end_date: string;
  status: 'active' | 'completed' | 'exceeded';
  created_at: string;
  updated_at: string;
}

export interface BudgetCategory {
  name: string;
  allocated_amount: number;
  spent_amount: number;
  percentage: number;
}

export interface FinancialReport {
  period: string;
  start_date: string;
  end_date: string;
  total_income: number;
  total_expenses: number;
  net_profit: number;
  profit_margin: number;
  income_by_category: Record<string, number>;
  expenses_by_category: Record<string, number>;
  trends: Array<{
    date: string;
    income: number;
    expenses: number;
    profit: number;
  }>;
}

export interface CashFlowReport {
  period: string;
  opening_balance: number;
  closing_balance: number;
  total_inflow: number;
  total_outflow: number;
  net_cash_flow: number;
  cash_flow_by_month: Array<{
    month: string;
    inflow: number;
    outflow: number;
    net: number;
  }>;
}

export interface CreateRecordRequest {
  type: 'income' | 'expense';
  category: string;
  amount: number;
  currency?: string;
  description?: string;
  date: string;
  farm?: string;
  receipt?: File;
  tags?: string[];
}

export interface CreateBudgetRequest {
  name: string;
  total_amount: number;
  currency?: string;
  categories: Array<{
    name: string;
    allocated_amount: number;
  }>;
  start_date: string;
  end_date: string;
}

export interface RecordListParams {
  page?: number;
  page_size?: number;
  type?: 'income' | 'expense';
  category?: string;
  start_date?: string;
  end_date?: string;
  farm?: string;
  ordering?: string;
}

export interface ExportParams {
  format: 'csv' | 'excel' | 'pdf';
  start_date?: string;
  end_date?: string;
  type?: 'income' | 'expense';
  category?: string;
}

class FinancialService {
  private readonly baseUrl = '/financial';

  /**
   * Get list of financial records
   */
  async getRecords(params?: RecordListParams): Promise<PaginatedResponse<FinancialRecord>> {
    return apiClient.getPaginated<FinancialRecord>(`${this.baseUrl}/records`, params);
  }

  /**
   * Get financial record by ID
   */
  async getRecord(recordId: string): Promise<FinancialRecord> {
    return apiClient.get<FinancialRecord>(`${this.baseUrl}/records/${recordId}`);
  }

  /**
   * Create financial record
   */
  async createRecord(data: CreateRecordRequest): Promise<FinancialRecord> {
    // Handle file upload for receipt
    if (data.receipt) {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (key === 'receipt' && value instanceof File) {
          formData.append(key, value);
        } else if (key === 'tags' && Array.isArray(value)) {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined) {
          formData.append(key, String(value));
        }
      });

      return apiClient.post<FinancialRecord>(`${this.baseUrl}/records`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    }

    return apiClient.post<FinancialRecord>(`${this.baseUrl}/records`, data);
  }

  /**
   * Update financial record
   */
  async updateRecord(recordId: string, data: Partial<CreateRecordRequest>): Promise<FinancialRecord> {
    return apiClient.patch<FinancialRecord>(`${this.baseUrl}/records/${recordId}`, data);
  }

  /**
   * Delete financial record
   */
  async deleteRecord(recordId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/records/${recordId}`);
  }

  /**
   * Get list of budgets
   */
  async getBudgets(): Promise<Budget[]> {
    return apiClient.get<Budget[]>(`${this.baseUrl}/budgets`);
  }

  /**
   * Get budget by ID
   */
  async getBudget(budgetId: string): Promise<Budget> {
    return apiClient.get<Budget>(`${this.baseUrl}/budgets/${budgetId}`);
  }

  /**
   * Create budget
   */
  async createBudget(data: CreateBudgetRequest): Promise<Budget> {
    return apiClient.post<Budget>(`${this.baseUrl}/budgets`, data);
  }

  /**
   * Update budget
   */
  async updateBudget(budgetId: string, data: Partial<CreateBudgetRequest>): Promise<Budget> {
    return apiClient.patch<Budget>(`${this.baseUrl}/budgets/${budgetId}`, data);
  }

  /**
   * Delete budget
   */
  async deleteBudget(budgetId: string): Promise<void> {
    return apiClient.delete(`${this.baseUrl}/budgets/${budgetId}`);
  }

  /**
   * Get profit/loss report
   */
  async getProfitLossReport(params?: {
    start_date?: string;
    end_date?: string;
    farm?: string;
  }): Promise<FinancialReport> {
    return apiClient.get<FinancialReport>(`${this.baseUrl}/reports/profit-loss`, { params });
  }

  /**
   * Get cash flow report
   */
  async getCashFlowReport(params?: {
    start_date?: string;
    end_date?: string;
    farm?: string;
  }): Promise<CashFlowReport> {
    return apiClient.get<CashFlowReport>(`${this.baseUrl}/reports/cash-flow`, { params });
  }

  /**
   * Get expense breakdown
   */
  async getExpenseBreakdown(params?: {
    start_date?: string;
    end_date?: string;
    farm?: string;
  }): Promise<{
    total_expenses: number;
    by_category: Record<string, number>;
    by_month: Array<{ month: string; amount: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/reports/expense-breakdown`, { params });
  }

  /**
   * Get income breakdown
   */
  async getIncomeBreakdown(params?: {
    start_date?: string;
    end_date?: string;
    farm?: string;
  }): Promise<{
    total_income: number;
    by_category: Record<string, number>;
    by_month: Array<{ month: string; amount: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/reports/income-breakdown`, { params });
  }

  /**
   * Export financial data
   */
  async exportData(params: ExportParams): Promise<void> {
    const filename = `financial-data-${new Date().toISOString().split('T')[0]}.${params.format}`;
    return apiClient.downloadFile(`${this.baseUrl}/export`, filename);
  }

  /**
   * Get financial categories
   */
  async getCategories(): Promise<{
    income_categories: string[];
    expense_categories: string[];
  }> {
    return apiClient.get(`${this.baseUrl}/categories`);
  }

  /**
   * Get financial summary
   */
  async getSummary(params?: {
    start_date?: string;
    end_date?: string;
    farm?: string;
  }): Promise<{
    total_income: number;
    total_expenses: number;
    net_profit: number;
    profit_margin: number;
    budget_utilization: number;
    top_expense_categories: Array<{ category: string; amount: number }>;
    top_income_sources: Array<{ category: string; amount: number }>;
  }> {
    return apiClient.get(`${this.baseUrl}/summary`, { params });
  }
}

export default new FinancialService();
