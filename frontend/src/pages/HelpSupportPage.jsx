import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  AlertCircle,
  FileText,
  ShieldAlert,
  Send,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Search,
  ChevronRight,
  MessageSquare,
  Building,
  User,
  Scale,
  Video,
  CreditCard,
  X,
  FileCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MOCK_FALLBACK_TICKETS = [
  {
    publicId: 'tkt-001',
    ticketId: 'TKT-2026-401',
    raisedBy: 'Vikram Patel',
    userPublicId: 'cli-003',
    userRole: 'CLIENT',
    category: 'ESCROW_DISPUTE',
    relatedAppointmentId: 'APT-2026-083',
    priority: 'HIGH',
    assignedAdmin: 'Amit Saxena (Support Lead)',
    status: 'UNDER_REVIEW',
    createdAt: '2026-02-14T16:30:00Z',
    title: 'Refund request for cancelled consultation with Adv. Meera Deshmukh',
    description:
      'I had to cancel 15 minutes before scheduled time due to a sudden medical emergency. Adv. Meera kindly agreed over chat that a full refund can be issued.',
    internalNotes: [
      'Checked appointment APT-2026-083. Advocate confirmed on record that waiver of short-notice penalty is approved. Finance refund authorized for ₹1,650.',
    ],
    messages: [
      {
        sender: 'Vikram Patel (Client)',
        timestamp: '2026-02-14T16:30:00Z',
        text: 'Please process refund to my original UPI account.',
      },
      {
        sender: 'Amit Saxena (Support Lead)',
        timestamp: '2026-02-14T17:15:00Z',
        text: 'Hello Vikram, we reviewed your request and confirmed with Adv. Meera. Your refund of ₹1,650 is queued for escrow payout reversal.',
      },
    ],
  },
];

