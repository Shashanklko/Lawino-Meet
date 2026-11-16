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

export default apiClient;
