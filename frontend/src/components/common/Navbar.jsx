import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MessageSquare, Bell, LogOut, LayoutDashboard, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { ThemeSelector } from './ThemeSelector';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadTotal, setIsDrawerOpen } = useChat();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/login';
    if (user.role === 'LAWYER') return '/dashboard/lawyer';
    if (user.role === 'FIRM_ADMIN') return '/dashboard/firm';
    return '/dashboard/client';
  };

  return (
    <nav className="bg-maroon-950/80 backdrop-blur-xl border-b border-luxury-gold/20 text-cream-100 sticky top-0 z-40 shadow-xl transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand Name (Aligned left, no subtitle, LawinoMeet with L & M capital) */}
          <Link to="/" className="flex items-center space-x-2.5 group shrink-0">
            <img
              src="/logo.jpg"
              alt="LawinoMeet Logo"
              className="w-9 h-9 rounded-full object-cover shadow-md ring-1 ring-luxury-gold/50 group-hover:scale-105 transition"
            />
            <span className="font-serif font-bold text-lg tracking-wide text-cream-50 group-hover:text-luxury-gold-light transition">
              Lawino<span className="text-luxury-gold">Meet</span>
            </span>
          </Link>

          {/* Center Navigation Links */}
          <div className="hidden lg:flex items-center space-x-7 text-xs font-serif tracking-wider uppercase">
            <Link
              to="/lawyers"
              className="text-cream-200 hover:text-luxury-gold transition py-1"
            >
              Discover Advocates
            </Link>
            <Link
              to="/lawyers?mode=OFFLINE"
              className="text-cream-200 hover:text-luxury-gold transition flex items-center space-x-1.5 py-1"
            >
              <Shield className="w-3.5 h-3.5 text-luxury-gold" />
              <span>Chamber Consultation</span>
            </Link>
            <Link
              to="/firms"
              className="text-cream-200 hover:text-luxury-gold transition py-1"
            >
              Law Firm Chambers
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-3">
            {/* Theme Selector Palette */}
            <ThemeSelector />

            {isAuthenticated ? (
              <>
                {/* Chat Drawer Toggle */}
                <button
                  onClick={() => setIsDrawerOpen((prev) => !prev)}
                  className="relative p-2 rounded-xl text-cream-200 hover:text-white hover:bg-white/10 transition"
                  title="Messages"
                >
                  <MessageSquare className="w-4 h-4 text-luxury-gold-light" />
                  {unreadTotal > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-luxury-gold text-maroon-950 text-[10px] font-black flex items-center justify-center shadow-md">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </button>

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-xl text-cream-200 hover:text-white hover:bg-white/10 transition"
                  title="Notifications"
                >
                  <Bell className="w-4 h-4 text-luxury-gold-light" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-maroon-500 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard Shortcut */}
                <Link
                  to={getDashboardLink()}
                  className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light text-maroon-950 text-xs font-serif font-bold shadow-md hover:brightness-110 hover:scale-105 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                {/* User Dropdown / Name */}
                <div className="flex items-center space-x-2 pl-2 border-l border-luxury-gold/30">
                  <div className="w-8 h-8 rounded-full bg-maroon-900 border border-luxury-gold flex items-center justify-center text-xs font-serif font-black text-luxury-gold">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-cream-400 hover:text-rose-400 hover:bg-white/10 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2.5">
                <Link
                  to="/login"
                  className="text-xs font-serif uppercase tracking-wider text-cream-200 hover:text-luxury-gold transition px-2.5 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-serif font-bold uppercase tracking-wider text-maroon-950 bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 px-3.5 py-1.5 rounded-xl shadow-md transition"
                >
                  Book Consultation
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
