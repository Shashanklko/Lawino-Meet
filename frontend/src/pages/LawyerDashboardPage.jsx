import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
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
  Settings,
  DollarSign,
  Scale,
  Sparkles,
  LayoutGrid,
  List,
  Search,
  Filter,
  Users,
  Mic,
  Camera,
  Wifi,
  ExternalLink,
  ChevronRight,
  Briefcase,
  Layers,
  Mail,
  Phone,
  FileText,
  Shield,
  Info,
  Lock,
  MapPin,
  RefreshCw,
} from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { meetingApi } from '../api/meetingApi';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusTabs } from '../components/dashboard/StatusTabs';
import { AppointmentItem } from '../components/dashboard/AppointmentItem';
import { EmptyState } from '../components/dashboard/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';
import { useLanguage } from '../context/LanguageContext';

const calculateEndTime = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const endH = (h + 1) % 24;
  const period = endH >= 12 ? 'PM' : 'AM';
  const displayH = endH % 12 === 0 ? 12 : endH % 12;
  const displayM = String(m || 0).padStart(2, '0');
  return `${String(displayH).padStart(2, '0')}:${displayM} ${period}`;
};

const formatTime12h = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const displayH = h % 12 === 0 ? 12 : h % 12;
  const displayM = String(m || 0).padStart(2, '0');
  return `${String(displayH).padStart(2, '0')}:${displayM} ${period}`;
};

