/**
 * React Query hooks for notifications service
 */
import { useMutation, useQuery, useQueryClient } from '@tantml:function_calls>
<invoke name="fsWrite">
<parameter name="path">frontend/src/api/hooks/useFinancial.ts**
 * React Query hooks for financial service
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import financialService from '../services/financial.service';
import type { CreateRecordRequest, CreateBudgetRequest, RecordListParams } from '../services/financial.service';

export const financialKeys = {
  all: ['financial'] as const,
  records: (params?: RecordListParams) => [...financialKeys.all, 'records', params] as const,
  record: (id: string) => [...financialKeys.all, 'record', id] as const,
  budgets: () => [...financialKeys.all, 'budgets'] as const,
  budget: (id: string) => [...financialKeys.all, 'budget', id] as const,
  reports: (type: string, params?: any) => [...financialKeys.all, 'reports', type, params] as const,
};

export const useRecords = (params?: RecordListParams) => {
  return useQuery({
    queryKey: financialKeys.records(params),
    queryFn: () => financialService.getRecords(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useBudgets = () => {
  return useQuery({
    queryKey: financialKeys.budgets(),
    queryFn: financialService.getBudgets,
    staleTime: 10 * 60 * 1000,
  });
};

export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateRecordRequest) => financialService.createRecord(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.all });
    },
  });
};

export const useCreateBudget = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBudgetRequest) => financialService.createBudget(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: financialKeys.budgets() });
    },
  });
};

export const useProfitLossReport = (params?: any) => {
  return useQuery({
    queryKey: financialKeys.reports('profit-loss', params),
    queryFn: () => financialService.getProfitLossReport(params),
    staleTime: 10 * 60 * 1000,
  });
};
