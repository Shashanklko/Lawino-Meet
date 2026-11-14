import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Video,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { meetingApi } from '../api/meetingApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { useChat } from '../context/ChatContext';

export const LawyerDashboardPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectingApt, setRejectingApt] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [joiningRoomId, setJoiningRoomId] = useState(null);

  const navigate = useNavigate();
  const { openChatWithUser } = useChat();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMyAppointments();
      if (res.success && res.data) {
        setAppointments(res.data.content || res.data || []);
      }
    } catch (err) {
      console.warn('Failed to load lawyer appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleConfirm = async (aptPublicId) => {
    setActionLoading(true);
    try {
      await appointmentApi.confirmAppointment(aptPublicId);
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to confirm appointment:', err);
      alert(err.response?.data?.message || 'Failed to confirm appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectingApt) return;
    setActionLoading(true);
    try {
      await appointmentApi.cancelAppointment(rejectingApt.publicId, rejectionReason);
      setRejectingApt(null);
      setRejectionReason('');
      await fetchAppointments();
    } catch (err) {
      console.error('Failed to reject appointment:', err);
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinVideoCall = async (appointment) => {
    try {
      setJoiningRoomId(appointment.publicId);
      let roomRes;
      try {
        roomRes = await meetingApi.getRoomByAppointment(appointment.publicId);
      } catch {
        roomRes = await meetingApi.createMeetingRoom(appointment.publicId);
      }

      if (roomRes?.data?.publicId) {
        navigate(`/meeting/${roomRes.data.publicId}`);
      }
    } catch (err) {
      console.error('Failed to enter video consultation room:', err);
      alert('Unable to launch meeting room.');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const pendingRequests = appointments.filter((a) => a.status === 'PENDING');
  const confirmedConsultations = appointments.filter((a) => a.status === 'CONFIRMED');

  return (
    <div className="space-y-8">
      {/* Overview Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Advocate Practice Console</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your consultation requests, confirmed hearings, and open calendar slots.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/lawyer/slots"
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Slots</span>
          </Link>
        </div>
      </div>

      {/* Pending Requests Queue (Action Required) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
            <span>Pending Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-slate-400">Action required within 15 mins</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            No pending consultation requests at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => (
              <div
                key={req.publicId}
                className="bg-amber-50/50 border border-amber-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-bold text-sm text-slate-900">
                      {req.clientName || 'Client Consultation'}
                    </h3>
                    <StatusBadge status="PENDING" />
                  </div>
                  <p className="text-xs text-slate-600 mt-1 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(req.startTime).toLocaleString()}</span>
                    </span>
                    <span className="font-semibold text-blue-700">₹{req.totalFee}</span>
                  </p>
                  {req.clientNotes && (
                    <p className="text-xs text-slate-700 mt-1 bg-white/70 p-2 rounded-lg border border-amber-200/60">
                      Matter: "{req.clientNotes}"
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleConfirm(req.publicId)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition flex items-center space-x-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Accept</span>
                  </button>
                  <button
                    onClick={() => setRejectingApt(req)}
                    disabled={actionLoading}
                    className="px-4 py-2 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-700 text-xs font-bold transition flex items-center space-x-1"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Reject</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmed Consultations */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900">Confirmed Video Consultations</h2>

        {confirmedConsultations.length === 0 ? (
          <div className="bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-8 text-center text-xs text-slate-500">
            No confirmed consultations scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedConsultations.map((apt) => (
              <div
                key={apt.publicId}
                className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Video className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h4 className="font-bold text-sm text-slate-900">
                        {apt.clientName || 'Client Consultation'}
                      </h4>
                      <StatusBadge status="CONFIRMED" />
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                      <span>{new Date(apt.startTime).toLocaleString()}</span>
                      <span className="font-semibold text-blue-600">₹{apt.totalFee}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => handleJoinVideoCall(apt)}
                    disabled={joiningRoomId === apt.publicId}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Enter Consultation Room</span>
                  </button>
                  <button
                    onClick={() => openChatWithUser(apt.clientUserPublicId, apt.clientName)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                    title="Message Client"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Reason Modal */}
      {rejectingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-slate-900">Decline Consultation Request</h3>
            <p className="text-xs text-slate-500">
              Please state a reason for declining this request so the client is notified appropriately.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Conflict of interest, court hearing clash, out of jurisdiction..."
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setRejectingApt(null)}
                className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50"
              >
                Back
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-md"
              >
                Confirm Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
