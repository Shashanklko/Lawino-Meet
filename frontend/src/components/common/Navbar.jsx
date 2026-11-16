import React, { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Bell,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Search,
  Settings,
  ChevronDown,
  CheckCheck,
  Calendar,
  User,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { useLanguage } from '../../context/LanguageContext';
import { LanguageSelector } from './LanguageSelector';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { t } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { unreadTotal, setIsDrawerOpen } = useChat();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationBoxOpen, setNotificationBoxOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setNotificationBoxOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setMobileMenuOpen(false);
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'LAWYER') return '/dashboard/lawyer';
    if (user.role === 'FIRM_ADMIN') return '/dashboard/firm';
    return '/dashboard/client';
  };

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate(`/#${id}`);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className="bg-[#FAF6EE]/95 backdrop-blur-md border-b border-[#EAE2D5] text-[#2E2A29] sticky top-0 z-50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name (Far Left, Clean Size, L & M Capital) */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 group shrink-0"
            onClick={() => setMobileMenuOpen(false)}
          >
            <img
              src="/logo.jpg"
              alt="LawinoMeet Logo"
              className="w-8 h-8 rounded-full object-cover ring-1 ring-[#831826]/30 shadow-sm group-hover:scale-105 transition duration-300"
            />
            <span className="font-serif font-semibold text-lg tracking-tight text-[#2E2A29] group-hover:text-[#831826] transition">
              LawinoMeet
            </span>
          </Link>

          {/* Desktop Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-7 text-sm font-sans text-[#524B47]">
            <button
              onClick={() => scrollToSection('story')}
              className="hover:text-[#831826] transition font-medium cursor-pointer"
            >
              {t('nav.ourStory', 'Our Story')}
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="hover:text-[#831826] transition font-medium cursor-pointer"
            >
              {t('nav.services', 'Services')}
            </button>
            <NavLink
              to="/lawyers"
              className={({ isActive }) =>
                `hover:text-[#831826] transition font-medium ${
                  isActive ? 'text-[#831826] font-semibold' : ''
                }`
              }
            >
              {t('nav.findAdvocates', 'Find Advocates')}
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) =>
                `hover:text-[#831826] transition font-medium ${
                  isActive ? 'text-[#831826] font-semibold' : ''
                }`
              }
            >
              {t('nav.contactUs', 'Contact Us')}
            </NavLink>
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3.5">
            {/* Language Selector */}
            <LanguageSelector position="down" />

            {isAuthenticated ? (
              <>
                {/* Messages Button */}
                <button
                  onClick={() => setIsDrawerOpen((prev) => !prev)}
                  className="relative p-2 rounded-xl text-[#524B47] hover:text-[#831826] hover:bg-[#831826]/10 transition"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4 text-[#831826]" />
                  {unreadTotal > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#831826] text-white text-[10px] font-bold flex items-center justify-center shadow-md">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </button>

                {/* Small Notification Box (Dropdown Popover) */}
                <div className="relative" ref={notificationsRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationBoxOpen(!notificationBoxOpen);
                      setUserMenuOpen(false);
                    }}
                    className="relative p-2 rounded-xl text-[#524B47] hover:text-[#831826] hover:bg-[#831826]/10 transition cursor-pointer"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4 text-[#831826]" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-[#831826] text-white text-[10px] font-bold flex items-center justify-center shadow-md animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Popover Box */}
                  {notificationBoxOpen && (
                    <div className="absolute right-0 top-12 w-80 sm:w-88 bg-white/95 backdrop-blur-2xl border border-stone-200/90 rounded-3xl shadow-2xl py-3 z-50 animate-in fade-in zoom-in-95">
                      <div className="px-4 pb-2.5 border-b border-stone-200/70 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-serif font-bold text-[#1F1C1B]">
                            {t('nav.notificationsTitle', 'Notifications')}
                          </span>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-[#831826] text-white font-bold px-2 py-0.5 rounded-full">
                              {unreadCount} {t('nav.newCount', 'new')}
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={markAllAsRead}
                            className="text-[11px] text-[#831826] hover:underline font-medium flex items-center space-x-1 cursor-pointer"
                          >
                            <CheckCheck className="w-3 h-3" />
                            <span>{t('nav.markAllRead', 'Mark all read')}</span>
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-stone-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-xs text-stone-400">
                            {t('nav.noNotifications', 'No notifications yet')}
                          </div>
                        ) : (
                          notifications.slice(0, 4).map((n) => (
                            <div
                              key={n.publicId}
                              onClick={async () => {
                                if (!n.isRead) await markAsRead(n.publicId);
                                // Remains on current page - marks as read without redirecting
                              }}
                              className={`p-3 px-4 hover:bg-[#FAF8F5] transition cursor-pointer flex items-start space-x-2.5 ${
                                !n.isRead ? 'bg-rose-50/40' : ''
                              }`}
                            >
                              <div
                                className="w-2 h-2 rounded-full bg-[#831826] mt-1.5 shrink-0"
                                style={{ opacity: n.isRead ? 0 : 1 }}
                              />
                              <div className="overflow-hidden flex-1">
                                <h5 className="text-xs font-bold text-[#1F1C1B] truncate">{n.title}</h5>
                                <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed mt-0.5">
                                  {n.message}
                                </p>
                                <span className="text-[9px] text-stone-400 mt-1 block">
                                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-2.5 px-4 border-t border-stone-200/70 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setNotificationBoxOpen(false)}
                          className="text-[11px] text-[#831826] hover:underline font-medium"
                        >
                          {t('nav.viewAllNotifications', 'View all notifications →')}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dashboard Quick Pill */}
                <Link
                  to={getDashboardLink()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full border border-[#831826]/30 text-[#831826] hover:bg-[#831826]/10 text-xs font-serif font-bold uppercase tracking-wider transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>{t('nav.dashboard', 'Dashboard')}</span>
                </Link>

                {/* User Menu Dropdown (Avatar + Popover) */}
                <div className="relative pl-1 border-l border-[#EAE2D5]" ref={userMenuRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setUserMenuOpen(!userMenuOpen);
                      setNotificationBoxOpen(false);
                    }}
                    className="flex items-center space-x-2 p-1 rounded-full hover:bg-stone-200/40 transition cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-full bg-[#831826] text-white flex items-center justify-center text-xs font-serif font-bold shadow-xs">
                      {user?.username?.[0]?.toUpperCase() || 'U'}
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-stone-500" />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute right-0 top-12 w-64 bg-white/95 backdrop-blur-2xl border border-stone-200/90 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in zoom-in-95 text-xs">
                      <div className="px-4 py-3 border-b border-stone-200/70">
                        <p className="font-serif font-bold text-stone-900 truncate">
                          {user?.fullName || user?.username}
                        </p>
                        <p className="text-[11px] text-stone-500 font-mono truncate">@{user?.username}</p>
                        <span className="inline-block text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#831826]/10 text-[#831826] mt-1.5">
                          {user?.role?.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="py-1">
                        <Link
                          to={getDashboardLink()}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-stone-700 hover:text-[#831826] transition"
                        >
                          <LayoutDashboard className="w-3.5 h-3.5" />
                          <span>{t('nav.dashboard', 'Dashboard')}</span>
                        </Link>
                        <Link
                          to="/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-stone-700 hover:text-[#831826] transition font-medium"
                        >
                          <Settings className="w-3.5 h-3.5" />
                          <span>{t('nav.profileSettings', 'Profile & Chamber Settings')}</span>
                        </Link>
                        {user?.role === 'LAWYER' && (
                          <Link
                            to="/dashboard/lawyer/slots"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-stone-700 hover:text-[#831826] transition"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>{t('nav.availabilityCalendar', 'Availability Calendar')}</span>
                          </Link>
                        )}
                        <Link
                          to="/lawyers"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 hover:bg-[#FAF8F5] text-stone-700 hover:text-[#831826] transition"
                        >
                          <Search className="w-3.5 h-3.5" />
                          <span>{t('nav.findAdvocates', 'Find Advocates')}</span>
                        </Link>
                      </div>

                      <div className="border-t border-stone-200/70 pt-1">
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full flex items-center space-x-2.5 px-4 py-2 hover:bg-rose-50 text-rose-700 transition text-left cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>{t('nav.signOut', 'Sign Out')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-sans font-medium text-[#524B47] hover:text-[#831826] transition px-2 py-1"
                >
                  {t('nav.signIn', 'Sign In')}
                </Link>
                <Link
                  to="/lawyers"
                  className="px-5 py-2 rounded-full text-xs sm:text-sm font-medium text-white bg-[#831826] hover:bg-[#6c131f] shadow-sm hover:shadow transition"
                >
                  {t('nav.consultLawyer', 'Consult a lawyer')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-[#524B47] hover:text-[#831826] hover:bg-[#831826]/10 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Glassy Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF6EE] border-b border-[#EAE2D5] px-6 py-5 space-y-4 shadow-xl">
          <div className="space-y-2">
            <button
              onClick={() => scrollToSection('story')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#524B47] hover:bg-[#831826]/10 hover:text-[#831826] transition"
            >
              {t('nav.ourStory', 'Our Story')}
            </button>
            <button
              onClick={() => scrollToSection('services')}
              className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-[#524B47] hover:bg-[#831826]/10 hover:text-[#831826] transition"
            >
              {t('nav.services', 'Services')}
            </button>
            <Link
              to="/lawyers"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#524B47] hover:bg-[#831826]/10 hover:text-[#831826] transition"
            >
              {t('nav.findAdvocates', 'Find Advocates')}
            </Link>
            <Link
              to="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-sm font-medium text-[#524B47] hover:bg-[#831826]/10 hover:text-[#831826] transition"
            >
              {t('nav.contactUs', 'Contact Us')}
            </Link>

            <div className="pt-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-stone-500 font-semibold px-1 block mb-1">
                {t('nav.selectLanguage', 'Select Language / भाषा')}
              </span>
              <LanguageSelector position="down" className="w-full" />
            </div>
          </div>

          <div className="pt-3 border-t border-[#EAE2D5] flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-full bg-[#831826] text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  {t('nav.goToDashboard', 'Go to Dashboard')}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2 rounded-lg text-xs text-rose-600 hover:bg-rose-50"
                >
                  {t('nav.signOut', 'Sign Out')}
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-full border border-[#831826]/40 text-[#831826] text-xs uppercase tracking-wider font-bold"
                >
                  {t('nav.signIn', 'Sign In')}
                </Link>
                <Link
                  to="/lawyers"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-full bg-[#831826] text-white text-xs uppercase tracking-wider font-bold shadow-md"
                >
                  {t('nav.consultNow', 'Consult Now')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
