import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Video,
  Building,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Plus,
  ShieldCheck,
  Unlock,
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

  const isOffline = (notes) => {
    return notes && notes.includes('[OFFLINE]');
  };

  const pendingRequests = appointments.filter((a) => a.status === 'PENDING');
  const confirmedConsultations = appointments.filter((a) => a.status === 'CONFIRMED');

  return (
    <div className="space-y-8 bg-cream-50 min-h-screen py-6">
      {/* Overview Topbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl border border-cream-300 shadow-xl">
        <div>
          <h1 className="text-2xl font-serif font-black text-maroon-950">Advocate Practice Console</h1>
          <p className="text-xs text-stone-500 mt-1">
            Review online hearings, chamber conference requests, and manage open calendar availability.
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/dashboard/lawyer/slots"
            className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Manage Slots</span>
          </Link>
        </div>
      </div>

      {/* Pending Requests Queue (Action Required) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-serif font-bold text-maroon-950 flex items-center space-x-2">
            <span>Pending Consultation Requests</span>
            {pendingRequests.length > 0 && (
              <span className="w-5 h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </h2>
          <span className="text-xs text-stone-400 font-sans">Requires Advocate Review</span>
        </div>

        {pendingRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-cream-300 p-8 text-center text-xs text-stone-500">
            No pending consultation requests at this time.
          </div>
        ) : (
          <div className="space-y-3">
            {pendingRequests.map((req) => {
              const offline = isOffline(req.clientNotes);
              return (
                <div
                  key={req.publicId}
                  className="bg-white border-2 border-amber-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <span
                        className={`text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                          offline
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border-emerald-300'
                        }`}
                      >
                        {offline ? '🏛️ Chamber In-Person Request' : '🌐 Online Video'}
                      </span>
                      <h3 className="font-serif font-bold text-base text-maroon-950">
                        {req.clientName || 'Client Consultation'}
                      </h3>
                      <StatusBadge status="PENDING" />
                    </div>

                    <p className="text-xs text-stone-600 flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-stone-400" />
                        <span>{new Date(req.startTime).toLocaleString()}</span>
                      </span>
                      <span className="font-serif font-bold text-maroon-900">₹{req.totalFee}</span>
                    </p>

                    {req.clientNotes && (
                      <p className="text-xs text-stone-700 bg-cream-100 p-3 rounded-xl border border-cream-300">
                        Matter: "{req.clientNotes}"
                      </p>
                    )}

                    {offline && (
                      <p className="text-[11px] text-amber-800 font-serif flex items-center space-x-1">
                        <Unlock className="w-3.5 h-3.5 text-amber-700" />
                        <span>
                          Accepting this request will confirm chamber availability and unlock chamber details for the client.
                        </span>
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => handleConfirm(req.publicId)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{offline ? 'Accept & Open Chamber' : 'Accept'}</span>
                    </button>
                    <button
                      onClick={() => setRejectingApt(req)}
                      disabled={actionLoading}
                      className="px-4 py-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-serif font-bold text-xs uppercase tracking-wider transition flex items-center space-x-1"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Decline</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmed Consultations List */}
      <div className="space-y-4">
        <h2 className="text-base font-serif font-bold text-maroon-950">Confirmed Hearings & Chamber Sessions</h2>

        {confirmedConsultations.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-cream-300 p-8 text-center text-xs text-stone-500">
            No confirmed consultations scheduled.
          </div>
        ) : (
          <div className="space-y-3">
            {confirmedConsultations.map((apt) => {
              const offline = isOffline(apt.clientNotes);
              return (
                <div
                  key={apt.publicId}
                  className="bg-white border border-cream-300 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                >
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                        offline ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {offline ? <Building className="w-6 h-6" /> : <Video className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`text-[9px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            offline
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {offline ? '🏛️ Chamber In-Person' : '🌐 Online Video'}
                        </span>
                        <h4 className="font-serif font-bold text-base text-maroon-950">
                          {apt.clientName || 'Client Consultation'}
                        </h4>
                        <StatusBadge status="CONFIRMED" />
                      </div>
                      <p className="text-xs text-stone-500 mt-1 flex items-center space-x-3">
                        <span>{new Date(apt.startTime).toLocaleString()}</span>
                        <span className="font-serif font-bold text-maroon-900">₹{apt.totalFee}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    {!offline && (
                      <button
                        onClick={() => handleJoinVideoCall(apt)}
                        disabled={joiningRoomId === apt.publicId}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Enter Video Room</span>
                      </button>
                    )}
                    <button
                      onClick={() => openChatWithUser(apt.clientUserPublicId, apt.clientName)}
                      className="p-2.5 rounded-xl border border-cream-300 hover:bg-cream-100 text-maroon-900 transition"
                      title="Message Client"
                    >
                      <MessageSquare className="w-4 h-4 text-luxury-gold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {rejectingApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-cream-300">
            <h3 className="text-lg font-serif font-bold text-maroon-950">Decline Consultation Request</h3>
            <p className="text-xs text-stone-500">
              Please enter the conflict or scheduling reason so the client is formally informed.
            </p>
            <textarea
              rows={3}
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g. Pre-scheduled High Court hearing, conflict of interest..."
              className="w-full text-xs border border-cream-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setRejectingApt(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-serif font-bold hover:bg-stone-50"
              >
                Back
              </button>
              <button
                onClick={handleReject}
                disabled={actionLoading || !rejectionReason.trim()}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-md"
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
