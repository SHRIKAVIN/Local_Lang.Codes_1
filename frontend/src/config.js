// API Configuration for app.py backend on Render.com
export const API_BASE_URL = 'https://local-lang-codes-1-4vgm.onrender.com';

// API Endpoints matching your app.py backend
export const API_ENDPOINTS = {
  LOGIN: `${API_BASE_URL}/login`,
  SIGNUP: `${API_BASE_URL}/signup`,
  USER: `${API_BASE_URL}/user`,
  PROCESS: `${API_BASE_URL}/process`,
  GENERATE_APP_PLAN: `${API_BASE_URL}/generate_app_plan`,
  GENERATE_CODE_FROM_PLAN: `${API_BASE_URL}/generate-code-from-plan`,
  HISTORY: `${API_BASE_URL}/history`,
  REFRESH_TOKEN: `${API_BASE_URL}/refresh-token`,
};