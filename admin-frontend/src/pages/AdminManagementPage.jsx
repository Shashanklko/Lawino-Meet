import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserPlus,
  Search,
  Filter,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  DollarSign,
  Users,
  Scale,
  Building,
  LifeBuoy,
  FileText,
  Sliders,
  MoreVertical,
  AlertCircle,
  X,
  Check,
  Layers,
  ArrowDownLeft,
  Activity,
} from 'lucide-react';
import { ADMIN_SUB_ROLES } from '../utils/adminPermissions';
import { getStoredAdminRoster, saveAdminRoster } from '../utils/adminRoster';
import { useAdminAuth } from '../context/AdminAuthContext';

const SUB_ROLE_OPTIONS = [
  {
    key: 'SUPER_ADMIN',
    label: 'Super Admin',
    badge: 'Supreme',
    badgeColor: 'text-purple-400 border-purple-500/30 bg-purple-500/10',
    desc: 'Full Platform Authority',
    icon: ShieldCheck,
    iconColor: 'text-purple-400',
    borderActive: 'border-purple-500 bg-purple-950/40 ring-1 ring-purple-500/50',
  },
  {
    key: 'FINANCE_ADMIN',
    label: 'Finance Director',
    badge: '10% Fee',
    badgeColor: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10',
    desc: 'Payouts & Treasury',
    icon: DollarSign,
    iconColor: 'text-emerald-400',
    borderActive: 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50',
  },
  {
    key: 'VERIFICATION_ADMIN',
    label: 'Verification Officer',
    badge: 'Bar Council',
    badgeColor: 'text-blue-400 border-blue-500/30 bg-blue-500/10',
    desc: 'Advocate & Firm Audits',
    icon: Scale,
    iconColor: 'text-blue-400',
    borderActive: 'border-blue-500 bg-blue-950/40 ring-1 ring-blue-500/50',
  },
  {
    key: 'SUPPORT_ADMIN',
    label: 'Support Lead',
    badge: 'Disputes',
    badgeColor: 'text-rose-400 border-rose-500/30 bg-rose-500/10',
    desc: 'Client & Lawyer Tickets',
    icon: LifeBuoy,
    iconColor: 'text-rose-400',
    borderActive: 'border-rose-500 bg-rose-950/40 ring-1 ring-rose-500/50',
  },
  {
    key: 'OPERATIONS_ADMIN',
    label: 'Ops Coordinator',
    badge: 'Hearings',
    badgeColor: 'text-cyan-400 border-cyan-500/30 bg-cyan-500/10',
    desc: 'Escalations & Telemetry',
    icon: Activity,
    iconColor: 'text-cyan-400',
    borderActive: 'border-cyan-500 bg-cyan-950/40 ring-1 ring-cyan-500/50',
  },
];

const getRoleIcon = (roleKey) => {
  switch (roleKey) {
    case 'SUPER_ADMIN': return ShieldCheck;
    case 'FINANCE_ADMIN': return DollarSign;
    case 'VERIFICATION_ADMIN': return Scale;
    case 'SUPPORT_ADMIN': return LifeBuoy;
    case 'OPERATIONS_ADMIN': return Activity;
    default: return ShieldCheck;
  }
};

