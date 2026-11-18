import apiClient from './client';

export const meetingApi = {
  createMeetingRoom: async (appointmentPublicId, clientUserPublicId, clientUsername, lawyerUserPublicId, lawyerUsername) => {
    const res = await apiClient.post('/api/meetings/rooms', {
      appointmentPublicId,
      clientUserPublicId,
      clientUsername,
      lawyerUserPublicId,
      lawyerUsername,
    });
    return res.data;
  },
  getMeetingRoom: async (roomPublicId) => {
    const res = await apiClient.get(`/api/meetings/rooms/${roomPublicId}`);
    return res.data;
  },
  getRoomByAppointment: async (appointmentPublicId) => {
    const res = await apiClient.get(`/api/meetings/appointments/${appointmentPublicId}/room`);
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
    const res = await apiClient.patch(`/api/meetings/rooms/${roomPublicId}/end`);
    return res.data;
  },
  getIceServers: async () => {
    const res = await apiClient.get('/api/meetings/ice-servers');
    return res.data;
  },
};
