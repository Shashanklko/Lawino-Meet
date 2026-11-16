import React, { useState, useEffect } from 'react';
import { Bell, CheckCheck, Clock, Calendar, Video, ShieldCheck, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';

export const NotificationPage = () => {
  const { notifications, loading, fetchNotifications, markAsRead, markAllAsRead, showNotificationToast } =
    useNotifications();
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleNotificationClick = async (item) => {
    if (!item.isRead) {
      await markAsRead(item.publicId);
    }
    setExpandedId((prev) => (prev === item.publicId ? null : item.publicId));
  };

  const getIcon = (type) => {
    if (type?.includes('MEETING')) return <Video className="w-4 h-4 text-emerald-600" />;
    if (type?.includes('APPOINTMENT')) return <Calendar className="w-4 h-4 text-[#831826]" />;
    return <ShieldCheck className="w-4 h-4 text-amber-600" />;
  };

  const triggerTestAlert = () => {
    showNotificationToast({
      title: 'Emergency Hearing Listed',
      message: 'Supreme Court Special Bench has scheduled an urgent 11:30 AM interim hearing for WP(C) 4921/2026.',
      type: 'APPOINTMENT',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 pb-16">
      {/* Header Glass Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-stone-200/80 shadow-xs">
        <div className="flex items-center space-x-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#831826] to-[#A32234] text-white flex items-center justify-center shadow-xs">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-serif font-bold text-[#1F1C1B]">Notifications &amp; Updates</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Simple and easy updates on your meetings, messages, and payments.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={triggerTestAlert}
            className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 border border-amber-300 text-xs font-sans font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            title="Pop up a simulated live notification alert for 3 seconds"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-700" />
            <span>Test Quick Alert</span>
          </button>

          <button
            type="button"
            onClick={markAllAsRead}
            className="px-4 py-2 rounded-xl border border-stone-200 hover:bg-stone-100 text-stone-700 text-xs font-sans font-medium flex items-center space-x-1.5 transition cursor-pointer"
          >
            <CheckCheck className="w-4 h-4 text-[#831826]" />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-stone-500">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl border border-stone-200/80 p-12 text-center text-xs text-stone-400 space-y-2">
          <Bell className="w-8 h-8 mx-auto text-stone-300" />
          <p>No notifications yet.</p>
        </div>
      ) : (
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-stone-200/80 divide-y divide-stone-100/90 shadow-xs overflow-hidden">
          {notifications.map((item) => {
            const isExpanded = expandedId === item.publicId;
            return (
              <div
                key={item.publicId}
                onClick={() => handleNotificationClick(item)}
                className={`p-4 sm:p-5 cursor-pointer transition select-none ${
                  !item.isRead ? 'bg-rose-50/30 hover:bg-rose-50/50' : 'hover:bg-stone-50/70'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3.5">
                    <div className="p-2.5 rounded-xl bg-stone-100 shrink-0 mt-0.5">
                      {getIcon(item.type)}
                    </div>
                    <div>
                      <h4
                        className={`text-xs ${
                          !item.isRead ? 'font-bold text-[#1F1C1B]' : 'font-medium text-stone-700'
                        }`}
                      >
                        {item.title}
                      </h4>
                      <p className={`text-xs text-stone-500 mt-0.5 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                        {item.message}
                      </p>
                      <div className="flex items-center space-x-3 mt-1.5">
                        <span className="text-[10px] text-stone-400 inline-flex items-center space-x-1 font-mono">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(item.createdAt).toLocaleString()}</span>
                        </span>
                        <span className="text-[10px] text-[var(--bg-primary)] hover:underline font-medium">
                          {isExpanded ? 'Collapse' : 'View details'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-3">
                    {!item.isRead && (
                      <span className="w-2.5 h-2.5 rounded-full bg-[#831826] mt-1" />
                    )}
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-3.5 pt-3 border-t border-stone-100/80 pl-11 text-xs text-stone-600 bg-stone-50/50 p-3 rounded-xl animate-in fade-in duration-200">
                    <p className="font-semibold text-stone-900 mb-1">Notification Metadata &amp; Record</p>
                    <p className="leading-relaxed">{item.message}</p>
                    <div className="flex items-center space-x-4 mt-2 text-[10px] font-mono text-stone-500">
                      <span>ID: {item.publicId}</span>
                      <span>Type: {item.type || 'STATUTORY_ALERT'}</span>
                      <span className="text-emerald-700 font-semibold">● In-Place View (No Redirection)</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