export const AdminManagementPage = () => {
  const { adminSubRole } = useAdminAuth();
  const [adminList, setAdminList] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [toastMessage, setToastMessage] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  // Form State for Add Admin
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    department: 'Legal Compliance',
    subRole: 'SUPPORT_ADMIN',
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
  });

  useEffect(() => {
    setAdminList(getStoredAdminRoster());
  }, []);

  const handleToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  const filteredAdmins = adminList.filter((a) => {
    const matchesSearch =
      a.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.department.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || a.subRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleToggleStatus = (adminId) => {
    const updated = adminList.map((a) => {
      if (a.publicId === adminId) {
        const nextStatus = a.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        return { ...a, status: nextStatus };
      }
      return a;
    });
    setAdminList(updated);
    saveAdminRoster(updated);
    handleToast(`Admin account status updated successfully.`);
  };

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    const newAdmin = {
      publicId: `admin-${Date.now()}`,
      fullName: formData.fullName.trim(),
      email: formData.email.trim(),
      subRole: formData.subRole,
      designation: ADMIN_SUB_ROLES[formData.subRole]?.label || 'Administrative Officer',
      department: formData.department,
      status: 'ACTIVE',
      customPermissions: { ...formData.customPermissions },
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      lastLogin: 'Never logged in',
    };

    const nextList = [newAdmin, ...adminList];
    setAdminList(nextList);
    saveAdminRoster(nextList);
    setIsAddModalOpen(false);
    setFormData({
      fullName: '',
      email: '',
      department: 'Legal Compliance',
      subRole: 'SUPPORT_ADMIN',
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
    });
    handleToast(`Platform administrator ${newAdmin.fullName} invited successfully.`);
  };

  const handleEditSave = (e) => {
    e.preventDefault();
    if (!editingAdmin) return;

    const updated = adminList.map((a) =>
      a.publicId === editingAdmin.publicId ? { ...editingAdmin } : a
    );
    setAdminList(updated);
    saveAdminRoster(updated);
    setEditingAdmin(null);
    handleToast(`Permissions & visibility for ${editingAdmin.fullName} updated.`);
  };

  // Helper when changing subRole in Add Form
  const handleRoleChangeInForm = (roleKey) => {
    const isSuper = roleKey === 'SUPER_ADMIN';
    const isFinance = roleKey === 'FINANCE_ADMIN';
    const isVerify = roleKey === 'VERIFICATION_ADMIN';

    setFormData((prev) => ({
      ...prev,
      subRole: roleKey,
      customPermissions: {
        showFinanceLedger: isSuper || isFinance,
        showWithdrawals: isSuper || isFinance,
        showAdvocateVerification: isSuper || isVerify,
        showFirmManagement: isSuper || isVerify,
        showClientManagement: isSuper || roleKey === 'SUPPORT_ADMIN' || roleKey === 'OPERATIONS_ADMIN',
        showSupportDisputes: isSuper || roleKey === 'SUPPORT_ADMIN' || roleKey === 'OPERATIONS_ADMIN',
        showAuditLogs: true,
        showSettings: isSuper,
      },
    }));
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[9999] max-w-md p-4 rounded-2xl bg-[#1C1817]/95 backdrop-blur-xl border border-amber-500/50 text-white shadow-2xl flex items-center justify-between space-x-3 animate-in slide-in-from-top-3">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-xs font-medium leading-relaxed">{toastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage('')}
            className="text-stone-400 hover:text-white text-xs font-bold shrink-0 ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-purple-400" />
            <h1 className="font-serif font-bold text-xl text-stone-100">
              Admin &amp; Sub-Admin Management
            </h1>
          </div>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Super Admin Control Console: Delegate administrative roles and configure granular feature visibility (e.g. show or hide financial ledgers, audit queues).
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-2 cursor-pointer shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Platform Admin</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-2xl bg-[#1A1614] border border-stone-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">Total Admins</span>
          <p className="font-serif font-bold text-xl text-stone-100">{adminList.length}</p>
          <span className="text-[10px] text-stone-400">Platform roster</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1A1614] border border-stone-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">Active Status</span>
          <p className="font-serif font-bold text-xl text-emerald-400">
            {adminList.filter((a) => a.status === 'ACTIVE').length} Active
          </p>
          <span className="text-[10px] text-stone-400">Authorized sessions</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1A1614] border border-stone-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">Finance Access</span>
          <p className="font-serif font-bold text-xl text-amber-400">
            {adminList.filter((a) => a.customPermissions?.showFinanceLedger).length} Officers
          </p>
          <span className="text-[10px] text-stone-400">Finance Ledger visible</span>
        </div>

        <div className="p-4 rounded-2xl bg-[#1A1614] border border-stone-800 space-y-1">
          <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">Super Admins</span>
          <p className="font-serif font-bold text-xl text-purple-400">
            {adminList.filter((a) => a.subRole === 'SUPER_ADMIN').length} Supreme
          </p>
          <span className="text-[10px] text-stone-400">Unrestricted authority</span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="p-3 rounded-2xl bg-[#171412] border border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, email, department..."
            className="w-full bg-[#1F1B19] border border-stone-800 rounded-xl pl-8 pr-3 py-2 text-stone-200 placeholder:text-stone-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[10px] font-mono uppercase text-stone-500 shrink-0">Role Filter:</span>
          {['ALL', 'SUPER_ADMIN', 'FINANCE_ADMIN', 'VERIFICATION_ADMIN', 'SUPPORT_ADMIN', 'OPERATIONS_ADMIN'].map(
            (r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRoleFilter(r)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-medium transition cursor-pointer whitespace-nowrap ${
                  roleFilter === r
                    ? 'bg-purple-900/60 text-purple-200 border border-purple-500'
                    : 'text-stone-400 hover:text-stone-200 bg-[#1F1B19] border border-stone-800'
                }`}
              >
                {r === 'ALL' ? 'All Roles' : ADMIN_SUB_ROLES[r]?.label?.split(' ')[0] || r}
              </button>
            )
          )}
        </div>
      </div>

      {/* Platform Admin Roster Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#171412] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-[#141110] text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Administrator</th>
                <th className="py-3 px-4">Assigned Role</th>
                <th className="py-3 px-4">Department</th>
                <th className="py-3 px-4">Feature Visibility (Show / Hide)</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Activity</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredAdmins.map((admin) => {
                const roleMeta = ADMIN_SUB_ROLES[admin.subRole] || ADMIN_SUB_ROLES.SUPER_ADMIN;
                const perms = admin.customPermissions || {};
                const isSuper = admin.subRole === 'SUPER_ADMIN';

                return (
                  <tr key={admin.publicId} className="hover:bg-stone-900/40 transition">
                    {/* Admin Identity */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-900/40 border border-purple-500/40 text-purple-300 flex items-center justify-center font-serif font-bold text-xs shrink-0">
                          {admin.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-serif font-bold text-stone-200">{admin.fullName}</p>
                          <p className="text-[10px] font-mono text-stone-400">{admin.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role Badge */}
                    <td className="py-3.5 px-4">
                      {(() => {
                        const RoleIcon = getRoleIcon(admin.subRole);
                        return (
                          <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${roleMeta.badgeClass}`}>
                            <RoleIcon className="w-3 h-3" />
                            <span>{roleMeta.label}</span>
                          </span>
                        );
                      })()}
                    </td>

                    {/* Department */}
                    <td className="py-3.5 px-4 text-stone-300 font-sans">
                      {admin.department}
                    </td>

                    {/* Visibility Tags */}
                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {/* Finance Ledger Tag */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 ${
                            perms.showFinanceLedger
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : 'bg-rose-950/60 text-rose-300 border border-rose-900'
                          }`}
                        >
                          {perms.showFinanceLedger ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                          <span>Finance: {perms.showFinanceLedger ? 'Visible' : 'Hidden'}</span>
                        </span>

                        {/* Advocate Tag */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 ${
                            perms.showAdvocateVerification
                              ? 'bg-stone-800 text-stone-200'
                              : 'bg-stone-900 text-stone-500'
                          }`}
                        >
                          <span>Advocates: {perms.showAdvocateVerification ? 'Show' : 'Hide'}</span>
                        </span>

                        {/* Firms Tag */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 ${
                            perms.showFirmManagement
                              ? 'bg-stone-800 text-stone-200'
                              : 'bg-stone-900 text-stone-500'
                          }`}
                        >
                          <span>Firms: {perms.showFirmManagement ? 'Show' : 'Hide'}</span>
                        </span>

                        {/* Support Tag */}
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono flex items-center space-x-1 ${
                            perms.showSupportDisputes
                              ? 'bg-stone-800 text-stone-200'
                              : 'bg-stone-900 text-stone-500'
                          }`}
                        >
                          <span>Support: {perms.showSupportDisputes ? 'Show' : 'Hide'}</span>
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                          admin.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            admin.status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        <span>{admin.status}</span>
                      </span>
                    </td>

                    {/* Last Login */}
                    <td className="py-3.5 px-4 text-stone-400 font-mono text-[11px]">
                      {admin.lastLogin}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          type="button"
                          onClick={() => setEditingAdmin({ ...admin, customPermissions: { ...perms } })}
                          className="px-2.5 py-1 rounded-lg border border-purple-500/40 bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 text-xs font-medium transition cursor-pointer"
                        >
                          Edit Permissions
                        </button>

                        {!isSuper && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(admin.publicId)}
                            className={`px-2 py-1 rounded-lg text-xs font-medium transition cursor-pointer ${
                              admin.status === 'ACTIVE'
                                ? 'border border-rose-800/60 text-rose-400 hover:bg-rose-950/40'
                                : 'border border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40'
                            }`}
                          >
                            {admin.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* =========================================================================
          MODAL 1: ADD PLATFORM ADMIN
          ========================================================================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171412] border border-stone-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-xs text-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-100 flex items-center space-x-2">
                  <UserPlus className="w-4 h-4 text-purple-400" />
                  <span>Invite &amp; Provision Platform Admin</span>
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Assign administrative scope and configure which navigation modules to display or hide.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Full Legal Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder="e.g. Adv. Ritu Kapur"
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] text-stone-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                    Official Admin Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="officer@lawinomeet.com"
                    className="w-full p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] text-stone-100 text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Department
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] text-stone-100 text-xs focus:outline-none focus:border-purple-500"
                >
                  <option value="Executive Legal Governance">Executive Legal Governance</option>
                  <option value="Treasury & Settlements">Treasury & Settlements</option>
                  <option value="Bar Council Compliance">Bar Council Compliance</option>
                  <option value="Client Grievance Redressal">Client Grievance Redressal</option>
                  <option value="Hearing Monitoring & Ops">Hearing Monitoring & Ops</option>
                </select>
              </div>

              {/* Administrative Sub-Role Cards with Visual Symbols */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-stone-300">
                  Select Administrative Sub-Role &amp; Clearance Tier *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUB_ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = formData.subRole === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => handleRoleChangeInForm(opt.key)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                          isSelected
                            ? opt.borderActive
                            : 'border-stone-800 bg-[#1F1B19] hover:border-stone-700 hover:bg-[#251E1C]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-stone-100">{opt.label}</div>
                        <div className="text-[9px] text-stone-400 truncate">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Visibility Switches */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <span className="text-[10px] font-mono uppercase text-purple-300 font-bold block">
                  Feature Navigation Visibility Matrix:
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Finance Ledger Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <span>Finance Ledger &amp; Treasury</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.customPermissions.showFinanceLedger}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customPermissions: {
                            ...formData.customPermissions,
                            showFinanceLedger: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Withdrawals Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Withdrawals &amp; Payouts</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.customPermissions.showWithdrawals}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customPermissions: {
                            ...formData.customPermissions,
                            showWithdrawals: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Advocate Verification Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      <span>Advocate Verification</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.customPermissions.showAdvocateVerification}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customPermissions: {
                            ...formData.customPermissions,
                            showAdvocateVerification: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Firm Management Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Firm Management</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.customPermissions.showFirmManagement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customPermissions: {
                            ...formData.customPermissions,
                            showFirmManagement: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Client Accounts Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <span>Client Accounts</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.customPermissions.showClientManagement}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customPermissions: {
                            ...formData.customPermissions,
                            showClientManagement: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Support & Disputes Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                      <span>Support &amp; Disputes</span>
                    </span>
                    <input
                      type="checkbox"
                      checked={formData.customPermissions.showSupportDisputes}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customPermissions: {
                            ...formData.customPermissions,
                            showSupportDisputes: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shadow-md"
                >
                  Create &amp; Provision Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: EDIT ROLE & VISIBILITY MATRIX
          ========================================================================= */}
      {editingAdmin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#171412] border border-stone-800 rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl text-xs text-stone-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-100 flex items-center space-x-2">
                  <Sliders className="w-4 h-4 text-purple-400" />
                  <span>Configure Permissions for {editingAdmin.fullName}</span>
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Update role and control feature navigation display (show or hide sensitive ledgers).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingAdmin(null)}
                className="text-stone-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-300 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editingAdmin.department}
                  onChange={(e) => setEditingAdmin({ ...editingAdmin, department: e.target.value })}
                  className="w-full p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] text-stone-100 text-xs focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Administrative Sub-Role Cards with Visual Symbols */}
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-stone-300">
                  Select Administrative Sub-Role &amp; Clearance Tier
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {SUB_ROLE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = editingAdmin.subRole === opt.key;
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() =>
                          setEditingAdmin({
                            ...editingAdmin,
                            subRole: opt.key,
                            designation: ADMIN_SUB_ROLES[opt.key]?.label || editingAdmin.designation,
                          })
                        }
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer relative ${
                          isSelected
                            ? opt.borderActive
                            : 'border-stone-800 bg-[#1F1B19] hover:border-stone-700 hover:bg-[#251E1C]'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <Icon className={`w-3.5 h-3.5 ${opt.iconColor}`} />
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border ${opt.badgeColor}`}>
                            {opt.badge}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-stone-100">{opt.label}</div>
                        <div className="text-[9px] text-stone-400 truncate">{opt.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Granular Visibility Switches */}
              <div className="pt-2 border-t border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-purple-300 font-bold">
                    Feature Navigation Visibility (Show / Hide):
                  </span>
                  <span className="text-[10px] text-stone-500">
                    Checked = Displayed in Sidebar
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Finance Ledger Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                      <div>
                        <p className="font-semibold text-xs">Finance Ledger</p>
                        <p className="text-[9px] text-stone-500">Treasury, earnings &amp; splits</p>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!editingAdmin.customPermissions?.showFinanceLedger}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          customPermissions: {
                            ...editingAdmin.customPermissions,
                            showFinanceLedger: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Withdrawals Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-400" />
                      <div>
                        <p className="font-semibold text-xs">Withdrawals &amp; Payouts</p>
                        <p className="text-[9px] text-stone-500">Bank transfers &amp; payout audit</p>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!editingAdmin.customPermissions?.showWithdrawals}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          customPermissions: {
                            ...editingAdmin.customPermissions,
                            showWithdrawals: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Advocate Verification Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <Scale className="w-3.5 h-3.5 text-blue-400" />
                      <div>
                        <p className="font-semibold text-xs">Advocate Verification</p>
                        <p className="text-[9px] text-stone-500">Bar Council onboarding queue</p>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!editingAdmin.customPermissions?.showAdvocateVerification}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          customPermissions: {
                            ...editingAdmin.customPermissions,
                            showAdvocateVerification: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Firm Management Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <Building className="w-3.5 h-3.5 text-indigo-400" />
                      <div>
                        <p className="font-semibold text-xs">Firm Management</p>
                        <p className="text-[9px] text-stone-500">Law firm roster &amp; sub-admins</p>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!editingAdmin.customPermissions?.showFirmManagement}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          customPermissions: {
                            ...editingAdmin.customPermissions,
                            showFirmManagement: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Client Management Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <Users className="w-3.5 h-3.5 text-teal-400" />
                      <div>
                        <p className="font-semibold text-xs">Client Accounts</p>
                        <p className="text-[9px] text-stone-500">Confidential client identities</p>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!editingAdmin.customPermissions?.showClientManagement}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          customPermissions: {
                            ...editingAdmin.customPermissions,
                            showClientManagement: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>

                  {/* Support & Disputes Toggle */}
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-stone-800 bg-[#1F1B19] cursor-pointer">
                    <span className="flex items-center space-x-2 text-stone-200">
                      <LifeBuoy className="w-3.5 h-3.5 text-rose-400" />
                      <div>
                        <p className="font-semibold text-xs">Support &amp; Disputes</p>
                        <p className="text-[9px] text-stone-500">Grievances, hearings &amp; refunds</p>
                      </div>
                    </span>
                    <input
                      type="checkbox"
                      checked={!!editingAdmin.customPermissions?.showSupportDisputes}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          customPermissions: {
                            ...editingAdmin.customPermissions,
                            showSupportDisputes: e.target.checked,
                          },
                        })
                      }
                      className="rounded text-purple-600 focus:ring-purple-500"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingAdmin(null)}
                  className="px-4 py-2 rounded-xl border border-stone-800 text-stone-400 hover:bg-stone-900 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold cursor-pointer shadow-md"
                >
                  Save Role &amp; Visibility Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
