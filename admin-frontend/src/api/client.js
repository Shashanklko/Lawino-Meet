import axios from 'axios';
import { DOMAIN_CONFIG } from '../utils/domainConfig';

const apiClient = axios.create({
  baseURL: DOMAIN_CONFIG.API_GATEWAY_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('lawino_admin_token') || localStorage.getItem('lawino_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isLoginRequest = error.config?.url?.includes('/api/auth/login');
      if (!isLoginRequest && typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        console.warn('Session expired or unauthorized. Clearing credentials.');
        localStorage.removeItem('lawino_admin_token');
        localStorage.removeItem('lawino_admin_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
