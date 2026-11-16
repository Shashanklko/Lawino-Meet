import React, { createContext, useContext, useState, useEffect } from 'react';
import { ADMIN_SUB_ROLES } from '../utils/adminPermissions';

const AdminAuthContext = createContext(null);

const DEFAULT_ADMIN = {
  publicId: 'admin-master-001',
  fullName: 'Justice A. K. Sikri (Retd.)',
  email: 'admin@lawinomeet.com',
  role: 'PLATFORM_ADMIN',
  subRole: 'SUPER_ADMIN',
  designation: 'Supreme Platform Administrator',
  avatar: 'A',
  lastLogin: new Date().toISOString(),
};

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const stored = localStorage.getItem('lawino_admin_user');
      return stored ? JSON.parse(stored) : DEFAULT_ADMIN;
    } catch {
      return DEFAULT_ADMIN;
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
    return !!localStorage.getItem('lawino_admin_token') || true; // Default logged in for immediate operations demo
  });

  const setAdminSubRole = (newSubRole) => {
    setAdminSubRoleState(newSubRole);
    localStorage.setItem('lawino_admin_subrole', newSubRole);
    if (adminUser) {
      const updated = { ...adminUser, subRole: newSubRole };
      setAdminUser(updated);
      localStorage.setItem('lawino_admin_user', JSON.stringify(updated));
    }
  };

  const loginAsDemoSubRole = (subRoleKey = 'SUPER_ADMIN') => {
    const meta = ADMIN_SUB_ROLES[subRoleKey] || ADMIN_SUB_ROLES.SUPER_ADMIN;
    const userObj = {
      ...DEFAULT_ADMIN,
      subRole: meta.key,
      designation: meta.label,
    };
    const mockToken = `mock_admin_token_${meta.key.toLowerCase()}`;
    localStorage.setItem('lawino_admin_token', mockToken);
    localStorage.setItem('lawino_admin_user', JSON.stringify(userObj));
    localStorage.setItem('lawino_admin_subrole', meta.key);
    setAdminUser(userObj);
    setAdminSubRoleState(meta.key);
    setIsAuthenticated(true);
    return userObj;
  };

  const login = async ({ identifier, password }) => {
    // Check demo identifier keywords
    if (identifier?.includes('support')) {
      return loginAsDemoSubRole('SUPPORT_ADMIN');
    }
    if (identifier?.includes('verify') || identifier?.includes('compliance')) {
      return loginAsDemoSubRole('VERIFICATION_ADMIN');
    }
    if (identifier?.includes('finance') || identifier?.includes('treasury')) {
      return loginAsDemoSubRole('FINANCE_ADMIN');
    }
    if (identifier?.includes('ops') || identifier?.includes('operations')) {
      return loginAsDemoSubRole('OPERATIONS_ADMIN');
    }
    return loginAsDemoSubRole('SUPER_ADMIN');
  };

  const logout = () => {
    localStorage.removeItem('lawino_admin_token');
    localStorage.removeItem('lawino_admin_user');
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
        loginAsDemoSubRole,
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
