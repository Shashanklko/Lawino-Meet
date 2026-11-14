import apiClient from './client';

export const authApi = {
  register: async (data) => {
    const res = await apiClient.post('/api/auth/register', data);
    return res.data;
  },
  login: async (credentials) => {
    const res = await apiClient.post('/api/auth/login', credentials);
    return res.data;
  },
  logout: async () => {
    try {
      await apiClient.post('/api/auth/logout');
    } catch {
      // Ignore logout network failure on client
    } finally {
      localStorage.removeItem('lawino_token');
      localStorage.removeItem('lawino_refresh_token');
      localStorage.removeItem('lawino_user');
    }
  },
  getMe: async () => {
    const res = await apiClient.get('/api/auth/me');
    return res.data;
  },
  refreshToken: async (refreshToken) => {
    const res = await apiClient.post('/api/auth/refresh-token', { refreshToken });
    return res.data;
  },
};
