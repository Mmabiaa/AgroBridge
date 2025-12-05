import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Browser-side MSW worker for development
 */
export const worker = setupWorker(...handlers);
