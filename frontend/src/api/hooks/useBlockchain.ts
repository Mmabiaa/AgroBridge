/**
 * React Query hooks for Blockchain Certificates API
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import blockchainService, {
  CertificateListParams,
  IssueCertificateRequest,
  VerifyCertificateRequest,
  SupplyChainEvent,
} from '../services/blockchain.service';
import { toast } from 'sonner';

// Query keys for cache management
export const blockchainKeys = {
  all: ['blockchain'] as const,
  certificates: () => [...blockchainKeys.all, 'certificates'] as const,
  certificatesList: (params?: CertificateListParams) =>
    [...blockchainKeys.certificates(), 'list', params] as const,
  certificate: (id: string) => [...blockchainKeys.certificates(), 'detail', id] as const,
  supplyChain: (productId: string) =>
    [...blockchainKeys.all, 'supply-chain', productId] as const,
  transactions: () => [...blockchainKeys.all, 'transactions'] as const,
  transactionsList: (params?: any) => [...blockchainKeys.transactions(), 'list', params] as const,
  transaction: (id: string) => [...blockchainKeys.transactions(), 'detail', id] as const,
  statistics: () => [...blockchainKeys.all, 'statistics'] as const,
  networkStatus: () => [...blockchainKeys.all, 'network-status'] as const,
};

/**
 * Get list of certificates
 */
export function useCertificates(params?: CertificateListParams) {
  return useQuery({
    queryKey: blockchainKeys.certificatesList(params),
    queryFn: () => blockchainService.getCertificates(params),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Get certificate by ID
 */
export function useCertificate(certificateId: string) {
  return useQuery({
    queryKey: blockchainKeys.certificate(certificateId),
    queryFn: () => blockchainService.getCertificate(certificateId),
    enabled: !!certificateId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Issue new certificate
 */
export function useIssueCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: IssueCertificateRequest) => blockchainService.issueCertificate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: blockchainKeys.certificates() });
      queryClient.invalidateQueries({ queryKey: blockchainKeys.statistics() });
      toast.success('Certificate issued successfully');
    },
    onError: (error: any) => {
      toast.error('Failed to issue certificate', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Verify certificate
 */
export function useVerifyCertificate() {
  return useMutation({
    mutationFn: (data: VerifyCertificateRequest) => blockchainService.verifyCertificate(data),
    onSuccess: (data) => {
      if (data.valid) {
        toast.success('Certificate verified', {
          description: data.message,
        });
      } else {
        toast.error('Certificate verification failed', {
          description: data.message,
        });
      }
    },
    onError: (error: any) => {
      toast.error('Verification failed', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Download certificate PDF
 */
export function useDownloadCertificate() {
  return useMutation({
    mutationFn: (certificateId: string) => blockchainService.downloadCertificate(certificateId),
    onSuccess: () => {
      toast.success('Certificate downloaded');
    },
    onError: (error: any) => {
      toast.error('Download failed', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Revoke certificate
 */
export function useRevokeCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ certificateId, reason }: { certificateId: string; reason: string }) =>
      blockchainService.revokeCertificate(certificateId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blockchainKeys.certificate(variables.certificateId) });
      queryClient.invalidateQueries({ queryKey: blockchainKeys.certificates() });
      toast.success('Certificate revoked');
    },
    onError: (error: any) => {
      toast.error('Failed to revoke certificate', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Get supply chain history
 */
export function useSupplyChain(productId: string) {
  return useQuery({
    queryKey: blockchainKeys.supplyChain(productId),
    queryFn: () => blockchainService.getSupplyChain(productId),
    enabled: !!productId,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Add supply chain event
 */
export function useAddSupplyChainEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: {
      product_id: string;
      event_type: SupplyChainEvent['event_type'];
      location: SupplyChainEvent['location'];
      metadata?: Record<string, any>;
    }) => blockchainService.addSupplyChainEvent(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: blockchainKeys.supplyChain(variables.product_id) });
      toast.success('Supply chain event added');
    },
    onError: (error: any) => {
      toast.error('Failed to add event', {
        description: error.message || 'Please try again',
      });
    },
  });
}

/**
 * Get blockchain transactions
 */
export function useTransactions(params?: any) {
  return useQuery({
    queryKey: blockchainKeys.transactionsList(params),
    queryFn: () => blockchainService.getTransactions(params),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get transaction by ID
 */
export function useTransaction(transactionId: string) {
  return useQuery({
    queryKey: blockchainKeys.transaction(transactionId),
    queryFn: () => blockchainService.getTransaction(transactionId),
    enabled: !!transactionId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get blockchain network status
 */
export function useNetworkStatus() {
  return useQuery({
    queryKey: blockchainKeys.networkStatus(),
    queryFn: () => blockchainService.getNetworkStatus(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Refetch every minute
  });
}

/**
 * Get certificate statistics
 */
export function useStatistics() {
  return useQuery({
    queryKey: blockchainKeys.statistics(),
    queryFn: () => blockchainService.getStatistics(),
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Verify product authenticity
 */
export function useVerifyProductAuthenticity(productId: string) {
  return useQuery({
    queryKey: [...blockchainKeys.all, 'verify-product', productId],
    queryFn: () => blockchainService.verifyProductAuthenticity(productId),
    enabled: !!productId,
    staleTime: 5 * 60 * 1000,
  });
}
