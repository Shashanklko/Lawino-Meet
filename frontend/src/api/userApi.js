import apiClient from './client';

export const userApi = {
  // Client Profile
  getClientProfile: async () => {
    const res = await apiClient.get('/api/users/profile');
    return res.data;
  },
  updateClientProfile: async (data) => {
    const res = await apiClient.put('/api/users/profile', data);
    return res.data;
  },
  uploadClientPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/users/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  // Lawyer Profile & Search
  getLawyerMe: async () => {
    const res = await apiClient.get('/api/lawyers/me');
    return res.data;
  },
  updateLawyerProfile: async (data) => {
    const res = await apiClient.put('/api/lawyers/profile', data);
    return res.data;
  },
  uploadLawyerPhoto: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post('/api/lawyers/profile/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  getLawyerByPublicId: async (lawyerPublicId) => {
    const res = await apiClient.get(`/api/lawyers/${lawyerPublicId}`);
    return res.data;
  },
  searchLawyers: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/search/lawyers', { params });
      return res.data;
    } catch {
      try {
        const res = await apiClient.get('/api/lawyers', { params });
        return res.data;
      } catch {
        return { success: false, data: [] };
      }
    }
  },

  // Lawyer Legal Services
  getLawyerServices: async (lawyerPublicId) => {
    const res = await apiClient.get(`/api/lawyers/${lawyerPublicId}/services`);
    return res.data;
  },
  createLawyerService: async (data) => {
    const res = await apiClient.post('/api/lawyers/me/services', data);
    return res.data;
  },

  // Law Firms
  getFirms: async (params = {}) => {
    const res = await apiClient.get('/api/firms', { params });
    return res.data;
  },
  getFirmByPublicId: async (firmPublicId) => {
    const res = await apiClient.get(`/api/firms/${firmPublicId}`);
    return res.data;
  },
  createFirm: async (data) => {
    const res = await apiClient.post('/api/firms', data);
    return res.data;
  },
  getFirmMembers: async (firmPublicId) => {
    const res = await apiClient.get(`/api/firms/${firmPublicId}/members`);
    return res.data;
  },
  inviteLawyerToFirm: async (firmPublicId, data) => {
    const res = await apiClient.post(`/api/firms/${firmPublicId}/members`, data);
    return res.data;
  },
  respondToFirmInvite: async (firmPublicId, accept) => {
    const res = await apiClient.post(`/api/firms/${firmPublicId}/members/respond`, { accept });
    return res.data;
  },
};
