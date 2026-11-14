import apiClient from './client';

export const notificationApi = {
  getMyNotifications: async (page = 0, size = 20) => {
    const res = await apiClient.get('/api/notifications', { params: { page, size } });
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get('/api/notifications/unread-count');
    return res.data;
  },
  markAsRead: async (notificationPublicId) => {
    const res = await apiClient.put(`/api/notifications/${notificationPublicId}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.put('/api/notifications/read-all');
    return res.data;
  },
};
