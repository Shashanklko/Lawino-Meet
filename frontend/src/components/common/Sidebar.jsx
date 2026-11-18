import React, { useState } from 'react';
import { NavLink, Link } from 'react-router-dom';
import {
  Calendar,
  Briefcase,
  Users,
  Shield,
  FileText,
  Settings,
  Bell,
  MessageSquare,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle2,
  DollarSign,
  Building,
  Video,
  UserCheck,
  FileSpreadsheet,
  Layers,
  Inbox,
  Wallet,
  Palette,
  ShieldCheck,
  LifeBuoy,
  X,
  Globe,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotifications } from '../../context/NotificationContext';
import { useLanguage } from '../../context/LanguageContext';
import { ThemeSelector } from './ThemeSelector';
import { LanguageSelector } from './LanguageSelector';

export const Sidebar = ({ mobileOpen = false, onCloseMobile = () => {} }) => {
  const { user } = useAuth();
  const { unreadTotal } = useChat();
  const { unreadCount } = useNotifications();
  const { t } = useLanguage();
  const role = user?.role || 'CLIENT';
  const hasFirm = !!user?.firmMembership;

  // Smooth collapsible state persisted across browser sessions (desktop only)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    try {
      return localStorage.getItem('lawino_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('lawino_sidebar_collapsed', String(next));
      } catch {
        // storage fallback
      }
      return next;
    });
  };

  const getLinks = () => {
    if (role === 'LAWYER') {
      const links = [
        { name: t('nav.overview', 'Overview'), path: '/lawyer', icon: Layers, exact: true },
        { name: t('nav.appointments', 'Appointments'), path: '/lawyer/appointments', icon: Calendar },
        { name: t('nav.availability', 'Availability Calendar'), path: '/lawyer/availability', icon: Clock },
        { name: t('nav.video', 'Video Consultations'), path: '/lawyer/video', icon: Video },
        { name: t('nav.messages', 'Messages & Briefs'), path: '/messages', icon: MessageSquare, badge: unreadTotal },
        { name: t('nav.finance', 'Finance & Wallet'), path: '/lawyer/finance', icon: DollarSign },
      ];

      if (hasFirm) {
        links.push({
          name: t('nav.firm', 'Firm Association'),
          path: '/lawyer/firm-info',
          icon: Building,
        });
      }

      links.push(
        { name: t('nav.settings', 'My Profile & Chamber'), path: '/settings', icon: Settings },
        { name: t('nav.notifications', 'Notifications'), path: '/notifications', icon: Bell, badge: unreadCount },
        { name: t('nav.support', 'Help & Support'), path: '/support', icon: LifeBuoy }
      );
      return links;
    }

    if (role === 'PLATFORM_ADMIN') {
      return [
        { name: t('nav.overview', 'Overview'), path: '/admin', icon: Layers, exact: true },
        { name: t('nav.messages', 'Messages & Briefs'), path: '/messages', icon: MessageSquare, badge: unreadTotal },
        { name: t('nav.notifications', 'Notifications'), path: '/notifications', icon: Bell, badge: unreadCount },
        { name: t('nav.settings', 'Platform Settings'), path: '/settings', icon: Settings },
      ];
    }

    if (role === 'FIRM_ADMIN') {
      return [
        { name: t('nav.overview', 'Overview'), path: '/firm', icon: Layers, exact: true },
        { name: t('nav.firmProfile', 'Firm Profile'), path: '/firm/profile', icon: Building },
        { name: 'Lawyer Management', path: '/firm/lawyers', icon: Users },
        { name: t('nav.subAdmins', 'Sub-Admin Delegation'), path: '/firm/sub-admins', icon: ShieldCheck },
        { name: t('nav.requests', 'Appointment Requests'), path: '/firm/requests', icon: Inbox },
        { name: t('nav.appointments', 'Firm Appointments'), path: '/firm/appointments', icon: Calendar },
        { name: t('nav.services', 'Legal Services'), path: '/firm/services', icon: FileSpreadsheet },
        { name: t('nav.finance', 'Firm Finance'), path: '/firm/finance', icon: DollarSign },
        { name: t('nav.settings', 'Firm Settings'), path: '/settings', icon: Settings },
        { name: t('nav.notifications', 'Notifications'), path: '/notifications', icon: Bell, badge: unreadCount },
        { name: t('nav.support', 'Help & Support'), path: '/support', icon: LifeBuoy },
      ];
    }

    // Default CLIENT links
    return [
      { name: t('nav.overview', 'Overview'), path: '/client', icon: Layers, exact: true },
      { name: t('nav.findAdvocates', 'Find Advocates'), path: '/client/advocates', icon: Briefcase },
      { name: t('nav.findFirms', 'Find Law Firms'), path: '/client/firms', icon: Building },
      { name: t('nav.appointments', 'My Appointments'), path: '/client/appointments', icon: Calendar },
      { name: t('nav.finance', 'Wallet & Payments'), path: '/client/finance', icon: Wallet },
      { name: t('nav.messages', 'Messages & Chat'), path: '/messages', icon: MessageSquare, badge: unreadTotal },
      { name: t('nav.notifications', 'Notifications'), path: '/notifications', icon: Bell, badge: unreadCount },
      { name: t('nav.settings', 'My Profile & Settings'), path: '/settings', icon: Settings },
      { name: t('nav.support', 'Help & Support'), path: '/support', icon: LifeBuoy },
    ];
  };

  const links = getLinks();

  const roleBadge =
    role === 'PLATFORM_ADMIN'
      ? 'Platform Admin'
      : role === 'FIRM_ADMIN'
      ? 'Firm Admin'
      : role === 'LAWYER'
      ? hasFirm
        ? 'Firm Counsel'
        : 'Independent'
      : 'Client';

  return (
    <>
      {/* ===================================================================
          1. DESKTOP SIDEBAR (Visible on md and up: >=768px, smoothly collapsible)
      ==================================================================== */}
      <aside
        className={`hidden md:flex ${
          isCollapsed ? 'w-16 sm:w-20' : 'w-60 lg:w-64'
        } bg-white/95 backdrop-blur-xl border-r border-[var(--border-cream)] flex-col shrink-0 h-full text-[var(--text-primary)] select-none transition-all duration-300 ease-in-out relative z-20`}
      >
        {/* Top Brand Capsule */}
        <div
          className={`h-14 border-b border-[var(--border-cream)] flex items-center shrink-0 ${
            isCollapsed ? 'justify-center px-2' : 'justify-between px-4 sm:px-5'
          }`}
        >
          <Link
            to="/"
            className="flex items-center space-x-2.5 group overflow-hidden"
            title="LawinoMeet Legal Portal"
          >
            <img
              src="/logo.jpg"
              alt="LawinoMeet"
              className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--accent-gold)] shadow-xs group-hover:scale-105 transition shrink-0"
            />
            {!isCollapsed && (
              <span className="font-serif font-bold text-base tracking-tight text-[var(--text-primary)] truncate">
                LawinoMeet{' '}
                <span className="text-[10px] uppercase font-mono font-normal text-stone-400">
                  Legal CRM
                </span>
              </span>
            )}
          </Link>

          {!isCollapsed && (
            <button
              type="button"
              onClick={toggleCollapse}
              className="p-1 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition cursor-pointer"
              title="Collapse Sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* User Info Profile Pill */}
        <div
          className={`p-2 sm:p-3 border-b border-[var(--border-cream)] shrink-0 ${
            isCollapsed ? 'flex justify-center' : ''
          }`}
        >
          <NavLink
            to="/settings"
            className={`flex items-center rounded-xl hover:bg-[var(--bg-cream-card)] transition group ${
              isCollapsed ? 'p-2 justify-center' : 'space-x-3 p-2.5'
            }`}
            title={
              isCollapsed
                ? `${user?.fullName || user?.username} (${roleBadge})`
                : 'View Profile & Settings'
            }
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs shrink-0">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            {!isCollapsed && (
              <>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-serif font-bold text-stone-900 group-hover:text-[var(--bg-primary)] transition truncate">
                    {user?.fullName || user?.username}
                  </p>
                  <div className="flex items-center space-x-1 mt-0.5">
                    <span className="inline-block text-[9px] font-sans font-bold uppercase tracking-wider text-[var(--bg-primary)] bg-[var(--bg-cream-card)] px-2 py-0.2 rounded-full border border-[var(--border-cream)] truncate max-w-[130px]">
                      {roleBadge}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-stone-400 group-hover:text-stone-700 transition shrink-0" />
              </>
            )}
          </NavLink>
        </div>

        {/* Navigation Links */}
        <nav
          className={`p-2 sm:p-3 space-y-1 flex-1 overflow-y-auto ${
            isCollapsed ? 'flex flex-col items-center' : ''
          }`}
        >
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.exact}
                title={isCollapsed ? link.name : undefined}
                className={({ isActive }) =>
                  `flex items-center transition relative ${
                    isCollapsed
                      ? `w-10 h-10 rounded-xl justify-center ${
                          isActive
                            ? 'bg-[var(--bg-primary)] text-white shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-[var(--bg-cream-card)]'
                        }`
                      : `justify-between px-3 py-2 rounded-xl text-xs font-sans ${
                          isActive
                            ? 'bg-[var(--bg-primary)] text-white font-semibold shadow-xs'
                            : 'text-stone-600 hover:text-stone-900 hover:bg-[var(--bg-cream-card)] font-medium'
                        }`
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div
                      className={`flex items-center ${
                        isCollapsed ? 'justify-center' : 'space-x-2.5 truncate'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {!isCollapsed && <span className="truncate">{link.name}</span>}
                    </div>

                    {link.badge > 0 && (
                      <span
                        className={`${
                          isCollapsed
                            ? 'absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse'
                            : isActive
                            ? 'text-[10px] bg-white text-[var(--bg-primary)] font-bold px-1.5 py-0.2 rounded-full shadow-xs'
                            : 'text-[10px] bg-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full shadow-xs animate-pulse'
                        }`}
                      >
                        {!isCollapsed && link.badge}
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Utility Box */}
        <div className="p-2 sm:p-3 border-t border-[var(--border-cream)] bg-[var(--bg-cream-soft)]/60 space-y-2 shrink-0">
          {/* Chamber Theme Settings */}
          {!isCollapsed ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold flex items-center space-x-1.5">
                  <Palette className="w-3.5 h-3.5 text-stone-600" />
                  <span>Chamber Theme</span>
                </span>
              </div>
              <ThemeSelector position="up" isCollapsed={false} />
            </div>
          ) : (
            <div className="flex justify-center" title="Legal Theme Palette">
              <ThemeSelector position="up" isCollapsed={true} />
            </div>
          )}

          {/* Smooth Collapse / Expand Toggle Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={`flex items-center rounded-xl hover:bg-stone-100 text-stone-600 hover:text-stone-900 text-xs font-medium transition cursor-pointer ${
              isCollapsed
                ? 'w-10 h-10 mx-auto justify-center'
                : 'w-full justify-between px-3 py-2'
            }`}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-stone-600 hover:text-[var(--bg-primary)] transition-transform" />
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <ChevronLeft className="w-4 h-4 text-stone-500" />
                  <span className="text-stone-700 font-sans text-xs">Collapse Sidebar</span>
                </div>
                <span className="text-[9px] font-mono bg-stone-200/80 text-stone-600 px-1.5 py-0.5 rounded">
                  Hide
                </span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* ===================================================================
          2. MOBILE SLIDE-OVER DRAWER (< 768px: smooth overlay, no screen squeeze)
      ==================================================================== */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex animate-in fade-in duration-200">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />

          {/* Sliding Navigation Panel */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-250">
            {/* Top Bar with Brand & Close Button */}
            <div className="h-14 px-4 border-b border-[var(--border-cream)] flex items-center justify-between shrink-0 bg-[var(--bg-cream-soft)]">
              <Link
                to="/"
                onClick={onCloseMobile}
                className="flex items-center space-x-2.5 overflow-hidden"
              >
                <img
                  src="/logo.jpg"
                  alt="LawinoMeet"
                  className="w-7 h-7 rounded-full object-cover ring-1 ring-[var(--accent-gold)] shadow-xs"
                />
                <span className="font-serif font-bold text-base tracking-tight text-stone-900">
                  LawinoMeet
                </span>
              </Link>
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/60 transition cursor-pointer"
                title="Close Menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Capsule */}
            <div className="p-3 border-b border-[var(--border-cream)] bg-white">
              <NavLink
                to="/settings"
                onClick={onCloseMobile}
                className="flex items-center space-x-3 p-2 rounded-xl bg-[var(--bg-cream-soft)]"
              >
                <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shadow-xs shrink-0">
                  {user?.username?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="overflow-hidden flex-1 min-w-0">
                  <p className="text-xs font-serif font-bold text-stone-900 truncate">
                    {user?.fullName || user?.username}
                  </p>
                  <span className="inline-block text-[9px] font-sans font-bold uppercase tracking-wider text-[var(--bg-primary)] bg-white px-2 py-0.2 rounded-full border border-[var(--border-cream)] mt-0.5">
                    {roleBadge}
                  </span>
                </div>
              </NavLink>
            </div>

            {/* Scrollable Mobile Nav Links */}
            <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <NavLink
                    key={link.path}
                    to={link.path}
                    end={link.exact}
                    onClick={onCloseMobile}
                    className={({ isActive }) =>
                      `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-sans transition ${
                        isActive
                          ? 'bg-[var(--bg-primary)] text-white font-semibold shadow-xs'
                          : 'text-stone-700 hover:bg-[var(--bg-cream-card)] font-medium'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center space-x-3 truncate">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span className="truncate">{link.name}</span>
                        </div>
                        {link.badge > 0 && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs ${
                              isActive
                                ? 'bg-white text-[var(--bg-primary)]'
                                : 'bg-rose-500 text-white animate-pulse'
                            }`}
                          >
                            {link.badge}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Language & Theme Controls at Drawer Bottom */}
            <div className="p-3 border-t border-[var(--border-cream)] bg-[var(--bg-cream-soft)] space-y-2.5 shrink-0">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold px-1">
                  Language / भाषा
                </span>
                <LanguageSelector position="up" isCollapsed={false} className="w-full" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold px-1">
                  Chamber Theme
                </span>
                <ThemeSelector position="up" isCollapsed={false} />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
