# Token Authentication Fix

## Issue
Users were experiencing authentication errors with expired JWT tokens:
- WebSocket connections failing with "Anonymous user attempted to connect"
- Login and password reset endpoints receiving 401 errors
- Token validation errors appearing in logs

## Root Causes

1. **Expired tokens in localStorage**: Old/expired tokens were persisting in browser storage
2. **Tokens sent to auth endpoints**: Expired tokens were being sent even to login/register endpoints
3. **WebSocket using expired tokens**: WebSocket connections attempted with expired access tokens
4. **No token expiration check on startup**: App didn't validate token expiration on initialization

## Solutions Implemented

### 1. Request Interceptor Enhancement (`frontend/src/api/axiosClient.ts`)
- Skip adding Authorization header for auth endpoints (login, register, password reset)
- Check token expiration before adding to requests
- Automatically clear expired tokens

```typescript
// Skip auth for login, register, and password reset endpoints
const isAuthEndpoint = config.url?.includes('/auth/login') || 
                      config.url?.includes('/auth/register') ||
                      config.url?.includes('/auth/request-password-reset') ||
                      config.url?.includes('/auth/reset-password');

if (!isAuthEndpoint) {
    const token = TokenManager.getAccessToken();
    if (token) {
        if (TokenManager.isTokenExpired(token)) {
            TokenManager.clearTokens();
        } else {
            config.headers.Authorization = `Bearer ${token}`;
        }
    }
}
```

### 2. WebSocket Token Validation (`frontend/src/hooks/useWebSocket.ts`)
- Validate token expiration before attempting WebSocket connection
- Clear expired tokens automatically
- Prevent connection attempts with invalid tokens

```typescript
// Check if token is expired before connecting
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    if (payload.exp < currentTime) {
        console.log('Cannot connect WebSocket: Token is expired');
        localStorage.removeItem('access_token');
        return;
    }
} catch (error) {
    console.error('Invalid token format:', error);
    localStorage.removeItem('access_token');
    return;
}
```

### 3. Startup Token Validation (`frontend/src/contexts/AuthContext.tsx`)
- Check token expiration on app initialization
- Clear expired tokens before attempting to fetch user data
- Prevent unnecessary API calls with invalid tokens

```typescript
// Verify token is not expired on startup
try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    
    if (payload.exp < currentTime) {
        console.log('Token expired on startup, clearing...');
        clearAuthData();
        setUser(null);
        return;
    }
} catch (error) {
    console.error('Invalid token format on startup:', error);
    clearAuthData();
    setUser(null);
    return;
}
```

### 4. Login Token Cleanup
- Clear any existing tokens before login attempt
- Ensures fresh authentication state

```typescript
const login = async (email: string, password: string): Promise<void> => {
    // Clear any existing expired tokens before login
    clearAuthData();
    
    const result = await loginMutation.mutateAsync({ username: email, password }) as LoginResponse;
    // ...
};
```

### 5. Token Utility Functions (`frontend/src/utils/tokenUtils.ts`)
Created utility functions for token management:
- `isTokenExpired(token)`: Check if a token is expired
- `clearExpiredTokens()`: Clear only expired tokens
- `clearAllTokens()`: Clear all authentication tokens

## Testing

To test the fix:

1. **Clear existing tokens**:
   ```javascript
   // In browser console
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');
   ```

2. **Test login**: Should work without 401 errors
3. **Test WebSocket**: Should connect successfully after login
4. **Test token expiration**: Wait for token to expire and verify automatic cleanup

## Prevention

The fix prevents future issues by:
- Validating tokens before use
- Automatically clearing expired tokens
- Skipping authentication for public endpoints
- Providing clear console logs for debugging

## Related Files
- `frontend/src/api/axiosClient.ts`
- `frontend/src/hooks/useWebSocket.ts`
- `frontend/src/contexts/AuthContext.tsx`
- `frontend/src/utils/tokenUtils.ts`
- `backend/authentication/authentication.py`
- `backend/agrobridge_backend/websocket_auth.py`
- `backend/marketplace/consumers.py`
