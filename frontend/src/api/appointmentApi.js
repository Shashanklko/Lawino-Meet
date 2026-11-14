import apiClient from './client';

export const appointmentApi = {
  // Availability Slots
  createSlot: async (data) => {
    const res = await apiClient.post('/api/slots', data);
    return res.data;
  },
  batchCreateSlots: async (data) => {
    const res = await apiClient.post('/api/slots/batch', data);
    return res.data;
  },
  getLawyerSlots: async (lawyerPublicId, params = {}) => {
    const res = await apiClient.get(`/api/slots/lawyer/${lawyerPublicId}`, { params });
    return res.data;
  },
  getMySlots: async (params = {}) => {
    const res = await apiClient.get('/api/slots/me', { params });
    return res.data;
  },
  deleteSlot: async (slotPublicId) => {
    const res = await apiClient.delete(`/api/slots/${slotPublicId}`);
    return res.data;
  },

  // Appointments
  reserveAppointment: async (data) => {
    const res = await apiClient.post('/api/appointments', data);
    return res.data;
  },
  confirmAppointment: async (appointmentPublicId) => {
    const res = await apiClient.post(`/api/appointments/${appointmentPublicId}/confirm`);
    return res.data;
  },
  cancelAppointment: async (appointmentPublicId, reason) => {
    const res = await apiClient.post(`/api/appointments/${appointmentPublicId}/cancel`, { cancellationReason: reason });
    return res.data;
  },
  getMyAppointments: async (params = {}) => {
    const res = await apiClient.get('/api/appointments/me', { params });
    return res.data;
  },
  getAppointmentByPublicId: async (appointmentPublicId) => {
    const res = await apiClient.get(`/api/appointments/${appointmentPublicId}`);
    return res.data;
  },
  getFirmAppointments: async (firmPublicId, params = {}) => {
    const res = await apiClient.get(`/api/appointments/firm/${firmPublicId}`, { params });
    return res.data;
  },
};
