import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { Sidebar } from '../common/Sidebar';
import { CrmHeader } from './CrmHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { FloatingChatWidget } from '../chat/FloatingChatWidget';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const { mobileThreadOpen } = useChat();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isMeeting = location.pathname.startsWith('/meeting');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  // Check if current route is part of the Lawyer / Client / Firm CRM workspace
  const isCrmRoute =
    location.pathname.startsWith('/client') ||
    location.pathname.startsWith('/lawyer') ||
    location.pathname.startsWith('/firm') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/settings') ||
    location.pathname.startsWith('/messages') ||
    location.pathname.startsWith('/notifications') ||
    location.pathname.startsWith('/support');

  const isMessagesRoute = location.pathname.startsWith('/messages');

  if (isMeeting) {
    // Immersive meeting mode - no navbar, no sidebar, full screen dark room
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Outlet />
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATION PAGES LAYOUT (No Navbar, No Footer, No Floating Chat)
  // =========================================================================
  if (isAuthRoute) {
    return (
      <div className="min-h-screen bg-[#FAF7F2] text-[#2E2A29] relative">
        <Outlet />
      </div>
    );
  }

  // =========================================================================
  // CRM WORKSPACE LAYOUT (Navbar hidden, dedicated compact CRM header & sidebar)
  // =========================================================================
  if (isCrmRoute) {
    return (
      <div className="h-screen w-screen flex bg-[var(--bg-cream-soft)] text-[var(--text-primary)] overflow-hidden select-none">
        {/* CRM Sidebar (Desktop aside + Mobile slide-over drawer) */}
        <Sidebar
          mobileOpen={mobileMenuOpen}
          onCloseMobile={() => setMobileMenuOpen(false)}
        />

        {/* CRM Main Workspace */}
        <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
          <CrmHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main
            className={`flex-1 min-w-0 ${
              isMessagesRoute
                ? `h-full overflow-hidden p-0 sm:p-4 ${mobileThreadOpen ? 'pb-0' : 'pb-14'} md:pb-0 w-full max-w-7xl mx-auto flex flex-col`
                : 'overflow-y-auto p-3 sm:p-6 pb-28 md:pb-12 w-full max-w-7xl mx-auto'
            }`}
          >
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </main>
        </div>

        {/* Mobile Native 1-Tap Bottom Navigation Bar */}
        <MobileBottomNav onOpenMenu={() => setMobileMenuOpen(true)} />

        {/* Floating Chat is hidden on dedicated /messages page to prevent overlay clash */}
        {!isMessagesRoute && <FloatingChatWidget />}
      </div>
    );
  }

  // =========================================================================
  // PUBLIC CONSUMER PORTAL LAYOUT (Standard Public Navbar & Footer)
  // =========================================================================
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF6EE] text-[#2E2A29] transition-colors duration-500">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <FloatingChatWidget />
      <Footer />
    </div>
  );
};
