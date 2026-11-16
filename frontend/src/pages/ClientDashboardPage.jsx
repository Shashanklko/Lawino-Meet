import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Calendar,
  Video,
  Clock,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertCircle,
  MessageSquare,
  ArrowRight,
  Building,
  MapPin,
  CreditCard,
  Lock,
  Plus,
  Settings,
  Sparkles,
  ExternalLink,
  LayoutGrid,
  List,
  Search,
  Filter,
  UserCheck,
  Briefcase,
  ChevronRight,
  DollarSign,
  Scale,
  Send,
  Eye,
  Wallet,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { meetingApi } from '../api/meetingApi';
import { useChat } from '../context/ChatContext';
import {
  MOCK_CLIENT_APPOINTMENTS,
  MOCK_LAWYERS,
  MOCK_FIRMS_DIRECTORY,
} from '../data/mockData';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusTabs } from '../components/dashboard/StatusTabs';
import { AppointmentItem } from '../components/dashboard/AppointmentItem';
import { EmptyState } from '../components/dashboard/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';

export const ClientDashboardPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { openChatWithUser } = useChat();

  // Determine current active subview based on URL path
  const currentPath = location.pathname;
  const isAdvocatesView = currentPath.includes('/client/advocates');
  const isFirmsView = currentPath.includes('/client/firms');
  const isAppointmentsView = currentPath.includes('/client/appointments');
  const isOverview = !isAdvocatesView && !isFirmsView && !isAppointmentsView;

  // State
  const [appointments, setAppointments] = useState(MOCK_CLIENT_APPOINTMENTS);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('ONGOING'); // 'REQUESTS' | 'ONGOING' | 'COMPLETED' | 'HISTORY'
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'

  // Modals & Actions
  const [cancellingApt, setCancellingApt] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [disputingApt, setDisputingApt] = useState(null);
  const [disputeReason, setDisputeReason] = useState('LAWYER_NO_SHOW');
  const [disputeNotes, setDisputeNotes] = useState('');
  const [selectedLawyerModal, setSelectedLawyerModal] = useState(null);
  const [firmRequestModal, setFirmRequestModal] = useState(null);
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [selectedConsultMode, setSelectedConsultMode] = useState('ONLINE');

  // Retainer Payment State
  const [payingAppointmentModal, setPayingAppointmentModal] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [walletBalance, setWalletBalance] = useState(4500);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentNotice, setPaymentNotice] = useState('');

  // Search & Filters for Advocates
  const [advocateSearch, setAdvocateSearch] = useState('');
  const [selectedSpecialization, setSelectedSpecialization] = useState('ALL');
  const [selectedCity, setSelectedCity] = useState('ALL');
  const [selectedMode, setSelectedMode] = useState('ALL');

  // Search & Filters for Law Firms
  const [firmSearch, setFirmSearch] = useState('');
  const [selectedFirmCity, setSelectedFirmCity] = useState('ALL');

  const fetchAppointments = async () => {
    try {
      const res = await appointmentApi.getMyAppointments();
      const list = res?.data?.content || res?.data || [];
      if (list.length > 0) {
        setAppointments(list);
      }
    } catch {
      // Keep mock data for UI testing
    }
  };

  useEffect(() => {
    fetchAppointments();
    // Auto-release check (24-hour mechanism)
    const now = Date.now();
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.status === 'COMPLETION_REQUESTED' && a.autoReleaseAt && now >= a.autoReleaseAt) {
          return { ...a, status: 'COMPLETED', autoReleased: true };
        }
        return a;
      })
    );
  }, []);

  const handleJoinCall = (apt) => {
    const roomId = apt.meetingRoomPublicId || 'room-chamber-001';
    navigate(`/meeting/${roomId}`);
  };

  const handleConfirmCompletion = (apt) => {
    setAppointments((prev) =>
      prev.map((a) =>
        a.publicId === apt.publicId
          ? { ...a, status: 'COMPLETED', clientConfirmedAt: Date.now() }
          : a
      )
    );
    setPaymentNotice(
      `Consultation completed! Escrow retainer has been released to counsel.`
    );
    setTimeout(() => setPaymentNotice(''), 5000);
  };

  const handleReportDisputeSubmit = (e) => {
    e.preventDefault();
    if (!disputingApt) return;

    const reasonMap = {
      LAWYER_NO_SHOW: 'Advocate did not join or connect to the consultation room',
      PREMATURE_EXIT: 'Consultation was cut short before the agreed duration',
      TECH_FAILURE: 'Severe audio/video technical failure prevented discussion',
      WRONG_ADVICE: 'Inappropriate professional conduct or improper legal advisory',
      OTHER: 'Other consultation dispute',
    };
    const reasonText = reasonMap[disputeReason] || disputeReason;

    setAppointments((prev) =>
      prev.map((a) =>
        a.publicId === disputingApt.publicId
          ? {
              ...a,
              status: 'DISPUTED',
              dispute: {
                reason: reasonText,
                category: disputeReason,
                notes: disputeNotes,
                reportedAt: Date.now(),
              },
              autoReleaseAt: null, // Freeze automatic release!
            }
          : a
      )
    );

    setPaymentNotice(
      `Dispute logged. Escrow funds (₹${disputingApt.service?.price || 1500}) are frozen on hold. Compliance officer will audit WebRTC connection logs.`
    );
    setDisputingApt(null);
    setDisputeNotes('');
    setTimeout(() => setPaymentNotice(''), 6000);
  };

  const handleCancelSubmit = async (e) => {
    e.preventDefault();
    if (!cancellingApt) return;
    try {
      await appointmentApi.cancelAppointment(cancellingApt.publicId, cancelReason);
    } catch {
      // Simulation for frontend UI testing
    }
    setAppointments((prev) =>
      prev.map((a) =>
        a.publicId === cancellingApt.publicId
          ? { ...a, status: 'CANCELLED', cancellationReason: cancelReason || 'Cancelled by client' }
          : a
      )
    );
    setCancellingApt(null);
    setCancelReason('');
  };

  const handleBookConsultation = (lawyer, channel = 'INDEPENDENT') => {
    const newApt = {
      publicId: `apt-new-${Date.now()}`,
      appointmentId: `APT-2026-${Math.floor(100 + Math.random() * 900)}`,
      status: 'PENDING',
      practiceType: channel,
      firmName: channel === 'FIRM' ? (lawyer.firmAffiliation?.firmName || 'Lex Veritas Legal LLP') : null,
      lawyer: {
        fullName: lawyer.fullName,
        barCouncilNumber: lawyer.barCouncilNumber,
        specialization: lawyer.specialization,
        hourlyRate: lawyer.hourlyRate,
        userPublicId: lawyer.userPublicId,
        city: lawyer.city,
        chamberAddress: lawyer.chamberAddress,
      },
      slot: {
        startTime: new Date(Date.now() + 3600000 * 24).toISOString(),
        endTime: new Date(Date.now() + 3600000 * 24.75).toISOString(),
      },
      service: {
        title: `${selectedConsultMode === 'ONLINE' ? 'Video' : 'In-Person Chamber'} Legal Advisory`,
        price: lawyer.hourlyRate,
        mode: selectedConsultMode,
      },
      consultationType: selectedConsultMode,
      clientNotes: consultationNotes || `[${selectedConsultMode}] Requested booking via ${channel} channel.`,
      createdAt: new Date().toISOString(),
    };

    setAppointments((prev) => [newApt, ...prev]);
    setRequestSuccessMessage(`Consultation request submitted to ${lawyer.fullName}!`);
    setTimeout(() => {
      setRequestSuccessMessage('');
      setSelectedLawyerModal(null);
      setConsultationNotes('');
    }, 1500);
  };

  const handleFirmRequestSubmit = (e) => {
    e.preventDefault();
    setRequestSuccessMessage(`Consultation brief submitted to ${firmRequestModal?.name}! Assigned partner will confirm your slot.`);
    setTimeout(() => {
      setRequestSuccessMessage('');
      setFirmRequestModal(null);
      setConsultationNotes('');
    }, 1800);
  };

  const handleConfirmPayment = (e) => {
    e?.preventDefault();
    if (!payingAppointmentModal) return;
    const advFee = payingAppointmentModal.service?.price || 500;
    const platformFee = Math.round(advFee * 0.1);
    const totalAmount = advFee + platformFee;

    if (walletBalance < totalAmount) {
      alert(`Insufficient wallet balance (₹${walletBalance.toLocaleString('en-IN')}). Please add funds to your wallet via Razorpay to continue.`);
      return;
    }

    setPaymentProcessing(true);
    setTimeout(() => {
      const targetApt = payingAppointmentModal;
      setWalletBalance((prev) => Math.max(0, prev - totalAmount));
      setAppointments((prev) =>
        prev.map((a) =>
          a.publicId === targetApt.publicId ? { ...a, status: 'CONFIRMED' } : a
        )
      );
      setPaymentProcessing(false);
      setPayingAppointmentModal(null);
      setPaymentNotice(
        `Retainer payment confirmed! ₹${totalAmount.toLocaleString('en-IN')} deducted from your Retainer Wallet (₹${advFee.toLocaleString('en-IN')} secured into statutory escrow). Consultation pass activated for both you and ${targetApt.lawyer?.fullName}.`
      );
      setTimeout(() => setPaymentNotice(''), 6000);
    }, 700);
  };

  // Metrics for the 4 unified tabs: New Requests, Ongoing, Completed, History
  const pendingCount = appointments.filter((a) => a.status === 'PENDING').length;
  const awaitingPaymentCount = appointments.filter((a) => a.status === 'AWAITING_PAYMENT').length;
  const ongoingCount = appointments.filter((a) =>
    ['AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETION_REQUESTED', 'DISPUTED'].includes(a.status)
  ).length;
  const upcomingCount = ongoingCount;
  const completedCount = appointments.filter((a) => a.status === 'COMPLETED').length;
  const historyCount = appointments.filter((a) =>
    ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(a.status)
  ).length;

  const appointmentTabs = [
    { id: 'REQUESTS', label: 'New Requests', count: pendingCount },
    { id: 'ONGOING', label: 'Ongoing', count: ongoingCount },
    { id: 'COMPLETED', label: 'Completed', count: completedCount },
    { id: 'HISTORY', label: 'History', count: historyCount },
  ];

  // Filtered Appointments
  const filteredAppointments = appointments.filter((a) => {
    if (activeTab === 'REQUESTS') return a.status === 'PENDING';
    if (activeTab === 'ONGOING') {
      return ['AWAITING_PAYMENT', 'CONFIRMED', 'COMPLETION_REQUESTED', 'DISPUTED'].includes(a.status);
    }
    if (activeTab === 'COMPLETED') return a.status === 'COMPLETED';
    if (activeTab === 'HISTORY') {
      return ['CANCELLED', 'REJECTED', 'EXPIRED', 'COMPLETED'].includes(a.status);
    }
    return true;
  });

  // Next Upcoming Appointment for Overview
  const nextAppointment = appointments
    .filter((a) => a.status === 'CONFIRMED')
    .sort((a, b) => new Date(a.slot?.startTime) - new Date(b.slot?.startTime))[0];

  // Filtered Advocates for Discover Advocates
  const filteredAdvocates = MOCK_LAWYERS.filter((l) => {
    const matchesSearch =
      l.fullName.toLowerCase().includes(advocateSearch.toLowerCase()) ||
      l.city.toLowerCase().includes(advocateSearch.toLowerCase()) ||
      l.specialization.toLowerCase().includes(advocateSearch.toLowerCase()) ||
      (l.practiceAreas && l.practiceAreas.some((p) => p.toLowerCase().includes(advocateSearch.toLowerCase())));

    const matchesSpec = selectedSpecialization === 'ALL' || l.specialization === selectedSpecialization;
    const matchesCity = selectedCity === 'ALL' || l.city.toLowerCase().includes(selectedCity.toLowerCase());
    const matchesMode =
      selectedMode === 'ALL' ||
      (selectedMode === 'ONLINE' && l.availableOnline) ||
      (selectedMode === 'OFFLINE' && l.availableOffline);

    return matchesSearch && matchesSpec && matchesCity && matchesMode;
  });

  // Filtered Law Firms
  const filteredFirms = MOCK_FIRMS_DIRECTORY.filter((f) => {
    const matchesSearch =
      f.name.toLowerCase().includes(firmSearch.toLowerCase()) ||
      f.description.toLowerCase().includes(firmSearch.toLowerCase()) ||
      f.practiceAreas.some((p) => p.toLowerCase().includes(firmSearch.toLowerCase()));
    const matchesCity = selectedFirmCity === 'ALL' || f.city.toLowerCase().includes(selectedFirmCity.toLowerCase());
    return matchesSearch && matchesCity;
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* =====================================================================
          VIEW 1: CLIENT OVERVIEW (/client)
      ====================================================================== */}
      {isOverview && (
        <>
          <PageHeader
            title="Overview"
            subtitle="Review your active chamber bookings, track pending advocate responses, and initiate encrypted consultations."
            actions={
              <Link
                to="/client/advocates"
                className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Find Advocates</span>
              </Link>
            }
          />

          {/* Payment Success Confirmation Toast */}
          {paymentNotice && (
            <div className="p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 text-xs font-medium flex items-center justify-between shadow-xs animate-in fade-in">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{paymentNotice}</span>
              </div>
              <button
                type="button"
                onClick={() => setPaymentNotice('')}
                className="text-stone-400 hover:text-stone-700 font-bold ml-2"
              >
                ✕
              </button>
            </div>
          )}

          {/* Awaiting Payment Action Alert */}
          {awaitingPaymentCount > 0 && (
            <div className="p-4 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-900 flex items-center justify-center shrink-0">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-serif font-bold text-stone-900 text-sm">
                    Advocate Accepted Your Request — Retainer Payment Required
                  </p>
                  <p className="text-[11px] text-stone-600 font-sans mt-0.5">
                    Your consultation request has been accepted by counsel. Complete the retainer payment to secure your time slot and activate your encrypted consultation pass.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setPayingAppointmentModal(
                    appointments.find((a) => a.status === 'AWAITING_PAYMENT')
                  )
                }
                className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition shrink-0 cursor-pointer shadow-xs"
              >
                Pay Retainer &amp; Confirm
              </button>
            </div>
          )}

          {/* Compact Summary Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Next Appointment"
              value={nextAppointment ? 'Scheduled' : 'None'}
              subtext={nextAppointment ? nextAppointment.lawyer?.fullName : 'No upcoming bookings'}
              icon={Calendar}
              badge={nextAppointment ? 'Confirmed' : undefined}
              badgeType="success"
            />
            <MetricCard
              label="Pending Requests"
              value={pendingCount}
              subtext="Awaiting advocate approval"
              icon={Clock}
              badge={pendingCount > 0 ? `${pendingCount} In Review` : 'None'}
              badgeType={pendingCount > 0 ? 'warning' : 'neutral'}
            />
            <MetricCard
              label="Completed Sessions"
              value={completedCount}
              subtext="Invoices & transcripts available"
              icon={CheckCircle2}
            />
          </div>

          {/* Main Content Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Next Upcoming Appointment & Pending Requests */}
            <div className="lg:col-span-2 space-y-6">
              {/* Next Upcoming Appointment Highlight */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-[var(--bg-primary)]" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Next Upcoming Consultation
                    </h3>
                  </div>
                  {nextAppointment && (
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                      Confirmed & Secured
                    </span>
                  )}
                </div>

                {nextAppointment ? (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center space-x-3.5">
                        <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-lg shadow-xs">
                          {nextAppointment.lawyer?.fullName?.[4] || 'A'}
                        </div>
                        <div>
                          <p className="font-serif font-bold text-base text-stone-900">
                            {nextAppointment.lawyer?.fullName}
                          </p>
                          <p className="text-xs text-stone-500 font-sans">
                            {nextAppointment.lawyer?.barCouncilNumber} • {nextAppointment.lawyer?.specialization?.replace('_', ' ')}
                          </p>
                          {nextAppointment.practiceType === 'FIRM' && (
                            <span className="inline-flex items-center space-x-1 text-[10px] text-blue-800 font-mono mt-0.5">
                              <Building className="w-2.5 h-2.5" />
                              <span>{nextAppointment.firmName || 'Lex Veritas Legal LLP'}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="sm:text-right">
                        <p className="text-sm font-semibold text-stone-900">
                          {new Date(nextAppointment.slot?.startTime).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-stone-500 font-sans">
                          {new Date(nextAppointment.slot?.startTime).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        {nextAppointment.consultationType === 'ONLINE' ? (
                          <Video className="w-4 h-4 text-emerald-700 shrink-0" />
                        ) : (
                          <Building className="w-4 h-4 text-stone-600 shrink-0" />
                        )}
                        <div>
                          <span className="font-semibold text-stone-800">
                            {nextAppointment.service?.title}
                          </span>
                          <p className="text-[11px] text-stone-500">
                            {nextAppointment.consultationType === 'ONLINE'
                              ? 'End-to-End Encrypted WebRTC Video Room'
                              : nextAppointment.lawyer?.chamberAddress || 'High Court Chambers'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0">
                        {nextAppointment.consultationType === 'ONLINE' && (
                          <button
                            type="button"
                            onClick={() => handleJoinCall(nextAppointment)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Join Video Call</span>
                          </button>
                        )}
                        <Link
                          to="/client/appointments"
                          className="px-3 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition"
                        >
                          View Details
                        </Link>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-stone-500 text-xs">
                    <p className="mb-2">You have no upcoming consultations scheduled.</p>
                    <Link
                      to="/client/advocates"
                      className="inline-flex items-center space-x-1 text-[var(--bg-primary)] font-semibold hover:underline"
                    >
                      <span>Explore verified advocates</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Pending Requests Section */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-700" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Pending Consultation Requests
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {pendingCount} Awaiting Response
                  </span>
                </div>

                {appointments.filter((a) => a.status === 'PENDING').length === 0 ? (
                  <p className="text-xs text-stone-500 py-4 text-center">
                    No requests pending. All submitted requests have been confirmed or concluded.
                  </p>
                ) : (
                  <div className="space-y-2.5">
                    {appointments
                      .filter((a) => a.status === 'PENDING')
                      .map((apt) => (
                        <div
                          key={apt.publicId}
                          className="p-3 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <p className="font-serif font-bold text-stone-900">
                                {apt.lawyer?.fullName}
                              </p>
                              {apt.practiceType === 'FIRM' ? (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                  Firm Request
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                  Independent
                                </span>
                              )}
                            </div>
                            <p className="text-stone-600 truncate mt-0.5 font-medium">
                              {apt.service?.title}
                            </p>
                            <p className="text-[10px] text-stone-500">
                              Requested for{' '}
                              {new Date(apt.slot?.startTime).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </p>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                              Awaiting Response
                            </span>
                            <button
                              type="button"
                              onClick={() => setCancellingApt(apt)}
                              className="px-2 py-1 rounded text-stone-500 hover:text-rose-700 hover:bg-rose-50 text-[11px] transition"
                            >
                              Withdraw
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Recommended Advocates & Quick Activity */}
            <div className="space-y-6">
              {/* Recommended Advocates */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <h3 className="font-serif font-bold text-sm text-stone-900">
                    Recommended Advocates
                  </h3>
                  <Link
                    to="/client/advocates"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    View All &rarr;
                  </Link>
                </div>

                <div className="space-y-3">
                  {MOCK_LAWYERS.slice(0, 3).map((l) => (
                    <div
                      key={l.publicId}
                      className="p-3 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] hover:bg-[var(--bg-cream-card)] transition flex items-start space-x-3 text-xs"
                    >
                      <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0 mt-0.5">
                        {l.fullName[4] || 'A'}
                      </div>
                      <div className="overflow-hidden flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-serif font-bold text-stone-900 truncate">
                            {l.fullName}
                          </p>
                          <span className="font-mono text-[11px] font-bold text-stone-900">
                            ₹{l.hourlyRate}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone-500 truncate">
                          {l.specialization?.replace('_', ' ')} • {l.yearsOfExperience} yrs
                        </p>
                        <div className="flex items-center justify-between mt-2 pt-1 border-t border-stone-200/60">
                          <span className="text-[10px] text-stone-500 font-mono">
                            {l.city}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedLawyerModal(l)}
                            className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline cursor-pointer"
                          >
                            Book &rarr;
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Activity Feed */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <h3 className="font-serif font-bold text-sm text-stone-900 pb-3 border-b border-stone-100 mb-3">
                  Recent Case Updates
                </h3>
                <div className="space-y-3 text-xs">
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-stone-900">Appointment Confirmed</p>
                      <p className="text-[11px] text-stone-500">
                        Adv. Raghavan Nambiar confirmed anticipatory bail review.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-stone-900">Chamber Gate Pass Ready</p>
                      <p className="text-[11px] text-stone-500">
                        Delhi High Court Chamber 412 entry pass attached.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2.5">
                    <div className="w-2 h-2 rounded-full bg-stone-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="font-medium text-stone-900">Statutory Escrow Authorized</p>
                      <p className="text-[11px] text-stone-500">
                        Retainer fees held in safe escrow until session conclusion.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 2: FIND ADVOCATES (/client/advocates)
      ====================================================================== */}
      {isAdvocatesView && (
        <>
          <PageHeader
            title="Discover Legal Advocates"
            subtitle="Browse verified counsel practicing before the Supreme Court of India, State High Courts, and commercial tribunals."
            badge="Advocate Directory"
            breadcrumbs={['Client Console', 'Find Advocates']}
          />

          {/* Search & Filter Bar */}
          <div className="p-4 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by advocate name, legal issue, FIR, trademark, court..."
                  value={advocateSearch}
                  onChange={(e) => setAdvocateSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                />
              </div>

              <div className="flex items-center space-x-2 overflow-x-auto">
                <select
                  value={selectedSpecialization}
                  onChange={(e) => setSelectedSpecialization(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-700 focus:outline-none"
                >
                  <option value="ALL">All Specializations</option>
                  <option value="CRIMINAL_DEFENSE">Criminal Defense & Bail</option>
                  <option value="CORPORATE_LAW">Corporate & M&A</option>
                  <option value="CIVIL_LITIGATION">Civil & Property</option>
                  <option value="FAMILY_LAW">Family & Matrimonial</option>
                  <option value="INTELLECTUAL_PROPERTY">IPR & Patents</option>
                  <option value="CYBER_CRIME">Cyber Crime & IT</option>
                </select>

                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-700 focus:outline-none"
                >
                  <option value="ALL">All Benches & Cities</option>
                  <option value="Delhi">Delhi NCR (Supreme Court & High Court)</option>
                  <option value="Mumbai">Mumbai (Bombay High Court)</option>
                  <option value="Bengaluru">Bengaluru (Karnataka High Court)</option>
                  <option value="Chennai">Chennai (Madras High Court)</option>
                  <option value="Pune">Pune District & Sessions</option>
                </select>

                <select
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-700 focus:outline-none"
                >
                  <option value="ALL">Any Mode</option>
                  <option value="ONLINE">Online WebRTC</option>
                  <option value="OFFLINE">Chamber Visit</option>
                </select>
              </div>
            </div>
          </div>

          {/* Advocate Results Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAdvocates.map((adv) => {
              const isFirmExclusive = adv.practiceArrangement === 'FIRM_EXCLUSIVE';
              const isFirmAndIndep = adv.practiceArrangement === 'FIRM_AND_INDEPENDENT';
              const isPureIndep = !adv.firmAffiliation;

              return (
                <div
                  key={adv.publicId}
                  className="rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm p-4 flex flex-col justify-between hover:border-stone-400 hover:shadow-xs transition"
                >
                  <div>
                    {/* Practice Affiliation Header Badge */}
                    <div className="flex items-center justify-between gap-1 mb-2.5">
                      {isFirmExclusive ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                          <Building className="w-2.5 h-2.5" />
                          <span>Firm Exclusive Counsel</span>
                        </span>
                      ) : isFirmAndIndep ? (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200">
                          <Building className="w-2.5 h-2.5" />
                          <span>Firm Partner & Independent</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          <span>Independent Advocate</span>
                        </span>
                      )}

                      <span className="text-[10px] font-mono text-stone-400">
                        {adv.barCouncilNumber}
                      </span>
                    </div>

                    {/* Advocate Profile Core */}
                    <div className="flex items-start space-x-3 mb-3">
                      <div className="w-11 h-11 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs shrink-0">
                        {adv.fullName[4] || 'A'}
                      </div>
                      <div className="overflow-hidden">
                        <h4 className="font-serif font-bold text-sm text-stone-900 truncate">
                          {adv.fullName}
                        </h4>
                        <p className="text-[11px] text-stone-500 font-sans truncate">
                          {adv.specialization?.replace('_', ' ')} • {adv.yearsOfExperience} Years Exp
                        </p>
                        {adv.firmAffiliation && (
                          <p className="text-[10px] text-blue-700 font-medium truncate mt-0.5">
                            {adv.firmAffiliation.firmName} ({adv.firmAffiliation.designation})
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3 font-sans">
                      {adv.bio}
                    </p>

                    {/* Court Benches & Hourly Rate */}
                    <div className="p-2 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] text-xs mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">Chamber Location</span>
                        <span className="font-semibold text-stone-800 text-[11px]">{adv.city}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">Consultation Retainer</span>
                        <span className="font-serif font-bold text-stone-900 text-xs">
                          ₹{adv.hourlyRate.toLocaleString('en-IN')} / session
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permitted Booking Channels (Rule from Section 5.B) */}
                  <div className="pt-2 border-t border-stone-100">
                    {isFirmExclusive ? (
                      <div className="space-y-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLawyerModal({ ...adv, forcedChannel: 'FIRM' });
                          }}
                          className="w-full py-2 px-3 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Building className="w-3.5 h-3.5" />
                          <span>Request Through Firm</span>
                        </button>
                        <p className="text-[9px] text-stone-400 text-center font-sans">
                          Practices exclusively with {adv.firmAffiliation.firmName}.
                        </p>
                      </div>
                    ) : isFirmAndIndep ? (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLawyerModal({ ...adv, forcedChannel: 'INDEPENDENT' });
                          }}
                          className="py-1.5 px-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <span>Independent</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLawyerModal({ ...adv, forcedChannel: 'FIRM' });
                          }}
                          className="py-1.5 px-2 rounded-lg border border-blue-300 text-blue-800 hover:bg-blue-50 font-medium text-xs flex items-center justify-center space-x-1 transition cursor-pointer"
                        >
                          <span>Through Firm</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedLawyerModal({ ...adv, forcedChannel: 'INDEPENDENT' });
                        }}
                        className="w-full py-2 px-3 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Book Consultation</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 3: FIND LAW FIRMS (/client/firms)
      ====================================================================== */}
      {isFirmsView && (
        <>
          <PageHeader
            title="Institutional Law Firms & Chambers"
            subtitle="Engage multi-partner legal firms for multi-bench litigation, corporate retainers, M&A due diligence, and regulatory compliance."
            badge="Firm Directory"
            breadcrumbs={['Client Console', 'Find Law Firms']}
          />

          {/* Search Firms Bar */}
          <div className="p-4 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search law firm by name, practice area (Arbitration, M&A, IPR)..."
                value={firmSearch}
                onChange={(e) => setFirmSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-800 placeholder-stone-400 focus:outline-none"
              />
            </div>
            <select
              value={selectedFirmCity}
              onChange={(e) => setSelectedFirmCity(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-700 focus:outline-none"
            >
              <option value="ALL">All Chambers & Hubs</option>
              <option value="Delhi">New Delhi High Court Bench</option>
              <option value="Mumbai">Mumbai Appellate Bench</option>
              <option value="Bengaluru">Bengaluru Tech Hub</option>
            </select>
          </div>

          {/* Firms Directory Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFirms.map((firm) => (
              <div
                key={firm.publicId}
                className="rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm p-5 flex flex-col justify-between hover:border-stone-400 hover:shadow-xs transition"
              >
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 mb-3">
                    <div className="flex items-start space-x-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-stone-900 to-stone-700 text-white flex items-center justify-center font-serif font-bold text-lg shadow-xs shrink-0">
                        {firm.name[0]}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="font-serif font-bold text-base text-stone-900 leading-snug">
                            {firm.name}
                          </h4>
                          {firm.verified && (
                            <span className="text-[10px] font-mono bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                              Verified LLP
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-stone-500 font-mono">
                          {firm.registrationNumber} • Est. {firm.founded}
                        </p>
                      </div>
                    </div>
                    {firm.reputationBadge && (
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-[var(--bg-cream-card)] border border-[var(--border-cream)] text-stone-700 whitespace-nowrap shrink-0 self-start">
                        {firm.reputationBadge}
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-stone-600 leading-relaxed font-sans mb-3 line-clamp-3">
                    {firm.description}
                  </p>

                  {/* Practice Areas */}
                  <div className="mb-3">
                    <p className="text-[10px] font-mono text-stone-400 uppercase tracking-wider mb-1.5">
                      Practice Bench Specializations
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {firm.practiceAreas.map((pa, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] font-sans px-2 py-0.5 rounded-md bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] text-stone-700"
                        >
                          {pa}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Roster & Location */}
                  <div className="p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] text-xs mb-4 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Chamber Locations</span>
                      <span className="font-semibold text-stone-800">{firm.city}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-stone-500">Counsel Team Size</span>
                      <span className="font-semibold text-stone-800">{firm.lawyersCount} Advocates</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-3">
                  <Link
                    to="/client/advocates"
                    className="text-xs font-semibold text-[var(--bg-primary)] hover:underline flex items-center space-x-1"
                  >
                    <span>Explore Firm Lawyers</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>

                  <button
                    type="button"
                    onClick={() => setFirmRequestModal(firm)}
                    className="px-3.5 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-xs transition shadow-xs cursor-pointer"
                  >
                    Request Consultation
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 4: MY APPOINTMENTS (/client/appointments)
      ====================================================================== */}
      {isAppointmentsView && (
        <>
          <PageHeader
            title="My Legal Consultations"
            subtitle="Full ledger of all pending, confirmed, completed, and archived appointments across independent advocates and law firms."
            badge="Consultations Ledger"
            breadcrumbs={['Client Console', 'My Appointments']}
            actions={
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'CARDS' ? 'TABLE' : 'CARDS')}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {viewMode === 'CARDS' ? (
                    <>
                      <List className="w-3.5 h-3.5" />
                      <span>Table View</span>
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Card View</span>
                    </>
                  )}
                </button>
                <Link
                  to="/client/advocates"
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] text-white hover:opacity-90 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Book New</span>
                </Link>
              </div>
            }
          />

          {/* Status Tabs */}
          <StatusTabs
            tabs={appointmentTabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />

          {/* Appointments List (Cards or Table) */}
          {filteredAppointments.length === 0 ? (
            <EmptyState
              title={`No ${activeTab.toLowerCase()} consultations`}
              description={`You have no legal appointments currently in ${activeTab.toLowerCase()} status.`}
              action={
                <Link
                  to="/client/advocates"
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] text-white text-xs font-semibold hover:opacity-90"
                >
                  Schedule Consultation
                </Link>
              }
            />
          ) : viewMode === 'CARDS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAppointments.map((apt) => (
                <AppointmentItem
                  key={apt.publicId}
                  appointment={apt}
                  viewMode="CARD"
                  role="CLIENT"
                  onJoinCall={handleJoinCall}
                  onPay={(a) => setPayingAppointmentModal(a)}
                  onCancel={(a) => setCancellingApt(a)}
                  onConfirmCompletion={handleConfirmCompletion}
                  onReportDispute={(a) => setDisputingApt(a)}
                  onOpenChat={(a) => {
                    if (a.lawyer) openChatWithUser(a.lawyer);
                    navigate('/messages');
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-stone-200 bg-[var(--bg-cream-card)] text-[10px] font-mono uppercase tracking-wider text-stone-500">
                      <th className="py-2.5 px-4">Ref ID</th>
                      <th className="py-2.5 px-4">Legal Counsel</th>
                      <th className="py-2.5 px-4">Practice Type</th>
                      <th className="py-2.5 px-4">Service</th>
                      <th className="py-2.5 px-4">Scheduled Date</th>
                      <th className="py-2.5 px-4">Mode</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAppointments.map((apt) => (
                      <AppointmentItem
                        key={apt.publicId}
                        appointment={apt}
                        viewMode="ROW"
                        role="CLIENT"
                        onJoinCall={handleJoinCall}
                        onPay={(a) => setPayingAppointmentModal(a)}
                        onCancel={(a) => setCancellingApt(a)}
                        onConfirmCompletion={handleConfirmCompletion}
                        onReportDispute={(a) => setDisputingApt(a)}
                        onOpenChat={(a) => {
                          if (a.lawyer) openChatWithUser(a.lawyer);
                          navigate('/messages');
                        }}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* =====================================================================
          MODAL: BOOK CONSULTATION MODAL (Independent vs Firm)
      ====================================================================== */}
      {selectedLawyerModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Request Legal Consultation
                </h3>
                <p className="text-xs text-stone-500">
                  With {selectedLawyerModal.fullName} ({selectedLawyerModal.barCouncilNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLawyerModal(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {requestSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                {requestSuccessMessage}
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBookConsultation(
                    selectedLawyerModal,
                    selectedLawyerModal.forcedChannel || 'INDEPENDENT'
                  );
                }}
                className="space-y-4"
              >
                {/* Channel Indicator */}
                <div className="p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)]">
                  <span className="text-[10px] font-mono text-stone-500 uppercase">
                    Authorized Booking Channel
                  </span>
                  <p className="font-semibold text-stone-900">
                    {selectedLawyerModal.forcedChannel === 'FIRM'
                      ? `Through Firm: ${selectedLawyerModal.firmAffiliation?.firmName || 'Lex Veritas Legal LLP'}`
                      : 'Independent Chamber Practice'}
                  </p>
                </div>

                {/* Consultation Mode */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1.5">
                    Select Consultation Mode
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedConsultMode('ONLINE')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedConsultMode === 'ONLINE'
                          ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] font-bold text-stone-900'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Video className="w-4 h-4 mb-1 text-emerald-700" />
                      <p className="text-xs">Encrypted WebRTC</p>
                      <p className="text-[10px] text-stone-500 font-normal">Remote video hearing</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedConsultMode('OFFLINE')}
                      className={`p-2.5 rounded-xl border text-left transition ${
                        selectedConsultMode === 'OFFLINE'
                          ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] font-bold text-stone-900'
                          : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Building className="w-4 h-4 mb-1 text-stone-700" />
                      <p className="text-xs">Chamber Visit</p>
                      <p className="text-[10px] text-stone-500 font-normal">In-person court chamber</p>
                    </button>
                  </div>
                </div>

                {/* Brief Notes */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Matter Description / Brief Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly state your legal issue, FIR number, contract type, or relief sought..."
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                  />
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    Protected by advocate-client legal privilege.
                  </p>
                </div>

                {/* Retainer Fee Disclosure */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--bg-cream-card)] border border-[var(--border-cream)]">
                  <span className="text-xs font-semibold text-stone-700">
                    Consultation Retainer
                  </span>
                  <span className="text-sm font-serif font-bold text-stone-900">
                    ₹{selectedLawyerModal.hourlyRate?.toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setSelectedLawyerModal(null)}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition shadow-xs cursor-pointer"
                  >
                    Submit Booking Request
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: REQUEST FIRM CONSULTATION MODAL
      ====================================================================== */}
      {firmRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Request Law Firm Consultation
                </h3>
                <p className="text-xs text-stone-500">
                  To {firmRequestModal.name} ({firmRequestModal.registrationNumber})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFirmRequestModal(null)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {requestSuccessMessage ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                {requestSuccessMessage}
              </div>
            ) : (
              <form onSubmit={handleFirmRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Select Practice Area
                  </label>
                  <select className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-800">
                    {firmRequestModal.practiceAreas.map((pa, i) => (
                      <option key={i} value={pa}>{pa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Matter Scope / Retainer Brief
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Describe your dispute, contract size, or regulatory matter for the managing partner to assign the lead advocate..."
                    value={consultationNotes}
                    onChange={(e) => setConsultationNotes(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setFirmRequestModal(null)}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition shadow-xs cursor-pointer"
                  >
                    Submit to Firm Intake
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: CANCEL APPOINTMENT WITH REASON
      ====================================================================== */}
      {cancellingApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-rose-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-rose-950 mb-1">
              Cancel Appointment Request
            </h3>
            <p className="text-stone-500 mb-4 font-sans">
              Are you sure you want to cancel your consultation with{' '}
              <span className="font-semibold text-stone-800">{cancellingApt.lawyer?.fullName}</span>?
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Cancellation Reason (Required)
                </label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule clash, matter settled amicably, rescheduling..."
                  required
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-rose-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setCancellingApt(null)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Keep Appointment
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer transition"
                >
                  Confirm Cancellation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* =====================================================================
          MODAL: AUTHORIZE RETAINER & 10% PLATFORM SERVICE FEE BREAKDOWN
      ====================================================================== */}
      {payingAppointmentModal && (() => {
        const advFee = payingAppointmentModal.service?.price || 500;
        const platformFee = Math.round(advFee * 0.1);
        const totalAmount = advFee + platformFee;

        return (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
              <div className="flex items-start justify-between pb-3 border-b border-stone-100 mb-4">
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Retainer Payment &amp; Platform Fee Breakout
                  </h3>
                  <p className="text-stone-500 text-[11px] font-sans">
                    Counsel accepted your request. Complete the payment to lock your consultation pass.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPayingAppointmentModal(null)}
                  className="p-1 rounded-lg hover:bg-stone-100 text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              {/* Consultation Summary */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] mb-4 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Legal Counsel:</span>
                  <span className="font-serif font-bold text-stone-900">
                    {payingAppointmentModal.lawyer?.fullName}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Practice Channel:</span>
                  <span className="font-medium text-stone-800">
                    {payingAppointmentModal.practiceType === 'FIRM'
                      ? `Through Firm: ${payingAppointmentModal.firmName || 'Lex Veritas Legal LLP'}`
                      : 'Independent Chamber Practice'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-stone-500">Consultation Service:</span>
                  <span className="font-medium text-stone-800">
                    {payingAppointmentModal.service?.title || 'Legal Advisory'}
                  </span>
                </div>
              </div>

              {/* Itemized Fee Breakdown (Client Only Visibility) */}
              <div className="p-4 rounded-xl border border-stone-200 bg-white mb-4 space-y-2.5">
                <p className="font-mono text-[10px] uppercase tracking-wider text-stone-400 font-bold mb-1">
                  Itemized Financial Breakdown
                </p>
                <div className="flex items-center justify-between text-stone-700">
                  <span>Advocate Consultation Retainer (Statutory Escrow)</span>
                  <span className="font-semibold text-stone-900">₹{advFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <div className="flex items-center space-x-1">
                    <span>Platform Service Fee (10%)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                      Platform Fee
                    </span>
                  </div>
                  <span className="font-semibold text-amber-900">₹{platformFee.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-stone-900">
                  <span>Total Amount Payable</span>
                  <span className="text-[var(--bg-primary)] text-base font-serif">
                    ₹{totalAmount.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Payment Source: Retainer Wallet */}
              <div className="space-y-2 mb-5">
                <label className="block text-[11px] font-semibold text-stone-800">
                  Payment Source
                </label>
                <div className="p-3.5 rounded-xl border border-[var(--bg-primary)] bg-[var(--bg-cream-card)] ring-1 ring-[var(--bg-primary)] flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-serif font-bold text-stone-900 text-xs">Retainer Wallet Balance</p>
                      <p className="text-[10px] text-stone-600 mt-0.5">
                        Available Balance: <strong className="font-semibold text-stone-900">₹{walletBalance.toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                    Direct Deduction
                  </span>
                </div>
                {walletBalance < totalAmount && (
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-[11px] flex items-center justify-between">
                    <span>Insufficient wallet balance (₹{walletBalance.toLocaleString('en-IN')}) for this consultation retainer.</span>
                    <Link to="/funds-billing" className="font-semibold underline hover:text-amber-800 ml-2 shrink-0">
                      Add Funds via Razorpay →
                    </Link>
                  </div>
                )}
              </div>

              {/* Modal Actions */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setPayingAppointmentModal(null)}
                  className="px-3.5 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={paymentProcessing || walletBalance < totalAmount}
                  onClick={handleConfirmPayment}
                  className="px-5 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 disabled:opacity-50 text-white font-semibold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                >
                  {paymentProcessing ? (
                    <span>Securing Escrow...</span>
                  ) : (
                    <span>Deduct ₹{totalAmount.toLocaleString('en-IN')} &amp; Confirm</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* =====================================================================
          MODAL: REPORT PROBLEM / NO-SHOW (ESCROW FREEZE & AUDIT)
      ====================================================================== */}
      {disputingApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-start space-x-3 pb-3 border-b border-stone-100">
              <span className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Report Consultation Problem &amp; Hold Escrow
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  If the lawyer did not join or could not deliver the consultation, freeze escrow release here.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Counsel:</span>
                <span className="font-semibold text-stone-900">{disputingApt.lawyer?.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Scheduled Service:</span>
                <span className="font-semibold text-stone-900">{disputingApt.service?.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-stone-200 pt-1">
                <span className="text-stone-500">Retainer Paid in Escrow:</span>
                <span className="font-serif font-bold text-emerald-800 text-sm">
                  ₹{(disputingApt.service?.price || 1500).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <form onSubmit={handleReportDisputeSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-semibold text-stone-800 mb-1.5">
                  What issue occurred? *
                </label>
                <div className="space-y-1.5">
                  {[
                    { id: 'LAWYER_NO_SHOW', label: 'Advocate did not show up / never joined the video room' },
                    { id: 'PREMATURE_EXIT', label: 'Meeting was cut short prematurely before consultation ended' },
                    { id: 'TECH_FAILURE', label: 'Severe technical / audio-video connection failure prevented meeting' },
                    { id: 'WRONG_ADVICE', label: 'Advocate refused service or conduct was unprofessional' },
                    { id: 'OTHER', label: 'Other consultation problem' },
                  ].map((opt) => (
                    <label
                      key={opt.id}
                      className={`flex items-center space-x-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition ${
                        disputeReason === opt.id
                          ? 'border-rose-400 bg-rose-50/60 font-semibold text-rose-950'
                          : 'border-stone-200 hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="disputeReason"
                        checked={disputeReason === opt.id}
                        onChange={() => setDisputeReason(opt.id)}
                        className="text-rose-600 focus:ring-rose-500"
                      />
                      <span>{opt.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-800 mb-1">
                  Additional Details / Statement of Facts *
                </label>
                <textarea
                  rows={3}
                  required
                  value={disputeNotes}
                  onChange={(e) => setDisputeNotes(e.target.value)}
                  placeholder="e.g. I waited in the encrypted meeting room for 15 minutes, but the advocate was absent. Attempted to reach counsel via message."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 text-[11px] leading-relaxed flex items-start space-x-2">
                <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <p>
                  <strong>Escrow Protection Activated:</strong> Submitting this dispute immediately pauses payout release. Our Platform Administrator will inspect WebRTC server connection logs and user presence timestamps within 24 hours to issue a full refund to your wallet or mediate.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setDisputingApt(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer transition shadow-xs flex items-center space-x-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Submit Dispute &amp; Freeze Escrow</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
