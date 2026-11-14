import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  Bell,
  LogOut,
  LayoutDashboard,
  Menu,
  X,
  Search,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';
import { ThemeSelector } from './ThemeSelector';

export const Navbar = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadTotal, setIsDrawerOpen } = useChat();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

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

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Find Advocates', path: '/lawyers', icon: Search },
    { name: 'Chambers', path: '/lawyers?mode=OFFLINE' },
    { name: 'About Us', path: '/about' },
    { name: 'Contact Us', path: '/contact' },
  ];

  return (
    <nav className="bg-maroon-950/90 backdrop-blur-xl border-b border-luxury-gold/25 text-cream-100 sticky top-0 z-40 shadow-xl transition-all duration-300">
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
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-1 ring-luxury-gold/60 shadow-md group-hover:scale-105 transition duration-300"
            />
            <span className="font-serif font-bold text-base sm:text-lg tracking-wide text-cream-50 group-hover:text-luxury-gold-light transition">
              Lawino<span className="text-luxury-gold">Meet</span>
            </span>
          </Link>

          {/* Desktop Center Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8 text-xs font-serif tracking-wider uppercase">
            {navLinks.map((link) => (
              <NavLink
                key={link.name}
                to={link.path}
                className={({ isActive }) =>
                  `transition-colors py-1 relative ${
                    isActive
                      ? 'text-luxury-gold font-bold border-b border-luxury-gold'
                      : 'text-cream-200 hover:text-luxury-gold'
                  }`
                }
              >
                {link.name}
              </NavLink>
            ))}
          </div>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center space-x-3">
            {/* Custom Theme Selector */}
            <ThemeSelector />

            {isAuthenticated ? (
              <>
                {/* Messages Button */}
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

                {/* Notifications Button */}
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

                {/* Dashboard Button */}
                <Link
                  to={getDashboardLink()}
                  className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light text-maroon-950 text-xs font-serif font-bold uppercase tracking-wider shadow-md hover:brightness-110 hover:scale-105 transition"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Dashboard</span>
                </Link>

                {/* User Dropdown */}
                <div className="flex items-center space-x-2 pl-2 border-l border-luxury-gold/30">
                  <div className="w-8 h-8 rounded-full bg-maroon-900 border border-luxury-gold flex items-center justify-center text-xs font-serif font-bold text-luxury-gold">
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
                  className="px-3.5 py-2 rounded-xl text-xs font-serif uppercase tracking-wider text-cream-200 hover:text-white hover:bg-white/10 transition font-medium"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-xs font-serif font-bold uppercase tracking-wider text-maroon-950 bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 shadow-md transition"
                >
                  Book Consultation
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <div className="flex md:hidden items-center space-x-2">
            <ThemeSelector />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-cream-200 hover:text-white hover:bg-white/10 transition"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Glassy Dropdown Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-maroon-950/98 backdrop-blur-2xl border-b border-luxury-gold/30 px-6 py-5 space-y-4 shadow-2xl">
          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-xl text-xs font-serif font-bold tracking-wider uppercase text-cream-200 hover:text-white hover:bg-white/10 transition"
              >
                {link.name}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-luxury-gold/20 flex flex-col space-y-2">
            {isAuthenticated ? (
              <>
                <Link
                  to={getDashboardLink()}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-md"
                >
                  Go to Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-center py-2 rounded-xl text-xs text-rose-300 hover:bg-white/5 font-serif"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl border border-luxury-gold/40 text-cream-200 text-xs font-serif uppercase tracking-wider font-bold"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-center py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light text-maroon-950 text-xs font-serif font-bold uppercase tracking-wider shadow-md"
                >
                  Book Now
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
