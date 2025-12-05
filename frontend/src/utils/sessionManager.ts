/**
 * Session management utilities
 * Handles session timeout, remember me, and concurrent session management
 */

export interface SessionConfig {
  /**
   * Session timeout in milliseconds
   * @default 30 minutes
   */
  timeout?: number;
  
  /**
   * Whether to remember the user
   * @default false
   */
  rememberMe?: boolean;
  
  /**
   * Extended session duration for "remember me" in milliseconds
   * @default 30 days
   */
  rememberMeDuration?: number;
}

export interface SessionData {
  lastActivity: number;
  rememberMe: boolean;
  sessionId: string;
  expiresAt: number;
}

class SessionManager {
  private static readonly SESSION_KEY = 'agrobridge_session';
  private static readonly DEFAULT_TIMEOUT = 30 * 60 * 1000; // 30 minutes
  private static readonly REMEMBER_ME_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days
  private static readonly WARNING_THRESHOLD = 5 * 60 * 1000; // 5 minutes before timeout
  
  private timeoutTimer: NodeJS.Timeout | null = null;
  private warningTimer: NodeJS.Timeout | null = null;
  private onTimeoutCallback: (() => void) | null = null;
  private onWarningCallback: ((remainingTime: number) => void) | null = null;

  /**
   * Initialize session
   */
  initSession(config: SessionConfig = {}): void {
    const {
      timeout = SessionManager.DEFAULT_TIMEOUT,
      rememberMe = false,
      rememberMeDuration = SessionManager.REMEMBER_ME_DURATION,
    } = config;

    const sessionDuration = rememberMe ? rememberMeDuration : timeout;
    const now = Date.now();

    const sessionData: SessionData = {
      lastActivity: now,
      rememberMe,
      sessionId: this.generateSessionId(),
      expiresAt: now + sessionDuration,
    };

    this.saveSession(sessionData);
    this.startTimeoutTimer(sessionDuration);
  }

  /**
   * Update session activity
   */
  updateActivity(): void {
    const session = this.getSession();
    if (!session) return;

    const now = Date.now();
    session.lastActivity = now;

    // Extend expiration if not using remember me
    if (!session.rememberMe) {
      session.expiresAt = now + SessionManager.DEFAULT_TIMEOUT;
    }

    this.saveSession(session);
    this.resetTimeoutTimer();
  }

  /**
   * Check if session is valid
   */
  isSessionValid(): boolean {
    const session = this.getSession();
    if (!session) return false;

    const now = Date.now();
    return now < session.expiresAt;
  }

  /**
   * Get remaining session time in milliseconds
   */
  getRemainingTime(): number {
    const session = this.getSession();
    if (!session) return 0;

    const now = Date.now();
    return Math.max(0, session.expiresAt - now);
  }

  /**
   * Clear session
   */
  clearSession(): void {
    localStorage.removeItem(SessionManager.SESSION_KEY);
    this.clearTimers();
  }

  /**
   * Set timeout callback
   */
  onTimeout(callback: () => void): void {
    this.onTimeoutCallback = callback;
  }

  /**
   * Set warning callback (called before timeout)
   */
  onWarning(callback: (remainingTime: number) => void): void {
    this.onWarningCallback = callback;
  }

  /**
   * Enable "remember me" for current session
   */
  enableRememberMe(): void {
    const session = this.getSession();
    if (!session) return;

    session.rememberMe = true;
    session.expiresAt = Date.now() + SessionManager.REMEMBER_ME_DURATION;
    this.saveSession(session);
    this.resetTimeoutTimer();
  }

  /**
   * Disable "remember me" for current session
   */
  disableRememberMe(): void {
    const session = this.getSession();
    if (!session) return;

    session.rememberMe = false;
    session.expiresAt = Date.now() + SessionManager.DEFAULT_TIMEOUT;
    this.saveSession(session);
    this.resetTimeoutTimer();
  }

  /**
   * Check if remember me is enabled
   */
  isRememberMeEnabled(): boolean {
    const session = this.getSession();
    return session?.rememberMe || false;
  }

  /**
   * Get session ID
   */
  getSessionId(): string | null {
    const session = this.getSession();
    return session?.sessionId || null;
  }

  /**
   * Private: Get session data
   */
  private getSession(): SessionData | null {
    try {
      const data = localStorage.getItem(SessionManager.SESSION_KEY);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to parse session data:', error);
      return null;
    }
  }

  /**
   * Private: Save session data
   */
  private saveSession(session: SessionData): void {
    try {
      localStorage.setItem(SessionManager.SESSION_KEY, JSON.stringify(session));
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  /**
   * Private: Generate unique session ID
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Private: Start timeout timer
   */
  private startTimeoutTimer(duration: number): void {
    this.clearTimers();

    // Set warning timer (5 minutes before timeout)
    const warningTime = Math.max(0, duration - SessionManager.WARNING_THRESHOLD);
    if (warningTime > 0) {
      this.warningTimer = setTimeout(() => {
        if (this.onWarningCallback) {
          this.onWarningCallback(SessionManager.WARNING_THRESHOLD);
        }
      }, warningTime);
    }

    // Set timeout timer
    this.timeoutTimer = setTimeout(() => {
      if (this.onTimeoutCallback) {
        this.onTimeoutCallback();
      }
      this.clearSession();
    }, duration);
  }

  /**
   * Private: Reset timeout timer
   */
  private resetTimeoutTimer(): void {
    const session = this.getSession();
    if (!session) return;

    const remainingTime = this.getRemainingTime();
    if (remainingTime > 0) {
      this.startTimeoutTimer(remainingTime);
    }
  }

  /**
   * Private: Clear all timers
   */
  private clearTimers(): void {
    if (this.timeoutTimer) {
      clearTimeout(this.timeoutTimer);
      this.timeoutTimer = null;
    }
    if (this.warningTimer) {
      clearTimeout(this.warningTimer);
      this.warningTimer = null;
    }
  }
}

// Export singleton instance
export const sessionManager = new SessionManager();

// Activity tracking
let activityTrackingEnabled = false;

/**
 * Enable automatic activity tracking
 */
export function enableActivityTracking(): void {
  if (activityTrackingEnabled) return;

  const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
  const throttledUpdate = throttle(() => {
    sessionManager.updateActivity();
  }, 60000); // Update at most once per minute

  events.forEach(event => {
    window.addEventListener(event, throttledUpdate, { passive: true });
  });

  activityTrackingEnabled = true;
}

/**
 * Throttle function
 */
function throttle(func: Function, wait: number): () => void {
  let timeout: NodeJS.Timeout | null = null;
  let lastRan: number = 0;

  return function(this: any, ...args: any[]) {
    const now = Date.now();

    if (!lastRan || now - lastRan >= wait) {
      func.apply(this, args);
      lastRan = now;
    } else {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        func.apply(this, args);
        lastRan = Date.now();
      }, wait - (now - lastRan));
    }
  };
}

export default sessionManager;