export const HelpSupportPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role || 'CLIENT';
  const userName = user?.fullName || user?.username || 'User';

  const [activeTab, setActiveTab] = useState('SUBMIT'); // 'SUBMIT' | 'HISTORY'
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [userReply, setUserReply] = useState('');
  const [submitSuccessMsg, setSubmitSuccessMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    category: 'CHAMBER_ISSUE',
    priority: 'MEDIUM',
    relatedAppointmentId: '',
    title: '',
    description: '',
  });

  // Load tickets from lawino_admin_tickets
  const loadTickets = () => {
    try {
      const stored = localStorage.getItem('lawino_admin_tickets');
      if (stored) {
        setTickets(JSON.parse(stored));
      } else {
        setTickets(MOCK_FALLBACK_TICKETS);
        localStorage.setItem('lawino_admin_tickets', JSON.stringify(MOCK_FALLBACK_TICKETS));
      }
    } catch {
      setTickets(MOCK_FALLBACK_TICKETS);
    }
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitTicket = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) return;

    const newTicketId = `TKT-2026-${Math.floor(100 + Math.random() * 900)}`;
    const newTicket = {
      publicId: `tkt-${Date.now()}`,
      ticketId: newTicketId,
      raisedBy: userName,
      userPublicId: user?.publicId || `usr_${Date.now()}`,
      userRole,
      category: formData.category,
      relatedAppointmentId: formData.relatedAppointmentId.trim() || 'N/A',
      priority: formData.priority,
      assignedAdmin: 'Amit Saxena (Support Lead)',
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      title: formData.title.trim(),
      description: formData.description.trim(),
      internalNotes: [
        `Grievance logged via Help & Support desk by ${userName} (${userRole}).`,
      ],
      messages: [
        {
          sender: `${userName} (${userRole})`,
          timestamp: new Date().toISOString(),
          text: formData.description.trim(),
        },
      ],
    };

    const updated = [newTicket, ...tickets];
    try {
      localStorage.setItem('lawino_admin_tickets', JSON.stringify(updated));
    } catch {}

    setTickets(updated);
    setFormData({
      category: 'CHAMBER_ISSUE',
      priority: 'MEDIUM',
      relatedAppointmentId: '',
      title: '',
      description: '',
    });

    setSubmitSuccessMsg(
      `Your grievance has been formally filed under Reference #${newTicketId}. Platform Compliance has been notified.`
    );
    setActiveTab('HISTORY');
    setTimeout(() => setSubmitSuccessMsg(''), 6000);
  };

  const handleSendReply = (e) => {
    e.preventDefault();
    if (!selectedTicket || !userReply.trim()) return;

    const replyMsg = {
      sender: `${userName} (${userRole})`,
      timestamp: new Date().toISOString(),
      text: userReply.trim(),
    };

    const updated = tickets.map((t) =>
      t.publicId === selectedTicket.publicId
        ? {
            ...t,
            messages: [...(t.messages || []), replyMsg],
            status: t.status === 'RESOLVED' ? 'OPEN' : t.status,
          }
        : t
    );

    try {
      localStorage.setItem('lawino_admin_tickets', JSON.stringify(updated));
    } catch {}

    setTickets(updated);
    setSelectedTicket((prev) => ({
      ...prev,
      messages: [...(prev.messages || []), replyMsg],
    }));
    setUserReply('');
  };

  // Filter tickets raised by this role or matching search
  const filteredTickets = tickets.filter((t) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      t.ticketId?.toLowerCase().includes(q) ||
      t.title?.toLowerCase().includes(q) ||
      t.description?.toLowerCase().includes(q) ||
      t.category?.toLowerCase().includes(q);
    return matchesSearch;
  });

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-bold animate-pulse';
      case 'HIGH':
        return 'bg-amber-100 text-amber-900 border-amber-300 font-semibold';
      case 'MEDIUM':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-stone-100 text-stone-700 border-stone-200';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'OPEN':
        return 'bg-amber-50 text-amber-800 border-amber-300 font-semibold';
      case 'UNDER_REVIEW':
        return 'bg-purple-50 text-purple-800 border-purple-300 font-semibold';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold';
      case 'CLOSED':
        return 'bg-stone-100 text-stone-600 border-stone-300';
      default:
        return 'bg-blue-50 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Header Card */}
      <div className="rounded-3xl border border-stone-200/90 bg-white/95 backdrop-blur-xl p-6 sm:p-8 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-[#831826]/10 text-[#831826] border border-[#831826]/20 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <h1 className="font-serif font-bold text-xl sm:text-2xl text-[#1F1C1B]">
                Help, Grievances &amp; Statutory Resolution
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-stone-500 font-sans leading-relaxed">
              Unified grievance reporting for Clients, Independent Advocates, and Law Firms. All tickets are audited by Platform Compliance within 24 hours.
            </p>
          </div>

          {/* Role Indicator Pill */}
          <div className="flex items-center space-x-2 shrink-0">
            <span className="text-[11px] font-mono font-medium px-3 py-1 rounded-full bg-stone-100 text-stone-700 border border-stone-200 flex items-center space-x-1.5">
              <User className="w-3.5 h-3.5 text-[#831826]" />
              <span>Reporting as: <strong className="font-bold text-[#1F1C1B]">{userRole}</strong></span>
            </span>
          </div>
        </div>

        {/* Success Toast */}
        {submitSuccessMsg && (
          <div className="mt-4 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center space-x-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span className="font-medium">{submitSuccessMsg}</span>
          </div>
        )}

        {/* View Switcher Tabs */}
        <div className="flex items-center space-x-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => setActiveTab('SUBMIT')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'SUBMIT'
                ? 'bg-[#831826] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>File New Grievance / Report</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('HISTORY')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5 ${
              activeTab === 'HISTORY'
                ? 'bg-[#831826] text-white shadow-xs'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200/70'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>My Submitted Grievances ({filteredTickets.length})</span>
          </button>
        </div>
      </div>

      {/* =====================================================================
          TAB 1: FILE GRIEVANCE / REPORT FORM
          ====================================================================== */}
      {activeTab === 'SUBMIT' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-3xl border border-stone-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
            <div>
              <h2 className="font-serif font-bold text-base text-[#1F1C1B]">
                Submit Formal Grievance or Dispute
              </h2>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                Provide accurate details. Escrow payments or chamber logs will be inspected automatically.
              </p>
            </div>

            <form onSubmit={handleSubmitTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Grievance Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#831826]"
                  >
                    <option value="CHAMBER_ISSUE">Chamber / Video Meeting Failure</option>
                    <option value="ESCROW_DISPUTE">Escrow Retainer / Fee Dispute</option>
                    <option value="NO_SHOW_MISCONDUCT">Counterparty No-Show / Ethics Breach</option>
                    <option value="FIRM_ADMINISTRATION">Law Firm Roster / Bench Delegation Query</option>
                    <option value="STATUTORY_VERIFICATION">Bar Council Verification / KYC Document</option>
                    <option value="GENERAL_ASSISTANCE">Platform Technical Support</option>
                  </select>
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                    Priority Level *
                  </label>
                  <select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 focus:outline-none focus:border-[#831826]"
                  >
                    <option value="LOW">Low — Feedback / Non-urgent inquiry</option>
                    <option value="MEDIUM">Medium — General consultation question</option>
                    <option value="HIGH">High — Escrow hold or room failure</option>
                    <option value="URGENT">Urgent — Immediate court filing / security breach</option>
                  </select>
                </div>
              </div>

              {/* Related Appointment / Ref ID */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Related Consultation / Appointment Ref ID (Optional)
                </label>
                <input
                  type="text"
                  name="relatedAppointmentId"
                  value={formData.relatedAppointmentId}
                  onChange={handleInputChange}
                  placeholder="e.g. APT-2026-202 or leave blank if general account query"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#831826]"
                />
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Grievance Title / Subject *
                </label>
                <input
                  type="text"
                  required
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Video room disconnected after 5 minutes; counterparty was unresponsive"
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2.5 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#831826]"
                />
              </div>

              {/* Detailed Description */}
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                  Detailed Statement &amp; Facts *
                </label>
                <textarea
                  required
                  rows={5}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="State the circumstances chronologically: dates, consultation timings, agreed terms, and specific resolution requested (e.g. reschedule, escrow refund, or investigation)..."
                  className="w-full text-xs bg-stone-50 border border-stone-300 rounded-xl p-3 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#831826] leading-relaxed"
                />
              </div>

              {/* Privilege & Escrow Notice */}
              <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                <div className="flex items-center space-x-1.5 font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                  <span>Statutory Dispute Safeguard</span>
                </div>
                <p className="leading-relaxed">
                  Submitting this report halts any automatic 24-hour escrow release for the specified consultation. Both parties will be prompted for clarification if mediation is required.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-[#831826] hover:bg-[#6c131f] text-white font-serif font-bold text-xs tracking-wide shadow-sm transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Submit Grievance to Compliance Desk</span>
              </button>
            </form>
          </div>

          {/* Right Guidance Sidebar */}
          <div className="space-y-4">
            <div className="rounded-3xl border border-stone-200 bg-[#FAF8F5] p-5 space-y-3">
              <h3 className="font-serif font-bold text-sm text-[#1F1C1B] flex items-center space-x-2">
                <Scale className="w-4 h-4 text-[#831826]" />
                <span>Escalation Protocols</span>
              </h3>
              <ul className="text-xs text-stone-600 space-y-2 leading-relaxed">
                <li className="flex items-start space-x-2">
                  <span className="text-[#831826] font-bold">•</span>
                  <span><strong>WebRTC Audits:</strong> Server timestamp telemetry verifies which participant knocked and remained connected.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#831826] font-bold">•</span>
                  <span><strong>Fee Escrow:</strong> Disputed funds remain held safely in platform escrow until both parties or compliance sign off.</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-[#831826] font-bold">•</span>
                  <span><strong>Bar Council Standards:</strong> All consultations uphold Bar Council rules on professional conduct and confidentiality.</span>
                </li>
              </ul>
            </div>

            <div className="rounded-3xl border border-stone-200 bg-white p-5 space-y-2.5">
              <h3 className="font-serif font-bold text-sm text-[#1F1C1B]">
                Direct Compliance Contacts
              </h3>
              <p className="text-xs text-stone-500">
                For court-mandated disclosures or statutory emergency notices:
              </p>
              <div className="text-xs font-mono space-y-1 text-stone-700 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <p>Email: compliance@lawinomeet.com</p>
                <p>Toll-Free Grievance: 1800-419-LEGAL</p>
                <p>Desk Hours: Mon–Sat, 09:00–20:00 IST</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: SUBMITTED GRIEVANCES / STATUS MATRIX
          ====================================================================== */}
      {activeTab === 'HISTORY' && (
        <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h2 className="font-serif font-bold text-base text-[#1F1C1B]">
                Submitted Grievance Records
              </h2>
              <p className="text-xs text-stone-500">
                Track status updates, administrative decisions, and ongoing mediation replies.
              </p>
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search ticket # or subject..."
                className="w-full text-xs bg-stone-50 border border-stone-200 rounded-xl pl-8 pr-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#831826]"
              />
            </div>
          </div>

          {filteredTickets.length === 0 ? (
            <div className="py-12 text-center text-xs text-stone-400 space-y-2">
              <LifeBuoy className="w-8 h-8 text-stone-300 mx-auto" />
              <p className="font-medium text-stone-600">No grievances recorded</p>
              <p className="text-[11px]">All your consultations and transactions are operating smoothly.</p>
            </div>
          ) : (
            <div className="divide-y divide-stone-100">
              {filteredTickets.map((t) => (
                <div
                  key={t.publicId}
                  onClick={() => setSelectedTicket(t)}
                  className="py-3.5 px-3 hover:bg-stone-50/80 rounded-2xl transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-[#831826]">
                        {t.ticketId}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadge(t.priority)}`}>
                        {t.priority}
                      </span>
                      <span className="text-stone-300">•</span>
                      <span className="text-[11px] font-mono text-stone-500">
                        {t.category?.replace(/_/g, ' ')}
                      </span>
                    </div>

                    <h4 className="text-xs font-serif font-bold text-[#1F1C1B]">
                      {t.title}
                    </h4>

                    <p className="text-[11px] text-stone-500 line-clamp-1 font-sans">
                      {t.description}
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className={`text-[10px] px-2.5 py-1 rounded-full border ${getStatusBadge(t.status)}`}>
                      {t.status}
                    </span>
                    <span className="text-[11px] text-stone-400 font-mono">
                      {new Date(t.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
                    <ChevronRight className="w-4 h-4 text-stone-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TICKET DETAILS & LIVE THREAD MODAL
          ====================================================================== */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-stone-200 shadow-2xl max-w-2xl w-full p-6 space-y-4 text-xs animate-in zoom-in-95 max-h-[90vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-sm text-[#831826]">
                    {selectedTicket.ticketId}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusBadge(selectedTicket.status)}`}>
                    {selectedTicket.status}
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getPriorityBadge(selectedTicket.priority)}`}>
                    {selectedTicket.priority} Priority
                  </span>
                </div>
                <h3 className="font-serif font-bold text-sm text-[#1F1C1B]">
                  {selectedTicket.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setSelectedTicket(null)}
                className="p-1.5 rounded-full hover:bg-stone-100 text-stone-400 hover:text-stone-700 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Matter Info Strip */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200/80 text-[11px] text-stone-600 grid grid-cols-2 sm:grid-cols-3 gap-2 shrink-0">
              <div>
                <span className="text-stone-400 block text-[10px]">Raised By:</span>
                <span className="font-semibold text-stone-900">{selectedTicket.raisedBy} ({selectedTicket.userRole})</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Reference Matter:</span>
                <span className="font-mono text-stone-900">{selectedTicket.relatedAppointmentId || 'N/A'}</span>
              </div>
              <div>
                <span className="text-stone-400 block text-[10px]">Assigned Officer:</span>
                <span className="text-stone-900">{selectedTicket.assignedAdmin || 'Compliance Operations'}</span>
              </div>
            </div>

            {/* Original Statement */}
            <div className="p-3.5 rounded-2xl bg-white border border-stone-200 text-stone-800 leading-relaxed font-sans shrink-0">
              <span className="text-[10px] uppercase font-bold text-stone-400 block mb-1">Original Statement:</span>
              <p>{selectedTicket.description}</p>
            </div>

            {/* Messages & Admin Resolution Thread */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[160px]">
              <span className="text-[10px] uppercase font-bold text-stone-400 block">Communication Timeline:</span>
              {(selectedTicket.messages || []).map((msg, i) => (
                <div key={i} className="p-3 rounded-2xl bg-stone-50 border border-stone-200/60 space-y-1">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold text-[#831826]">{msg.sender}</span>
                    <span className="text-stone-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-xs text-stone-700 leading-relaxed">{msg.text}</p>
                </div>
              ))}
            </div>

            {/* Reply Input Form */}
            <form onSubmit={handleSendReply} className="pt-2 border-t border-stone-100 flex items-center space-x-2 shrink-0">
              <input
                type="text"
                value={userReply}
                onChange={(e) => setUserReply(e.target.value)}
                placeholder="Type additional evidence or reply to compliance officer..."
                className="flex-1 text-xs bg-stone-50 border border-stone-300 rounded-xl px-3 py-2 text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[#831826]"
              />
              <button
                type="submit"
                disabled={!userReply.trim()}
                className="px-4 py-2 rounded-xl bg-[#831826] hover:bg-[#6c131f] disabled:opacity-40 text-white font-medium text-xs transition cursor-pointer flex items-center space-x-1"
              >
                <Send className="w-3 h-3" />
                <span>Reply</span>
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
