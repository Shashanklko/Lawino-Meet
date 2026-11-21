import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000; // 43,200,000 ms (Strict 12-Hour Session Expiration)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('lawino_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('lawino_token'));
  const [loading, setLoading] = useState(true);

  // Active 12-Hour Session Expiration Watchdog
  useEffect(() => {
    if (!token) return;

    const checkSessionExpiration = () => {
      const sessionStartedAt = localStorage.getItem('lawino_session_started_at');
      if (sessionStartedAt) {
        const elapsed = Date.now() - Number(sessionStartedAt);
        if (elapsed > TWELVE_HOURS_MS) {
          console.warn('12-hour session window elapsed. User must re-authenticate.');
          localStorage.removeItem('lawino_token');
          localStorage.removeItem('lawino_refresh_token');
          localStorage.removeItem('lawino_user');
          localStorage.removeItem('lawino_session_started_at');
          setToken(null);
          setUser(null);
          window.location.href = '/login?expired=12h';
        }
      }
    };

    checkSessionExpiration();
    const interval = setInterval(checkSessionExpiration, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, [token]);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('lawino_token');
      const sessionStartedAt = localStorage.getItem('lawino_session_started_at');

      // Check if session has exceeded 12 hours
      if (sessionStartedAt && Date.now() - Number(sessionStartedAt) > TWELVE_HOURS_MS) {
        console.warn('Existing session older than 12 hours. Logging out.');
        localStorage.removeItem('lawino_token');
        localStorage.removeItem('lawino_refresh_token');
        localStorage.removeItem('lawino_user');
        localStorage.removeItem('lawino_session_started_at');
        setToken(null);
        setUser(null);
        setLoading(false);
        return;
      }

      if (storedToken) {
        // Clear any old legacy mock tokens
        if (storedToken.startsWith('mock_demo_token_')) {
          localStorage.removeItem('lawino_token');
          localStorage.removeItem('lawino_refresh_token');
          localStorage.removeItem('lawino_user');
          localStorage.removeItem('lawino_session_started_at');
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
            if (!sessionStartedAt) {
              localStorage.setItem('lawino_session_started_at', Date.now().toString());
            }
          }
        } catch (err) {
          console.warn('Session verification failed, logging out:', err);
          localStorage.removeItem('lawino_token');
          localStorage.removeItem('lawino_refresh_token');
          localStorage.removeItem('lawino_user');
          localStorage.removeItem('lawino_session_started_at');
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
        localStorage.setItem('lawino_session_started_at', Date.now().toString());
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
        localStorage.setItem('lawino_session_started_at', Date.now().toString());
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
      localStorage.removeItem('lawino_session_started_at');
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
