import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, Lock, ArrowLeft, KeyRound, CheckCircle2 } from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import {
  ADMIN_SUB_ROLES,
  ADMIN_PERMISSIONS,
  checkAdminPermission,
  getAdminPermissionTier,
} from '../../utils/adminPermissions';

export const AdminAccessGuard = ({ permission, requiredRoleName, children }) => {
  const { adminSubRole, setAdminSubRole } = useAdminAuth();

  // Super Admin possesses supreme clearance across all administrative modules
  if (adminSubRole === 'SUPER_ADMIN') {
    return <>{children}</>;
  }

  const hasAccess = permission
    ? checkAdminPermission(adminSubRole, permission)
    : true;

  if (!hasAccess) {
    const currentRoleMeta = ADMIN_SUB_ROLES[adminSubRole] || ADMIN_SUB_ROLES.SUPER_ADMIN;

    return (
      <div className="py-12 px-4 max-w-xl mx-auto animate-in fade-in duration-300">
        <div className="p-8 rounded-2xl bg-[#221C1A] border border-rose-900/60 shadow-xl text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rose-950/70 border border-rose-700/60 text-rose-400 mx-auto flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-rose-950 border border-rose-800 text-[10px] font-mono font-bold uppercase tracking-widest text-rose-300">
              Departmental Clearance Boundary Active
            </span>
            <h2 className="text-xl font-serif font-bold text-cream-50 pt-1">
              Restricted Administrative Access
            </h2>
            <p className="text-xs text-stone-400 font-sans leading-relaxed">
              Your active credential <strong className="text-amber-400">{currentRoleMeta.label}</strong> is not cleared to inspect this department&apos;s data or operational controls.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-stone-900/90 border border-stone-800 text-left text-xs font-mono space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Current Sub-Role:</span>
              <span className="text-amber-400 font-bold">{adminSubRole}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Required Clearance:</span>
              <span className="text-rose-400 font-semibold">{requiredRoleName || permission || 'SUPER_ADMIN'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-400">Clearance Status:</span>
              <span className="text-rose-400 font-bold flex items-center space-x-1">
                <span>DENIED (ACCESS: NONE)</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-stone-400 leading-relaxed font-sans">
            Under LawinoMeet administrative privilege protocols, financial ledgers, audit trails, and sensitive verification documents are compartmentalized. <strong className="text-stone-200">Super Admin</strong> retains unconstrained platform oversight.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setAdminSubRole('SUPER_ADMIN')}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-800 to-indigo-900 hover:opacity-90 text-white text-xs font-semibold flex items-center justify-center space-x-2 transition shadow-md cursor-pointer border border-purple-600/40"
            >
              <KeyRound className="w-3.5 h-3.5 text-amber-300" />
              <span>Switch to Super Admin Authority</span>
            </button>

            <Link
              to="/overview"
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center justify-center space-x-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Overview</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
