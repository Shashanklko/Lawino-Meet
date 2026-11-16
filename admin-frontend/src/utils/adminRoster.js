/**
 * Default Platform Administrator Roster & Permission Override State
 */

export const DEFAULT_ADMIN_ROSTER = [
  {
    publicId: 'admin-001',
    fullName: 'Justice A. K. Sikri (Retd.)',
    email: 'admin@lawinomeet.com',
    subRole: 'SUPER_ADMIN',
    designation: 'Supreme Platform Administrator',
    department: 'Executive Legal Governance',
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
    createdAt: '10 Jan 2026',
    lastLogin: 'Active now (Current session)',
  },
  {
    publicId: 'admin-002',
    fullName: 'Vikramaditya Sen',
    email: 'finance.lead@lawinomeet.com',
    subRole: 'FINANCE_ADMIN',
    designation: 'Finance & Settlement Director',
    department: 'Treasury & Settlements',
    status: 'ACTIVE',
    customPermissions: {
      showFinanceLedger: true,
      showWithdrawals: true,
      showAdvocateVerification: false,
      showFirmManagement: false,
      showClientManagement: false,
      showSupportDisputes: true,
      showAuditLogs: true,
      showSettings: false,
    },
    createdAt: '15 Feb 2026',
    lastLogin: 'Yesterday, 04:30 PM',
  },
  {
    publicId: 'admin-003',
    fullName: 'Meenakshi Arora',
    email: 'compliance@lawinomeet.com',
    subRole: 'VERIFICATION_ADMIN',
    designation: 'Statutory Verification Officer',
    department: 'Bar Council Compliance',
    status: 'ACTIVE',
    customPermissions: {
      showFinanceLedger: false,
      showWithdrawals: false,
      showAdvocateVerification: true,
      showFirmManagement: true,
      showClientManagement: false,
      showSupportDisputes: false,
      showAuditLogs: true,
      showSettings: false,
    },
    createdAt: '01 Mar 2026',
    lastLogin: '14 Nov 2026, 11:20 AM',
  },
  {
    publicId: 'admin-004',
    fullName: 'Rohan Deshmukh',
    email: 'support@lawinomeet.com',
    subRole: 'SUPPORT_ADMIN',
    designation: 'Customer Support Lead',
    department: 'Client Grievance Redressal',
    status: 'ACTIVE',
    customPermissions: {
      showFinanceLedger: false,
      showWithdrawals: false,
      showAdvocateVerification: false,
      showFirmManagement: false,
      showClientManagement: true,
      showSupportDisputes: true,
      showAuditLogs: true,
      showSettings: false,
    },
    createdAt: '12 Mar 2026',
    lastLogin: 'Today, 02:15 AM',
  },
  {
    publicId: 'admin-005',
    fullName: 'Kavita Nambiar',
    email: 'operations@lawinomeet.com',
    subRole: 'OPERATIONS_ADMIN',
    designation: 'Platform Operations Lead',
    department: 'Hearing Monitoring & Ops',
    status: 'ACTIVE',
    customPermissions: {
      showFinanceLedger: false,
      showWithdrawals: false,
      showAdvocateVerification: true,
      showFirmManagement: true,
      showClientManagement: true,
      showSupportDisputes: true,
      showAuditLogs: true,
      showSettings: false,
    },
    createdAt: '25 Mar 2026',
    lastLogin: '15 Nov 2026, 09:45 PM',
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
