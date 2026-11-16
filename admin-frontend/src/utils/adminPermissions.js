/**
 * LawinoMeet Platform Admin - Fine-Grained Administrative Permission Matrix
 */

export const ADMIN_SUB_ROLES = {
  SUPER_ADMIN: {
    key: 'SUPER_ADMIN',
    label: 'Super Admin',
    badge: 'Supreme Authority',
    badgeClass: 'bg-purple-100 text-purple-900 border-purple-300',
    description: 'Full unconstrained platform authority, system settings, financial clearance, and audit controls.',
  },
  SUPPORT_ADMIN: {
    key: 'SUPPORT_ADMIN',
    label: 'Customer Support Lead',
    badge: 'Dispute & Support',
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-300',
    description: 'Manages client & professional tickets, escalations, client assistance, and resolution coordination.',
  },
  VERIFICATION_ADMIN: {
    key: 'VERIFICATION_ADMIN',
    label: 'Verification & Compliance Officer',
    badge: 'Bar Compliance',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300',
    description: 'Audits Bar Council enrollments, LLB/LLM credentials, LLP certificates, and approves practitioner onboarding.',
  },
  FINANCE_ADMIN: {
    key: 'FINANCE_ADMIN',
    label: 'Finance & Settlement Director',
    badge: 'Treasury & Settlements',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    description: 'Authorizes withdrawals, audits 10% platform commission, reviews refund claims, and executes gateway reconciliation.',
  },
  OPERATIONS_ADMIN: {
    key: 'OPERATIONS_ADMIN',
    label: 'Operations Coordinator',
    badge: 'Platform Ops',
    badgeClass: 'bg-stone-200 text-stone-800 border-stone-300',
    description: 'Monitors ongoing hearings, appointment escalations, system uptime, and user moderation.',
  },
};

// Permission Keys
export const ADMIN_PERMISSIONS = {
  ADMIN_MANAGEMENT: 'ADMIN_MANAGEMENT',
  CLIENT_MANAGEMENT: 'CLIENT_MANAGEMENT',
  ADVOCATE_MANAGEMENT: 'ADVOCATE_MANAGEMENT',
  FIRM_MANAGEMENT: 'FIRM_MANAGEMENT',
  APPOINTMENT_MANAGEMENT: 'APPOINTMENT_MANAGEMENT',
  SUPPORT_TICKETS: 'SUPPORT_TICKETS',
  PAYMENTS: 'PAYMENTS',
  REFUNDS: 'REFUNDS',
  WITHDRAWALS: 'WITHDRAWALS',
  SYSTEM_SETTINGS: 'SYSTEM_SETTINGS',
  AUDIT_LOGS: 'AUDIT_LOGS',
};

// Sub-Role to Permission Map (Exact spec matching Section 3)
const PERMISSION_MATRIX = {
  SUPER_ADMIN: {
    ADMIN_MANAGEMENT: 'FULL',
    CLIENT_MANAGEMENT: 'FULL',
    ADVOCATE_MANAGEMENT: 'FULL',
    FIRM_MANAGEMENT: 'FULL',
    APPOINTMENT_MANAGEMENT: 'FULL',
    SUPPORT_TICKETS: 'FULL',
    PAYMENTS: 'FULL',
    REFUNDS: 'FULL',
    WITHDRAWALS: 'FULL',
    SYSTEM_SETTINGS: 'FULL',
    AUDIT_LOGS: 'FULL',
  },
  SUPPORT_ADMIN: {
    ADMIN_MANAGEMENT: 'NONE',
    CLIENT_MANAGEMENT: 'FULL',
    ADVOCATE_MANAGEMENT: 'LIMITED',
    FIRM_MANAGEMENT: 'LIMITED',
    APPOINTMENT_MANAGEMENT: 'FULL',
    SUPPORT_TICKETS: 'FULL',
    PAYMENTS: 'NONE',
    REFUNDS: 'LIMITED',
    WITHDRAWALS: 'NONE',
    SYSTEM_SETTINGS: 'NONE',
    AUDIT_LOGS: 'LIMITED',
  },
  VERIFICATION_ADMIN: {
    ADMIN_MANAGEMENT: 'NONE',
    CLIENT_MANAGEMENT: 'NONE',
    ADVOCATE_MANAGEMENT: 'FULL',
    FIRM_MANAGEMENT: 'FULL',
    APPOINTMENT_MANAGEMENT: 'NONE',
    SUPPORT_TICKETS: 'NONE',
    PAYMENTS: 'NONE',
    REFUNDS: 'NONE',
    WITHDRAWALS: 'NONE',
    SYSTEM_SETTINGS: 'NONE',
    AUDIT_LOGS: 'LIMITED',
  },
  FINANCE_ADMIN: {
    ADMIN_MANAGEMENT: 'NONE',
    CLIENT_MANAGEMENT: 'NONE',
    ADVOCATE_MANAGEMENT: 'NONE',
    FIRM_MANAGEMENT: 'NONE',
    APPOINTMENT_MANAGEMENT: 'LIMITED',
    SUPPORT_TICKETS: 'LIMITED',
    PAYMENTS: 'FULL',
    REFUNDS: 'FULL',
    WITHDRAWALS: 'FULL',
    SYSTEM_SETTINGS: 'NONE',
    AUDIT_LOGS: 'LIMITED',
  },
  OPERATIONS_ADMIN: {
    ADMIN_MANAGEMENT: 'NONE',
    CLIENT_MANAGEMENT: 'LIMITED',
    ADVOCATE_MANAGEMENT: 'LIMITED',
    FIRM_MANAGEMENT: 'LIMITED',
    APPOINTMENT_MANAGEMENT: 'FULL',
    SUPPORT_TICKETS: 'FULL',
    PAYMENTS: 'NONE',
    REFUNDS: 'LIMITED',
    WITHDRAWALS: 'NONE',
    SYSTEM_SETTINGS: 'NONE',
    AUDIT_LOGS: 'LIMITED',
  },
};

/**
 * Check if the given admin sub-role has access to a permission
 * @param {string} subRole - 'SUPER_ADMIN' | 'SUPPORT_ADMIN' | etc.
 * @param {string} permissionKey - Key from ADMIN_PERMISSIONS
 * @returns {boolean}
 */
export const checkAdminPermission = (subRole = 'SUPER_ADMIN', permissionKey) => {
  const roleRules = PERMISSION_MATRIX[subRole] || PERMISSION_MATRIX.SUPER_ADMIN;
  const level = roleRules[permissionKey];
  return level === 'FULL' || level === 'LIMITED';
};

/**
 * Returns access tier: 'FULL' | 'LIMITED' | 'NONE'
 */
export const getAdminPermissionTier = (subRole = 'SUPER_ADMIN', permissionKey) => {
  const roleRules = PERMISSION_MATRIX[subRole] || PERMISSION_MATRIX.SUPER_ADMIN;
  return roleRules[permissionKey] || 'NONE';
};
