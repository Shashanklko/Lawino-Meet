import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Bell, X, CheckCircle2, Clock, ShieldAlert } from 'lucide-react';
import { notificationApi } from '../api/notificationApi';
import { useAuth } from './AuthContext';
import { MOCK_NOTIFICATIONS } from '../data/mockData';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [unreadCount, setUnreadCount] = useState(
    MOCK_NOTIFICATIONS.filter((n) => !n.isRead).length
  );
  const [loading, setLoading] = useState(false);

  // 3-Second Floating Notification Toast State
  const [activeToast, setActiveToast] = useState(null);
  const toastTimerRef = useRef(null);

  const showNotificationToast = useCallback((notif) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }

    const toastItem = {
      id: notif.id || `toast-${Date.now()}`,
      publicId: notif.publicId || `notif-${Date.now()}`,
      title: notif.title || 'Platform Notification',
      message: notif.message || '',
      type: notif.type || 'INFO',
      createdAt: notif.createdAt || new Date().toISOString(),
    };

    setActiveToast(toastItem);

    // Prepend to notifications list
    setNotifications((prev) => [
      {
        publicId: toastItem.publicId,
        title: toastItem.title,
        message: toastItem.message,
        type: toastItem.type,
        isRead: false,
        createdAt: toastItem.createdAt,
      },
      ...prev,
    ]);
    setUnreadCount((prev) => prev + 1);

    // Auto-dismiss after exactly 3000ms (3 seconds)
    toastTimerRef.current = setTimeout(() => {
      setActiveToast(null);
    }, 3000);
  }, []);

  const closeToast = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setActiveToast(null);
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const res = await notificationApi.getUnreadCount();
      if (res.success && typeof res.data === 'number') {
        setUnreadCount(res.data);
      }
    } catch {
      // Keep mock count
    }
  }, [isAuthenticated]);

  const fetchNotifications = useCallback(async (page = 0, size = 15) => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await notificationApi.getMyNotifications(page, size);
      const list = res?.data?.content || res?.data || [];
      if (list.length > 0) {
        setNotifications(list);
      } else {
        setNotifications(MOCK_NOTIFICATIONS);
      }
    } catch {
      setNotifications(MOCK_NOTIFICATIONS);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  const markAsRead = async (notificationPublicId) => {
    try {
      await notificationApi.markAsRead(notificationPublicId);
    } catch {
      // Mock local fallback
    }
    setNotifications((prev) =>
      prev.map((n) => (n.publicId === notificationPublicId ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
    } catch {
      // Mock local fallback
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchUnreadCount();
      fetchNotifications();
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [isAuthenticated, fetchUnreadCount, fetchNotifications]);

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        fetchUnreadCount,
        markAsRead,
        markAllAsRead,
        showNotificationToast,
        activeToast,
        closeToast,
      }}
    >
      {children}

      {/* 3-Second Popup Notification Toast */}
      {activeToast && (
        <div className="fixed top-5 right-5 z-[9999] max-w-sm w-full animate-in slide-in-from-top-4 fade-in duration-300 pointer-events-auto">
          <div
            onClick={() => {
              markAsRead(activeToast.publicId);
              closeToast();
            }}
            className="p-4 rounded-2xl bg-[#1C1817]/95 backdrop-blur-xl border border-amber-500/50 text-white shadow-2xl relative overflow-hidden flex items-start space-x-3.5 cursor-pointer hover:border-amber-400 transition"
          >
            <div className="p-2 rounded-xl bg-[var(--bg-primary)] text-white shrink-0 mt-0.5 shadow-md">
              <Bell className="w-4 h-4 text-amber-300 animate-bounce" />
            </div>
            <div className="flex-1 min-w-0 pr-4">
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  New Alert • 3s Pop
                </span>
              </div>
              <h4 className="text-xs font-serif font-bold text-cream-50 truncate mt-0.5">
                {activeToast.title}
              </h4>
              <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed mt-0.5 font-sans">
                {activeToast.message}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                closeToast();
              }}
              className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* 3-Second Shrinking Timer Bar */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-stone-800/80">
              <div
                className="h-full bg-gradient-to-r from-amber-400 via-rose-500 to-[var(--bg-primary)]"
                style={{
                  animation: 'shrinkBar 3000ms linear forwards',
                }}
              />
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
