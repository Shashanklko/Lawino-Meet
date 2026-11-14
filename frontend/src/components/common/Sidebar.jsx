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
  Building,
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
        { name: 'Firm Chambers', path: '/dashboard/firm', icon: Shield },
        { name: 'Advocate Partners', path: '/dashboard/firm/members', icon: Users },
        { name: 'Firm Consultations', path: '/dashboard/firm/appointments', icon: FileText },
      ];
    }
    // Default CLIENT
    return [
      { name: 'My Consultations', path: '/dashboard/client', icon: LayoutDashboard },
      { name: 'Discover Advocates', path: '/lawyers', icon: Briefcase },
    ];
  };

  const links = getLinks();

  return (
    <aside className="w-64 bg-maroon-950 border-r border-luxury-gold/30 flex flex-col shrink-0 min-h-[calc(100vh-5rem)] text-cream-100">
      {/* User Info Bar */}
      <div className="p-4 border-b border-luxury-gold/20 flex items-center space-x-3">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-maroon-800 to-maroon-700 border border-luxury-gold flex items-center justify-center font-serif font-bold text-luxury-gold shadow-md">
          {user?.username?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="overflow-hidden">
          <p className="text-xs font-serif font-bold text-cream-50 truncate">{user?.username}</p>
          <span className="inline-block text-[9px] font-serif font-bold uppercase tracking-wider text-luxury-gold-light bg-black/40 px-2 py-0.5 rounded border border-luxury-gold/30 mt-0.5">
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
                `flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-xs font-serif font-medium tracking-wide transition ${
                  isActive
                    ? 'bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light text-maroon-950 font-bold shadow-md'
                    : 'text-cream-300 hover:text-white hover:bg-white/5'
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
      <div className="p-4 m-3 rounded-2xl bg-black/30 border border-luxury-gold/20 text-xs text-cream-300">
        <p className="font-serif font-bold text-luxury-gold mb-1 flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5" />
          <span>Dual Privilege</span>
        </p>
        <p className="text-[10px] text-cream-400 leading-relaxed font-sans">
          Encrypted WebRTC online rooms & verified chamber in-person hearings.
        </p>
      </div>
    </aside>
  );
};
