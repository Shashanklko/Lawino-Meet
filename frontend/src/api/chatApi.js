import apiClient from './client';

export const chatApi = {
  getOrCreateConversation: async (recipientPublicId, recipientUsername = null, appointmentPublicId = null) => {
    const res = await apiClient.post('/api/chat/conversations', {
      recipientPublicId,
      recipientUsername,
      appointmentPublicId,
    });
    return res.data;
  },
  getAppointmentConversation: async (appointmentPublicId) => {
    const res = await apiClient.get(`/api/chat/appointment/${appointmentPublicId}`);
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
  sendMessage: async (conversationPublicId, content, reply = null) => {
    const payload = { content };
    if (reply) {
      payload.replyToMessagePublicId = reply.replyToMessagePublicId || reply.publicId;
      payload.replyToSenderName = reply.replyToSenderName || reply.senderName;
      payload.replyToContent = reply.replyToContent || reply.content;
    }
    const res = await apiClient.post(`/api/chat/conversations/${conversationPublicId}/messages`, payload);
    return res.data;
  },
  deleteMessage: async (messagePublicId, deleteType = 'SELF') => {
    const res = await apiClient.delete(`/api/chat/messages/${messagePublicId}`, {
      params: { deleteType },
    });
    return res.data;
  },
  uploadAttachment: async (conversationPublicId, file, caption = '') => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    const res = await apiClient.post(`/api/chat/conversations/${conversationPublicId}/attachments`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },
  markConversationAsRead: async (conversationPublicId) => {
    const res = await apiClient.patch(`/api/chat/conversations/${conversationPublicId}/read`);
    return res.data;
  },
  closeConversation: async (conversationPublicId) => {
    const res = await apiClient.post(`/api/chat/conversations/${conversationPublicId}/close`);
    return res.data;
  },
  getUnreadCount: async () => {
    const res = await apiClient.get('/api/chat/unread-count');
    return res.data;
  },
};
