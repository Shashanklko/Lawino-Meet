import React, { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  Scale,
  Building,
  CheckCircle2,
  Clock,
  Radio,
  Eye,
  AlertCircle,
} from 'lucide-react';

export const AdminNotificationsPage = () => {
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL_USERS'); // 'ALL_USERS' | 'CLIENTS_ONLY' | 'ADVOCATES_ONLY' | 'FIRMS_ONLY'
  const [priorityLevel, setPriorityLevel] = useState('STANDARD');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [sentAlerts, setSentAlerts] = useState([
    {
      id: 'ANC-01',
      title: 'Scheduled Platform Maintenance Notice',
      body: 'WebRTC video rooms and client payments will undergo scheduled infrastructure optimization on Sunday 02:00 AM IST.',
      audience: 'All Clients, Advocates & Law Firms',
      date: '14 Feb 2026, 18:00',
      deliveredCount: 420,
    },
    {
      id: 'ANC-02',
      title: 'Bar Council Mandatory Practice Docket Update',
      body: 'All active independent and firm practitioners must ensure their 2025-2026 Certificate of Practice is on record.',
      audience: 'Advocates & Law Firms Only',
      date: '10 Feb 2026, 12:30',
      deliveredCount: 172,
    },
  ]);
  const [toastMessage, setToastMessage] = useState('');

  const handleSendAnnouncement = (e) => {
    e.preventDefault();
    if (!announcementTitle.trim() || !announcementBody.trim()) return;

    const newAnc = {
      id: `ANC-${Date.now().toString().slice(-4)}`,
      title: announcementTitle.trim(),
      body: announcementBody.trim(),
      audience: targetAudience.replace(/_/g, ' '),
      date: 'Just now',
      deliveredCount: targetAudience === 'ALL_USERS' ? 420 : 148,
    };

    setSentAlerts([newAnc, ...sentAlerts]);
    setToastMessage(`Platform announcement broadcast successfully to [${newAnc.audience}].`);
    setAnnouncementTitle('');
    setAnnouncementBody('');
    setPreviewOpen(false);
    setTimeout(() => setToastMessage(''), 3500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage('')} className="text-emerald-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-stone-800">
        <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
          <Bell className="w-5 h-5 text-amber-500" />
          <span>Administrative Notifications &amp; Targeted Broadcasts</span>
        </h2>
        <p className="text-xs text-stone-400 font-sans mt-0.5">
          Dispatch official regulatory notices, platform policy broadcasts, and system maintenance alerts.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Broadcast Dispatcher Form */}
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-4 text-xs">
          <div className="flex items-center space-x-2 pb-2 border-b border-stone-800">
            <Send className="w-4 h-4 text-amber-500" />
            <h3 className="font-serif font-bold text-sm text-cream-100">
              Compose Platform Broadcast
            </h3>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); setPreviewOpen(true); }} className="space-y-3">
            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Target Audience
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 focus:outline-none focus:border-amber-500 cursor-pointer"
              >
                <option value="ALL_USERS">All Users (Clients, Advocates, Law Firms)</option>
                <option value="CLIENTS_ONLY">Clients Only</option>
                <option value="ADVOCATES_ONLY">Verified Advocates Only</option>
                <option value="FIRMS_ONLY">Law Firm Administrators Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Announcement Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Mandatory Compliance Advisory / New Court Bench..."
                value={announcementTitle}
                onChange={(e) => setAnnouncementTitle(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Announcement Message
              </label>
              <textarea
                rows={4}
                required
                placeholder="Provide clear statutory or administrative advisory..."
                value={announcementBody}
                onChange={(e) => setAnnouncementBody(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!announcementTitle.trim() || !announcementBody.trim()}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-90 disabled:opacity-40 text-stone-950 font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview &amp; Confirm Broadcast</span>
              </button>
            </div>
          </form>
        </div>

        {/* Broadcast History */}
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3 text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-stone-800">
            <h3 className="font-serif font-bold text-sm text-cream-100">
              Broadcast Dispatch Ledger
            </h3>
            <span className="text-[10px] font-mono text-stone-400">{sentAlerts.length} Recorded Alerts</span>
          </div>

          <div className="space-y-2.5">
            {sentAlerts.map((al) => (
              <div key={al.id} className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-cream-100 text-xs">{al.title}</span>
                  <span className="text-[9px] font-mono text-emerald-400">Delivered: {al.deliveredCount}</span>
                </div>
                <p className="text-stone-300 font-sans leading-relaxed text-[11px]">{al.body}</p>
                <div className="flex items-center justify-between pt-1 text-[9px] font-mono text-stone-500 border-t border-stone-800/80">
                  <span>Audience: {al.audience}</span>
                  <span>{al.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Preview & Confirmation Modal */}
      {previewOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-amber-800 rounded-3xl max-w-md w-full p-6 text-xs text-stone-300 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-2 border-b border-stone-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase font-bold">Broadcast Preview</span>
                <h3 className="font-serif font-bold text-base text-cream-50">{announcementTitle}</h3>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
              <p className="text-stone-200 font-sans leading-relaxed">{announcementBody}</p>
              <div className="pt-2 border-t border-stone-800 text-[10px] font-mono text-stone-400">
                Target Audience: <strong className="text-cream-100">{targetAudience.replace(/_/g, ' ')}</strong>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="px-3.5 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800"
              >
                Back to Edit
              </button>
              <button
                type="button"
                onClick={handleSendAnnouncement}
                className="px-5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold"
              >
                Confirm &amp; Broadcast Live
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
