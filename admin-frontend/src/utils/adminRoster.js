/**
 * Platform Administrator Roster & Live Permission Configuration
 */

export const DEFAULT_ADMIN_ROSTER = [
  {
    publicId: '55555555-5555-5555-5555-555555555555',
    fullName: 'Platform Administrator',
    email: 'admin@lawinomeet.com',
    subRole: 'SUPER_ADMIN',
    designation: 'Supreme Platform Administrator',
    department: 'Platform Governance & Security',
    status: 'ACTIVE',
    customPermissions: {
      showFinanceLedger: true,
      showWithdrawals: true,
      showAdvocateVerification: true,
      showFirmManagement: true,
      showClientManagement: true,
      showSupportDisputes: true,
      showAuditLogs: true,
      showSettings: true,
    },
    createdAt: '01 Jan 2026',
    lastLogin: 'Active now (Current session)',
  },
];

export const getStoredAdminRoster = () => {
  try {
    const raw = localStorage.getItem('lawino_admin_roster');
    return raw ? JSON.parse(raw) : DEFAULT_ADMIN_ROSTER;
  } catch {
    return DEFAULT_ADMIN_ROSTER;
  }
};

export const saveAdminRoster = (roster) => {
  try {
    localStorage.setItem('lawino_admin_roster', JSON.stringify(roster));
  } catch (err) {
    console.warn('Failed to persist admin roster', err);
  }
};
