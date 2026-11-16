import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  Layers,
  Calendar,
  Briefcase,
  Wallet,
  Clock,
  DollarSign,
  Inbox,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useChat } from '../../context/ChatContext';

export const MobileBottomNav = ({ onOpenMenu }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { mobileThreadOpen } = useChat();
  const location = useLocation();
  const role = user?.role || 'CLIENT';

  // Completely hide native bottom nav when inside an active mobile chat conversation
  // so the message input field & document upload bar have full unobstructed screen space
  if (location.pathname.startsWith('/messages') && mobileThreadOpen) {
    return null;
  }

  const getNavItems = () => {
    if (role === 'LAWYER') {
      return [
        { label: t('nav.overview', 'Overview'), path: '/lawyer', icon: Layers, exact: true },
        { label: t('nav.appointments', 'Appointments'), path: '/lawyer/appointments', icon: Calendar },
        { label: t('nav.availability', 'Calendar'), path: '/lawyer/availability', icon: Clock },
        { label: t('nav.finance', 'Finance'), path: '/lawyer/finance', icon: DollarSign },
      ];
    }
    if (role === 'FIRM_ADMIN') {
      return [
        { label: t('nav.overview', 'Overview'), path: '/firm', icon: Layers, exact: true },
        { label: t('nav.requests', 'Requests'), path: '/firm/requests', icon: Inbox },
        { label: t('nav.appointments', 'Matters'), path: '/firm/appointments', icon: Calendar },
        { label: t('nav.finance', 'Finance'), path: '/firm/finance', icon: DollarSign },
      ];
    }
    // Default CLIENT
    return [
      { label: t('nav.overview', 'Overview'), path: '/client', icon: Layers, exact: true },
      { label: t('nav.findAdvocates', 'Advocates'), path: '/client/advocates', icon: Briefcase },
      { label: t('nav.appointments', 'Appointments'), path: '/client/appointments', icon: Calendar },
      { label: t('nav.finance', 'Wallet'), path: '/client/finance', icon: Wallet },
    ];
  };

  const items = getNavItems();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-2xl border-t border-[var(--border-cream)] py-1 px-2 flex items-center justify-around shadow-lg select-none">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-medium transition cursor-pointer ${
                isActive
                  ? 'text-[var(--bg-primary)] font-bold'
                  : 'text-stone-500 hover:text-stone-800'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div className={`p-1 rounded-lg ${isActive ? 'bg-[var(--bg-cream-card)]' : ''}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="truncate max-w-[68px] mt-0.5">{item.label}</span>
              </>
            )}
          </NavLink>
        );
      })}

      {/* Menu button triggers mobile slide-over drawer */}
      <button
        type="button"
        onClick={onOpenMenu}
        className="flex flex-col items-center justify-center py-1 px-1.5 rounded-xl text-[10px] font-medium text-stone-500 hover:text-stone-800 transition cursor-pointer"
        title="More Navigation Options"
      >
        <div className="p-1 rounded-lg">
          <Menu className="w-4 h-4" />
        </div>
        <span className="truncate max-w-[68px] mt-0.5">{t('action.more', 'Menu')}</span>
      </button>
    </nav>
  );
};
