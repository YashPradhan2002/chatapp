// API utility functions
import { getApiUrl } from './api';

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('uchat_token');
};

// Generic API call function
export const apiCall = async (endpoint, options = {}) => {
  const url = getApiUrl(endpoint);
  const token = getAuthToken();
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  // Add authorization header if token exists
  if (token) {
    defaultOptions.headers.Authorization = `Bearer ${token}`;
  }

  const finalOptions = { ...defaultOptions, ...options };

  try {
    const response = await fetch(url, finalOptions);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
};

// Authentication functions
export const login = (credentials) => {
  return apiCall('LOGIN', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });
};

export const register = (userData) => {
  return apiCall('REGISTER', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const logout = () => {
  return apiCall('LOGOUT', {
    method: 'POST',
  });
};

export const getCurrentUser = () => {
  return apiCall('ME');
};

// Other API functions
export const getProfiles = () => {
  return apiCall('PROFILES');
};

export const getMessages = () => {
  return apiCall('MESSAGES');
};

export const checkHealth = () => {
  return apiCall('HEALTH');
};
