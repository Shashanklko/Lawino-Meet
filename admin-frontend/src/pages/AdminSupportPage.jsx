import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Clock,
  Send,
  User,
  Shield,
  X,
  ArrowRight,
  FileText,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminSupportPage = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  const [selectedTicket, setSelectedTicket] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadTickets = async () => {
    setLoading(true);
    const res = await adminApi.getSupportTickets();
    if (res.success) {
      setTickets(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const filteredTickets = tickets.filter((t) => {
    const matchesSearch =
      t.ticketId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.raisedBy.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || t.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    await adminApi.sendTicketMessage(selectedTicket.publicId, replyText.trim(), 'Platform Operations Desk');
    setReplyText('');
    loadTickets();
    setSelectedTicket((prev) => ({
      ...prev,
      messages: [
        ...(prev.messages || []),
        { sender: 'Platform Operations Desk', timestamp: new Date().toISOString(), text: replyText.trim() },
      ],
    }));
  };

  const handleResolveTicket = async (status) => {
    if (!selectedTicket) return;
    const notes = resolutionText.trim() || `Ticket marked as ${status} by admin operations.`;
    await adminApi.updateTicketStatus(selectedTicket.publicId, status, notes);
    setToastMessage(`Ticket ${selectedTicket.ticketId} marked as [${status}].`);
    setResolutionText('');
    loadTickets();
    setSelectedTicket((prev) => ({ ...prev, status }));
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

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
            <LifeBuoy className="w-5 h-5 text-amber-500" />
            <span>Customer Support &amp; Dispute Resolutions</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Resolve real client and advocate grievances, verify session attendance disputes, and coordinate statutory refunds.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search ticket #, title, user..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ESCALATED">Escalated</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Ticket ID</th>
                <th className="py-3 px-4">Raised By &amp; Role</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Issue Description</th>
                <th className="py-3 px-4">Priority</th>
                <th className="py-3 px-4">Assigned Admin</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredTickets.map((t) => {
                const isUrgent = t.priority === 'URGENT' || t.priority === 'HIGH';
                const isResolved = t.status === 'RESOLVED' || t.status === 'CLOSED';

                return (
                  <tr key={t.publicId} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cream-100">{t.ticketId}</td>
                    <td className="py-3 px-4">
                      <p className="font-serif font-bold text-cream-100">{t.raisedBy}</p>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-stone-400">
                        {t.userRole}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                        {t.category.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-xs truncate text-stone-300 font-medium">{t.title}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isUrgent
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : 'bg-stone-900 text-stone-400 border-stone-700'
                        }`}
                      >
                        {t.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-400 text-[11px] font-mono">{t.assignedAdmin}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          isResolved
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedTicket(t)}
                        className="px-3 py-1 rounded-lg bg-amber-950/70 hover:bg-amber-900 text-amber-300 text-[11px] font-mono border border-amber-800/60 transition cursor-pointer"
                      >
                        Open Docket &rarr;
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ticket Details & Resolution Thread Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-xs text-stone-300 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    {selectedTicket.category.replace(/_/g, ' ')}
                  </span>
                  <span className="font-mono text-stone-400 text-[11px]">{selectedTicket.ticketId}</span>
                </div>
                <h3 className="font-serif font-bold text-base text-cream-50 mt-1">{selectedTicket.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Ticket Info Strip */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 grid grid-cols-3 gap-2 font-mono text-[11px]">
              <div>
                <span className="text-stone-500 block text-[9px] uppercase">Raised By</span>
                <span className="text-cream-100 font-bold">{selectedTicket.raisedBy} ({selectedTicket.userRole})</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px] uppercase">Related Appointment</span>
                <span className="text-amber-400 font-bold">{selectedTicket.relatedAppointmentId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-500 block text-[9px] uppercase">Current Status</span>
                <span className="text-emerald-400 font-bold">{selectedTicket.status}</span>
              </div>
            </div>

            {/* Description */}
            <div className="p-3.5 rounded-xl bg-stone-900/60 border border-stone-800 space-y-1">
              <p className="font-semibold text-stone-300">User Statement</p>
              <p className="text-stone-300 leading-relaxed font-sans">{selectedTicket.description}</p>
            </div>

            {/* Internal Admin Notes */}
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1">
              <p className="font-serif font-bold text-cream-100 text-xs">Internal Administrative Findings</p>
              {selectedTicket.internalNotes?.map((note, i) => (
                <p key={i} className="text-stone-400 text-[11px] font-mono leading-relaxed">• {note}</p>
              ))}
            </div>

            {/* Message Thread */}
            <div className="space-y-2">
              <p className="font-serif font-bold text-cream-100 text-xs">Communication Thread</p>
              <div className="space-y-2 max-h-48 overflow-y-auto p-2 rounded-xl bg-stone-900 border border-stone-800">
                {selectedTicket.messages?.map((m, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-stone-800/80 border border-stone-700/60 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between text-[10px] font-mono text-stone-400">
                      <span className="font-bold text-amber-400">{m.sender}</span>
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="text-stone-200 font-sans">{m.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="flex gap-2 pt-1">
                <input
                  type="text"
                  placeholder="Send official platform response to user..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim()}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 disabled:opacity-40 text-stone-950 font-bold text-xs"
                >
                  Send
                </button>
              </form>
            </div>

            {/* Resolution Actions */}
            <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <input
                type="text"
                placeholder="Resolution conclusion summary..."
                value={resolutionText}
                onChange={(e) => setResolutionText(e.target.value)}
                className="w-full sm:w-72 bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 placeholder-stone-500"
              />
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleResolveTicket('ESCALATED')}
                  className="px-3 py-1.5 rounded-xl border border-rose-800 text-rose-300 hover:bg-rose-950/60 font-medium"
                >
                  Escalate
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveTicket('RESOLVED')}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-stone-950 font-bold text-xs cursor-pointer"
                >
                  Resolve &amp; Close Docket
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
