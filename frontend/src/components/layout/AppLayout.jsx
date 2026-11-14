import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from '../common/Navbar';
import { Footer } from '../common/Footer';
import { Sidebar } from '../common/Sidebar';
import { ChatDrawer } from '../chat/ChatDrawer';
import { useAuth } from '../../context/AuthContext';

export const AppLayout = () => {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isDashboard = location.pathname.startsWith('/dashboard');
  const isMeeting = location.pathname.startsWith('/meeting');

  if (isMeeting) {
    // Immersive meeting mode - no navbar, no sidebar, full screen
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />
      <div className="flex-1 flex">
        {isAuthenticated && isDashboard && <Sidebar />}
        <main className={`flex-1 ${isDashboard ? 'p-6 max-w-7xl mx-auto w-full' : ''}`}>
          <Outlet />
        </main>
      </div>
      <ChatDrawer />
      {!isDashboard && <Footer />}
    </div>
  );
};
