import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell,
  MessageSquare,
  Search,
  ChevronDown,
  LogOut,
  Settings,
  Calendar,
  LayoutDashboard,
  CheckCheck,
  Video,
  ExternalLink,
  ShieldCheck,
  Users,
  Building,
  UserCheck,
  LifeBuoy,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from '../common/LanguageSelector';

export const CrmHeader = ({ onOpenMobileMenu }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { unreadTotal } = useChat();
  const { t } = useLanguage();
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setNotificationOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getPageTitleKey = () => {
    const path = location.pathname;
    if (path.includes('/client/advocates') || path.startsWith('/lawyers')) return 'nav.findAdvocates';
    if (path.includes('/client/firms') || path.startsWith('/firms')) return 'nav.findFirms';
    if (path.includes('/client/appointments')) return 'nav.appointments';
    if (path.includes('/client/finance')) return 'nav.finance';
    if (path === '/client') return 'nav.overview';

    if (path.includes('/lawyer/appointments')) return 'nav.appointments';
    if (path.includes('/lawyer/availability') || path.includes('/lawyer/slots')) return 'nav.availability';
    if (path.includes('/lawyer/video')) return 'nav.video';
    if (path.includes('/lawyer/finance')) return 'nav.finance';
    if (path.includes('/lawyer/firm-info')) return 'nav.firm';
    if (path === '/lawyer') return 'nav.overview';

    if (path.includes('/firm/profile')) return 'nav.firmProfile';
    if (path.includes('/firm/requests')) return 'nav.requests';
    if (path.includes('/firm/appointments')) return 'nav.appointments';
    if (path.includes('/firm/services')) return 'nav.services';
    if (path.includes('/firm/finance')) return 'nav.finance';
    if (path === '/firm') return 'nav.overview';

    if (path.startsWith('/admin')) return 'nav.overview';

    if (path.includes('/messages')) return 'nav.messages';
    if (path.includes('/settings')) return 'nav.settings';
    if (path.includes('/notifications')) return 'nav.notifications';
    if (path.includes('/support')) return 'nav.support';
    return 'nav.overview';
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const role = user?.role || 'CLIENT';
  const isFirmLawyer = role === 'LAWYER' && !!user?.firmMembership;
  const isIndepLawyer = role === 'LAWYER' && !user?.firmMembership;
  const isFirmAdmin = role === 'FIRM_ADMIN';

  const firmName =
    user?.firmName ||
    user?.firmMembership?.firmName ||
    (isFirmAdmin ? 'Lex Veritas Legal LLP' : null);
  const firmLogo = user?.firmLogo || null;

  return (
    <header className="h-14 px-3 sm:px-6 bg-white/90 backdrop-blur-xl border-b border-[var(--border-cream)] flex items-center justify-between shrink-0 select-none z-30">
      {/* Left: Mobile Menu Hamburger & Title & Firm Branding */}
      <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="md:hidden p-1.5 -ml-1 rounded-lg text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition cursor-pointer shrink-0"
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <h1 className="text-sm font-serif font-bold text-[var(--text-primary)] truncate">
          {t(getPageTitleKey())}
        </h1>

        {/* Firm Name with Logo if Any, otherwise name only */}
        {firmName ? (
          <>
            <span className="hidden sm:inline-block w-1.5 h-1.5 rounded-full bg-stone-300" />
            <div className="hidden sm:inline-flex items-center space-x-2 px-2.5 py-1 rounded-full bg-[var(--bg-cream-card)] border border-[var(--border-cream)] text-xs text-stone-800">
              {firmLogo ? (
                <img
                  src={firmLogo}
                  alt={firmName}
                  className="w-4 h-4 rounded-full object-cover shrink-0"
                />
              ) : (
                <Building className="w-3.5 h-3.5 text-stone-600 shrink-0" />
              )}
              <span className="font-serif font-bold text-stone-900 tracking-tight text-xs truncate max-w-[220px]">
                {firmName}
              </span>
            </div>
          </>
        ) : null}
      </div>

      {/* Right: Language Selector, Messages, Notifications, Profile */}
      <div className="flex items-center space-x-1.5 sm:space-x-3 shrink-0">
        {/* Language Selector Dropdown */}
        <div className="hidden sm:block">
          <LanguageSelector position="down" />
        </div>

        {/* Messages Dedicated Page Shortcut (Hidden for Firm Admin) */}
        {user?.role !== 'FIRM_ADMIN' && (
          <Link
            to="/messages"
            className="relative p-2 rounded-lg text-stone-600 hover:text-[var(--bg-primary)] hover:bg-[var(--bg-cream-card)] transition"
            title="Open Messages Page"
          >
            <MessageSquare className="w-4 h-4 text-stone-700" />
            {unreadTotal > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--bg-primary)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadTotal}
              </span>
            )}
          </Link>
        )}

        {/* Small Notification Box Popover */}
        <div className="relative" ref={notificationsRef}>
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(!notificationOpen);
              setUserMenuOpen(false);
            }}
            className="relative p-2 rounded-lg text-stone-600 hover:text-[var(--bg-primary)] hover:bg-[var(--bg-cream-card)] transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-4 h-4 text-stone-700" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[var(--bg-primary)] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationOpen && (
            <div className="absolute right-0 top-11 w-80 bg-white/95 backdrop-blur-2xl border border-[var(--border-cream)] rounded-2xl shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="px-4 pb-2 border-b border-stone-200/70 flex items-center justify-between">
                <span className="font-serif font-bold text-stone-900">Notifications</span>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-[11px] text-[var(--bg-primary)] hover:underline font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Mark all read</span>
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-y-auto divide-y divide-stone-100">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-xs text-stone-400">No new notifications</div>
                ) : (
                  notifications.slice(0, 4).map((n) => (
                    <div
                      key={n.publicId}
                      onClick={async () => {
                        if (!n.isRead) await markAsRead(n.publicId);
                      }}
                      className={`p-3 px-4 hover:bg-[var(--bg-cream-soft)] transition cursor-pointer flex items-start space-x-2.5 ${
                        !n.isRead ? 'bg-rose-50/40' : ''
                      }`}
                    >
                      <div className="w-2 h-2 rounded-full bg-[var(--bg-primary)] mt-1 shrink-0" style={{ opacity: n.isRead ? 0 : 1 }} />
                      <div className="overflow-hidden flex-1">
                        <h5 className="text-xs font-bold text-stone-900 truncate">{n.title}</h5>
                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">{n.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="pt-2 px-4 border-t border-stone-200/70 text-center">
                <Link
                  to="/notifications"
                  onClick={() => setNotificationOpen(false)}
                  className="text-[11px] text-[var(--bg-primary)] hover:underline font-medium"
                >
                  View full notifications &rarr;
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Public Site Link */}
        <Link
          to="/"
          className="hidden sm:inline-flex items-center space-x-1 text-xs text-stone-500 hover:text-[var(--bg-primary)] px-2.5 py-1 rounded-lg hover:bg-[var(--bg-cream-card)] transition"
        >
          <span>{t('Website')}</span>
          <ExternalLink className="w-3 h-3" />
        </Link>

        {/* User Menu Dropdown */}
        <div className="relative pl-1 sm:pl-2 border-l border-stone-200" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => {
              setUserMenuOpen(!userMenuOpen);
              setNotificationOpen(false);
            }}
            className="flex items-center space-x-2 p-1 rounded-full hover:bg-[var(--bg-cream-card)] transition cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-white flex items-center justify-center text-xs font-serif font-bold shadow-xs">
              {user?.username?.[0]?.toUpperCase() || 'U'}
            </div>
            <div className="text-left hidden lg:block">
              <p className="text-xs font-serif font-bold text-stone-900 leading-tight truncate max-w-[120px]">
                {user?.fullName?.split(' ')[0] || user?.username}
              </p>
              <p className="text-[9px] text-stone-400 font-mono leading-none">
                {role.replace('_', ' ')}
              </p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-11 w-56 bg-white/95 backdrop-blur-2xl border border-[var(--border-cream)] rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-xs">
              <div className="px-4 py-2.5 border-b border-stone-200/70">
                <p className="font-serif font-bold text-stone-900 truncate">{user?.fullName || user?.username}</p>
                <p className="text-[11px] text-stone-500 font-mono truncate">@{user?.username}</p>
                {user?.firmMembership && (
                  <p className="text-[10px] text-stone-600 font-sans mt-0.5 truncate">
                    {user.firmMembership.firmName}
                  </p>
                )}
              </div>

              <div className="py-1">
                <Link
                  to="/settings"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-[var(--bg-cream-soft)] text-stone-700 hover:text-[var(--bg-primary)] transition"
                >
                  <Settings className="w-3.5 h-3.5" />
                  <span>Profile Settings</span>
                </Link>
                {role === 'LAWYER' && (
                  <>
                    <Link
                      to="/lawyer/availability"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-[var(--bg-cream-soft)] text-stone-700 hover:text-[var(--bg-primary)] transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Availability Calendar</span>
                    </Link>
                    <Link
                      to="/lawyer/finance"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-[var(--bg-cream-soft)] text-stone-700 hover:text-[var(--bg-primary)] transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Finance & Wallet</span>
                    </Link>
                  </>
                )}
                {role === 'FIRM_ADMIN' && (
                  <Link
                    to="/firm/finance"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[var(--bg-cream-soft)] text-stone-700 hover:text-[var(--bg-primary)] transition"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Firm Finance</span>
                  </Link>
                )}
                {user?.role !== 'FIRM_ADMIN' && (
                  <Link
                    to="/messages"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center space-x-2 px-4 py-2 hover:bg-[var(--bg-cream-soft)] text-stone-700 hover:text-[var(--bg-primary)] transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Messages Page</span>
                  </Link>
                )}
                <Link
                  to="/support"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-[var(--bg-cream-soft)] text-stone-700 hover:text-[var(--bg-primary)] transition"
                >
                  <LifeBuoy className="w-3.5 h-3.5" />
                  <span>Help &amp; Grievances</span>
                </Link>
              </div>

              <div className="border-t border-stone-200/70 pt-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-rose-50 text-rose-700 transition text-left cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
