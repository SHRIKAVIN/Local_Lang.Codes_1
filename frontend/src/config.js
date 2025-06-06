// API Configuration
export const API_BASE_URL = 'http://localhost:5007';  // Update this to match your backend port

// API Endpoints
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  SIGNUP: `${API_BASE_URL}/signup`,
  USER: `${API_BASE_URL}/user`,
  PROCESS: `${API_BASE_URL}/process`,
  GENERATE_APP_PLAN: `${API_BASE_URL}/generate_app_plan`,
  GENERATE_CODE_FROM_PLAN: `${API_BASE_URL}/generate_code_from_plan`,
  HISTORY: `${API_BASE_URL}/history`,
}; 