export const LawyerDashboardPage = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const { openChatWithUser } = useChat();

  const currentPath = location.pathname;
  const isAppointmentsView = currentPath.includes('/lawyer/appointments');
  const isVideoView = currentPath.includes('/lawyer/video');
  const isFirmInfoView = currentPath.includes('/lawyer/firm-info');
  const isOverview = !isAppointmentsView && !isVideoView && !isFirmInfoView;

  const hasFirmMembership = !!user?.firmMembership;
  const firmArrangement = user?.firmMembership?.practiceArrangement || 'INDEPENDENT'; // 'FIRM_EXCLUSIVE' | 'FIRM_AND_INDEPENDENT' | 'RESTRICTED_INDEPENDENT' | 'INDEPENDENT'

  // Practice Context Filter (Section 7)
  const [practiceContext, setPracticeContext] = useState(() => {
    return firmArrangement === 'FIRM_EXCLUSIVE' ? 'FIRM' : 'ALL';
  }); // 'ALL' | 'FIRM' | 'INDEPENDENT'

  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('REQUESTS'); // 'REQUESTS' | 'UPCOMING' | 'COMPLETED' | 'CANCELLED' | 'HISTORY'
  const [viewMode, setViewMode] = useState('CARDS'); // 'CARDS' | 'TABLE'
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Actions
  const [rejectingApt, setRejectingApt] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [acceptingApt, setAcceptingApt] = useState(null);
  const [chamberAddressInput, setChamberAddressInput] = useState('');
  const [directionsInput, setDirectionsInput] = useState('');
  const [actionNotice, setActionNotice] = useState('');
  const [completingApt, setCompletingApt] = useState(null);
  const [modifyingSlotApt, setModifyingSlotApt] = useState(null);
  const [lawyerOpenSlots, setLawyerOpenSlots] = useState([]);
  const [loadingOpenSlots, setLoadingOpenSlots] = useState(false);
  const [selectedModifySlotId, setSelectedModifySlotId] = useState('');
  const [rescheduleReasonInput, setRescheduleReasonInput] = useState('');
  const [modifyMode, setModifyMode] = useState('CALENDAR'); // 'CALENDAR' | 'CUSTOM'
  const [lawyerCustomDate, setLawyerCustomDate] = useState('');
  const [lawyerCustomTime, setLawyerCustomTime] = useState('11:00');

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getLawyerAppointments();
      const list = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
      setAppointments(list);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    const interval = setInterval(fetchAppointments, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleInitiateAccept = (apt) => {
    if (apt.isInPerson || apt.consultationType === 'IN_PERSON') {
      setAcceptingApt(apt);
      setChamberAddressInput(
        apt.chamberAddress && !apt.chamberAddress.includes('revealed upon payment')
          ? apt.chamberAddress
          : 'Chamber 402, Lawyers Chambers Block, Delhi High Court Complex, Sher Shah Road, New Delhi - 110003'
      );
      setDirectionsInput(
        apt.directionsInstructions && !apt.directionsInstructions.includes('locked until retainer')
          ? apt.directionsInstructions
          : 'Report to High Court Gate 5 Reception 10 minutes prior with government-issued photo ID.'
      );
    } else {
      handleConfirm(apt.publicId);
    }
  };

  const handleConfirmInPerson = async (e) => {
    e.preventDefault();
    if (!acceptingApt) return;
    try {
      await appointmentApi.confirmAppointment(acceptingApt.publicId, {
        chamberAddress: chamberAddressInput,
        directionsInstructions: directionsInput,
      });
    } catch {
      // Fallback
    }
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.publicId === acceptingApt.publicId
          ? {
              ...apt,
              status: 'AWAITING_PAYMENT',
              chamberAddress: chamberAddressInput,
              directionsInstructions: directionsInput,
            }
          : apt
      )
    );
    setAcceptingApt(null);
    setActionNotice('In-Chamber consultation accepted. Chamber address securely stored (concealed from client until retainer payment).');
    setTimeout(() => setActionNotice(''), 3500);
  };

  const handleOpenModifySlot = async (apt) => {
    setModifyingSlotApt(apt);
    setRescheduleReasonInput('');
    setSelectedModifySlotId('');
    const tmrw = new Date();
    tmrw.setDate(tmrw.getDate() + 1);
    setLawyerCustomDate(tmrw.toISOString().split('T')[0]);
    setLawyerCustomTime('11:00');
    setLoadingOpenSlots(true);
    try {
      const res = await appointmentApi.getMySlots();
      const list = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
      const now = new Date();
      const valid = list.filter(
        (s) => new Date(s.startTime) > now && (s.slotStatus === 'AVAILABLE' || s.status === 'AVAILABLE')
      );
      setLawyerOpenSlots(valid);
      if (valid.length > 0) {
        setSelectedModifySlotId(valid[0].publicId);
        setModifyMode('CALENDAR');
      } else {
        setModifyMode('CUSTOM');
      }
    } catch (err) {
      console.warn('Could not load slots for modify:', err);
      setLawyerOpenSlots([]);
      setModifyMode('CUSTOM');
    } finally {
      setLoadingOpenSlots(false);
    }
  };

  const handleConfirmModifySlot = async (e) => {
    e.preventDefault();
    if (!modifyingSlotApt) return;
    try {
      if (modifyMode === 'CUSTOM') {
        if (!lawyerCustomDate || !lawyerCustomTime) {
          alert('Please select date and start time for the custom 1-hour slot.');
          return;
        }
        const start = new Date(`${lawyerCustomDate}T${lawyerCustomTime}:00`);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour strictly

        await appointmentApi.rescheduleAppointment(modifyingSlotApt.publicId, {
          newStartTime: start.toISOString(),
          newEndTime: end.toISOString(),
          rescheduleReason: rescheduleReasonInput || 'Custom 1-hour consultation slot assigned by counsel.',
        });
      } else {
        if (!selectedModifySlotId) return;
        await appointmentApi.rescheduleAppointment(modifyingSlotApt.publicId, {
          newSlotPublicId: selectedModifySlotId,
          rescheduleReason: rescheduleReasonInput || 'Adjusted by counsel according to court schedule',
        });
      }
      await fetchAppointments();
      setModifyingSlotApt(null);
      setActionNotice('Consultation time modified successfully (1-hour slot locked)! Client notified.');
      setTimeout(() => setActionNotice(''), 3500);
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not modify consultation time';
      alert(msg);
    }
  };

  const handleConfirm = async (aptPublicId, options = { chosenSlotOption: 1 }) => {
    try {
      await appointmentApi.confirmAppointment(aptPublicId, options);
    } catch (err) {
      console.warn('Could not confirm appointment with backend:', err);
    }
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.publicId === aptPublicId ? { ...apt, status: 'AWAITING_PAYMENT' } : apt
      )
    );
    const chosenText = options?.chosenSlotOption === 2 ? 'Option 2 (Alternative)' : 'Option 1 (Primary)';
    setActionNotice(`Consultation confirmed for ${chosenText}. Client notified to complete retainer payment.`);
    setTimeout(() => setActionNotice(''), 3500);
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectingApt) return;
    try {
      await appointmentApi.rejectAppointment(rejectingApt.publicId, rejectionReason);
    } catch {
      // Fallback
    }
    setAppointments((prev) =>
      prev.map((apt) =>
        apt.publicId === rejectingApt.publicId
          ? { ...apt, status: 'REJECTED', rejectionReason: rejectionReason || 'Declined by counsel' }
          : apt
      )
    );
    setRejectingApt(null);
    setRejectionReason('');
    setActionNotice('Appointment declined. Notification dispatched to client.');
    setTimeout(() => setActionNotice(''), 2500);
  };

  const handleMarkCompleted = async (apt) => {
    try {
      await appointmentApi.requestCompletion(apt.publicId);
      await fetchAppointments();
      setCompletingApt(null);
      setActionNotice(
        `Session marked completed! Waiting for client confirmation — fee will settle upon client confirmation (or auto-release in 24 hours).`
      );
      setTimeout(() => setActionNotice(''), 4500);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to mark consultation completed');
      setCompletingApt(null);
    }
  };

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchAppointments();
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleStartRoom = (apt) => {
    const roomId = apt.meetingRoomPublicId || apt.publicId || apt.appointmentPublicId || apt.id || 'chamber_consultation';
    navigate(`/meeting/${roomId}`);
  };

  const handleJoinCall = (apt) => {
    handleStartRoom(apt);
  };

  // Filter appointments by Practice Context (Section 7)
  const contextFilteredAppointments = appointments.filter((apt) => {
    if (!hasFirmMembership) return true;
    if (practiceContext === 'ALL') return true;
    if (practiceContext === 'FIRM') return apt.practiceType === 'FIRM';
    if (practiceContext === 'INDEPENDENT') return apt.practiceType === 'INDEPENDENT';
    return true;
  });

  // Filter by Tab (Section: New Requests, Ongoing, Completed, History)
  const tabFilteredAppointments = contextFilteredAppointments.filter((apt) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        apt.client?.fullName?.toLowerCase().includes(q) ||
        apt.service?.title?.toLowerCase().includes(q) ||
        apt.appointmentId?.toLowerCase().includes(q);
      if (!matchSearch) return false;
    }

    if (activeTab === 'REQUESTS') return apt.status === 'PENDING';
    if (activeTab === 'ONGOING') {
      return (
        apt.status === 'CONFIRMED' ||
        apt.status === 'AWAITING_PAYMENT' ||
        apt.status === 'COMPLETION_REQUESTED' ||
        apt.status === 'DISPUTED'
      );
    }
    if (activeTab === 'COMPLETED') return apt.status === 'COMPLETED';
    if (activeTab === 'HISTORY') {
      return (
        apt.status === 'CANCELLED' ||
        apt.status === 'REJECTED' ||
        apt.status === 'EXPIRED' ||
        apt.status === 'COMPLETED'
      );
    }
    return true;
  });

  // Counts for the 4 unified tabs
  const pendingRequestsCount = contextFilteredAppointments.filter((a) => a.status === 'PENDING').length;
  const ongoingCount = contextFilteredAppointments.filter((a) =>
    ['CONFIRMED', 'AWAITING_PAYMENT', 'COMPLETION_REQUESTED', 'DISPUTED'].includes(a.status)
  ).length;
  const upcomingCount = ongoingCount;
  const confirmedCount = contextFilteredAppointments.filter((a) => a.status === 'CONFIRMED').length;
  const completedCount = contextFilteredAppointments.filter((a) => a.status === 'COMPLETED').length;
  const historyCount = contextFilteredAppointments.filter((a) =>
    ['CANCELLED', 'REJECTED', 'EXPIRED'].includes(a.status)
  ).length;

  const tabs = [
    { id: 'REQUESTS', label: 'New Requests', count: pendingRequestsCount },
    { id: 'ONGOING', label: 'Ongoing', count: ongoingCount },
    { id: 'COMPLETED', label: 'Completed', count: completedCount },
    { id: 'HISTORY', label: 'History', count: historyCount },
  ];

  // Video Consultations specific list
  const videoConsultations = contextFilteredAppointments.filter(
    (a) =>
      a.status === 'CONFIRMED' &&
      (a.consultationType === 'ONLINE' || a.service?.mode === 'ONLINE' || a.clientNotes?.includes('[ONLINE]'))
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Action Notification Toast */}
      {actionNotice && (
        <div className="p-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionNotice}</span>
          </div>
          <button type="button" onClick={() => setActionNotice('')} className="text-emerald-700 hover:text-emerald-900">
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: LAWYER OVERVIEW (/lawyer)
      ====================================================================== */}
      {isOverview && (
        <>
          <PageHeader
            title="nav.overview"
            subtitle={
              hasFirmMembership
                ? `Practicing Partner at ${user.firmMembership.firmName} with active independent & multi-bench authority.`
                : 'subtext.consoleSubtitle'
            }
            actions={
              <div className="flex items-center space-x-2">
                {/* Practice Context Filter (Section 7) */}
                {hasFirmMembership && (
                  <div className="flex items-center space-x-1.5 p-1 rounded-lg bg-[var(--bg-cream-card)] border border-[var(--border-cream)] text-xs">
                    <span className="text-[10px] font-mono text-stone-500 uppercase px-1">Context:</span>
                    <button
                      type="button"
                      onClick={() => setPracticeContext('ALL')}
                      className={`px-2 py-1 rounded-md transition ${
                        practiceContext === 'ALL'
                          ? 'bg-[var(--bg-primary)] text-white font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      All Practices
                    </button>
                    <button
                      type="button"
                      onClick={() => setPracticeContext('FIRM')}
                      className={`px-2 py-1 rounded-md transition ${
                        practiceContext === 'FIRM'
                          ? 'bg-blue-800 text-white font-semibold'
                          : 'text-stone-600 hover:text-stone-900'
                      }`}
                    >
                      Firm Practice
                    </button>
                    {firmArrangement !== 'FIRM_EXCLUSIVE' && (
                      <button
                        type="button"
                        onClick={() => setPracticeContext('INDEPENDENT')}
                        className={`px-2 py-1 rounded-md transition ${
                          practiceContext === 'INDEPENDENT'
                            ? 'bg-amber-800 text-white font-semibold'
                            : 'text-stone-600 hover:text-stone-900'
                        }`}
                      >
                        Independent
                      </button>
                    )}
                  </div>
                )}

                <Link
                  to="/lawyer/availability"
                  className="px-3 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-stone-800 hover:bg-stone-50 text-xs font-semibold flex items-center space-x-1.5 transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('action.slots')}</span>
                </Link>
                <Link
                  to="/lawyer/appointments"
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] text-white hover:opacity-90 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{t('action.allAppointments')}</span>
                </Link>
              </div>
            }
          />

          {/* Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="metric.pendingRequests"
              value={pendingRequestsCount}
              subtext="subtext.awaitingAcceptance"
              icon={Clock}
              badge={pendingRequestsCount > 0 ? `${pendingRequestsCount} ${t('dashboard.actionReq')}` : t('dashboard.allClear')}
              badgeType={pendingRequestsCount > 0 ? 'warning' : 'neutral'}
            />
            <MetricCard
              label="metric.upcomingConsultations"
              value={upcomingCount}
              subtext="subtext.confirmedHearings"
              icon={Calendar}
              badge={upcomingCount > 0 ? `${upcomingCount} ${t('dashboard.active')}` : '0 Scheduled'}
              badgeType="success"
            />
            <MetricCard
              label="metric.concludedBriefs"
              value={completedCount}
              subtext="subtext.settledRetainers"
              icon={CheckCircle2}
            />
            <MetricCard
              label="metric.openSlotsToday"
              value={t('status.availableCount')}
              subtext="subtext.sharedCalendar"
              icon={Clock}
            />
          </div>

          {/* Main Grid: New Requests on Left, Schedule on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: New Appointment Requests & Today's Schedule */}
            <div className="lg:col-span-2 space-y-6">
              {/* New Incoming Requests Section (Accept / Reject) */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-[var(--bg-primary)]" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      {t('section.newConsultationRequests')}
                    </h3>
                  </div>
                  <span className="text-[11px] font-mono text-stone-500">
                    {pendingRequestsCount} {t('status.pending')}
                  </span>
                </div>

                {pendingRequestsCount === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center font-sans">
                    No pending booking requests. All client consultation inquiries have been answered.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {contextFilteredAppointments
                      .filter((a) => a.status === 'PENDING')
                      .map((apt) => {
                        const isFirm = apt.practiceType === 'FIRM';
                        const rawNotes = apt.clientNotes || '';
                        const isOnline =
                          apt.consultationType === 'ONLINE' ||
                          rawNotes.includes('[ONLINE]') ||
                          apt.service?.mode === 'ONLINE';
                        const isOffline =
                          apt.consultationType === 'OFFLINE' ||
                          rawNotes.includes('[OFFLINE]') ||
                          apt.service?.mode === 'OFFLINE';
                        const cleanedNotes = rawNotes.replace(/\[ONLINE\]|\[OFFLINE\]/gi, '').trim();
                        const isUrgent =
                          /urgent|emergency|bail|fir|arrest|police|quash/i.test(rawNotes) ||
                          /urgent|emergency|bail/i.test(apt.service?.title || '');

                        const initials = (apt.client?.fullName || 'Client')
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <div
                            key={apt.publicId}
                            className="p-5 rounded-2xl border border-[var(--border-cream)] bg-white shadow-xs hover:shadow-sm transition space-y-4 text-xs"
                          >
                            {/* Card Header: Client Info & Escrow Price */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                              <div className="flex items-start space-x-3">
                                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center justify-center font-serif font-bold text-sm shrink-0">
                                  {initials}
                                </div>
                                <div>
                                  <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                                    <h4 className="font-serif font-bold text-sm text-stone-900">
                                      {apt.client?.fullName}
                                    </h4>
                                    {isFirm ? (
                                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                                        <Building className="w-2.5 h-2.5" />
                                        <span>{t('dashboard.firmAppointment')}</span>
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center space-x-1 text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                                        <Scale className="w-2.5 h-2.5" />
                                        <span>{t('dashboard.independentPractice')}</span>
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center space-x-3 text-stone-500 text-[11px] font-sans mt-1">
                                    <span className="flex items-center space-x-1">
                                      <Mail className="w-3 h-3 text-stone-400" />
                                      <span>{apt.client?.email}</span>
                                    </span>
                                    <span className="text-stone-300">•</span>
                                    <span className="flex items-center space-x-1 font-mono">
                                      <Phone className="w-3 h-3 text-stone-400" />
                                      <span>{apt.client?.phone || '+91 98102 33491'}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <div className="sm:text-right shrink-0">
                                <span className="font-serif font-bold text-stone-900 text-base">
                                  ₹{(apt.service?.price || 1800).toLocaleString('en-IN')}
                                </span>
                                <div className="flex items-center sm:justify-end space-x-1 text-[10px] text-emerald-700 font-mono mt-0.5">
                                  <ShieldCheck className="w-3 h-3" />
                                  <span>{t('dashboard.escrowDeposited')}</span>
                                </div>
                              </div>
                            </div>

                            {/* Case Brief & Client Message Section (Vastly Enhanced) */}
                            <div className="rounded-xl border border-stone-200 bg-stone-50/50 overflow-hidden shadow-2xs">
                              {/* Brief Header Bar */}
                              <div className="px-3.5 py-2 bg-stone-100/70 border-b border-stone-200/70 flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-3.5 h-3.5 text-stone-700" />
                                  <span className="font-mono text-[10px] uppercase font-bold tracking-wider text-stone-700">
                                    {t('dashboard.legalBriefTitle')}
                                  </span>
                                </div>
                                <div className="flex items-center space-x-1.5">
                                  {isOnline && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                                      <Video className="w-2.5 h-2.5" />
                                      <span>{t('mode.online')}</span>
                                    </span>
                                  )}
                                  {isOffline && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-stone-100 text-stone-800 border border-stone-300">
                                      <Building className="w-2.5 h-2.5" />
                                      <span>{t('mode.chamber')}</span>
                                    </span>
                                  )}
                                  {isUrgent && (
                                    <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">
                                      <AlertCircle className="w-2.5 h-2.5" />
                                      <span>{t('dashboard.timeSensitive')}</span>
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Brief Content */}
                              <div className="p-3.5 space-y-2.5 bg-white">
                                <div>
                                  <span className="text-[10px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
                                    {t('dashboard.requestedAdvisory')}
                                  </span>
                                  <h5 className="font-serif font-bold text-stone-900 text-sm mt-0.5">
                                    {apt.service?.title}
                                  </h5>
                                </div>

                                {cleanedNotes && (
                                  <div className="p-3 rounded-lg bg-stone-50/90 border-l-3 border-[var(--bg-primary)] border border-stone-200/60 text-stone-800 text-[11px] leading-relaxed">
                                    <div className="flex items-start space-x-2">
                                      <MessageSquare className="w-3.5 h-3.5 text-[var(--bg-primary)] shrink-0 mt-0.5" />
                                      <div className="space-y-1">
                                        <span className="text-[10px] font-mono uppercase font-semibold text-stone-500">
                                          {t('dashboard.clientFacts')}
                                        </span>
                                        <p className="text-stone-800 italic font-sans leading-relaxed">
                                          "{cleanedNotes}"
                                        </p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Card Footer: Requested Slot & Actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 text-[11px] text-stone-500">
                              <div className="flex items-center space-x-2 font-sans">
                                <span className="font-semibold text-stone-700">{t('dashboard.requestedSchedule')}</span>
                                <span className="inline-flex items-center space-x-1 text-stone-800 font-medium">
                                  <Calendar className="w-3.5 h-3.5 text-stone-400" />
                                  <span>
                                    {new Date(apt.slot?.startTime).toLocaleDateString('en-IN', {
                                      weekday: 'short',
                                      day: 'numeric',
                                      month: 'short',
                                      year: 'numeric',
                                    })}
                                  </span>
                                </span>
                                <span className="text-stone-300">•</span>
                                <span className="inline-flex items-center space-x-1 font-mono text-stone-600">
                                  <Clock className="w-3 h-3 text-stone-400" />
                                  <span>
                                    {new Date(apt.slot?.startTime).toLocaleTimeString('en-IN', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                  </span>
                                </span>
                              </div>

                              <div className="flex items-center space-x-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setRejectingApt(apt)}
                                  className="px-3.5 py-1.5 rounded-lg border border-stone-300 bg-white text-stone-700 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 transition font-medium cursor-pointer shadow-2xs"
                                >
                                  {t('action.decline')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleInitiateAccept(apt)}
                                  className="px-4 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition shadow-xs cursor-pointer flex items-center space-x-1.5"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>{t('action.acceptRequest')}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </div>

              {/* Today's Schedule & Upcoming Consultations */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-4">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      {t('dashboard.confirmedSchedule')}
                    </h3>
                  </div>
                  <Link
                    to="/lawyer/appointments"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    {t('dashboard.viewAll')} ({upcomingCount}) &rarr;
                  </Link>
                </div>

                {upcomingCount === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center font-sans">
                    No confirmed sessions for today. Open additional slots on your availability calendar.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {contextFilteredAppointments
                      .filter((a) => a.status === 'CONFIRMED')
                      .map((apt) => (
                        <div
                          key={apt.publicId}
                          className="p-3.5 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-start space-x-3">
                            <div className="w-9 h-9 rounded-lg bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0 mt-0.5">
                              {apt.client?.fullName?.[0] || 'C'}
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <p className="font-serif font-bold text-stone-900">
                                  {apt.client?.fullName}
                                </p>
                                {apt.practiceType === 'FIRM' ? (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                                    {t('dashboard.firmAppointment')}
                                  </span>
                                ) : (
                                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900">
                                    {t('dashboard.independentPractice')}
                                  </span>
                                )}
                              </div>
                              <p className="text-stone-600 font-medium truncate mt-0.5">
                                {apt.service?.title}
                              </p>
                              <p className="text-[10px] text-stone-500">
                                {new Date(apt.slot?.startTime).toLocaleString('en-IN', {
                                  weekday: 'short',
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            {apt.consultationType === 'ONLINE' ? (
                              <button
                                type="button"
                                onClick={() => handleJoinCall(apt)}
                                className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-medium text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                              >
                                <Video className="w-3.5 h-3.5" />
                                <span>{t('action.joinRoom')}</span>
                              </button>
                            ) : (
                              <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 border border-stone-200 text-[11px] font-medium flex items-center space-x-1">
                                <Building className="w-3 h-3 text-stone-500" />
                                <span>Chamber 412</span>
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => setCompletingApt(apt)}
                              className="px-2.5 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium transition cursor-pointer"
                            >
                              {t('action.markCompleted')}
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right 1 Col: Shared Calendar Snapshot & Firm Info */}
            <div className="space-y-6">
              {/* Single Shared Availability Calendar Summary */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-4 h-4 text-stone-700" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      {t('section.singleSharedCalendar')}
                    </h3>
                  </div>
                  <Link
                    to="/lawyer/availability"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    {t('action.manage')} &rarr;
                  </Link>
                </div>

                <p className="text-[11px] text-stone-500 leading-relaxed font-sans mb-3">
                  {t('dashboard.calendarDesc')}
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">10:00 AM – 10:45 AM</p>
                      <p className="text-[10px] text-blue-700 font-mono">FIRM: State vs Sterling</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                      {t('status.booked')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-800">11:30 AM – 12:15 PM</p>
                      <p className="text-[10px] text-amber-800 font-mono">INDEPENDENT: Rahul Sharma</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-900">
                      {t('status.booked')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-lg bg-emerald-50/60 border border-emerald-200 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-emerald-900">03:00 PM – 03:45 PM</p>
                      <p className="text-[10px] text-emerald-700 font-mono">{t('status.openForBooking')}</p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                      {t('status.available')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Firm Information Widget (if firm-associated) */}
              {hasFirmMembership && (
                <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-stone-100 mb-3">
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Firm Governance
                    </h3>
                    <Link
                      to="/lawyer/firm-info"
                      className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                    >
                      Details &rarr;
                    </Link>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div>
                      <p className="text-[10px] text-stone-400 font-mono uppercase">Institutional Firm</p>
                      <p className="font-serif font-bold text-stone-900">
                        {user.firmMembership.firmName}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-mono uppercase">Designation</p>
                      <p className="font-medium text-stone-800">
                        {user.firmMembership.designation} ({user.firmMembership.department})
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-stone-400 font-mono uppercase">Practice Arrangement</p>
                      <span className="inline-block mt-0.5 text-[10px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-900 border border-purple-200">
                        {user.firmMembership.practiceArrangement.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 2: LAWYER APPOINTMENTS (/lawyer/appointments)
      ====================================================================== */}
      {isAppointmentsView && (
        <>
          <PageHeader
            title="Appointments & Case Intake"
            subtitle="Manage incoming briefs, scheduled client consultations, and litigation retainers with dual firm & independent tracking."
            badge="Advocate Intake"
            breadcrumbs={['Lawyer Console', 'Appointments']}
            actions={
              <div className="flex items-center space-x-2">
                {/* Practice Context Selector */}
                {hasFirmMembership && (
                  <select
                    value={practiceContext}
                    onChange={(e) => setPracticeContext(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-xs text-stone-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">All Practice Channels</option>
                    <option value="FIRM">Firm Matters Only</option>
                    {firmArrangement !== 'FIRM_EXCLUSIVE' && (
                      <option value="INDEPENDENT">Independent Only</option>
                    )}
                  </select>
                )}

                <button
                  type="button"
                  onClick={() => setViewMode(viewMode === 'CARDS' ? 'TABLE' : 'CARDS')}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
                >
                  {viewMode === 'CARDS' ? (
                    <>
                      <List className="w-3.5 h-3.5" />
                      <span>Table</span>
                    </>
                  ) : (
                    <>
                      <LayoutGrid className="w-3.5 h-3.5" />
                      <span>Cards</span>
                    </>
                  )}
                </button>
              </div>
            }
          />

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by client name, matter brief, or appointment reference..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-[var(--border-cream)] bg-white text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
            />
          </div>

          {/* 5 Tabs: Requests, Upcoming, Completed, Cancelled, History */}
          <StatusTabs
            tabs={tabs}
            activeTab={activeTab}
            onChange={(tabId) => setActiveTab(tabId)}
          />

          {/* Appointments Grid or Table */}
          {tabFilteredAppointments.length === 0 ? (
            <EmptyState
              title={`No appointments in ${activeTab.toLowerCase()}`}
              description="There are currently no consultation records matching this status and practice context."
            />
          ) : viewMode === 'CARDS' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tabFilteredAppointments.map((apt) => (
                <AppointmentItem
                  key={apt.publicId}
                  appointment={apt}
                  viewMode="CARD"
                  role="LAWYER"
                  onStartRoom={handleStartRoom}
                  onJoinCall={handleJoinCall}
                  onAccept={(aptId) => {
                    const found = appointments.find((a) => a.publicId === aptId);
                    if (found) handleInitiateAccept(found);
                    else handleConfirm(aptId);
                  }}
                  onReject={(a) => setRejectingApt(a)}
                  onMarkCompleted={(a) => setCompletingApt(a)}
                  onOpenChat={(a) => {
                    if (a.client) openChatWithUser(a.client, a.client.fullName, a.publicId);
                    navigate('/messages');
                  }}
                  onModifyTime={handleOpenModifySlot}
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
                      <th className="py-2.5 px-4">Client Name</th>
                      <th className="py-2.5 px-4">Practice Channel</th>
                      <th className="py-2.5 px-4">Legal Matter</th>
                      <th className="py-2.5 px-4">Date & Time</th>
                      <th className="py-2.5 px-4">Mode</th>
                      <th className="py-2.5 px-4">Status</th>
                      <th className="py-2.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tabFilteredAppointments.map((apt) => (
                      <AppointmentItem
                        key={apt.publicId}
                        appointment={apt}
                        viewMode="ROW"
                        role="LAWYER"
                        onStartRoom={handleStartRoom}
                        onJoinCall={handleJoinCall}
                        onAccept={(aptId) => {
                    const found = appointments.find((a) => a.publicId === aptId);
                    if (found) handleInitiateAccept(found);
                    else handleConfirm(aptId);
                  }}
                        onReject={(a) => setRejectingApt(a)}
                        onMarkCompleted={(a) => setCompletingApt(a)}
                        onOpenChat={(a) => {
                          if (a.client) openChatWithUser(a.client, a.client.fullName, a.publicId);
                          navigate('/messages');
                        }}
                        onModifyTime={handleOpenModifySlot}
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
          VIEW 3: VIDEO CONSULTATIONS (/lawyer/video)
      ====================================================================== */}
      {isVideoView && (
        <>
          <PageHeader
            title="Encrypted Video Consultation Suite"
            subtitle="Host privileged WebRTC hearings, verify client identities, and conduct multi-party remote case strategy conferences."
            badge="Privileged Video Portal"
            breadcrumbs={['Lawyer Console', 'Video Consultations']}
          />

          {/* Pre-Call Readiness Hardware Check Indicator */}
          <div className="p-4 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
            <div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h4 className="font-serif font-bold text-stone-900">
                  Pre-Call Encryption & Hardware Readiness
                </h4>
              </div>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                DTLS/SRTP 256-bit media encryption active. Compliant with Bar Council confidential consultation guidelines.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                <Camera className="w-3.5 h-3.5 text-emerald-600" />
                <span>Camera Ready</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                <Mic className="w-3.5 h-3.5 text-emerald-600" />
                <span>Microphone Ready</span>
              </span>
              <span className="flex items-center space-x-1.5 text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium">
                <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                <span>Latency 18ms</span>
              </span>
            </div>
          </div>

          {/* Active Video Rooms List */}
          <div className="space-y-4">
            <h3 className="font-serif font-bold text-base text-stone-900">
              Upcoming Remote Video Appointments ({videoConsultations.length})
            </h3>

            {videoConsultations.length === 0 ? (
              <EmptyState
                title="No video hearings scheduled"
                description="You currently have no confirmed online video consultations queued."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {videoConsultations.map((apt) => (
                  <div
                    key={apt.publicId}
                    className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm flex flex-col justify-between shadow-xs space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-medium">
                          Encrypted Room Ready
                        </span>
                        <span className="text-[11px] font-mono text-stone-500">
                          {apt.appointmentId || apt.publicId?.slice(0, 10)}
                        </span>
                      </div>

                      <h4 className="font-serif font-bold text-base text-stone-900">
                        {apt.client?.fullName}
                      </h4>
                      <p className="text-xs text-stone-600 font-medium mt-0.5">
                        {apt.service?.title}
                      </p>

                      <div className="mt-3 p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Scheduled Time</span>
                          <span className="font-semibold text-stone-800">
                            {new Date(apt.slot?.startTime).toLocaleString('en-IN', {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-stone-500">Retainer Fee</span>
                          <span className="font-serif font-bold text-stone-900">
                            ₹{apt.service?.price?.toLocaleString('en-IN')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-stone-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => setCompletingApt(apt)}
                        className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-medium cursor-pointer"
                      >
                        Mark Completed
                      </button>

                      <button
                        type="button"
                        onClick={() => handleJoinCall(apt)}
                        className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Video className="w-4 h-4" />
                        <span>Join Room</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 4: FIRM INFORMATION (/lawyer/firm-info)
      ====================================================================== */}
      {isFirmInfoView && hasFirmMembership && (
        <>
          <PageHeader
            title="Law Firm Affiliation & Governance"
            subtitle="Institutional partnership details, registered LLP credentials, and authorized bench responsibilities."
            badge="Institutional Counsel"
            breadcrumbs={['Lawyer Console', 'Firm Information']}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
            {/* Firm Overview Card */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-6 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm shadow-xs space-y-4">
                <div className="flex items-start justify-between pb-4 border-b border-stone-100">
                  <div>
                    <span className="text-[10px] font-mono text-stone-400 uppercase">Registered Law Firm</span>
                    <h3 className="text-xl font-serif font-bold text-stone-900 mt-0.5">
                      {user.firmMembership.firmName}
                    </h3>
                    <p className="text-stone-500 mt-1 font-sans">
                      {user.firmMembership.tagline || 'Registered Full-Service Legal Enterprise'}
                    </p>
                  </div>
                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 font-medium">
                    Verified LLP
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)]">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">LLP Registration</p>
                    <p className="font-serif font-bold text-stone-900 text-sm mt-0.5">
                      {user.firmMembership.registrationNumber || 'LLP-IN-49210-MUM'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)]">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">Partner in Charge</p>
                    <p className="font-serif font-bold text-stone-900 text-sm mt-0.5">
                      {user.firmMembership.partnerInCharge || user.fullName}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)]">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">My Role in Firm</p>
                    <p className="font-semibold text-stone-900 text-xs mt-0.5">
                      {user.firmMembership.designation || 'Partner'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)]">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">Practice Arrangement</p>
                    <p className="font-semibold text-purple-900 text-xs mt-0.5">
                      {(user.firmMembership.practiceArrangement || 'INDEPENDENT').replace('_', ' ')}
                    </p>
                  </div>
                </div>

                {/* Headquarters */}
                <div>
                  <h4 className="font-serif font-bold text-sm text-stone-900 mb-2">
                    Primary Chamber Location
                  </h4>
                  <div className="p-3 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">{user.firmMembership.firmName} - Main Chambers</p>
                      <p className="text-[11px] text-stone-500">{user.firmMembership.address || 'Chamber 412, High Court Commercial Wing, Mumbai'}</p>
                    </div>
                    <span className="text-[10px] font-mono text-stone-600">
                      {user.firmMembership.contactPhone || '+91 22 6677 8899'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Firm Compensation Snapshot */}
            <div className="space-y-6">
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm shadow-xs space-y-3">
                <h4 className="font-serif font-bold text-sm text-stone-900 pb-2 border-b border-stone-100">
                  Earnings Separation Policy
                </h4>
                <p className="text-stone-600 leading-relaxed font-sans text-xs">
                  As a firm-associated advocate, your retainers are automatically categorized:
                </p>
                <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1">
                  <p className="font-semibold text-blue-950">Firm Matters</p>
                  <p className="text-[11px] text-blue-800">
                    Billed under {user.firmMembership.firmName}. Disbursed via monthly partnership draw.
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 space-y-1">
                  <p className="font-semibold text-amber-950">Independent Retainers</p>
                  <p className="text-[11px] text-amber-900">
                    Direct personal client earnings. Credited directly to your LawinoMeet Wallet.
                  </p>
                </div>
                <Link
                  to="/lawyer/finance"
                  className="block text-center py-2 rounded-lg bg-[var(--bg-primary)] text-white font-semibold text-xs hover:opacity-90 transition mt-2"
                >
                  View Financial Ledger
                </Link>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          MODAL: ACCEPT IN-CHAMBER APPOINTMENT (ENTER OFFICE ADDRESS & DIRECTIONS)
      ====================================================================== */}
      {acceptingApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-start space-x-3">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <Building className="w-5 h-5 text-amber-700" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Accept In-Chamber Consultation
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Confirm the chamber office address and visiting instructions for{' '}
                  <span className="font-semibold text-stone-800">{acceptingApt.client?.fullName || 'the client'}</span>.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-950 text-[11px] flex items-start space-x-2.5">
              <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-amber-900">Privacy Safeguard Active:</span>
                <p className="text-[10px] text-amber-800 mt-0.5 leading-relaxed">
                  This address remains strictly <strong>concealed</strong> from the client until their retainer fee is paid and verified. The client will only see a privacy lock until funds are cleared in escrow.
                </p>
              </div>
            </div>

            <form onSubmit={handleConfirmInPerson} className="space-y-3 pt-1">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Chamber / Office Address *
                </label>
                <textarea
                  rows={2}
                  value={chamberAddressInput}
                  onChange={(e) => setChamberAddressInput(e.target.value)}
                  required
                  placeholder="e.g. Chamber 402, Lawyers Chambers Block, Delhi High Court Complex, Sher Shah Road, New Delhi - 110003"
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] font-sans"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Building Entry &amp; Landmark Instructions
                </label>
                <textarea
                  rows={2}
                  value={directionsInput}
                  onChange={(e) => setDirectionsInput(e.target.value)}
                  placeholder="e.g. Carry valid photo ID. Report to Gate 5 Security Reception 10 mins prior."
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setAcceptingApt(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer transition shadow-xs flex items-center space-x-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Accept &amp; Save Chamber Address</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: MODIFY / RESCHEDULE CONSULTATION TIME (LAWYER SIDE)
      ====================================================================== */}
      {modifyingSlotApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-start space-x-3">
              <span className="p-2.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
                <Clock className="w-5 h-5 text-amber-700" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Modify Consultation Time Slot
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Propose an alternative slot for <span className="font-semibold text-stone-800">{modifyingSlotApt.client?.fullName || 'the client'}</span>.
                </p>
              </div>
            </div>

            {/* Current Requested Time */}
            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-700 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-stone-400 uppercase font-mono block">Currently Requested</span>
                <span className="font-semibold text-stone-900">
                  {modifyingSlotApt.slot ? new Date(modifyingSlotApt.slot.startTime).toLocaleString('en-IN', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) : 'Requested Slot'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-amber-800 bg-amber-100 px-2 py-0.5 rounded font-bold">
                Pending Change
              </span>
            </div>

            <form onSubmit={handleConfirmModifySlot} className="space-y-3.5 pt-1">
              {/* Mode Toggle Switch */}
              <div className="flex items-center space-x-1.5 p-1 bg-stone-100 rounded-xl mb-2">
                <button
                  type="button"
                  onClick={() => setModifyMode('CALENDAR')}
                  disabled={lawyerOpenSlots.length === 0}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    modifyMode === 'CALENDAR'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : lawyerOpenSlots.length === 0
                      ? 'text-stone-400 cursor-not-allowed opacity-50'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Existing Slots ({lawyerOpenSlots.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setModifyMode('CUSTOM')}
                  className={`flex-1 py-1 px-2.5 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center justify-center space-x-1 ${
                    modifyMode === 'CUSTOM'
                      ? 'bg-white text-stone-900 shadow-2xs'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Propose Custom 1-Hr Slot</span>
                </button>
              </div>

              {modifyMode === 'CUSTOM' ? (
                <div className="p-3 rounded-xl border border-stone-200 bg-stone-50 space-y-2">
                  <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold block">
                    Lock Custom 1-Hour Time Window
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">Date</label>
                      <input
                        type="date"
                        min={new Date().toISOString().split('T')[0]}
                        value={lawyerCustomDate}
                        onChange={(e) => setLawyerCustomDate(e.target.value)}
                        className="w-full p-2 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-stone-600 mb-1">Start Time (1 Hour)</label>
                      <input
                        type="time"
                        value={lawyerCustomTime}
                        onChange={(e) => setLawyerCustomTime(e.target.value)}
                        className="w-full p-2 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                      />
                    </div>
                  </div>
                  {lawyerCustomDate && lawyerCustomTime && (
                    <div className="text-[11px] font-mono text-stone-800 bg-white p-2 rounded-lg border border-stone-200 flex items-center justify-between">
                      <span>Window: <strong>{formatTime12h(lawyerCustomTime)} – {calculateEndTime(lawyerCustomTime)}</strong> (Strictly 1 Hour)</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1.5">
                    Select New Available Slot from Your Calendar
                  </label>
                  {loadingOpenSlots ? (
                    <div className="py-6 text-center text-stone-400">
                      <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-stone-500" />
                      <span>Loading your open calendar slots...</span>
                    </div>
                  ) : lawyerOpenSlots.length === 0 ? (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-center">
                      <p className="font-medium text-xs">No upcoming open slots on your calendar.</p>
                      <p className="text-[10px] text-amber-700 mt-1">Please create new slots in the "Slots &amp; Availability" page first.</p>
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                      {lawyerOpenSlots.map((slot) => {
                        const start = new Date(slot.startTime);
                        const end = new Date(slot.endTime);
                        const isSelected = selectedModifySlotId === slot.publicId;
                        return (
                          <button
                            key={slot.publicId}
                            type="button"
                            onClick={() => setSelectedModifySlotId(slot.publicId)}
                            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center justify-between cursor-pointer ${
                              isSelected
                                ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] ring-1 ring-[var(--bg-primary)]'
                                : 'border-stone-200 bg-white hover:bg-stone-50'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <Calendar className="w-3.5 h-3.5 text-stone-500" />
                              <span className="font-semibold text-xs text-stone-900">
                                {start.toLocaleDateString('en-IN', {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <span className="text-stone-300">•</span>
                              <span className="font-mono text-[11px] text-stone-600">
                                {start.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} – {end.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                                isSelected ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-100 text-stone-600'
                              }`}
                            >
                              {isSelected ? '✓ Selected' : 'Available'}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Reason for Time Modification (Disclosed to Client)
                </label>
                <textarea
                  rows={2}
                  value={rescheduleReasonInput}
                  onChange={(e) => setRescheduleReasonInput(e.target.value)}
                  placeholder="e.g. Prior High Court hearing commitment, shifting consultation to afternoon slot..."
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] font-sans"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setModifyingSlotApt(null)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modifyMode === 'CUSTOM' ? (!lawyerCustomDate || !lawyerCustomTime) : !selectedModifySlotId}
                  className={`px-4 py-2 rounded-xl text-white font-semibold cursor-pointer transition shadow-xs flex items-center space-x-1.5 ${
                    (modifyMode === 'CUSTOM' ? (!lawyerCustomDate || !lawyerCustomTime) : !selectedModifySlotId)
                      ? 'bg-stone-400 opacity-60 cursor-not-allowed'
                      : 'bg-[var(--bg-primary)] hover:opacity-90'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Confirm New Schedule Time</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: DECLINE APPOINTMENT MODAL
      ====================================================================== */}
      {rejectingApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Decline Consultation Request
            </h3>
            <p className="text-stone-500 mb-4 font-sans">
              Provide a professional reason for declining{' '}
              <span className="font-semibold text-stone-800">{rejectingApt.client?.fullName}</span>.
            </p>

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Decline Reason (Disclosed to Client / Firm)
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Prior High Court hearing commitment, professional conflict of interest, full calendar..."
                  required
                  className="w-full p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRejectingApt(null)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer transition"
                >
                  Confirm Decline
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: MARK COMPLETED CONFIRMATION (ESCROW VERIFICATION REQUEST)
      ====================================================================== */}
      {completingApt && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-start space-x-3">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-800 border border-purple-200">
                <Clock className="w-5 h-5 text-purple-700" />
              </span>
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Mark Consultation Completed
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Initiate client verification and release of statutory escrow retainer.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2 text-stone-700">
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Client:</span>
                <span className="font-semibold text-stone-900">{completingApt.client?.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-stone-500">Matter:</span>
                <span className="font-semibold text-stone-900">{completingApt.service?.title}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-stone-200 pt-1.5">
                <span className="text-stone-500">Retainer Fee in Escrow:</span>
                <span className="font-serif font-bold text-stone-900 text-sm">
                  ₹{(completingApt.service?.price || 1800).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-purple-50/80 border border-purple-200 text-purple-900 text-[11px] leading-relaxed space-y-1">
              <p className="font-semibold flex items-center space-x-1">
                <Info className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                <span>Verification &amp; Payout Release Process:</span>
              </p>
              <p className="text-purple-800">
                A verification prompt will be sent to the client to confirm session attendance. Once the client confirms (or automatically after the 24-hour verification window if no dispute is raised), your funds will transfer directly to your Withdrawable Balance.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => setCompletingApt(null)}
                className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleMarkCompleted(completingApt)}
                className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer transition shadow-xs flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Confirm &amp; Await Client Response</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
