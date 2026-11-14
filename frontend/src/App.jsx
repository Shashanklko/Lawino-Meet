import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ChatProvider } from './context/ChatContext';

import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { LawyerDiscoveryPage } from './pages/LawyerDiscoveryPage';
import { LawyerProfilePage } from './pages/LawyerProfilePage';
import { ClientDashboardPage } from './pages/ClientDashboardPage';
import { LawyerDashboardPage } from './pages/LawyerDashboardPage';
import { LawyerSlotsPage } from './pages/LawyerSlotsPage';
import { FirmAdminDashboardPage } from './pages/FirmAdminDashboardPage';
import { VideoMeetingPage } from './pages/VideoMeetingPage';
import { NotificationPage } from './pages/NotificationPage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <ChatProvider>
            <Routes>
              {/* App Layout Route */}
              <Route element={<AppLayout />}>
                {/* Public Routes */}
                <Route path="/" element={<LandingPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/lawyers" element={<LawyerDiscoveryPage />} />
                <Route path="/lawyers/:lawyerPublicId" element={<LawyerProfilePage />} />

                {/* Common Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/notifications" element={<NotificationPage />} />
                </Route>

                {/* Client Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                  <Route path="/dashboard/client" element={<ClientDashboardPage />} />
                </Route>

                {/* Lawyer Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['LAWYER']} />}>
                  <Route path="/dashboard/lawyer" element={<LawyerDashboardPage />} />
                  <Route path="/dashboard/lawyer/slots" element={<LawyerSlotsPage />} />
                  <Route path="/dashboard/lawyer/services" element={<LawyerSlotsPage />} />
                </Route>

                {/* Firm Admin Protected Routes */}
                <Route element={<ProtectedRoute allowedRoles={['FIRM_ADMIN']} />}>
                  <Route path="/dashboard/firm" element={<FirmAdminDashboardPage />} />
                  <Route path="/dashboard/firm/members" element={<FirmAdminDashboardPage />} />
                  <Route path="/dashboard/firm/appointments" element={<FirmAdminDashboardPage />} />
                </Route>

                {/* Full-screen Meeting Route */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/meeting/:roomPublicId" element={<VideoMeetingPage />} />
                </Route>
              </Route>

              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </ChatProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
