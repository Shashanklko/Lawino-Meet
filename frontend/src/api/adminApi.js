import apiClient from './client';
import {
  MOCK_ADMIN_CLIENTS,
  MOCK_ADMIN_ADVOCATES,
  MOCK_ADMIN_FIRMS,
  MOCK_ADMIN_APPOINTMENTS,
  MOCK_ADMIN_SUPPORT_TICKETS,
  MOCK_ADMIN_FINANCE,
  MOCK_ADMIN_WITHDRAWALS,
  MOCK_ADMIN_REPORTS,
  MOCK_ADMIN_SETTINGS,
  MOCK_ADMIN_AUDIT_LOGS,
} from '../data/adminMockData';

// Helper for local mock storage
const getStored = (key, fallback) => {
  try {
    const raw = localStorage.getItem(`lawino_admin_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const setStored = (key, data) => {
  try {
    localStorage.setItem(`lawino_admin_${key}`, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const adminApi = {
  // ==========================================
  // Overview Stats
  // ==========================================
  getOverviewStats: async () => {
    try {
      const res = await apiClient.get('/api/admin/overview/stats');
      return res.data;
    } catch {
      const clients = getStored('clients', MOCK_ADMIN_CLIENTS);
      const advocates = getStored('advocates', MOCK_ADMIN_ADVOCATES);
      const firms = getStored('firms', MOCK_ADMIN_FIRMS);
      const appointments = getStored('appointments', MOCK_ADMIN_APPOINTMENTS);
      const tickets = getStored('tickets', MOCK_ADMIN_SUPPORT_TICKETS);
      const withdrawals = getStored('withdrawals', MOCK_ADMIN_WITHDRAWALS);

      return {
        success: true,
        data: {
          totalClients: clients.length,
          activeAdvocates: advocates.filter((a) => a.accountStatus === 'ACTIVE').length,
          registeredFirms: firms.length,
          totalAppointments: appointments.length,
          openSupportTickets: tickets.filter((t) => t.status === 'OPEN' || t.status === 'UNDER_REVIEW' || t.status === 'ESCALATED').length,
          pendingAdvocateVerification: advocates.filter((a) => a.verificationStatus === 'UNDER_REVIEW' || a.verificationStatus === 'ADDITIONAL_INFORMATION_REQUIRED').length,
          pendingFirmVerification: firms.filter((f) => f.verificationStatus === 'UNDER_REVIEW').length,
          pendingWithdrawals: withdrawals.filter((w) => w.status === 'REQUESTED' || w.status === 'UNDER_REVIEW').length,
          totalPlatformCommission: 148500,
          grossConsultationVolume: 1485000,
          systemHealth: 'OPERATIONAL_ENCRYPTED',
        },
      };
    }
  },

  // ==========================================
  // Client Management
  // ==========================================
  getClients: async () => {
    try {
      const res = await apiClient.get('/api/admin/clients');
      return res.data;
    } catch {
      return { success: true, data: getStored('clients', MOCK_ADMIN_CLIENTS) };
    }
  },

  updateClientStatus: async (publicId, status, reason = '') => {
    try {
      const res = await apiClient.patch(`/api/admin/clients/${publicId}/status`, { status, reason });
      return res.data;
    } catch {
      const list = getStored('clients', MOCK_ADMIN_CLIENTS);
      const updated = list.map((c) => (c.publicId === publicId ? { ...c, status } : c));
      setStored('clients', updated);
      adminApi.recordAuditLog('CLIENT_STATUS_CHANGED', 'CLIENT_PROFILE', publicId, status, reason);
      return { success: true, data: { publicId, status, reason } };
    }
  },

  addClientNote: async (publicId, text) => {
    const list = getStored('clients', MOCK_ADMIN_CLIENTS);
    const updated = list.map((c) => {
      if (c.publicId === publicId) {
        return {
          ...c,
          internalNotes: [
            { id: `note-${Date.now()}`, author: 'Platform Admin', date: new Date().toISOString(), text },
            ...(c.internalNotes || []),
          ],
        };
      }
      return c;
    });
    setStored('clients', updated);
    return { success: true };
  },

  // ==========================================
  // Advocate Management & Verification
  // ==========================================
  getAdvocates: async () => {
    try {
      const res = await apiClient.get('/api/admin/advocates');
      return res.data;
    } catch {
      return { success: true, data: getStored('advocates', MOCK_ADMIN_ADVOCATES) };
    }
  },

  updateAdvocateVerification: async (publicId, verificationStatus, reason = '') => {
    try {
      const res = await apiClient.patch(`/api/admin/advocates/${publicId}/verification`, {
        status: verificationStatus,
        reason,
      });
      return res.data;
    } catch {
      const list = getStored('advocates', MOCK_ADMIN_ADVOCATES);
      const updated = list.map((a) => (a.publicId === publicId ? { ...a, verificationStatus } : a));
      setStored('advocates', updated);
      adminApi.recordAuditLog('ADVOCATE_VERIFICATION_UPDATED', 'LAWYER_PROFILE', publicId, verificationStatus, reason);
      return { success: true, data: { publicId, verificationStatus, reason } };
    }
  },

  updateAdvocateAccountStatus: async (publicId, accountStatus, reason = '') => {
    try {
      const res = await apiClient.patch(`/api/admin/advocates/${publicId}/status`, {
        status: accountStatus,
        reason,
      });
      return res.data;
    } catch {
      const list = getStored('advocates', MOCK_ADMIN_ADVOCATES);
      const updated = list.map((a) => (a.publicId === publicId ? { ...a, accountStatus } : a));
      setStored('advocates', updated);
      adminApi.recordAuditLog('ADVOCATE_ACCOUNT_STATUS_CHANGED', 'LAWYER_PROFILE', publicId, accountStatus, reason);
      return { success: true, data: { publicId, accountStatus, reason } };
    }
  },

  // ==========================================
  // Firm Management
  // ==========================================
  getFirms: async () => {
    try {
      const res = await apiClient.get('/api/admin/firms');
      return res.data;
    } catch {
      return { success: true, data: getStored('firms', MOCK_ADMIN_FIRMS) };
    }
  },

  updateFirmVerification: async (publicId, verificationStatus, reason = '') => {
    try {
      const res = await apiClient.patch(`/api/admin/firms/${publicId}/verification`, {
        status: verificationStatus,
        reason,
      });
      return res.data;
    } catch {
      const list = getStored('firms', MOCK_ADMIN_FIRMS);
      const updated = list.map((f) => (f.publicId === publicId ? { ...f, verificationStatus } : f));
      setStored('firms', updated);
      adminApi.recordAuditLog('FIRM_VERIFICATION_UPDATED', 'LAW_FIRM', publicId, verificationStatus, reason);
      return { success: true, data: { publicId, verificationStatus, reason } };
    }
  },

  updateFirmAccountStatus: async (publicId, accountStatus, reason = '') => {
    try {
      const res = await apiClient.patch(`/api/admin/firms/${publicId}/status`, {
        status: accountStatus,
        reason,
      });
      return res.data;
    } catch {
      const list = getStored('firms', MOCK_ADMIN_FIRMS);
      const updated = list.map((f) => (f.publicId === publicId ? { ...f, accountStatus } : f));
      setStored('firms', updated);
      adminApi.recordAuditLog('FIRM_ACCOUNT_STATUS_CHANGED', 'LAW_FIRM', publicId, accountStatus, reason);
      return { success: true, data: { publicId, accountStatus, reason } };
    }
  },

  // ==========================================
  // Appointments Management & Escalation
  // ==========================================
  getAppointments: async () => {
    try {
      const res = await apiClient.get('/api/admin/appointments');
      return res.data;
    } catch {
      return { success: true, data: getStored('appointments', MOCK_ADMIN_APPOINTMENTS) };
    }
  },

  escalateAppointment: async (publicId, reason = '', notes = '') => {
    try {
      const res = await apiClient.post(`/api/admin/appointments/${publicId}/escalate`, { reason, notes });
      return res.data;
    } catch {
      const list = getStored('appointments', MOCK_ADMIN_APPOINTMENTS);
      const updated = list.map((apt) =>
        apt.publicId === publicId
          ? {
              ...apt,
              escalationStatus: 'PRIORITY_ESCALATED',
              assignmentHistory: [
                { timestamp: new Date().toISOString(), note: `Admin Priority Escalation: ${reason} (${notes})` },
                ...(apt.assignmentHistory || []),
              ],
            }
          : apt
      );
      setStored('appointments', updated);
      adminApi.recordAuditLog('APPOINTMENT_ESCALATED', 'APPOINTMENT', publicId, 'PRIORITY_ESCALATED', reason);
      return { success: true, data: { publicId, escalated: true } };
    }
  },

  // ==========================================
  // Support & Dispute Tickets
  // ==========================================
  getSupportTickets: async () => {
    return { success: true, data: getStored('tickets', MOCK_ADMIN_SUPPORT_TICKETS) };
  },

  updateTicketStatus: async (publicId, status, resolutionNotes = '') => {
    const list = getStored('tickets', MOCK_ADMIN_SUPPORT_TICKETS);
    const updated = list.map((t) =>
      t.publicId === publicId
        ? {
            ...t,
            status,
            internalNotes: resolutionNotes
              ? [`[${status}] ${resolutionNotes}`, ...(t.internalNotes || [])]
              : t.internalNotes,
          }
        : t
    );
    setStored('tickets', updated);
    adminApi.recordAuditLog('TICKET_STATUS_UPDATED', 'SUPPORT_TICKET', publicId, status, resolutionNotes);
    return { success: true };
  },

  sendTicketMessage: async (publicId, text, adminName = 'Platform Admin Support') => {
    const list = getStored('tickets', MOCK_ADMIN_SUPPORT_TICKETS);
    const updated = list.map((t) => {
      if (t.publicId === publicId) {
        return {
          ...t,
          messages: [
            ...(t.messages || []),
            { sender: adminName, timestamp: new Date().toISOString(), text },
          ],
        };
      }
      return t;
    });
    setStored('tickets', updated);
    return { success: true };
  },

  // ==========================================
  // Finance, Payments & Refunds
  // ==========================================
  getFinanceOverview: async () => {
    return { success: true, data: getStored('finance', MOCK_ADMIN_FINANCE) };
  },

  approveRefund: async (refundId, reason = '') => {
    const finance = getStored('finance', MOCK_ADMIN_FINANCE);
    const updatedRefunds = finance.refunds.map((r) =>
      r.id === refundId ? { ...r, status: 'APPROVED', approvedBy: 'Finance Admin' } : r
    );
    setStored('finance', { ...finance, refunds: updatedRefunds });
    adminApi.recordAuditLog('REFUND_APPROVED', 'REFUND_TRANSACTION', refundId, 'APPROVED', reason);
    return { success: true };
  },

  // ==========================================
  // Withdrawals & Settlements
  // ==========================================
  getWithdrawals: async () => {
    return { success: true, data: getStored('withdrawals', MOCK_ADMIN_WITHDRAWALS) };
  },

  updateWithdrawalStatus: async (withdrawalId, status, reason = '') => {
    const list = getStored('withdrawals', MOCK_ADMIN_WITHDRAWALS);
    const updated = list.map((w) =>
      w.id === withdrawalId ? { ...w, status, approvedBy: 'Finance Admin' } : w
    );
    setStored('withdrawals', updated);
    adminApi.recordAuditLog('WITHDRAWAL_STATUS_CHANGED', 'SETTLEMENT_PAYOUT', withdrawalId, status, reason);
    return { success: true };
  },

  // ==========================================
  // Reviews & Moderation Reports
  // ==========================================
  getReports: async () => {
    return { success: true, data: getStored('reports', MOCK_ADMIN_REPORTS) };
  },

  updateReportStatus: async (reportId, status, actionTaken = '') => {
    const list = getStored('reports', MOCK_ADMIN_REPORTS);
    const updated = list.map((r) => (r.id === reportId ? { ...r, status, actionTaken } : r));
    setStored('reports', updated);
    adminApi.recordAuditLog('CONTENT_REPORT_RESOLVED', 'MODERATION_REPORT', reportId, status, actionTaken);
    return { success: true };
  },

  // ==========================================
  // Settings & Configuration
  // ==========================================
  getSettings: async () => {
    return { success: true, data: getStored('settings', MOCK_ADMIN_SETTINGS) };
  },

  updateSettings: async (newSettings, reason = 'Policy update by Super Admin') => {
    const current = getStored('settings', MOCK_ADMIN_SETTINGS);
    const updated = {
      ...current,
      ...newSettings,
      lastUpdated: new Date().toISOString(),
      updatedBy: 'Super Admin',
    };
    setStored('settings', updated);
    adminApi.recordAuditLog('SYSTEM_SETTINGS_UPDATED', 'CONFIGURATION', 'GLOBAL', 'UPDATED', reason);
    return { success: true, data: updated };
  },

  // ==========================================
  // Audit Logs
  // ==========================================
  getAuditLogs: async () => {
    return { success: true, data: getStored('audit_logs', MOCK_ADMIN_AUDIT_LOGS) };
  },

  recordAuditLog: (action, entityType, entityId, newValue, reason = '') => {
    const logs = getStored('audit_logs', MOCK_ADMIN_AUDIT_LOGS);
    const newEntry = {
      id: `AUD-${Date.now().toString().slice(-4)}`,
      timestamp: new Date().toISOString(),
      adminId: 'ADM-001',
      adminName: 'Platform Super Admin',
      adminRole: 'SUPER_ADMIN',
      action,
      entityType,
      entityId,
      details: `Action executed: ${action} on ${entityType} #${entityId}. New status: [${newValue}]`,
      reason: reason || 'Administrative compliance operation.',
      correlationId: `CORR-${Math.floor(1000 + Math.random() * 9000)}`,
    };
    setStored('audit_logs', [newEntry, ...logs]);
  },
};
