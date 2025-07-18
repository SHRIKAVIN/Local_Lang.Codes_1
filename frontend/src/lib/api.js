// API Configuration for SQLite backend
const API_BASE_URL = 'http://localhost:5007';

// API Endpoints
export const API_ENDPOINTS = {
  SIGNUP: `${API_BASE_URL}/api/auth/signup`,
  SIGNIN: `${API_BASE_URL}/api/auth/signin`,
  ME: `${API_BASE_URL}/api/auth/me`,
  PROFILE: `${API_BASE_URL}/api/profile`,
  PROFILE_HISTORY: `${API_BASE_URL}/api/profile/history`,
  PROCESS: `${API_BASE_URL}/process`,
  GENERATE_APP_PLAN: `${API_BASE_URL}/generate_app_plan`,
  GENERATE_CODE_FROM_PLAN: `${API_BASE_URL}/generate-code-from-plan`,
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('auth_token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// API functions
export const authAPI = {
  signup: async (userData) => {
    const response = await fetch(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return response.json();
  },

  signin: async (credentials) => {
    const response = await fetch(API_ENDPOINTS.SIGNIN, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(credentials)
    });
    return response.json();
  },

  getCurrentUser: async () => {
    const response = await fetch(API_ENDPOINTS.ME, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

export const profileAPI = {
  getProfile: async () => {
    const response = await fetch(API_ENDPOINTS.PROFILE, {
      headers: getAuthHeaders()
    });
    return response.json();
  },

  updateProfile: async (updates) => {
    const response = await fetch(API_ENDPOINTS.PROFILE, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(updates)
    });
    return response.json();
  },

  getHistory: async () => {
    const response = await fetch(API_ENDPOINTS.PROFILE_HISTORY, {
      headers: getAuthHeaders()
    });
    return response.json();
  }
};

export const generationAPI = {
  processGeneration: async (data) => {
    const response = await fetch(API_ENDPOINTS.PROCESS, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  generateAppPlan: async (data) => {
    const response = await fetch(API_ENDPOINTS.GENERATE_APP_PLAN, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  },

  generateCodeFromPlan: async (data) => {
    const response = await fetch(API_ENDPOINTS.GENERATE_CODE_FROM_PLAN, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data)
    });
    return response.json();
  }
};