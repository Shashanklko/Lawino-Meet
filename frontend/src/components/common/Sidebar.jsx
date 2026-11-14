import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  Clock,
  Briefcase,
  Users,
  Video,
  Shield,
  FileText,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Sidebar = () => {
  const { user } = useAuth();
  const role = user?.role || 'CLIENT';

  const getLinks = () => {
    if (role === 'LAWYER') {
      return [
        { name: 'Consultation Requests', path: '/dashboard/lawyer', icon: LayoutDashboard },
        { name: 'Availability Calendar', path: '/dashboard/lawyer/slots', icon: Calendar },
        { name: 'Legal Services & Fees', path: '/dashboard/lawyer/services', icon: Briefcase },
      ];
    }
    if (role === 'FIRM_ADMIN') {
      return [
        { name: 'Firm Overview', path: '/dashboard/firm', icon: Shield },
        { name: 'Lawyer Members', path: '/dashboard/firm/members', icon: Users },
        { name: 'Firm Consultations', path: '/dashboard/firm/appointments', icon: FileText },
      ];
    }
    // Default CLIENT
    return [
      { name: 'My Consultations', path: '/dashboard/client', icon: LayoutDashboard },
      { name: 'Find an Advocate', path: '/lawyers', icon: Briefcase },
    ];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      {/* User Info Bar */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-blue-600/20 border border-blue-500/30 flex items-center justify-center font-bold text-blue-400">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
          <span className="inline-block text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
            {role.replace('_', ' ')}
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="p-3 space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path.endsWith('/lawyer') || link.path.endsWith('/client') || link.path.endsWith('/firm')}
              className={({ isActive }) =>
                `flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{link.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Legal Support Card */}
      <div className="p-4 m-3 rounded-xl bg-slate-800/40 border border-slate-800 text-xs text-slate-400">
        <p className="font-semibold text-slate-200 mb-1 flex items-center space-x-1.5">
          <Video className="w-3.5 h-3.5 text-blue-400" />
          <span>HD Consultations</span>
        </p>
        <p className="text-[11px] text-slate-400 leading-tight">
          WebRTC audio/video consultations are end-to-end encrypted with zero intermediary recording.
        </p>
      </div>
    </aside>
  );
};
