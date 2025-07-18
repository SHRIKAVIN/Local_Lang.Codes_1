import { API_ENDPOINTS } from '../config';

// Function to refresh the token
const refreshToken = async () => {
  const refresh_token = localStorage.getItem('refresh_token');
  if (!refresh_token) {
    console.error('No refresh token available');
    throw new Error('No refresh token available');
  }

  try {
    console.log('Attempting to refresh token...');
    const response = await fetch(API_ENDPOINTS.REFRESH_TOKEN, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error('Token refresh failed:', data.error);
      throw new Error(data.error || 'Failed to refresh token');
    }

    console.log('Token refresh successful');
    // Update tokens in localStorage
    localStorage.setItem('token', data.token);
    localStorage.setItem('refresh_token', data.refresh_token);
    return data.token;
  } catch (error) {
    console.error('Token refresh error:', error);
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
    console.error('No access token available');
    throw new Error('No token available');
  }

  // Add authorization header
  const headers = {
    ...options.headers,
    'Authorization': `Bearer ${token}`,
  };

  try {
    console.log('Making authenticated request to:', url);
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();

    // If token expired, try to refresh and retry the request
    if (response.status === 401) {
      console.log('Token expired, attempting to refresh...');
      if (data.code === 'TOKEN_EXPIRED') {
        try {
          const newToken = await refreshToken();
          console.log('Token refreshed successfully, retrying request...');
          // Retry the request with the new token
          const newHeaders = {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          };
          const retryResponse = await fetch(url, { ...options, headers: newHeaders });
          const retryData = await retryResponse.json();
          
          if (!retryResponse.ok) {
            console.error('Retry request failed:', retryData);
            throw new Error(retryData.error || 'Request failed after token refresh');
          }
          
          return retryData;
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError);
          // If refresh fails, redirect to login
          window.location.href = '/login';
          throw refreshError;
        }
      } else {
        console.error('Unauthorized request:', data);
        window.location.href = '/login';
        throw new Error(data.error || 'Unauthorized request');
      }
    }

    if (!response.ok) {
      console.error('Request failed:', data);
      throw new Error(data.error || 'Request failed');
    }

    return data;
  } catch (error) {
    console.error('Request error:', error);
    if (error.message === 'No refresh token available') {
      window.location.href = '/login';
    }
    throw error;
  }
};