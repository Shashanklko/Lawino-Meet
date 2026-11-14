import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Video,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { meetingApi } from '../api/meetingApi';
import { StatusBadge } from '../components/common/StatusBadge';
import { useChat } from '../context/ChatContext';

export const ClientDashboardPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL');
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
      console.warn('Failed to fetch client appointments:', err);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const handleJoinVideoCall = async (appointment) => {
    try {
      setJoiningRoomId(appointment.publicId);
      // Try to get existing meeting room for appointment or create one
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
      alert('Unable to launch meeting room. Please ensure appointment is confirmed.');
    } finally {
      setJoiningRoomId(null);
    }
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    return apt.status === activeTab;
  });

  // Find next upcoming confirmed appointment
  const nextAppointment = appointments.find((apt) => apt.status === 'CONFIRMED');

  return (
    <div className="space-y-6">
      {/* Top Banner / Next Consultation */}
      {nextAppointment ? (
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-950 p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Upcoming Consultation Confirmed</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold">
              Meeting with {nextAppointment.lawyerName || 'Advocate'}
            </h2>
            <p className="text-xs text-slate-300 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              <span>{new Date(nextAppointment.startTime).toLocaleString()}</span>
            </p>
          </div>

          <button
            onClick={() => handleJoinVideoCall(nextAppointment)}
            disabled={joiningRoomId === nextAppointment.publicId}
            className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg transition flex items-center space-x-2 shrink-0 disabled:opacity-50"
          >
            <Video className="w-4 h-4" />
            <span>
              {joiningRoomId === nextAppointment.publicId
                ? 'Connecting Room...'
                : 'Join Encrypted Video Call'}
            </span>
          </button>
        </div>
      ) : (
        <div className="rounded-2xl bg-white border border-slate-200 p-6 shadow-sm flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Welcome to your Client Portal</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Track your scheduled consultations, speak directly with advocates, and join video hearings.
            </p>
          </div>
          <button
            onClick={() => navigate('/lawyers')}
            className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 transition"
          >
            Book New Consultation
          </button>
        </div>
      )}

      {/* Tabs Filter */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
        {['ALL', 'CONFIRMED', 'PENDING', 'COMPLETED', 'CANCELLED'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition ${
              activeTab === tab
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Appointment Cards List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Loading consultations...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">No Consultations Found</h3>
          <p className="text-xs text-slate-500">
            You don't have any {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} consultations scheduled.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAppointments.map((apt) => (
            <div
              key={apt.publicId}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:border-slate-300 transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
            >
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Video className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-sm text-slate-900">
                      {apt.lawyerName || 'Legal Consultation'}
                    </h4>
                    <StatusBadge status={apt.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-1 flex items-center space-x-3">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{new Date(apt.startTime).toLocaleString()}</span>
                    </span>
                    <span className="font-semibold text-blue-600">₹{apt.totalFee || '1,500'}</span>
                  </p>
                  {apt.clientNotes && (
                    <p className="text-[11px] text-slate-400 mt-1 italic">
                      Notes: "{apt.clientNotes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                {apt.status === 'CONFIRMED' && (
                  <button
                    onClick={() => handleJoinVideoCall(apt)}
                    disabled={joiningRoomId === apt.publicId}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center space-x-1.5 shadow-sm"
                  >
                    <Video className="w-3.5 h-3.5" />
                    <span>Join Room</span>
                  </button>
                )}
                <button
                  onClick={() => openChatWithUser(apt.lawyerUserPublicId, apt.lawyerName)}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition"
                  title="Message Advocate"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
