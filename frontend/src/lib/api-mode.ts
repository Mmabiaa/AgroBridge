import { isMockApiEnabled } from './env';

/**
 * API Mode Configuration
 * Allows toggling between mock and real API
 */

const STORAGE_KEY = 'agrobridge_api_mode';

export type ApiMode = 'real' | 'mock';

/**
 * Get current API mode
 */
export function getApiMode(): ApiMode {
  // Check environment variable first
  if (isMockApiEnabled) {
    return 'mock';
  }

  // Check localStorage for user preference
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'mock' || stored === 'real') {
    return stored;
  }

  // Default to real API
  return 'real';
}

/**
 * Set API mode
 */
export function setApiMode(mode: ApiMode): void {
  localStorage.setItem(STORAGE_KEY, mode);
  // Reload to apply changes
  window.location.reload();
}

/**
 * Check if mock API is active
 */
export function isMockApiActive(): boolean {
  return getApiMode() === 'mock';
}

/**
 * Toggle between mock and real API
 */
export function toggleApiMode(): void {
  const current = getApiMode();
  setApiMode(current === 'mock' ? 'real' : 'mock');
}

/**
 * Get API mode display name
 */
export function getApiModeDisplay(): string {
  return getApiMode() === 'mock' ? 'Mock API' : 'Real API';
}
