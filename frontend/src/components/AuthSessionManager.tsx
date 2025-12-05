/**
 * AuthSessionManager component
 * Manages session timeout warnings and logout confirmations
 */
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { SessionTimeoutDialog } from './SessionTimeoutDialog';

interface AuthSessionManagerProps {
  children: React.ReactNode;
}

export const AuthSessionManager: React.FC<AuthSessionManagerProps> = ({ children }) => {
  const { 
    showSessionWarning, 
    sessionTimeRemaining, 
    extendSession,
    isAuthenticated,
  } = useAuth();

  return (
    <>
      {children}
      
      {/* Session Timeout Warning Dialog */}
      {isAuthenticated && (
        <SessionTimeoutDialog
          open={showSessionWarning}
          remainingTime={sessionTimeRemaining}
          onExtendSession={extendSession}
        />
      )}
    </>
  );
};

export default AuthSessionManager;
