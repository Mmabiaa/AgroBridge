/**
 * API Hooks Index
 */

// Export utility hooks
export {
  useApiError,
  useApiErrorTypes,
  useAsyncError,
  useFormError,
} from './useApiError';

export {
  useApiRequest,
  useApiGet,
  useApiPost,
  useApiPut,
  useApiPatch,
  useApiDelete,
  useApiUpload,
} from './useApiRequest';

export type {
  UseApiErrorOptions,
  UseApiErrorReturn,
} from './useApiError';

export type {
  UseApiRequestOptions,
  UseApiRequestReturn,
} from './useApiRequest';

// Export service-specific hooks
export * from './useAuth';
export * from './useFarms';
export * from './useMarketplace';
export * from './useAI';
export * from './useCropDetection';
export * from './useUsers';
export * from './useIoT';
export * from './useNotifications';
export * from './useFinancial';