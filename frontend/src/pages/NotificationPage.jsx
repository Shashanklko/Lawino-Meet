import React, { useEffect } from 'react';
import { Bell, CheckCheck, Clock, Calendar, Video, Shield } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

export const NotificationPage = () => {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead } =
    useNotifications();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.publicId);
    }
    // Navigate based on event type if target URL or data is present
    if (item.targetUrl) {
      navigate(item.targetUrl);
    }
  };

  const getIcon = (type) => {
    if (type?.includes('MEETING')) return <Video className="w-4 h-4 text-emerald-500" />;
    if (type?.includes('APPOINTMENT')) return <Calendar className="w-4 h-4 text-blue-500" />;
    return <Bell className="w-4 h-4 text-amber-500" />;
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900">Notifications</h1>
            <p className="text-xs text-slate-500">
              Stay informed on appointment updates, room invites, and invitations.
            </p>
          </div>
        </div>

        <button
          onClick={markAllAsRead}
          className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center space-x-1.5 transition"
        >
          <CheckCheck className="w-4 h-4 text-blue-600" />
          <span>Mark all as read</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
          <Bell className="w-8 h-8 mx-auto text-slate-300" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 shadow-sm overflow-hidden">
          {notifications.map((item) => (
            <div
              key={item.publicId}
              onClick={() => handleNotificationClick(item)}
              className={`p-4 flex items-start justify-between cursor-pointer transition ${
                !item.isRead ? 'bg-blue-50/40 hover:bg-blue-50/70' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className="p-2 rounded-xl bg-slate-100 shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <h4
                    className={`text-xs ${
                      !item.isRead ? 'font-bold text-slate-900' : 'font-medium text-slate-700'
                    }`}
                  >
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-400 mt-1 inline-flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(item.createdAt).toLocaleString()}</span>
                  </span>
                </div>
              </div>

              {!item.isRead && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
