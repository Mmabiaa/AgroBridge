/**
 * Token utility functions
 */

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch {
    return true;
  }
};

export const clearExpiredTokens = (): void => {
  const accessToken = localStorage.getItem('access_token');
  const refreshToken = localStorage.getItem('refresh_token');
  
  if (accessToken && isTokenExpired(accessToken)) {
    console.log('Clearing expired access token');
    localStorage.removeItem('access_token');
  }
  
  if (refreshToken && isTokenExpired(refreshToken)) {
    console.log('Clearing expired refresh token');
    localStorage.removeItem('refresh_token');
  }
};

export const clearAllTokens = (): void => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  console.log('All tokens cleared');
};
