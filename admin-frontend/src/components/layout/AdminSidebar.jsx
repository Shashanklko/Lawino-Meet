import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Scale,
  Building,
  Calendar,
  LifeBuoy,
  DollarSign,
  ArrowDownLeft,
  AlertTriangle,
  Bell,
  BarChart3,
  Sliders,
  FileText,
  Lock,
  ShieldCheck,
} from 'lucide-react';
import { checkAdminPermission, ADMIN_PERMISSIONS } from '../../utils/adminPermissions';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminSidebar = () => {
  const { adminUser, adminSubRole } = useAdminAuth();
  const perms = adminUser?.customPermissions || {};

  const navItems = [
    {
      to: '/',
      end: true,
      label: 'Overview',
      icon: LayoutDashboard,
      permission: null,
    },
    {
      to: '/admins',
      label: 'Admin Team & Roles',
      icon: ShieldCheck,
      badge: 'Super Admin',
      badgeColor: 'bg-purple-900/60 text-purple-300 border-purple-700/60',
      permission: ADMIN_PERMISSIONS.ADMIN_MANAGEMENT,
      superAdminOnly: true,
    },
    {
      to: '/clients',
      label: 'Clients',
      icon: Users,
      permission: ADMIN_PERMISSIONS.CLIENT_MANAGEMENT,
    },
    {
      to: '/advocates',
      label: 'Lawyers & Advocates',
      icon: Scale,
      badge: '2 Pending',
      badgeColor: 'bg-amber-900/60 text-amber-300 border-amber-700/60',
      permission: ADMIN_PERMISSIONS.ADVOCATE_MANAGEMENT,
    },
    {
      to: '/firms',
      label: 'Law Firms',
      icon: Building,
      badge: '1 Pending',
      badgeColor: 'bg-blue-900/60 text-blue-300 border-blue-700/60',
      permission: ADMIN_PERMISSIONS.FIRM_MANAGEMENT,
    },
    {
      to: '/appointments',
      label: 'Appointments',
      icon: Calendar,
      badge: '1 Escalated',
      badgeColor: 'bg-rose-900/60 text-rose-300 border-rose-700/60',
      permission: ADMIN_PERMISSIONS.APPOINTMENT_MANAGEMENT,
    },
    {
      to: '/support',
      label: 'Help & Support Tickets',
      icon: LifeBuoy,
      badge: '2 Open',
      badgeColor: 'bg-rose-900/60 text-rose-300 border-rose-700/60',
      permission: ADMIN_PERMISSIONS.SUPPORT_TICKETS,
    },
    {
      to: '/finance',
      label: 'Payments & Revenue',
      icon: DollarSign,
      permission: ADMIN_PERMISSIONS.PAYMENTS,
    },
    {
      to: '/withdrawals',
      label: 'Withdrawal Requests',
      icon: ArrowDownLeft,
      badge: '1 Ready',
      badgeColor: 'bg-emerald-900/60 text-emerald-300 border-emerald-700/60',
      permission: ADMIN_PERMISSIONS.WITHDRAWALS,
    },
    {
      to: '/reports',
      label: 'User Reports & Feedback',
      icon: AlertTriangle,
      permission: ADMIN_PERMISSIONS.SUPPORT_TICKETS,
    },
    {
      to: '/notifications',
      label: 'Send Notifications',
      icon: Bell,
      permission: null,
    },
    {
      to: '/analytics',
      label: 'Stats & Growth',
      icon: BarChart3,
      permission: null,
    },
    {
      to: '/settings',
      label: 'Platform Settings',
      icon: Sliders,
      permission: ADMIN_PERMISSIONS.SYSTEM_SETTINGS,
      superAdminOnly: true,
    },
    {
      to: '/audit-logs',
      label: 'Activity History',
      icon: FileText,
      permission: ADMIN_PERMISSIONS.AUDIT_LOGS,
    },
  ];

  const isItemVisible = (item) => {
    // Super admin exclusive items
    if (item.superAdminOnly && adminSubRole !== 'SUPER_ADMIN') {
      return false;
    }

    // Granular feature visibility toggles (whether finance ledger to show or not, etc.)
    if (item.to === '/finance' || item.to === '/withdrawals') {
      if (perms.showFinanceLedger === false && adminSubRole !== 'SUPER_ADMIN') return false;
    }
    if (item.to === '/advocates') {
      if (perms.showAdvocateVerification === false && adminSubRole !== 'SUPER_ADMIN') return false;
    }
    if (item.to === '/firms') {
      if (perms.showFirmManagement === false && adminSubRole !== 'SUPER_ADMIN') return false;
    }
    if (item.to === '/clients') {
      if (perms.showClientManagement === false && adminSubRole !== 'SUPER_ADMIN') return false;
    }
    if (item.to === '/support') {
      if (perms.showSupportDisputes === false && adminSubRole !== 'SUPER_ADMIN') return false;
    }
    if (item.to === '/audit-logs') {
      if (perms.showAuditLogs === false && adminSubRole !== 'SUPER_ADMIN') return false;
    }

    if (item.permission) {
      return checkAdminPermission(adminSubRole, item.permission);
    }
    return true;
  };

  return (
    <aside className="w-64 bg-[#1C1816] border-r border-stone-800 text-stone-300 flex flex-col h-full shrink-0 select-none">
      {/* Brand & Authority Header */}
      <div className="h-14 px-4 border-b border-stone-800 flex items-center justify-between bg-[#171412]">
        <div className="flex items-center space-x-2.5">
          <img
            src="/logo.jpg"
            alt="LawinoMeet"
            className="w-7 h-7 rounded-full object-cover ring-1 ring-amber-500/40 shadow-xs"
          />
          <div>
            <span className="font-serif font-bold text-sm tracking-tight text-stone-100 block leading-tight">
              LawinoMeet
            </span>
            <span className="text-[9px] font-mono tracking-widest text-amber-400 uppercase font-semibold">
              PLATFORM ADMIN
            </span>
          </div>
        </div>

        <span className="w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-emerald-950" title="System Operational" />
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs">
        <div className="px-3 pt-2 pb-1 text-[10px] font-mono font-semibold tracking-wider text-stone-500 uppercase">
          Administrative Operations
        </div>

        {navItems.map((item) => {
          const hasAccess = item.permission
            ? checkAdminPermission(adminSubRole, item.permission)
            : true;

          if (!hasAccess) {
            return (
              <div
                key={item.to}
                className="flex items-center justify-between px-3 py-2 rounded-xl text-stone-600 bg-stone-900/30 cursor-not-allowed text-[11px] opacity-60"
                title={`Access restricted for ${adminSubRole}`}
              >
                <div className="flex items-center space-x-2.5">
                  <item.icon className="w-3.5 h-3.5 text-stone-600" />
                  <span>{item.label}</span>
                </div>
                <Lock className="w-3 h-3 text-stone-600" />
              </div>
            );
          }

          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-medium transition group ${
                  isActive
                    ? 'bg-gradient-to-r from-[#831826]/80 to-[#5a101b]/60 text-white shadow-xs font-semibold border border-[#941B2B]/40'
                    : 'text-stone-300 hover:text-white hover:bg-stone-800/60'
                }`
              }
            >
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <item.icon className="w-3.5 h-3.5 shrink-0 opacity-80 group-hover:opacity-100 transition" />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[9px] font-mono px-1.5 py-0.5 rounded border font-bold shrink-0 ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer System Status */}
      <div className="p-3 border-t border-stone-800 bg-[#171412] text-[10px] text-stone-400 font-mono space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Domain</span>
          <span className="text-stone-300">admin.lawinomeet</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-stone-500">Infrastructure</span>
          <span className="text-emerald-400 flex items-center space-x-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>Online</span>
          </span>
        </div>
        <div className="flex items-center justify-between pt-0.5">
          <span className="text-stone-500">Platform Surcharge</span>
          <span className="text-amber-400 font-bold">10% Flat Fee</span>
        </div>
      </div>
    </aside>
  );
};
