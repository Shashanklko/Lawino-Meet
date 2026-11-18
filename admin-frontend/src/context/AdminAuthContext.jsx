import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { ADMIN_SUB_ROLES } from '../utils/adminPermissions';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lawino_admin_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [adminSubRole, setAdminSubRoleState] = useState(() => {
    try {
      const stored = localStorage.getItem('lawino_admin_subrole');
      return stored || 'SUPER_ADMIN';
    } catch {
      return 'SUPER_ADMIN';
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const token = localStorage.getItem('lawino_admin_token');
    return !!token && !token.startsWith('mock_admin_token_');
  });

  useEffect(() => {
    // Invalidate any legacy demo/mock tokens from previous testing
    const token = localStorage.getItem('lawino_admin_token');
    if (token && token.startsWith('mock_admin_token_')) {
      localStorage.removeItem('lawino_admin_token');
      localStorage.removeItem('lawino_admin_user');
      localStorage.removeItem('lawino_admin_subrole');
      setAdminUser(null);
      setIsAuthenticated(false);
    }
  }, []);

  const setAdminSubRole = (newSubRole) => {
    setAdminSubRoleState(newSubRole);
    localStorage.setItem('lawino_admin_subrole', newSubRole);
    if (adminUser) {
      const updated = { ...adminUser, subRole: newSubRole };
      setAdminUser(updated);
      localStorage.setItem('lawino_admin_user', JSON.stringify(updated));
    }
  };

  const login = async ({ identifier, password }) => {
    try {
      const res = await apiClient.post('/api/auth/login', { identifier, password });
      if (res.data && res.data.success && res.data.data) {
        const { accessToken, user: userData } = res.data.data;
        if (userData.role !== 'PLATFORM_ADMIN') {
          throw new Error('Access denied: Account does not possess PLATFORM_ADMIN credentials.');
        }

        const userObj = {
          publicId: userData.publicId || '55555555-5555-5555-5555-555555555555',
          username: userData.username,
          fullName: userData.fullName || 'Platform Super Administrator',
          email: userData.email,
          role: userData.role,
          subRole: 'SUPER_ADMIN',
          designation: 'Supreme Platform Administrator',
          avatar: userData.username ? userData.username.charAt(0).toUpperCase() : 'A',
          lastLogin: new Date().toISOString(),
        };

        localStorage.setItem('lawino_admin_token', accessToken);
        localStorage.setItem('lawino_admin_user', JSON.stringify(userObj));
        localStorage.setItem('lawino_admin_subrole', 'SUPER_ADMIN');
        setAdminUser(userObj);
        setAdminSubRoleState('SUPER_ADMIN');
        setIsAuthenticated(true);
        return userObj;
      } else {
        throw new Error(res.data?.message || 'Authentication failed.');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Administrative verification failed.';
      throw new Error(msg);
    }
  };

  const logout = () => {
    localStorage.removeItem('lawino_admin_token');
    localStorage.removeItem('lawino_admin_user');
    localStorage.removeItem('lawino_admin_subrole');
    setAdminUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        adminUser,
        adminSubRole,
        setAdminSubRole,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};
