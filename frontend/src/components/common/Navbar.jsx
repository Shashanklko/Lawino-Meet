import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, MessageSquare, Bell, User, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { useChat } from '../../context/ChatContext';

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
    <nav className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 backdrop-blur bg-opacity-95">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Scale className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-xl tracking-tight text-white">
                Lawino<span className="text-blue-400">Meet</span>
              </span>
              <span className="text-[10px] text-slate-400 tracking-wider uppercase font-semibold">
                Legal Consultation
              </span>
            </div>
          </Link>

          {/* Center Navigation */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link to="/lawyers" className="text-slate-300 hover:text-white transition">
              Find Lawyers
            </Link>
            <Link to="/firms" className="text-slate-300 hover:text-white transition">
              Law Firms
            </Link>
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                {/* Chat Drawer Toggle */}
                <button
                  onClick={() => setIsDrawerOpen((prev) => !prev)}
                  className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Messages"
                >
                  <MessageSquare className="w-5 h-5" />
                  {unreadTotal > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadTotal > 9 ? '9+' : unreadTotal}
                    </span>
                  )}
                </button>

                {/* Notifications Bell */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition"
                  title="Notifications"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* Dashboard Shortcut */}
                <Link
                  to={getDashboardLink()}
                  className="hidden sm:inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md transition"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Dashboard</span>
                </Link>

                {/* User Dropdown / Name */}
                <div className="flex items-center space-x-2 pl-2 border-l border-slate-700">
                  <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-blue-400">
                    {user?.username?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <button
                    onClick={handleLogout}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-slate-300 hover:text-white transition px-3 py-1.5"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg shadow-md transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
