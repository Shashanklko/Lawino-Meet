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
  Building,
  MapPin,
  CreditCard,
  Lock,
  Unlock,
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
  const [paymentModalApt, setPaymentModalApt] = useState(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paidAppointments, setPaidAppointments] = useState({});

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

  const handleSimulatePayment = (apt) => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaidAppointments((prev) => ({ ...prev, [apt.publicId]: true }));
      setPaymentProcessing(false);
      setPaymentModalApt(null);
    }, 1200);
  };

  const isOffline = (notes) => {
    return notes && notes.includes('[OFFLINE]');
  };

  const filteredAppointments = appointments.filter((apt) => {
    if (activeTab === 'ALL') return true;
    if (activeTab === 'OFFLINE') return isOffline(apt.clientNotes);
    if (activeTab === 'ONLINE') return !isOffline(apt.clientNotes);
    return apt.status === activeTab;
  });

  return (
    <div className="space-y-8 bg-cream-50 min-h-screen py-6">
      {/* Top Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 p-6 sm:p-8 text-cream-100 shadow-2xl border border-luxury-gold/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-luxury-gold/20 border border-luxury-gold/40 text-luxury-gold-light text-xs font-serif font-bold uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-luxury-gold" />
            <span>Client Consultation Portal</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-cream-50">
            Your Legal Consultations
          </h1>
          <p className="text-xs text-cream-300 font-light leading-relaxed">
            Manage your scheduled online hearings, track chamber approvals, and access confidential consultation records.
          </p>
        </div>

        <button
          onClick={() => navigate('/lawyers')}
          className="px-6 py-3 rounded-2xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition"
        >
          Book New Consultation
        </button>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center space-x-2 border-b border-cream-300 pb-2 overflow-x-auto">
        {['ALL', 'CONFIRMED', 'PENDING', 'ONLINE', 'OFFLINE'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-serif font-bold uppercase tracking-wider transition ${
              activeTab === tab
                ? 'bg-maroon-900 text-cream-100 shadow-md'
                : 'text-stone-600 hover:bg-cream-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Consultations List */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2">
          <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-serif text-maroon-800">Loading consultations...</p>
        </div>
      ) : filteredAppointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-cream-300 p-12 text-center space-y-3">
          <Calendar className="w-12 h-12 text-stone-300 mx-auto" />
          <h3 className="text-base font-serif font-bold text-maroon-950">No Consultations Found</h3>
          <p className="text-xs text-stone-500">
            You don't have any {activeTab !== 'ALL' ? activeTab.toLowerCase() : ''} consultations scheduled at this time.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAppointments.map((apt) => {
            const offline = isOffline(apt.clientNotes);
            const isApproved = apt.status === 'CONFIRMED';
            const isPaid = paidAppointments[apt.publicId] || apt.paymentStatus === 'PAID';

            return (
              <div
                key={apt.publicId}
                className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm hover:border-luxury-gold hover:shadow-md transition space-y-4"
              >
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                        offline ? 'bg-amber-100 text-amber-800' : 'bg-maroon-100 text-maroon-800'
                      }`}
                    >
                      {offline ? <Building className="w-7 h-7" /> : <Video className="w-7 h-7" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-serif font-bold text-base text-maroon-950">
                          {apt.lawyerName || 'Senior Advocate Consultation'}
                        </h4>
                        <span
                          className={`text-[10px] font-serif font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                            offline
                              ? 'bg-amber-50 text-amber-900 border-amber-300'
                              : 'bg-emerald-50 text-emerald-900 border-emerald-300'
                          }`}
                        >
                          {offline ? '🏛️ Chamber In-Person' : '🌐 Online Video'}
                        </span>
                        <StatusBadge status={apt.status} />
                      </div>
                      <p className="text-xs text-stone-500 mt-1 flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>{new Date(apt.startTime).toLocaleString()}</span>
                        </span>
                        <span className="font-serif font-bold text-maroon-900">₹{apt.totalFee || '1,500'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                    {/* If Online Video Confirmed -> Join Video Call */}
                    {!offline && isApproved && (
                      <button
                        onClick={() => handleJoinVideoCall(apt)}
                        disabled={joiningRoomId === apt.publicId}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-md transition flex items-center space-x-1.5"
                      >
                        <Video className="w-3.5 h-3.5" />
                        <span>Launch Video Room</span>
                      </button>
                    )}

                    {/* Chat button */}
                    <button
                      onClick={() => openChatWithUser(apt.lawyerUserPublicId, apt.lawyerName)}
                      className="p-2.5 rounded-xl border border-cream-300 hover:bg-cream-100 text-maroon-900 transition"
                      title="Message Advocate"
                    >
                      <MessageSquare className="w-4 h-4 text-luxury-gold" />
                    </button>
                  </div>
                </div>

                {/* SPECIAL WORKFLOW FOR OFFLINE CHAMBER CONSULTATION */}
                {offline && (
                  <div className="pt-3 border-t border-cream-200">
                    {isApproved ? (
                      /* Advocate has accepted! Unlock Chamber address & Payment Details */
                      <div className="p-4 rounded-2xl bg-gradient-to-r from-cream-100 to-cream-50 border border-luxury-gold/50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2 text-xs font-serif font-bold text-maroon-900">
                            <Unlock className="w-4 h-4 text-emerald-600" />
                            <span>Advocate Confirmed Readiness • Chamber Details Unlocked!</span>
                          </div>
                          {isPaid ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-serif font-bold uppercase tracking-wider border border-emerald-300">
                              ✓ Retainer Paid
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-serif font-bold uppercase tracking-wider border border-amber-300">
                              Payment Required
                            </span>
                          )}
                        </div>

                        {/* Unlocked Chamber Location */}
                        <div className="p-3 bg-white rounded-xl border border-cream-300 text-xs text-stone-700 space-y-1">
                          <p className="font-serif font-bold text-maroon-950 flex items-center space-x-1.5">
                            <MapPin className="w-3.5 h-3.5 text-maroon-800" />
                            <span>Chamber 412, Lawyers Chambers Block, Court Complex, New Delhi</span>
                          </p>
                          <p className="text-[11px] text-stone-500 pl-5">
                            Reporting time: 10 minutes prior to scheduled slot. Please present digital confirmation badge at court gate security.
                          </p>
                        </div>

                        {/* Payment Unlock Action */}
                        {!isPaid ? (
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs text-stone-600 font-sans">
                              Retainer Fee: <strong className="font-serif text-maroon-950">₹{apt.totalFee || '1,500'}</strong>
                            </span>
                            <button
                              onClick={() => setPaymentModalApt(apt)}
                              className="px-4 py-2 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-md flex items-center space-x-1.5"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Retainer & Lock Seat</span>
                            </button>
                          </div>
                        ) : (
                          <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center space-x-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>Chamber seat securely booked. Advocate notified of confirmed arrival.</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      /* Still Pending Advocate Approval: Chamber details & payment are locked */
                      <div className="p-3.5 rounded-2xl bg-stone-50 border border-stone-200 text-xs text-stone-600 flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Lock className="w-4 h-4 text-stone-400" />
                          <span>
                            <strong>Chamber Request Under Review:</strong> Advocate is verifying court calendar. Exact chamber room and payment options will unlock immediately once approved.
                          </span>
                        </div>
                        <span className="text-[10px] font-serif uppercase tracking-wider font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 shrink-0">
                          Pending Approval
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Simulated Payment Modal */}
      {paymentModalApt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-cream-300">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-maroon-900 text-luxury-gold flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-serif font-bold text-maroon-950">Chamber Retainer Payment</h3>
                <p className="text-xs text-stone-500">Atomic Escrow Holding</p>
              </div>
            </div>

            <div className="p-4 bg-cream-100 rounded-2xl border border-cream-300 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-stone-500">Advocate:</span>
                <span className="font-serif font-bold text-maroon-950">{paymentModalApt.lawyerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Chamber:</span>
                <span className="font-semibold text-stone-800">Chamber 412, Court Complex</span>
              </div>
              <div className="flex justify-between border-t border-cream-300 pt-2 font-serif text-sm">
                <span className="font-bold text-maroon-950">Total Retainer:</span>
                <span className="font-bold text-maroon-900">₹{paymentModalApt.totalFee || '1,500'}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[11px] text-emerald-800 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% secure payment under Bar Council facilitation norms.</span>
            </div>

            <div className="flex items-center space-x-3 pt-2">
              <button
                onClick={() => setPaymentModalApt(null)}
                className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-serif font-bold hover:bg-stone-50 transition"
              >
                Cancel
              </button>
              <button
                disabled={paymentProcessing}
                onClick={() => handleSimulatePayment(paymentModalApt)}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 disabled:opacity-50 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition"
              >
                {paymentProcessing ? 'Authorizing...' : 'Authorize Payment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
