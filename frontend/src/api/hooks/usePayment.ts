/**
 * React Query hooks for Payment service
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import paymentService, {
  InitializePaymentRequest,
  VerifyPaymentRequest,
  AddPaymentMethodRequest,
  TransactionListParams,
} from '../services/payment.service';

// Query keys
export const paymentKeys = {
  all: ['payment'] as const,
  transactions: () => [...paymentKeys.all, 'transactions'] as const,
  transaction: (id: string) => [...paymentKeys.transactions(), id] as const,
  methods: () => [...paymentKeys.all, 'methods'] as const,
  balance: () => [...paymentKeys.all, 'balance'] as const,
  providers: () => [...paymentKeys.all, 'providers'] as const,
  statistics: (params?: any) => [...paymentKeys.all, 'statistics', params] as const,
};

// Transactions
export const useTransactions = (params?: TransactionListParams) => {
  return useQuery({
    queryKey: [...paymentKeys.transactions(), params],
    queryFn: () => paymentService.getTransactions(params),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useTransaction = (transactionId: string) => {
  return useQuery({
    queryKey: paymentKeys.transaction(transactionId),
    queryFn: () => paymentService.getTransaction(transactionId),
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000,
  });
};

// Payment Methods
export const usePaymentMethods = () => {
  return useQuery({
    queryKey: paymentKeys.methods(),
    queryFn: paymentService.getPaymentMethods,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useAddPaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: AddPaymentMethodRequest) => paymentService.addPaymentMethod(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
  });
};

export const useDeletePaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (methodId: string) => paymentService.deletePaymentMethod(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
  });
};

export const useSetDefaultPaymentMethod = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (methodId: string) => paymentService.setDefaultPaymentMethod(methodId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.methods() });
    },
  });
};

// Payment Operations
export const useInitializePayment = () => {
  return useMutation({
    mutationFn: (data: InitializePaymentRequest) => paymentService.initializePayment(data),
  });
};

export const useVerifyPayment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: VerifyPaymentRequest) => paymentService.verifyPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.balance() });
    },
  });
};

// Wallet
export const useWalletBalance = () => {
  return useQuery({
    queryKey: paymentKeys.balance(),
    queryFn: paymentService.getBalance,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
};

export const useWithdraw = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { amount: number; payment_method_id: string; description?: string }) =>
      paymentService.withdraw(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.balance() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.transactions() });
    },
  });
};

export const useDeposit = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: { amount: number; payment_method_id: string; description?: string }) =>
      paymentService.deposit(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.balance() });
      queryClient.invalidateQueries({ queryKey: paymentKeys.transactions() });
    },
  });
};

// Refunds
export const useRequestRefund = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ transactionId, reason }: { transactionId: string; reason: string }) =>
      paymentService.requestRefund(transactionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.transactions() });
    },
  });
};

// Providers
export const usePaymentProviders = () => {
  return useQuery({
    queryKey: paymentKeys.providers(),
    queryFn: paymentService.getProviders,
    staleTime: 60 * 60 * 1000, // 1 hour
  });
};

// Statistics
export const usePaymentStatistics = (params?: { start_date?: string; end_date?: string }) => {
  return useQuery({
    queryKey: paymentKeys.statistics(params),
    queryFn: () => paymentService.getStatistics(params),
    staleTime: 10 * 60 * 1000,
  });
};

// Receipt Download
export const useDownloadReceipt = () => {
  return useMutation({
    mutationFn: (transactionId: string) => paymentService.getReceipt(transactionId),
  });
};
