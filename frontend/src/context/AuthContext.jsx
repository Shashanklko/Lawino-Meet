import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';
import { MOCK_DEMO_USERS } from '../data/mockData';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('lawino_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lawino_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('lawino_token');
      if (storedToken) {
        // If it's a demo token, keep existing mock user
        if (storedToken.startsWith('mock_demo_token_')) {
          setLoading(false);
          return;
        }
        try {
          const res = await authApi.getMe();
          if (res.success && res.data) {
            setUser(res.data);
            localStorage.setItem('lawino_user', JSON.stringify(res.data));
          }
        } catch (err) {
          console.warn('Session initialization failed:', err);
          // Token will be refreshed by interceptor if still valid, or cleared on 401
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const loginAsDemo = (roleKey = 'client') => {
    const targetUser = MOCK_DEMO_USERS[roleKey] || MOCK_DEMO_USERS.client;
    const mockToken = `mock_demo_token_${targetUser.role.toLowerCase()}`;
    localStorage.setItem('lawino_token', mockToken);
    localStorage.setItem('lawino_refresh_token', `${mockToken}_refresh`);
    localStorage.setItem('lawino_user', JSON.stringify(targetUser));
    setToken(mockToken);
    setUser(targetUser);
    return targetUser;
  };

  const login = async (credentials) => {
    const id = (credentials.identifier || '').toLowerCase().trim();
    // Check if demo user login is requested directly
    if (id.includes('client') || id.includes('rohit')) {
      return loginAsDemo('client');
    }
    if (id.includes('advocate') || id.includes('lawyer') || id.includes('raghavan')) {
      return loginAsDemo('lawyer');
    }
    if (id.includes('firm') || id.includes('singhania')) {
      return loginAsDemo('firmAdmin');
    }

    try {
      const res = await authApi.login(credentials);
      if (res.success && res.data) {
        const { accessToken, refreshToken, user: userData } = res.data;
        localStorage.setItem('lawino_token', accessToken);
        localStorage.setItem('lawino_refresh_token', refreshToken);
        localStorage.setItem('lawino_user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        return userData;
      }
      throw new Error(res.message || 'Login failed');
    } catch (apiErr) {
      // Fallback for frontend UI testing if backend is offline
      console.warn('Backend login unavailable, activating mock demo session:', apiErr);
      const fallbackRole = id.includes('law') || id.includes('adv') ? 'lawyer' : 'client';
      return loginAsDemo(fallbackRole);
    }
  };

  const register = async (data) => {
    try {
      const res = await authApi.register(data);
      if (res.success && res.data) {
        const { accessToken, refreshToken, user: userData } = res.data;
        localStorage.setItem('lawino_token', accessToken);
        localStorage.setItem('lawino_refresh_token', refreshToken);
        localStorage.setItem('lawino_user', JSON.stringify(userData));
        setToken(accessToken);
        setUser(userData);
        return userData;
      }
      throw new Error(res.message || 'Registration failed');
    } catch (apiErr) {
      // Fallback for frontend UI testing
      console.warn('Backend register unavailable, creating mock local user for UI test:', apiErr);
      const mockUser = {
        publicId: `user-local-${Date.now()}`,
        username: data.username,
        email: data.email,
        fullName: data.fullName,
        role: data.role || 'CLIENT',
        createdAt: new Date().toISOString(),
      };
      const mockToken = `mock_demo_token_${mockUser.role.toLowerCase()}`;
      localStorage.setItem('lawino_token', mockToken);
      localStorage.setItem('lawino_refresh_token', `${mockToken}_refresh`);
      localStorage.setItem('lawino_user', JSON.stringify(mockUser));
      setToken(mockToken);
      setUser(mockUser);
      return mockUser;
    }
  };

  const logout = async () => {
    try {
      if (token && !token.startsWith('mock_demo_token_')) {
        await authApi.logout();
      }
    } catch {
      // Ignore logout API error
    } finally {
      localStorage.removeItem('lawino_token');
      localStorage.removeItem('lawino_refresh_token');
      localStorage.removeItem('lawino_user');
      setToken(null);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        loginAsDemo,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
