import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const isDemo = localStorage.getItem('kukkutpro_demo_mode') === 'true';
  if (isDemo) {
    config.headers['x-demo-mode'] = 'true';
  } else {
    const activeFarmId = localStorage.getItem('kukkutpro_active_farm_id');
    if (activeFarmId) {
      config.headers['x-farm-id'] = activeFarmId;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject({
      error: error.message || 'Network error occurred',
      code: 'NETWORK_ERROR',
    });
  }
);
