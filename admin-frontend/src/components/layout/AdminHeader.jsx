import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Search,
  Bell,
  Calendar,
  ChevronDown,
  LogOut,
  User,
  Sliders,
  ExternalLink,
  Lock,
  Layers,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { ThemeSelector } from './ThemeSelector';
import { ADMIN_SUB_ROLES } from '../../utils/adminPermissions';
import { DOMAIN_CONFIG } from '../../utils/domainConfig';

export const AdminHeader = ({ selectedDateFilter, onDateFilterChange }) => {
  const { adminUser, adminSubRole, setAdminSubRole, logout } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);

  const roleRef = useRef(null);
  const userRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (roleRef.current && !roleRef.current.contains(e.target)) setRoleMenuOpen(false);
      if (userRef.current && !userRef.current.contains(e.target)) setUserMenuOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotificationOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/clients')) return 'Client Management';
    if (path.includes('/advocates')) return 'Advocate Management & Verifications';
    if (path.includes('/firms')) return 'Law Firm Management & LLP Audits';
    if (path.includes('/appointments')) return 'Platform-Wide Appointment Escalations';
    if (path.includes('/support')) return 'Customer Support & Dispute Resolutions';
    if (path.includes('/finance')) return 'Platform Finance, Commissions & Refunds';
    if (path.includes('/withdrawals')) return 'Withdrawals & Advocate Settlements';
    if (path.includes('/reports')) return 'Platform Reviews & Moderation Reports';
    if (path.includes('/notifications')) return 'Administrative Notifications & Broadcasts';
    if (path.includes('/analytics')) return 'Platform Analytics & Growth Telemetry';
    if (path.includes('/settings')) return 'Global Platform Configuration & Rules';
    if (path.includes('/audit-logs')) return 'Tamper-Evident Administrative Audit Trail';
    return 'Master Platform Operations Overview';
  };

  const subRoleMeta = ADMIN_SUB_ROLES[adminSubRole] || ADMIN_SUB_ROLES.SUPER_ADMIN;

  return (
    <header
      className="h-14 px-4 sm:px-6 border-b text-stone-200 flex items-center justify-between shrink-0 select-none z-30 shadow-sm transition-colors duration-200"
      style={{ backgroundColor: 'var(--admin-bg-header)', borderColor: 'var(--admin-border)' }}
    >
      {/* Left: Breadcrumbs and Title */}
      <div className="flex items-center space-x-3 overflow-hidden">
        <div className="flex items-center space-x-2 text-xs font-mono text-stone-400">
          <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0" />
          <span className="font-semibold text-amber-400/90 tracking-wider text-[11px]">
            LawinoMeet // Operations
          </span>
          <span className="text-stone-600">/</span>
        </div>
        <h1 className="text-xs sm:text-sm font-serif font-bold text-stone-100 truncate">
          {getPageTitle()}
        </h1>
      </div>

      {/* Right: Date Filter, Authority Badge, Theme, Public Site Link, Profile */}
      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Date Filter Selector */}
        <div className="hidden md:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-xs">
          <Calendar className="w-3.5 h-3.5 text-stone-400 shrink-0" />
          <select
            value={selectedDateFilter}
            onChange={(e) => onDateFilterChange(e.target.value)}
            className="bg-transparent text-[11px] text-stone-300 focus:outline-none cursor-pointer"
          >
            <option value="TODAY" className="bg-stone-900 text-white">Today</option>
            <option value="LAST_7_DAYS" className="bg-stone-900 text-white">Last 7 Days</option>
            <option value="LAST_30_DAYS" className="bg-stone-900 text-white">Last 30 Days</option>
            <option value="CUSTOM_RANGE" className="bg-stone-900 text-white">Custom Range</option>
          </select>
        </div>

        {/* Operational Authority Badge */}
        <div className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-stone-900/80 border border-stone-800 text-xs">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          <div className="text-left hidden lg:block">
            <div className="text-[10px] font-mono text-stone-400 leading-tight">Authority Role</div>
            <div className="font-serif font-bold text-[11px] text-amber-300 leading-tight">
              {subRoleMeta.label}
            </div>
          </div>
        </div>

        {/* Public Website External Link */}
        <a
          href={DOMAIN_CONFIG.CLIENT_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 hover:text-white text-[11px] transition"
          title={`Open Public Website (${DOMAIN_CONFIG.CLIENT_PORTAL_URL})`}
        >
          <span>Public Portal</span>
          <ExternalLink className="w-3 h-3 text-stone-400" />
        </a>

        {/* Theme Selector */}
        <ThemeSelector />

        {/* Admin Alerts Bell */}
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setNotificationOpen(!notificationOpen)}
            className="p-1.5 rounded-lg border border-stone-800 bg-stone-900/80 hover:bg-stone-800 text-stone-300 relative transition cursor-pointer"
            title="Operational System Alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-rose-500 rounded-full" />
          </button>

          {notificationOpen && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#1C1816] border border-stone-700 shadow-2xl z-50 p-3 space-y-2 text-xs">
              <div className="flex items-center justify-between border-b border-stone-800 pb-2">
                <span className="font-serif font-bold text-xs text-stone-200">System Priority Feeds</span>
                <span className="text-[10px] font-mono text-amber-400">Live Telemetry</span>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 space-y-0.5">
                  <div className="text-[11px] font-semibold text-rose-300">Appointment Escalated #APPT-2026-981</div>
                  <div className="text-[10px] text-stone-400">WebRTC connection dropped during Supreme Court hearing room.</div>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 space-y-0.5">
                  <div className="text-[11px] font-semibold text-amber-300">New Advocate Verification Submitted</div>
                  <div className="text-[10px] text-stone-400">Adv. Ananya Roy submitted Delhi Bar Council enrollment credentials.</div>
                </div>
                <div className="p-2 rounded-lg bg-stone-900/80 border border-stone-800 space-y-0.5">
                  <div className="text-[11px] font-semibold text-emerald-300">10% Platform Treasury Settlement</div>
                  <div className="text-[10px] text-stone-400">₹14,500 credited to platform commission escrow.</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Admin Profile Dropdown */}
        <div className="relative" ref={userRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center space-x-2 p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#941B2B] to-amber-600 text-white flex items-center justify-center font-serif font-bold text-xs ring-1 ring-amber-500/30">
              {adminUser?.avatar || 'A'}
            </div>
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1C1816] border border-stone-700 shadow-2xl z-50 p-3 space-y-2 text-xs">
              <div className="border-b border-stone-800 pb-2">
                <div className="font-serif font-bold text-stone-200">{adminUser?.fullName}</div>
                <div className="text-[10px] text-stone-400 font-mono">{adminUser?.email}</div>
                <div className="text-[10px] text-amber-400 font-serif mt-0.5">{subRoleMeta.label}</div>
              </div>

              <div className="space-y-1">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-stone-300 hover:bg-stone-800 transition"
                >
                  <Sliders className="w-3.5 h-3.5 text-stone-400" />
                  <span>Platform System Settings</span>
                </Link>
                <Link
                  to="/audit-logs"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center space-x-2 p-2 rounded-lg text-stone-300 hover:bg-stone-800 transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-stone-400" />
                  <span>Administrative Audit Trail</span>
                </Link>
              </div>

              <div className="border-t border-stone-800 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 p-2 rounded-lg text-rose-400 hover:bg-rose-950/40 transition cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of Master Console</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
