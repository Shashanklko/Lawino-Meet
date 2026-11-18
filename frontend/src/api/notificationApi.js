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
    const res = await apiClient.patch(`/api/notifications/${notificationPublicId}/read`);
    return res.data;
  },
  markAllAsRead: async () => {
    const res = await apiClient.patch('/api/notifications/mark-all-read');
    return res.data;
  },
  deleteNotification: async (notificationPublicId) => {
    const res = await apiClient.delete(`/api/notifications/${notificationPublicId}`);
    return res.data;
  },
};
