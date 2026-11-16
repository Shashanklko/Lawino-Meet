import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { AdminSidebar } from './AdminSidebar';
import { AdminHeader } from './AdminHeader';
import { useAdminAuth } from '../../context/AdminAuthContext';

export const AdminLayout = () => {
  const [selectedDateFilter, setSelectedDateFilter] = useState('LAST_7_DAYS');
  const { adminSubRole } = useAdminAuth();

  return (
    <div className="h-screen w-screen flex bg-[#161210] text-stone-200 overflow-hidden select-none font-sans">
      {/* Platform Admin Sidebar */}
      <AdminSidebar />

      {/* Main Admin Content Viewport */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#1A1614]">
        {/* Admin Header */}
        <AdminHeader
          selectedDateFilter={selectedDateFilter}
          onDateFilterChange={setSelectedDateFilter}
        />

        {/* Dynamic Admin Module Viewport */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 w-full max-w-7xl mx-auto space-y-6">
          <Outlet context={{ dateFilter: selectedDateFilter, adminSubRole }} />
        </main>
      </div>
    </div>
  );
};
