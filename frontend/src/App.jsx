import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
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
import { ContactPage } from './pages/ContactPage';
import { ProfileSettingsPage } from './pages/ProfileSettingsPage';
import { MessagesPage } from './pages/MessagesPage';
import { FundsBillingPage } from './pages/FundsBillingPage';
import { HelpSupportPage } from './pages/HelpSupportPage';
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <LanguageProvider>
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <ChatProvider>
              <Routes>
                {/* App Layout Route */}
                <Route element={<AppLayout />}>
                  {/* Public Routes */}
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/contact" element={<ContactPage />} />
                  <Route path="/login" element={<LoginPage />} />
                  <Route path="/register" element={<RegisterPage />} />
                  <Route path="/lawyers" element={<LawyerDiscoveryPage />} />
                  <Route path="/lawyers/:lawyerPublicId" element={<LawyerProfilePage />} />

                  {/* Common Protected Routes */}
                  <Route element={<ProtectedRoute />}>
                    <Route path="/notifications" element={<NotificationPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/dashboard/messages" element={<MessagesPage />} />
                    <Route path="/settings" element={<ProfileSettingsPage />} />
                    <Route path="/dashboard/settings" element={<ProfileSettingsPage />} />
                    <Route path="/dashboard/funds" element={<FundsBillingPage />} />
                    <Route path="/dashboard/earnings" element={<FundsBillingPage />} />
                    <Route path="/support" element={<HelpSupportPage />} />
                    <Route path="/dashboard/support" element={<HelpSupportPage />} />
                  </Route>

                  {/* 1. Client Dashboard Routes (/client/*) */}
                  <Route element={<ProtectedRoute allowedRoles={['CLIENT']} />}>
                    <Route path="/client" element={<ClientDashboardPage />} />
                    <Route path="/client/advocates" element={<ClientDashboardPage />} />
                    <Route path="/client/firms" element={<ClientDashboardPage />} />
                    <Route path="/client/appointments" element={<ClientDashboardPage />} />
                    <Route path="/client/finance" element={<FundsBillingPage />} />
                    {/* Backward compatibility */}
                    <Route path="/dashboard/client" element={<Navigate to="/client" replace />} />
                  </Route>

                  {/* 2 & 3. Independent & Firm-Associated Lawyer Routes (/lawyer/*) */}
                  <Route element={<ProtectedRoute allowedRoles={['LAWYER']} />}>
                    <Route path="/lawyer" element={<LawyerDashboardPage />} />
                    <Route path="/lawyer/appointments" element={<LawyerDashboardPage />} />
                    <Route path="/lawyer/availability" element={<LawyerSlotsPage />} />
                    <Route path="/lawyer/slots" element={<Navigate to="/lawyer/availability" replace />} />
                    <Route path="/lawyer/video" element={<LawyerDashboardPage />} />
                    <Route path="/lawyer/finance" element={<FundsBillingPage />} />
                    <Route path="/lawyer/firm-info" element={<LawyerDashboardPage />} />
                    {/* Backward compatibility */}
                    <Route path="/dashboard/lawyer" element={<Navigate to="/lawyer" replace />} />
                    <Route path="/dashboard/lawyer/slots" element={<Navigate to="/lawyer/availability" replace />} />
                    <Route path="/dashboard/lawyer/services" element={<Navigate to="/lawyer/availability" replace />} />
                    <Route path="/dashboard/lawyer/funds" element={<Navigate to="/lawyer/finance" replace />} />
                  </Route>

                  {/* 4. Firm Admin Dashboard Routes (/firm/*) */}
                  <Route element={<ProtectedRoute allowedRoles={['FIRM_ADMIN']} />}>
                    <Route path="/firm" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/profile" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/lawyers" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/sub-admins" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/requests" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/appointments" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/services" element={<FirmAdminDashboardPage />} />
                    <Route path="/firm/finance" element={<FundsBillingPage />} />
                    {/* Backward compatibility */}
                    <Route path="/dashboard/firm" element={<Navigate to="/firm" replace />} />
                    <Route path="/dashboard/firm/members" element={<Navigate to="/firm/lawyers" replace />} />
                    <Route path="/dashboard/firm/matters" element={<Navigate to="/firm/appointments" replace />} />
                    <Route path="/dashboard/firm/appointments" element={<Navigate to="/firm/appointments" replace />} />
                    <Route path="/dashboard/firm/funds" element={<Navigate to="/firm/finance" replace />} />
                  </Route>

                  {/* Full-screen Meeting Route (Accessible directly via Share Link for all participants) */}
                  <Route path="/meeting/:roomPublicId" element={<VideoMeetingPage />} />
                </Route>

                {/* Catch-all redirect */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ChatProvider>
          </NotificationProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  </Router>
  );
}

export default App;
