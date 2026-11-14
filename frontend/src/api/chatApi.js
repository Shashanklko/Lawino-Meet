import apiClient from './client';

export const chatApi = {
  getOrCreateConversation: async (recipientPublicId) => {
    const res = await apiClient.post('/api/chat/conversations', { recipientPublicId });
    return res.data;
  },
  getMyConversations: async () => {
    const res = await apiClient.get('/api/chat/conversations');
    return res.data;
  },
  getMessages: async (conversationPublicId, page = 0, size = 50) => {
    const res = await apiClient.get(`/api/chat/conversations/${conversationPublicId}/messages`, {
      params: { page, size },
    });
    return res.data;
  },
  sendMessage: async (conversationPublicId, content) => {
    const res = await apiClient.post(`/api/chat/conversations/${conversationPublicId}/messages`, { content });
    return res.data;
  },
  markConversationAsRead: async (conversationPublicId) => {
    const res = await apiClient.put(`/api/chat/conversations/${conversationPublicId}/read`);
    return res.data;
  },
};
