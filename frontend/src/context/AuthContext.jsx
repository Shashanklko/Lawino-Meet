import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

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
        // Clear any old legacy mock tokens
        if (storedToken.startsWith('mock_demo_token_')) {
          localStorage.removeItem('lawino_token');
          localStorage.removeItem('lawino_refresh_token');
          localStorage.removeItem('lawino_user');
          setToken(null);
          setUser(null);
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
          console.warn('Session verification failed, logging out:', err);
          localStorage.removeItem('lawino_token');
          localStorage.removeItem('lawino_refresh_token');
          localStorage.removeItem('lawino_user');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
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
      const msg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Authentication failed. Please verify your credentials.';
      throw new Error(msg);
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
      const msg =
        apiErr.response?.data?.message ||
        apiErr.message ||
        'Registration failed. Please check your details.';
      throw new Error(msg);
    }
  };

  const logout = async () => {
    try {
      if (token) {
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
