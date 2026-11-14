import apiClient from './client';

export const meetingApi = {
  createMeetingRoom: async (appointmentPublicId) => {
    const res = await apiClient.post('/api/meetings/rooms', { appointmentPublicId });
    return res.data;
  },
  getMeetingRoom: async (roomPublicId) => {
    const res = await apiClient.get(`/api/meetings/rooms/${roomPublicId}`);
    return res.data;
  },
  getRoomByAppointment: async (appointmentPublicId) => {
    const res = await apiClient.get(`/api/meetings/rooms/appointment/${appointmentPublicId}`);
    return res.data;
  },
  joinMeeting: async (roomPublicId) => {
    const res = await apiClient.post(`/api/meetings/rooms/${roomPublicId}/join`);
    return res.data;
  },
  leaveMeeting: async (roomPublicId) => {
    const res = await apiClient.post(`/api/meetings/rooms/${roomPublicId}/leave`);
    return res.data;
  },
  endMeeting: async (roomPublicId) => {
    const res = await apiClient.post(`/api/meetings/rooms/${roomPublicId}/end`);
    return res.data;
  },
  getIceServers: async (roomPublicId) => {
    const res = await apiClient.get(`/api/meetings/rooms/${roomPublicId}/ice-servers`);
    return res.data;
  },
};
