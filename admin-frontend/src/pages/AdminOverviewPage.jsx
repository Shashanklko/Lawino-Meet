import React, { useState, useEffect } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import {
  Users,
  Scale,
  Building,
  Calendar,
  LifeBuoy,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  Clock,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ArrowUpRight,
  Server,
  Zap,
  KeyRound,
  EyeOff,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';
import {
  ADMIN_SUB_ROLES,
  ADMIN_PERMISSIONS,
  checkAdminPermission,
} from '../utils/adminPermissions';

export const AdminOverviewPage = () => {
  const { dateFilter, adminSubRole } = useOutletContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const role = adminSubRole || 'SUPER_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const roleMeta = ADMIN_SUB_ROLES[role] || ADMIN_SUB_ROLES.SUPER_ADMIN;

  // Departmental Clearance Matrix
  const canAccessFinance = isSuperAdmin || checkAdminPermission(role, ADMIN_PERMISSIONS.PAYMENTS);
  const canAccessVerification = isSuperAdmin || checkAdminPermission(role, ADMIN_PERMISSIONS.ADVOCATE_MANAGEMENT);
  const canAccessSupport = isSuperAdmin || checkAdminPermission(role, ADMIN_PERMISSIONS.SUPPORT_TICKETS);
  const canAccessClients = isSuperAdmin || checkAdminPermission(role, ADMIN_PERMISSIONS.CLIENT_MANAGEMENT);
  const canAccessWithdrawals = isSuperAdmin || checkAdminPermission(role, ADMIN_PERMISSIONS.WITHDRAWALS);
  const canAccessAudit = isSuperAdmin;

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const res = await adminApi.getOverviewStats();
      if (res.success) {
        setStats(res.data);
      }
      setLoading(false);
    };
    fetchStats();
  }, [dateFilter]);

  if (loading || !stats) {
    return (
      <div className="py-20 text-center text-xs text-stone-400 font-mono">
        Loading Master Platform Metrics...
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Platform Authority Welcome Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2B1216] via-[#1E1715] to-[#171412] border border-[#5A101B]/50 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${
                isSuperAdmin ? 'bg-purple-400 animate-pulse' : 'bg-emerald-400 animate-pulse'
              }`}
            />
            <span
              className={`text-[10px] font-mono uppercase tracking-widest font-bold ${
                isSuperAdmin ? 'text-purple-300' : 'text-amber-400'
              }`}
            >
              {isSuperAdmin
                ? 'CLEARANCE LEVEL 1: SUPREME AUTHORITY // UNRESTRICTED ACCESS'
                : role === 'FINANCE_ADMIN'
                ? 'CLEARANCE LEVEL 2: TREASURY & SETTLEMENTS // BAR COMPLIANCE RESTRICTED'
                : role === 'VERIFICATION_ADMIN'
                ? 'CLEARANCE LEVEL 2: BAR COMPLIANCE OFFICER // FINANCIAL TREASURY MASKED'
                : role === 'SUPPORT_ADMIN'
                ? 'CLEARANCE LEVEL 3: CUSTOMER GRIEVANCE LEAD // FINANCIAL TREASURY MASKED'
                : 'CLEARANCE LEVEL 3: OPERATIONS & TELEMETRY // FINANCIAL DATA MASKED'}
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-cream-50">
            {isSuperAdmin
              ? 'LawinoMeet Master Operational Command Center'
              : `${roleMeta.label} Command Workspace`}
          </h2>
          <p className="text-xs text-stone-400 mt-0.5 font-sans max-w-2xl">
            {isSuperAdmin
              ? 'Full unconstrained platform oversight: multi-bench advocate verification, statutory 10% platform commission monitoring, customer dispute escalation, and enterprise firm oversight.'
              : roleMeta.description}
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-right">
            <p className="text-[10px] font-mono text-stone-400 uppercase">Selected Range</p>
            <p className="text-xs font-bold text-amber-400 font-mono">{dateFilter.replace(/_/g, ' ')}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-stone-900/80 border border-stone-800 text-right">
            <p className="text-[10px] font-mono text-stone-400 uppercase">Active Role</p>
            <p className="text-xs font-bold text-cream-100 font-mono flex items-center space-x-1.5 justify-end">
              <span className={`w-1.5 h-1.5 rounded-full ${isSuperAdmin ? 'bg-purple-400' : 'bg-amber-400'}`} />
              <span>{roleMeta.key}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Role-Based Visibility) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Total Clients */}
        {canAccessClients ? (
          <Link
            to="/admin/clients"
            className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 hover:border-stone-600 transition shadow-xs group"
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] font-mono uppercase font-semibold">Total Clients</span>
              <Users className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-2xl font-serif font-bold text-cream-50">{stats.totalClients}</p>
            <p className="text-[10px] text-stone-400 mt-1 flex items-center space-x-1">
              <span>Verified client accounts</span>
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
            </p>
          </Link>
        ) : (
          <div className="p-4 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[10px] font-mono uppercase font-semibold">Total Clients</span>
              <Lock className="w-3.5 h-3.5 text-stone-600" />
            </div>
            <div className="flex items-center space-x-1.5 my-1">
              <Lock className="w-4 h-4 text-stone-500" />
              <span className="text-xl font-mono text-stone-500 tracking-widest">••••••</span>
            </div>
            <p className="text-[10px] text-stone-500 font-mono">Cleared for Support &amp; Super Admin</p>
          </div>
        )}

        {/* Active Advocates */}
        {canAccessVerification ? (
          <Link
            to="/admin/advocates"
            className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 hover:border-stone-600 transition shadow-xs group"
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] font-mono uppercase font-semibold">Active Advocates</span>
              <Scale className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-2xl font-serif font-bold text-cream-50">{stats.activeAdvocates}</p>
            <p className="text-[10px] text-stone-400 mt-1 flex items-center space-x-1">
              <span>100% Bar Council enrollment</span>
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
            </p>
          </Link>
        ) : (
          <div className="p-4 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[10px] font-mono uppercase font-semibold">Active Advocates</span>
              <Lock className="w-3.5 h-3.5 text-stone-600" />
            </div>
            <div className="flex items-center space-x-1.5 my-1">
              <Lock className="w-4 h-4 text-stone-500" />
              <span className="text-xl font-mono text-stone-500 tracking-widest">••••••</span>
            </div>
            <p className="text-[10px] text-stone-500 font-mono">Cleared for Verification &amp; Super Admin</p>
          </div>
        )}

        {/* Registered Firms */}
        {canAccessVerification ? (
          <Link
            to="/admin/firms"
            className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 hover:border-stone-600 transition shadow-xs group"
          >
            <div className="flex items-center justify-between text-stone-400 mb-2">
              <span className="text-[10px] font-mono uppercase font-semibold">Registered Firms</span>
              <Building className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition" />
            </div>
            <p className="text-2xl font-serif font-bold text-cream-50">{stats.registeredFirms}</p>
            <p className="text-[10px] text-stone-400 mt-1 flex items-center space-x-1">
              <span>Multi-bench registered LLPs</span>
              <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
            </p>
          </Link>
        ) : (
          <div className="p-4 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-2">
              <span className="text-[10px] font-mono uppercase font-semibold">Registered Firms</span>
              <Lock className="w-3.5 h-3.5 text-stone-600" />
            </div>
            <div className="flex items-center space-x-1.5 my-1">
              <Lock className="w-4 h-4 text-stone-500" />
              <span className="text-xl font-mono text-stone-500 tracking-widest">••••••</span>
            </div>
            <p className="text-[10px] text-stone-500 font-mono">Cleared for Verification &amp; Super Admin</p>
          </div>
        )}

        {/* Total Consultations (Platform Session Telemetry - Visible to all) */}
        <Link
          to="/admin/appointments"
          className="p-4 rounded-xl bg-[#221C1A] border border-stone-800 hover:border-stone-600 transition shadow-xs group"
        >
          <div className="flex items-center justify-between text-stone-400 mb-2">
            <span className="text-[10px] font-mono uppercase font-semibold">Total Consultations</span>
            <Calendar className="w-4 h-4 text-stone-500 group-hover:text-amber-400 transition" />
          </div>
          <p className="text-2xl font-serif font-bold text-cream-50">{stats.totalAppointments}</p>
          <p className="text-[10px] text-stone-400 mt-1 flex items-center space-x-1">
            <span>WebRTC video &amp; chamber</span>
            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-1 transition-transform" />
          </p>
        </Link>
      </div>

      {/* Secondary Urgent Queue Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        {/* Open Support Tickets */}
        {canAccessSupport ? (
          <Link
            to="/admin/support"
            className="p-3.5 rounded-xl bg-[#221C1A] border border-rose-900/40 hover:border-rose-700/70 transition shadow-xs"
          >
            <div className="flex items-center justify-between text-rose-300 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Open Support Tickets</span>
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            </div>
            <p className="text-xl font-serif font-bold text-rose-200">{stats.openSupportTickets}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Disputes &amp; refund requests</p>
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Support Tickets</span>
              <Lock className="w-3 h-3 text-stone-600" />
            </div>
            <p className="text-lg font-mono font-bold text-stone-500 tracking-wider">••••</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-mono">Restricted: Support Lead</p>
          </div>
        )}

        {/* Pending Advocate Verif. */}
        {canAccessVerification ? (
          <Link
            to="/admin/advocates"
            className="p-3.5 rounded-xl bg-[#221C1A] border border-amber-900/40 hover:border-amber-700/70 transition shadow-xs"
          >
            <div className="flex items-center justify-between text-amber-300 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Pending Advocate Verif.</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-400 border border-amber-800">
                Audit
              </span>
            </div>
            <p className="text-xl font-serif font-bold text-amber-200">{stats.pendingAdvocateVerification}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">Awaiting Bar Council check</p>
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Advocate Verif.</span>
              <Lock className="w-3 h-3 text-stone-600" />
            </div>
            <p className="text-lg font-mono font-bold text-stone-500 tracking-wider">••••</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-mono">Restricted: Bar Compliance</p>
          </div>
        )}

        {/* Pending Firm Verif. */}
        {canAccessVerification ? (
          <Link
            to="/admin/firms"
            className="p-3.5 rounded-xl bg-[#221C1A] border border-blue-900/40 hover:border-blue-700/70 transition shadow-xs"
          >
            <div className="flex items-center justify-between text-blue-300 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Pending Firm Verif.</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-950 text-blue-400 border border-blue-800">
                LLP Check
              </span>
            </div>
            <p className="text-xl font-serif font-bold text-blue-200">{stats.pendingFirmVerification}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">MCA incorporation review</p>
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Firm Verif.</span>
              <Lock className="w-3 h-3 text-stone-600" />
            </div>
            <p className="text-lg font-mono font-bold text-stone-500 tracking-wider">••••</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-mono">Restricted: MCA Compliance</p>
          </div>
        )}

        {/* Pending Withdrawals */}
        {canAccessWithdrawals ? (
          <Link
            to="/admin/withdrawals"
            className="p-3.5 rounded-xl bg-[#221C1A] border border-emerald-900/40 hover:border-emerald-700/70 transition shadow-xs"
          >
            <div className="flex items-center justify-between text-emerald-300 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Pending Withdrawals</span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                Payout
              </span>
            </div>
            <p className="text-xl font-serif font-bold text-emerald-200">{stats.pendingWithdrawals}</p>
            <p className="text-[10px] text-stone-400 mt-0.5">IMPS/NEFT batches ready</p>
          </Link>
        ) : (
          <div className="p-3.5 rounded-xl bg-[#221C1A]/60 border border-stone-800/60 shadow-xs select-none">
            <div className="flex items-center justify-between text-stone-500 mb-1">
              <span className="text-[10px] font-mono uppercase font-semibold">Pending Withdrawals</span>
              <Lock className="w-3 h-3 text-stone-600" />
            </div>
            <p className="text-lg font-mono font-bold text-stone-500 tracking-wider">••••</p>
            <p className="text-[10px] text-stone-500 mt-0.5 font-mono">Restricted: Finance Clearance</p>
          </div>
        )}
      </div>

      {/* Financial Health Summary Banner (Masked for non-finance / non-super-admins) */}
      <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              canAccessFinance
                ? 'bg-amber-500/15 text-amber-400'
                : 'bg-stone-800/80 text-stone-500'
            }`}
          >
            {canAccessFinance ? <DollarSign className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
          </div>
          <div>
            <p className="text-xs font-mono uppercase text-stone-400 font-semibold">
              Statutory 10% Platform Commission Treasury
            </p>
            {canAccessFinance ? (
              <div className="flex items-baseline space-x-3">
                <span className="text-2xl font-serif font-bold text-cream-50">
                  ₹{stats.totalPlatformCommission.toLocaleString('en-IN')}
                </span>
                <span className="text-xs text-stone-400 font-mono">
                  Gross Volume: ₹{stats.grossConsultationVolume.toLocaleString('en-IN')}
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="text-xl font-mono text-stone-500 tracking-widest font-bold">
                    ••••••••••
                  </span>
                  <span className="text-xs text-stone-600 font-mono">
                    (Gross Volume: ••••••••••)
                  </span>
                </div>
                <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-mono text-amber-400">
                  <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>Classified Platform Treasury — Cleared for Super Admin &amp; Finance Director only</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {canAccessFinance ? (
          <Link
            to="/admin/finance"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#941B2B] to-[#731522] hover:opacity-90 text-white font-medium text-xs flex items-center space-x-1.5 transition shadow-xs self-start md:self-auto"
          >
            <span>Open Full Finance &amp; Commission Ledger</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        ) : (
          <div className="px-3.5 py-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-500 font-mono text-xs flex items-center space-x-1.5 self-start md:self-auto cursor-not-allowed">
            <Lock className="w-3 h-3 text-stone-500" />
            <span>Financial Ledger Restricted</span>
          </div>
        )}
      </div>

      {/* Operational Queues Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Urgent Action Queue (Role-Governed Items) */}
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Urgent Action Queue
              </h3>
            </div>
            <span className="text-[10px] font-mono text-stone-400">Departmental Clearances Applied</span>
          </div>

          <div className="space-y-2 text-xs">
            {/* Action Item 1: Advocate Verification Audit */}
            {canAccessVerification ? (
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-cream-100">Adv. Suresh K. Nair (Verification)</p>
                  <p className="text-[10px] text-stone-400">Submitted Karnataka Bar Council card &amp; AIBE slip.</p>
                </div>
                <Link
                  to="/admin/advocates"
                  className="px-2.5 py-1 rounded-lg bg-amber-900/60 hover:bg-amber-800/80 text-amber-200 text-[11px] font-mono border border-amber-700/60"
                >
                  Review &rarr;
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/50 flex items-center justify-between opacity-60">
                <div>
                  <p className="font-semibold text-stone-400 flex items-center space-x-1.5">
                    <Lock className="w-3 h-3 text-stone-500" />
                    <span>Advocate Enrollment Verification [MASKED]</span>
                  </p>
                  <p className="text-[10px] text-stone-500">Bar Council credential clearance required.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 text-[10px] font-mono border border-stone-700">
                  Restricted
                </span>
              </div>
            )}

            {/* Action Item 2: Customer Dispute Ticket */}
            {canAccessSupport || canAccessFinance ? (
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-rose-300">TKT-2026-401 (Dispute &amp; Refund)</p>
                  <p className="text-[10px] text-stone-400">Client Vikram Patel claimed ₹1,650 consultation refund.</p>
                </div>
                <Link
                  to="/admin/support"
                  className="px-2.5 py-1 rounded-lg bg-rose-900/60 hover:bg-rose-800/80 text-rose-200 text-[11px] font-mono border border-rose-700/60"
                >
                  Inspect &rarr;
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/50 flex items-center justify-between opacity-60">
                <div>
                  <p className="font-semibold text-stone-400 flex items-center space-x-1.5">
                    <Lock className="w-3 h-3 text-stone-500" />
                    <span>Client Grievance Ticket [MASKED]</span>
                  </p>
                  <p className="text-[10px] text-stone-500">Support Lead clearance required.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 text-[10px] font-mono border border-stone-700">
                  Restricted
                </span>
              </div>
            )}

            {/* Action Item 3: Firm LLP Verification Audit */}
            {canAccessVerification ? (
              <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-cream-100">Apex Horizon Legal Partners (Firm LLP)</p>
                  <p className="text-[10px] text-stone-400">LLP-KAR-2026-104 pending MCA registrar match.</p>
                </div>
                <Link
                  to="/admin/firms"
                  className="px-2.5 py-1 rounded-lg bg-blue-900/60 hover:bg-blue-800/80 text-blue-200 text-[11px] font-mono border border-blue-700/60"
                >
                  Audit &rarr;
                </Link>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-stone-900/40 border border-stone-800/50 flex items-center justify-between opacity-60">
                <div>
                  <p className="font-semibold text-stone-400 flex items-center space-x-1.5">
                    <Lock className="w-3 h-3 text-stone-500" />
                    <span>Firm LLP Incorporation Audit [MASKED]</span>
                  </p>
                  <p className="text-[10px] text-stone-500">MCA incorporation audit clearance required.</p>
                </div>
                <span className="px-2 py-0.5 rounded bg-stone-800 text-stone-500 text-[10px] font-mono border border-stone-700">
                  Restricted
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Microservice Architecture Status */}
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-emerald-500" />
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Microservice Infrastructure Status
              </h3>
            </div>
            <span className="text-[10px] font-mono text-emerald-400">All 6 Clusters Healthy</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/90 flex items-center justify-between">
              <span className="text-stone-300">auth-service</span>
              <span className="text-[10px] text-emerald-400">● 8081 OK</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/90 flex items-center justify-between">
              <span className="text-stone-300">user-service</span>
              <span className="text-[10px] text-emerald-400">● 8082 OK</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/90 flex items-center justify-between">
              <span className="text-stone-300">appointment-service</span>
              <span className="text-[10px] text-emerald-400">● 8083 OK</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/90 flex items-center justify-between">
              <span className="text-stone-300">meeting-service</span>
              <span className="text-[10px] text-emerald-400">● 8084 OK</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/90 flex items-center justify-between">
              <span className="text-stone-300">notification-service</span>
              <span className="text-[10px] text-emerald-400">● 8085 OK</span>
            </div>
            <div className="p-2.5 rounded-xl bg-stone-900/70 border border-stone-800/90 flex items-center justify-between">
              <span className="text-stone-300">chat-service</span>
              <span className="text-[10px] text-emerald-400">● 8086 OK</span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800/80 flex items-center justify-between text-[11px] text-stone-400">
            <span className="flex items-center space-x-1">
              <Lock className="w-3 h-3 text-amber-500" />
              <span>Section 126 Privilege Boundary Active</span>
            </span>
            {canAccessAudit ? (
              <Link to="/admin/audit-logs" className="text-amber-400 hover:underline">
                View Audit Logs &rarr;
              </Link>
            ) : (
              <span className="text-stone-500 text-[10px] font-mono flex items-center space-x-1">
                <Lock className="w-2.5 h-2.5 text-stone-600" />
                <span>Audit Trail (Super Admin Only)</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
