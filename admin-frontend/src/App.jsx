import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AdminAuthProvider, useAdminAuth } from './context/AdminAuthContext';

// Layout
import { AdminLayout } from './components/layout/AdminLayout';
import { AdminAccessGuard } from './components/common/AdminAccessGuard';
import { ADMIN_PERMISSIONS } from './utils/adminPermissions';

// Pages
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminOverviewPage } from './pages/AdminOverviewPage';
import { AdminClientsPage } from './pages/AdminClientsPage';
import { AdminAdvocatesPage } from './pages/AdminAdvocatesPage';
import { AdminFirmsPage } from './pages/AdminFirmsPage';
import { AdminAppointmentsPage } from './pages/AdminAppointmentsPage';
import { AdminSupportPage } from './pages/AdminSupportPage';
import { AdminFinancePage } from './pages/AdminFinancePage';
import { AdminWithdrawalsPage } from './pages/AdminWithdrawalsPage';
import { AdminReportsPage } from './pages/AdminReportsPage';
import { AdminNotificationsPage } from './pages/AdminNotificationsPage';
import { AdminAnalyticsPage } from './pages/AdminAnalyticsPage';
import { AdminSettingsPage } from './pages/AdminSettingsPage';
import { AdminAuditLogsPage } from './pages/AdminAuditLogsPage';
import { AdminManagementPage } from './pages/AdminManagementPage';

// Protected Route Guard
const ProtectedAdminRoute = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <Router>
      <ThemeProvider>
        <AdminAuthProvider>
          <Routes>
            {/* Public Admin Authentication Passage */}
            <Route path="/login" element={<AdminLoginPage />} />

            {/* Protected Master Console Routes */}
            <Route
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route path="/" element={<AdminOverviewPage />} />
              <Route path="/overview" element={<AdminOverviewPage />} />
              <Route
                path="/clients"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.CLIENT_MANAGEMENT} requiredRoleName="Customer Support / Super Admin">
                    <AdminClientsPage />
                  </AdminAccessGuard>
                }
              />
              <Route
                path="/advocates"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.ADVOCATE_MANAGEMENT} requiredRoleName="Verification Officer / Super Admin">
                    <AdminAdvocatesPage />
                  </AdminAccessGuard>
                }
              />
              <Route
                path="/firms"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.FIRM_MANAGEMENT} requiredRoleName="Verification Officer / Super Admin">
                    <AdminFirmsPage />
                  </AdminAccessGuard>
                }
              />
              <Route path="/appointments" element={<AdminAppointmentsPage />} />
              <Route
                path="/support"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.SUPPORT_TICKETS} requiredRoleName="Customer Support Lead / Super Admin">
                    <AdminSupportPage />
                  </AdminAccessGuard>
                }
              />
              <Route
                path="/finance"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.PAYMENTS} requiredRoleName="Finance Director / Super Admin">
                    <AdminFinancePage />
                  </AdminAccessGuard>
                }
              />
              <Route
                path="/withdrawals"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.WITHDRAWALS} requiredRoleName="Finance Director / Super Admin">
                    <AdminWithdrawalsPage />
                  </AdminAccessGuard>
                }
              />
              <Route path="/reports" element={<AdminReportsPage />} />
              <Route path="/notifications" element={<AdminNotificationsPage />} />
              <Route path="/analytics" element={<AdminAnalyticsPage />} />
              <Route
                path="/settings"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.SYSTEM_SETTINGS} requiredRoleName="Super Admin Only">
                    <AdminSettingsPage />
                  </AdminAccessGuard>
                }
              />
              <Route
                path="/audit-logs"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.AUDIT_LOGS} requiredRoleName="Super Admin Only">
                    <AdminAuditLogsPage />
                  </AdminAccessGuard>
                }
              />
              <Route
                path="/admins"
                element={
                  <AdminAccessGuard permission={ADMIN_PERMISSIONS.ADMIN_MANAGEMENT} requiredRoleName="Super Admin Only">
                    <AdminManagementPage />
                  </AdminAccessGuard>
                }
              />
              <Route path="/admin-management" element={<Navigate to="/admins" replace />} />

              {/* Aliases for /admin/* paths */}
              <Route path="/admin" element={<Navigate to="/" replace />} />
              <Route path="/admin/overview" element={<Navigate to="/" replace />} />
              <Route path="/admin/admins" element={<Navigate to="/admins" replace />} />
              <Route path="/admin/clients" element={<Navigate to="/clients" replace />} />
              <Route path="/admin/advocates" element={<Navigate to="/advocates" replace />} />
              <Route path="/admin/firms" element={<Navigate to="/firms" replace />} />
              <Route path="/admin/appointments" element={<Navigate to="/appointments" replace />} />
              <Route path="/admin/support" element={<Navigate to="/support" replace />} />
              <Route path="/admin/finance" element={<Navigate to="/finance" replace />} />
              <Route path="/admin/treasury" element={<Navigate to="/finance" replace />} />
              <Route path="/admin/withdrawals" element={<Navigate to="/withdrawals" replace />} />
              <Route path="/admin/reports" element={<Navigate to="/reports" replace />} />
              <Route path="/admin/notifications" element={<Navigate to="/notifications" replace />} />
              <Route path="/admin/analytics" element={<Navigate to="/analytics" replace />} />
              <Route path="/admin/settings" element={<Navigate to="/settings" replace />} />
              <Route path="/admin/audit-logs" element={<Navigate to="/audit-logs" replace />} />
            </Route>

            {/* Catch-all redirect to / */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AdminAuthProvider>
      </ThemeProvider>
    </Router>
  );
};

export default App;
