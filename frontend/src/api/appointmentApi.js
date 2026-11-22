import apiClient from './client';

export const normalizeAppointment = (apt) => {
  if (!apt) return apt;
  const status = (apt.status || apt.appointmentStatus || 'PENDING').toUpperCase();
  const rawNotes = apt.clientNotes || apt.consultationReason || '';

  // Determine consultation mode precisely
  const rawType = (apt.consultationType || '').toUpperCase();
  const isChatOnly = rawType === 'CHAT' || rawNotes.includes('[CHAT]');
  const isInPerson = rawType === 'IN_PERSON' || rawType === 'OFFLINE' || rawNotes.includes('[IN_PERSON]') || rawNotes.includes('[OFFLINE]');
  const isOnline = !isChatOnly && !isInPerson && (rawType === 'ONLINE' || rawNotes.includes('[ONLINE]') || apt.service?.mode === 'ONLINE' || (!rawType && !rawNotes));

  const consultationType = isChatOnly ? 'CHAT' : isInPerson ? 'IN_PERSON' : 'ONLINE';

  const clientName =
    apt.client?.fullName ||
    apt.clientFullName ||
    (apt.clientUsername ? apt.clientUsername.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : 'Rohit Verma');

  const lawyerName =
    apt.lawyer?.fullName ||
    apt.lawyerFullName ||
    (apt.lawyerUsername ? `Adv. ${apt.lawyerUsername.replace('adv_', '').replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}` : 'Adv. Raghavan Nambiar');

  const fee = apt.fee || apt.price || apt.servicePrice || 1500;
  const isPaid = apt.paymentStatus === 'PAID' || status === 'CONFIRMED' || status === 'IN_PROGRESS' || status === 'COMPLETION_REQUESTED' || status === 'COMPLETED';

  // Chamber address revealing logic
  let chamberAddress = apt.chamberAddress;
  let directionsInstructions = apt.directionsInstructions;
  let chamberAddressRevealed = apt.chamberAddressRevealed || false;

  if (isInPerson) {
    if (isPaid) {
      chamberAddress = chamberAddress || apt.lawyer?.chamberAddress || 'Advocate Chambers, High Court Complex, New Delhi - 110001';
      directionsInstructions = directionsInstructions || 'Report to Chamber Reception 10 minutes prior with your appointment reference and photo ID.';
      chamberAddressRevealed = true;
    } else {
      chamberAddress = 'Chamber address & directions will be revealed upon payment verification.';
      directionsInstructions = 'Address locked until retainer payment is completed.';
      chamberAddressRevealed = false;
    }
  }

  return {
    ...apt,
    status,
    appointmentStatus: status,
    consultationType,
    isOnline,
    isInPerson,
    isChatOnly,
    fee,
    paymentStatus: isPaid ? 'PAID' : (apt.paymentStatus || 'UNPAID'),
    paymentMethod: apt.paymentMethod || 'WALLET',
    paidAt: apt.paidAt,
    chamberAddress,
    directionsInstructions,
    chamberAddressRevealed,
    alternativeSlotPublicId: apt.alternativeSlotPublicId,
    preferredSlotsJson: apt.preferredSlotsJson,
    completionRequestedAt: apt.completionRequestedAt,
    autoReleaseAt: apt.autoReleaseAt,
    clientConfirmedAt: apt.clientConfirmedAt,
    settledAt: apt.settledAt,
    settlementStatus: apt.settlementStatus || (status === 'COMPLETED' ? 'SETTLED' : 'UNSETTLED'),
    appointmentId: apt.appointmentId || apt.publicId?.slice(0, 12) || `APT-${Date.now().toString().slice(-4)}`,
    clientNotes: rawNotes,
    consultationReason: rawNotes,
    practiceType: apt.practiceType || (apt.firmPublicId ? 'FIRM' : 'INDEPENDENT'),
    client: {
      fullName: clientName,
      username: apt.clientUsername || 'rohit_client',
      userPublicId: apt.clientUserPublicId,
      email: apt.client?.email || `${apt.clientUsername || 'rohit_client'}@example.com`,
      phone: apt.client?.phone || '+91 98102 33491',
    },
    lawyer: {
      fullName: lawyerName,
      username: apt.lawyerUsername || 'adv_raghavan',
      userPublicId: apt.lawyerUserPublicId,
      specialization: apt.specialization || 'Corporate & Commercial Law',
      barCouncilNumber: apt.barCouncilNumber || 'D/1482/2009',
      chamberAddress: chamberAddress,
      city: apt.lawyer?.city || 'Delhi',
    },
    service: apt.service || {
      title: `${isChatOnly ? 'Live Chat' : isOnline ? 'Video' : 'In-Chamber'} Legal Advisory`,
      price: fee,
      mode: consultationType,
    },
    slot: apt.slot || {
      startTime: apt.requestedAt || new Date().toISOString(),
      endTime: new Date(Date.now() + 2700000).toISOString(),
    },
  };
};

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
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  confirmAppointment: async (appointmentPublicId, data = null) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/accept`, data || {});
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  updateChamberAddress: async (appointmentPublicId, data) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/chamber-address`, data || {});
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  rescheduleAppointment: async (appointmentPublicId, data) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/reschedule`, data || {});
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  rejectAppointment: async (appointmentPublicId, reason) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/reject`, { reason });
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  payAppointment: async (appointmentPublicId) => {
    const res = await apiClient.post(`/api/appointments/${appointmentPublicId}/pay`);
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  requestCompletion: async (appointmentPublicId) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/request-completion`);
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  confirmCompletion: async (appointmentPublicId) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/confirm-completion`);
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  completeAppointment: async (appointmentPublicId) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/complete`);
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  cancelAppointment: async (appointmentPublicId, reason) => {
    const res = await apiClient.patch(`/api/appointments/${appointmentPublicId}/cancel`, { reason });
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  getMyAppointments: async (params = {}) => {
    try {
      const userStr = localStorage.getItem('lawino_user');
      const user = userStr ? JSON.parse(userStr) : null;
      const isLawyer = user?.role === 'LAWYER' || user?.role === 'ADVOCATE';
      const endpoint = isLawyer ? '/api/appointments/lawyer/me' : '/api/appointments/me';
      const res = await apiClient.get(endpoint, { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        res.data.data = res.data.data.map(normalizeAppointment);
      }
      return res.data;
    } catch {
      return { success: false, data: [] };
    }
  },
  getLawyerAppointments: async (params = {}) => {
    try {
      const res = await apiClient.get('/api/appointments/lawyer/me', { params });
      if (res.data?.data && Array.isArray(res.data.data)) {
        res.data.data = res.data.data.map(normalizeAppointment);
      }
      return res.data;
    } catch {
      return { success: false, data: [] };
    }
  },
  getAppointmentByPublicId: async (appointmentPublicId) => {
    const res = await apiClient.get(`/api/appointments/${appointmentPublicId}`);
    if (res.data?.data) {
      res.data.data = normalizeAppointment(res.data.data);
    }
    return res.data;
  },
  getFirmAppointments: async (firmPublicId, params = {}) => {
    const res = await apiClient.get(`/api/appointments/firm/${firmPublicId}`, { params });
    if (res.data?.data && Array.isArray(res.data.data)) {
      res.data.data = res.data.data.map(normalizeAppointment);
    }
    return res.data;
  },
};
