import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Video,
  Building,
  AlertTriangle,
  ArrowRight,
  Shield,
  Lock,
  X,
  CreditCard,
  PhoneCall,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [channelFilter, setChannelFilter] = useState('ALL');
  const [escalatedOnly, setEscalatedOnly] = useState(false);

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [escalateModal, setEscalateModal] = useState(null);
  const [escalateReason, setEscalateReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    const res = await adminApi.getAppointments();
    if (res.success) {
      setAppointments(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const filteredAppointments = appointments.filter((apt) => {
    const matchesSearch =
      (apt.appointmentId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.client?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.advocate?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (apt.firm?.name || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || apt.appointmentStatus === statusFilter;
    const matchesChannel = channelFilter === 'ALL' || apt.bookingChannel === channelFilter;
    const matchesEscalation = !escalatedOnly || apt.escalationStatus === 'PRIORITY_ESCALATED';

    return matchesSearch && matchesStatus && matchesChannel && matchesEscalation;
  });

  const handleExecuteEscalation = async (e) => {
    e.preventDefault();
    if (!escalateModal || !escalateReason.trim()) return;

    await adminApi.escalateAppointment(
      escalateModal.publicId,
      escalateReason.trim(),
      'Admin Operations Priority'
    );

    setToastMessage(`Appointment ${escalateModal.appointmentId} escalated to senior support desk.`);
    setEscalateModal(null);
    setEscalateReason('');
    loadAppointments();
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
            <Calendar className="w-5 h-5 text-amber-500" />
            <span>Platform-Wide Appointment Escalation &amp; Lifecycle</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Monitor consultation fulfillment across independent and law firm bookings while strictly enforcing Section 126 legal privilege boundaries.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search appointment, client, counsel..."
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
            <option value="CONFIRMED">Confirmed</option>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>

          <select
            value={channelFilter}
            onChange={(e) => setChannelFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Channels</option>
            <option value="FIRM">Firm Bookings</option>
            <option value="INDEPENDENT">Independent</option>
          </select>

          <button
            type="button"
            onClick={() => setEscalatedOnly(!escalatedOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition cursor-pointer ${
              escalatedOnly
                ? 'bg-rose-950 text-rose-300 border-rose-700 ring-1 ring-rose-500'
                : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            Escalated Only
          </button>
        </div>
      </div>

      {/* Privilege & Privacy Boundary Banner */}
      <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 text-[11px] text-stone-400 flex items-start space-x-2.5 leading-relaxed">
        <Lock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cream-100">Attorney-Client Privilege Boundary:</strong> Platform administrators inspect technical room connectivity and scheduling status only. Administrators never have access to private audio/video streams, chat transcripts, or client case briefs.
        </div>
      </div>

      {/* Appointments Data Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Appointment ID</th>
                <th className="py-3 px-4">Client</th>
                <th className="py-3 px-4">Counsel / Firm</th>
                <th className="py-3 px-4">Legal Service</th>
                <th className="py-3 px-4">Scheduled Date</th>
                <th className="py-3 px-4">Channel &amp; Mode</th>
                <th className="py-3 px-4">Status &amp; Escrow</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredAppointments.map((apt) => {
                const isConfirmed = apt.appointmentStatus === 'CONFIRMED';
                const isEscalated = apt.escalationStatus === 'PRIORITY_ESCALATED';

                return (
                  <tr key={apt.publicId} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cream-100">
                      <div className="flex items-center space-x-1.5">
                        {isEscalated && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
                        <span>{apt.appointmentId}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-serif font-bold text-cream-100">{apt.client.fullName}</p>
                      <p className="text-[10px] text-stone-500 font-mono">{apt.client.phone}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-serif font-bold text-amber-400">{apt.advocate.fullName}</p>
                      <p className="text-[10px] text-stone-500">
                        {apt.firm ? apt.firm.name : 'Independent Chamber'}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-stone-300 font-medium">{apt.service.title}</td>
                    <td className="py-3 px-4">
                      <p className="font-mono text-cream-100">
                        {new Date(apt.scheduledDate).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </p>
                      <p className="text-[10px] text-stone-500 font-mono">
                        {new Date(apt.scheduledDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-1">
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-stone-300">
                          {apt.bookingChannel}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-stone-300">
                          {apt.service.mode}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border inline-block ${
                            isConfirmed
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                              : 'bg-stone-900 text-stone-400 border-stone-700'
                          }`}
                        >
                          {apt.appointmentStatus}
                        </span>
                        <p className="text-[9px] font-mono text-stone-500">{apt.paymentStatus}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAppointment(apt)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition cursor-pointer"
                      >
                        Details
                      </button>

                      {!isEscalated && (
                        <button
                          type="button"
                          onClick={() => setEscalateModal(apt)}
                          className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-mono border border-rose-800 transition cursor-pointer"
                        >
                          Escalate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Appointment Details Modal */}
      {selectedAppointment && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-xs text-stone-300 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-cream-50">
                  Appointment {selectedAppointment.appointmentId}
                </h3>
                <p className="text-[11px] font-mono text-stone-400">
                  Scheduled for {new Date(selectedAppointment.scheduledDate).toLocaleString()}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Financial Ledger Breakdown */}
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5 font-mono text-[11px]">
              <p className="font-serif font-bold text-cream-100 text-xs">Financial Ledger Breakdown</p>
              <div className="flex justify-between">
                <span className="text-stone-500">Gross Client Charged:</span>
                <span className="font-bold text-cream-100">₹{selectedAppointment.grossFeeCharged.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Statutory Platform Commission (10%):</span>
                <span className="text-amber-400">₹{selectedAppointment.platformCommissionFee.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-1">
                <span className="text-stone-500">Advocate Escrow Entitlement:</span>
                <span className="font-bold text-emerald-400">₹{selectedAppointment.advocateNetEntitled.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Assignment & Lifecycle History */}
            <div className="space-y-2">
              <p className="font-serif font-bold text-cream-100 text-xs">Assignment &amp; Audit Trail</p>
              <div className="space-y-1">
                {selectedAppointment.assignmentHistory?.map((entry, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 text-[11px]">
                    <span className="text-[9px] font-mono text-stone-500 block">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <span className="text-stone-300 font-sans">{entry.note}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedAppointment(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Escalation Modal */}
      {escalateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-rose-800 rounded-2xl max-w-md w-full p-5 text-xs text-stone-300 shadow-2xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-rose-300">
              Escalate Appointment {escalateModal.appointmentId}
            </h3>
            <p className="text-[11px] text-stone-400">
              Flag for priority intervention by Senior Operations &amp; Support desk.
            </p>

            <form onSubmit={handleExecuteEscalation} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                  Escalation Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Advocate delayed in confirmation, client requested emergency reschedule, technical room connection check..."
                  value={escalateReason}
                  onChange={(e) => setEscalateReason(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEscalateModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!escalateReason.trim()}
                  className="px-4 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs"
                >
                  Confirm Priority Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
