import { API_ENDPOINTS } from '../config';

// Function to refresh the token
const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) {
    throw new Error('No refresh token available');
  }

  try {
    const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Failed to refresh token');
    }

    // Update tokens in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data.token;
  } catch (error) {
    // If refresh fails, clear all auth data and throw error
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    throw error;
  }
};

// Function to make authenticated API calls with automatic token refresh
export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  if (!token) {
    throw new Error('No token available');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    // If token expired, try to refresh and retry the request
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED') {
      const newToken = await refreshToken();
      // Retry the request with the new token
      const newHeaders = {
        ...options.headers,
        'Authorization': `Bearer ${newToken}`,
      };
      const retryResponse = await fetch(url, { ...options, headers: newHeaders });
      return retryResponse.json();
    }

    return data;
  } catch (error) {
    if (error.message === 'No refresh token available') {
      // If no refresh token, redirect to login
      window.location.href = '/login';
    }
    throw error;
  }
}; 