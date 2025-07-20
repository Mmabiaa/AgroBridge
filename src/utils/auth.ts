// Authentication utilities for AgroBridge

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  location?: string;
  farmSize?: string;
  experience?: string;
  crops?: string[];
  language?: string;
  timezone?: string;
}

// Mock user data
export const mockUser: User = {
  id: 'user123',
  name: 'Kwame Addo',
  email: 'kwame.addo@email.com',
  location: 'Kumasi, Ashanti Region',
  farmSize: 'Medium (1-5 acres)',
  experience: 'intermediate',
  crops: ['Tomatoes', 'Maize', 'Yam'],
  language: 'en',
  timezone: 'Africa/Accra'
};

// Check if user is logged in
export const isLoggedIn = (): boolean => {
  const userData = localStorage.getItem('agroBridgeUser');
  return !!userData;
};

// Get current user data
export const getCurrentUser = (): User | null => {
  const userData = localStorage.getItem('agroBridgeUser');
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
  return null;
};

// Set user data
export const setUserData = (user: User): void => {
  localStorage.setItem('agroBridgeUser', JSON.stringify(user));
};

// Logout function
export const logout = async (): Promise<void> => {
  // Clear all user-related data from localStorage
  const keysToRemove = [
    'agroBridgeUser',
    'agroBridgeNotifications',
    'agroBridgeNotificationSettings',
    'userCropScans',
    'agroBridgeSettings',
    'agroBridgeMarketplaceData',
    'agroBridgeAnalyticsData',
    'agroBridgeCalendarData'
  ];

  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });

  // Clear session storage as well
  sessionStorage.clear();

  // Simulate API call to logout
  await new Promise(resolve => setTimeout(resolve, 1000));
};

// Login function (for future use)
export const login = async (email: string, password: string): Promise<User> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // For now, return mock user
  setUserData(mockUser);
  return mockUser;
};

// Initialize user data (for development/testing)
export const initializeUserData = (): void => {
  if (!isLoggedIn()) {
    setUserData(mockUser);
  }
}; 