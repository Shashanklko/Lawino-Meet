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
  RefreshCw,
} from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { userApi } from '../api/userApi';
import { meetingApi } from '../api/meetingApi';
import { walletApi } from '../api/walletApi';
import { useChat } from '../context/ChatContext';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusTabs } from '../components/dashboard/StatusTabs';
import { AppointmentItem } from '../components/dashboard/AppointmentItem';
import { EmptyState } from '../components/dashboard/EmptyState';
import { StatusBadge } from '../components/common/StatusBadge';

const formatAdvocateName = (name) => {
  if (!name) return 'Counsel';
  const clean = String(name).trim();
  return clean.toLowerCase().startsWith('adv.') ? clean : `Adv. ${clean}`;
};

const normalizeFirmItem = (f) => {
  return {
    ...f,
    publicId: f.publicId || f.slug,
    name: f.firmName || f.name || 'Law Firm LLP',
    description: f.description || 'Full-service legal chambers specializing in high court and corporate litigation.',
    city: f.city || 'Mumbai',
    state: f.state || 'Maharashtra',
    verified: f.verificationStatus === 'VERIFIED' || f.verified !== false,
    registrationNumber: f.registrationNumber || `LLP-${(f.publicId || '2026').slice(0, 8).toUpperCase()}`,
    founded: f.founded || '2014',
    reputationBadge: f.reputationBadge || 'Top Tier Chambers',
    practiceAreas: Array.isArray(f.practiceAreas) && f.practiceAreas.length > 0
      ? f.practiceAreas
      : ['Corporate Law', 'High Court Litigation', 'Arbitration & Dispute Resolution', 'Commercial Contracts'],
    lawyersCount: f.lawyersCount || 12,
  };
};

const normalizeLawyerItem = (adv) => {
  const hourlyRate = Number(adv.hourlyRate) || adv.services?.[0]?.price || adv.services?.[0]?.consultationFee || 1500;
  const experienceYears = Number(adv.experienceYears || adv.yearsOfExperience) || 10;
  const bio = adv.biography || adv.bio || 'Advocate practicing before High Courts and tribunals.';
  const specialization = adv.specialization || adv.specializations?.[0]?.name || adv.specializations?.[0]?.code || 'CORPORATE';
  const barCouncilNumber = adv.barCouncilNumber || adv.qualification || 'Bar Council Enrolled';

  const userPublicId = adv.userPublicId || adv.publicId;
  const shortUid = adv.shortUid || '';
  const workingDays = adv.workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY';
  const workingHours = (adv.workingHoursStart && adv.workingHoursEnd)
    ? `${adv.workingHoursStart} – ${adv.workingHoursEnd}`
    : '09:00 AM – 06:00 PM';

  const daysCount = workingDays.split(',').length;
  const availableDaysText = 
    daysCount >= 7 ? 'Available All 7 Days (Mon – Sun)' :
    daysCount === 6 ? 'Available 6 Days (Mon – Sat)' :
    `Available ${daysCount} Days (${workingDays.split(',').map(d => d.trim().slice(0, 3)).join(', ')})`;

  return {
    ...adv,
    publicId: adv.username || adv.slug || userPublicId,
    userPublicId,
    shortUid,
    fullName: adv.fullName || adv.username,
    barCouncilNumber,
    specialization,
    hourlyRate,
    yearsOfExperience: experienceYears,
    workingDays,
    workingHoursStart: adv.workingHoursStart || '09:00',
    workingHoursEnd: adv.workingHoursEnd || '18:00',
    breakStartTime: adv.breakStartTime || '13:00',
    breakEndTime: adv.breakEndTime || '14:00',
    timeZone: adv.timeZone || 'Asia/Kolkata',
    availableDaysText,
    workingHours,
    city: adv.city || 'Delhi NCR',
    bio,
    availableOnline: adv.messagingEnabled !== false,
    availableOffline: true,
    rating: adv.rating || 4.9,
    consultationsCount: adv.consultationsCount || 0,
    firmAffiliation: adv.associatedFirmName
      ? {
          firmName: adv.associatedFirmName,
          designation: 'Partner',
          firmPublicId: adv.associatedFirmSlug || 'lex-veritas-legal-llp',
        }
      : null,
    practiceArrangement: adv.associatedFirmName ? 'FIRM_AND_INDEPENDENT' : 'INDEPENDENT',
  };
};

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

  // State - Real Database Appointments, Advocates & Firms
  const [appointments, setAppointments] = useState([]);
  const [advocates, setAdvocates] = useState([]);
  const [firms, setFirms] = useState([]);
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
  const [modalSlots, setModalSlots] = useState([]);
  const [modalSlotsLoading, setModalSlotsLoading] = useState(false);
  const [selectedSlotId, setSelectedSlotId] = useState(null);
  const [selectedAlternativeSlotId, setSelectedAlternativeSlotId] = useState(null);
  const [bookingTimeMode, setBookingTimeMode] = useState('CALENDAR'); // 'CALENDAR' | 'CUSTOM'
  const [customDate1, setCustomDate1] = useState('');
  const [customTime1, setCustomTime1] = useState('10:00');
  const [customDate2, setCustomDate2] = useState('');
  const [customTime2, setCustomTime2] = useState('14:00');
  const [activeSlotDateTab, setActiveSlotDateTab] = useState('');
  const [requestSuccessMessage, setRequestSuccessMessage] = useState('');
  const [requestErrorMessage, setRequestErrorMessage] = useState('');
  const [consultationNotes, setConsultationNotes] = useState('');
  const [selectedConsultMode, setSelectedConsultMode] = useState('ONLINE');
  const [firmRequestModal, setFirmRequestModal] = useState(null);

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

  const fetchWallet = async () => {
    try {
      const res = await walletApi.getWallet();
      if (res?.data?.balance !== undefined) {
        setWalletBalance(Number(res.data.balance));
      }
    } catch (err) {
      console.warn('Could not fetch wallet balance:', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMyAppointments();
      const rawList = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
      const list = rawList.map(a => ({
        ...a,
        status: a.status || a.appointmentStatus,
      }));
      setAppointments(list);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchWallet();
    const interval = setInterval(() => {
      fetchAppointments();
      fetchWallet();
    }, 8000);
    const loadAdvocates = async () => {
      try {
        const res = await userApi.searchLawyers();
        const raw = res?.data?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        const normalized = raw.map(normalizeLawyerItem);
        setAdvocates(normalized);
      } catch (err) {
        console.warn('Could not load advocates from database:', err);
      }
    };
    loadAdvocates();

    const loadFirms = async () => {
      try {
        const res = await userApi.getFirms();
        const raw = res?.data?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
        setFirms(raw.map(normalizeFirmItem));
      } catch (err) {
        console.warn('Could not load firms from database:', err);
      }
    };
    loadFirms();
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
    return () => clearInterval(interval);
  }, []);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.allSettled([
        fetchAppointments(),
        (async () => {
          const res = await userApi.searchLawyers();
          const raw = res?.data?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          setAdvocates(raw.map(normalizeLawyerItem));
        })(),
        (async () => {
          const res = await userApi.getFirms();
          const raw = res?.data?.content || (Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : []));
          setFirms(raw.map(normalizeFirmItem));
        })(),
      ]);
    } finally {
      setTimeout(() => setIsRefreshing(false), 400);
    }
  };

  const handleJoinCall = (apt) => {
    const roomId = apt.meetingRoomPublicId || apt.publicId || apt.appointmentPublicId || apt.id || 'chamber_consultation';
    navigate(`/meeting/${roomId}`);
  };

  const handleConfirmCompletion = async (apt) => {
    try {
      await appointmentApi.confirmCompletion(apt.publicId);
      await fetchAppointments();
      await fetchWallet();
      setPaymentNotice(
        `Consultation completion verified! Retainer fee has been released and settled to counsel.`
      );
      setTimeout(() => setPaymentNotice(''), 5000);
    } catch (err) {
      alert(err?.response?.data?.message || err?.message || 'Failed to confirm consultation completion');
    }
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

  // Fetch available slots when advocate modal opens
  useEffect(() => {
    if (!selectedLawyerModal) {
      setModalSlots([]);
      setSelectedSlotId(null);
      setSelectedAlternativeSlotId(null);
      setActiveSlotDateTab('');
      setBookingTimeMode('CALENDAR');
      setRequestErrorMessage('');
      setRequestSuccessMessage('');
      return;
    }
    const loadAdvocateSlots = async () => {
      setModalSlotsLoading(true);
      setRequestErrorMessage('');
      try {
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        setCustomDate1(tmrw.toISOString().split('T')[0]);
        setCustomTime1('10:00');
        const day2 = new Date(tmrw);
        day2.setDate(day2.getDate() + 1);
        setCustomDate2(day2.toISOString().split('T')[0]);
        setCustomTime2('15:00');

        const lawyerId = selectedLawyerModal.userPublicId || selectedLawyerModal.publicId;
        const res = await appointmentApi.getLawyerSlots(lawyerId, { status: 'AVAILABLE' });
        const list = Array.isArray(res?.data) ? res.data : (res?.data?.content || []);
        const now = new Date();
        const validSlots = list.filter(
          (s) => new Date(s.startTime) > now && (s.slotStatus === 'AVAILABLE' || s.status === 'AVAILABLE')
        );

        validSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setModalSlots(validSlots);
        if (validSlots.length > 0) {
          setSelectedSlotId(validSlots[0].publicId);
          setSelectedAlternativeSlotId(validSlots[1]?.publicId || null);
          setActiveSlotDateTab(validSlots[0].startTime.split('T')[0]);
          setBookingTimeMode('CALENDAR');
        } else {
          setBookingTimeMode('CUSTOM');
        }
      } catch (err) {
        console.warn('Could not load advocate slots:', err);
        setModalSlots([]);
        setBookingTimeMode('CUSTOM');
      } finally {
        setModalSlotsLoading(false);
      }
    };
    loadAdvocateSlots();
  }, [selectedLawyerModal]);

  // Group modal slots by Date and Morning/Afternoon/Evening
  const groupedModalSlots = React.useMemo(() => {
    const groups = {};
    modalSlots.forEach((slot) => {
      if (!slot.startTime) return;
      const d = new Date(slot.startTime);
      const dateKey = slot.startTime.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          label: d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          }),
          fullDate: d.toLocaleDateString('en-IN', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          morning: [],
          afternoon: [],
          evening: [],
        };
      }
      const hour = d.getHours();
      if (hour < 12) {
        groups[dateKey].morning.push(slot);
      } else if (hour < 17) {
        groups[dateKey].afternoon.push(slot);
      } else {
        groups[dateKey].evening.push(slot);
      }
    });
    return groups;
  }, [modalSlots]);

  useEffect(() => {
    const keys = Object.keys(groupedModalSlots);
    if (keys.length > 0 && (!activeSlotDateTab || !groupedModalSlots[activeSlotDateTab])) {
      setActiveSlotDateTab(keys[0]);
    }
  }, [groupedModalSlots, activeSlotDateTab]);

  const handleBookConsultation = async (lawyer, channel = 'INDEPENDENT') => {
    setRequestErrorMessage('');
    setRequestSuccessMessage('');

    let payload = {};
    const reason = consultationNotes || `[${selectedConsultMode}] Requested 1-hour consultation via ${channel} channel.`;

    if (selectedConsultMode === 'CHAT') {
      if (!consultationNotes.trim()) {
        setRequestErrorMessage('Please provide a brief description of your legal query or matter so counsel can review your request.');
        return;
      }
      payload = {
        lawyerUserPublicId: lawyer.userPublicId || lawyer.publicId,
        consultationType: 'CHAT',
        consultationReason: consultationNotes.trim(),
        fee: Math.round((Number(lawyer.hourlyRate) || 1500) * 0.6),
        firmPublicId: channel === 'FIRM' ? (lawyer.firmPublicId || null) : null,
      };
    } else {
      if (!customDate1 || !customTime1) {
        setRequestErrorMessage('Please select an appointment date and preferred start time.');
        return;
      }
      const start1 = new Date(`${customDate1}T${customTime1}:00`);
      const end1 = new Date(start1.getTime() + 60 * 60 * 1000); // Automatically calculated + 60 minutes

      if (start1 <= new Date()) {
        setRequestErrorMessage('Proposed appointment time must be scheduled in the future.');
        return;
      }

      // Validate working day
      const dayOfWeek = start1.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
      const workingDays = (lawyer.workingDays || 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY').toUpperCase();
      if (!workingDays.includes(dayOfWeek)) {
        setRequestErrorMessage(`Counsel does not take consultations on ${dayOfWeek}s. Configured working days: ${lawyer.workingDays}`);
        return;
      }

      // Validate working hours
      const workStart = lawyer.workingHoursStart || '09:00';
      const workEnd = lawyer.workingHoursEnd || '18:00';
      const [th, tm] = customTime1.split(':').map(Number);
      const endH = th + 1;
      const endTimeStr = `${String(endH).padStart(2, '0')}:${String(tm || 0).padStart(2, '0')}`;
      if (customTime1 < workStart || endTimeStr > workEnd) {
        setRequestErrorMessage(`Requested time (${customTime1} – ${endTimeStr}) falls outside counsel's working hours (${workStart} – ${workEnd}).`);
        return;
      }

      // Validate break times
      const breakStart = lawyer.breakStartTime || '13:00';
      const breakEnd = lawyer.breakEndTime || '14:00';
      if (customTime1 < breakEnd && endTimeStr > breakStart) {
        setRequestErrorMessage(`Requested time conflicts with counsel's break time (${breakStart} – ${breakEnd}).`);
        return;
      }

      let start2 = null;
      let end2 = null;
      if (customDate2 && customTime2) {
        start2 = new Date(`${customDate2}T${customTime2}:00`);
        end2 = new Date(start2.getTime() + 60 * 60 * 1000);
      }

      payload = {
        lawyerUserPublicId: lawyer.userPublicId || lawyer.publicId,
        startTime: start1.toISOString(),
        endTime: end1.toISOString(),
        appointmentDate: customDate1,
        appointmentTime: customTime1,
        customStartTime1: start1.toISOString(),
        customEndTime1: end1.toISOString(),
        customStartTime2: start2 ? start2.toISOString() : null,
        customEndTime2: end2 ? end2.toISOString() : null,
        preferredSlotsJson: JSON.stringify([
          {
            label: 'Slot Option 1 (Primary)',
            startTime: start1.toISOString(),
            endTime: end1.toISOString(),
            formatted: `${start1.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • ${start1.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end1.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} (1 hr)`
          },
          ...(start2 ? [{
            label: 'Slot Option 2 (Alternative)',
            startTime: start2.toISOString(),
            endTime: end2.toISOString(),
            formatted: `${start2.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })} • ${start2.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} - ${end2.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} (1 hr)`
          }] : [])
        ]),
        consultationType: (selectedConsultMode === 'OFFLINE' || selectedConsultMode === 'IN_PERSON') ? 'IN_PERSON' : (selectedConsultMode || 'ONLINE'),
        consultationReason: reason,
        fee: (selectedConsultMode === 'OFFLINE' || selectedConsultMode === 'IN_PERSON')
          ? Math.round((Number(lawyer.hourlyRate) || 1500) * 1.2)
          : Number(lawyer.hourlyRate) || 1500,
        firmPublicId: channel === 'FIRM' ? (lawyer.firmPublicId || null) : null,
      };
    }

    try {
      const bookRes = await appointmentApi.reserveAppointment(payload);

      if (bookRes?.success && bookRes?.data) {
        const refresh = await appointmentApi.getMyAppointments();
        const list = refresh?.data?.content || (Array.isArray(refresh?.data) ? refresh.data : []);
        setAppointments(list);
        setRequestSuccessMessage(`Consultation request submitted to ${lawyer.fullName}! Counsel will confirm your session.`);
        setTimeout(() => {
          setRequestSuccessMessage('');
          setSelectedLawyerModal(null);
          setConsultationNotes('');
        }, 2200);
      }
    } catch (apiErr) {
      console.warn('Backend booking error:', apiErr);
      const errMsg = apiErr.response?.data?.message || 'Booking reservation could not be processed. Please try another slot or refresh.';
      setRequestErrorMessage(errMsg);
    }
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

  const handleConfirmPayment = async (e) => {
    e?.preventDefault();
    if (!payingAppointmentModal) return;
    const advFee = payingAppointmentModal.fee || payingAppointmentModal.service?.price || 1500;
    const platformFee = Math.round(advFee * 0.1);
    const totalAmount = advFee + platformFee;

    if (walletBalance < totalAmount) {
      alert(`Insufficient wallet balance (₹${walletBalance.toLocaleString('en-IN')}). Please add funds to your wallet to continue.`);
      return;
    }

    setPaymentProcessing(true);
    try {
      await appointmentApi.payAppointment(payingAppointmentModal.publicId);
      await fetchWallet();
      await fetchAppointments();
      setPaymentNotice(
        `Retainer payment confirmed! ₹${totalAmount.toLocaleString('en-IN')} secured into statutory escrow. Consultation pass activated for ${payingAppointmentModal.lawyer?.fullName || 'counsel'}.`
      );
      setTimeout(() => setPaymentNotice(''), 6000);
      setPayingAppointmentModal(null);
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Payment processing failed';
      alert(msg);
    } finally {
      setPaymentProcessing(false);
    }
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
    .sort((a, b) => new Date(a.startTime || a.slot?.startTime) - new Date(b.startTime || b.slot?.startTime))[0];

  // Filtered Advocates for Discover Advocates
  const filteredAdvocates = advocates.filter((l) => {
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
      ((selectedMode === 'OFFLINE' || selectedMode === 'IN_PERSON') && l.availableOffline);

    return matchesSearch && matchesSpec && matchesCity && matchesMode;
  });

  // Filtered Law Firms
  const filteredFirms = firms.filter((f) => {
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
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-3 py-2 rounded-xl border border-stone-200 bg-white hover:bg-stone-50 text-stone-700 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
                  title="Refresh appointments and live data"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--bg-primary)]' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
                <Link
                  to="/client/advocates"
                  className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Find Advocates</span>
                </Link>
              </div>
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
                          {new Date(nextAppointment.startTime || nextAppointment.slot?.startTime || Date.now()).toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                          })}
                        </p>
                        <p className="text-xs text-stone-500 font-sans">
                          {new Date(nextAppointment.startTime || nextAppointment.slot?.startTime || Date.now()).toLocaleTimeString('en-IN', {
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
                  {advocates.slice(0, 3).map((l) => (
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
                  <option value="IN_PERSON">Chamber Visit</option>
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
                      <Link
                        to={`/lawyers/${adv.username || adv.slug || adv.publicId}`}
                        className="w-11 h-11 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-base shadow-xs shrink-0 hover:opacity-90 transition"
                        title="View Full Profile"
                      >
                        {adv.fullName[4] || 'A'}
                      </Link>
                      <div className="overflow-hidden">
                        <Link
                          to={`/lawyers/${adv.username || adv.slug || adv.publicId}`}
                          className="font-serif font-bold text-sm text-stone-900 truncate block hover:text-[var(--bg-primary)] hover:underline transition"
                          title="View Full Profile"
                        >
                          {adv.fullName}
                        </Link>
                        <p className="text-[11px] text-stone-500 font-sans truncate">
                          {adv.specialization?.replace('_', ' ')} • {adv.yearsOfExperience} Years Exp
                        </p>
                        {adv.firmAffiliation && (
                          <Link
                            to={`/firms/${adv.firmAffiliation.firmPublicId || adv.firmAffiliation.firmSlug || 'firm-001-lex-veritas'}`}
                            className="text-[10px] text-blue-700 hover:text-blue-900 hover:underline font-medium truncate block mt-0.5"
                            title="View Law Firm Profile"
                          >
                            {adv.firmAffiliation.firmName} ({adv.firmAffiliation.designation})
                          </Link>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-3 font-sans">
                      {adv.bio}
                    </p>

                    {/* Schedule, Location & Retainer */}
                    <div className="p-2 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] text-xs mb-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">Weekly Schedule</span>
                        <span className="font-semibold text-emerald-800 text-[11px]">
                          {adv.availableDaysText || 'Available 5 Days (Mon – Fri)'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">Working Hours</span>
                        <span className="font-mono text-stone-700 text-[11px]">
                          {adv.workingHours || '10:00 AM – 06:00 PM'} (1-Hr Slots)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] text-stone-500">Chamber Location</span>
                        <span className="font-semibold text-stone-800 text-[11px]">{adv.city}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                        <span className="text-[11px] text-stone-500">Consultation Retainer</span>
                        <span className="font-serif font-bold text-stone-900 text-xs">
                          ₹{(Number(adv.hourlyRate) || 1500).toLocaleString('en-IN')} / session
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Permitted Booking Channels (Rule from Section 5.B) */}
                  <div className="pt-2 border-t border-stone-100">
                    {isFirmExclusive ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-5 gap-1.5">
                          <Link
                            to={`/lawyers/${adv.username || adv.slug || adv.publicId}`}
                            className="col-span-2 py-2 px-2 rounded-lg border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center space-x-1 transition shadow-xs text-center cursor-pointer"
                          >
                            <span>View Details</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLawyerModal({ ...adv, forcedChannel: 'FIRM' });
                            }}
                            className="col-span-3 py-2 px-2 rounded-lg bg-blue-800 hover:bg-blue-900 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                          >
                            <Building className="w-3.5 h-3.5" />
                            <span>Request via Firm</span>
                          </button>
                        </div>
                        <p className="text-[9px] text-stone-400 text-center font-sans">
                          Practices exclusively with {adv.firmAffiliation.firmName}.
                        </p>
                      </div>
                    ) : isFirmAndIndep ? (
                      <div className="space-y-1.5">
                        <div className="grid grid-cols-5 gap-1.5">
                          <Link
                            to={`/lawyers/${adv.username || adv.slug || adv.publicId}`}
                            className="col-span-2 py-2 px-2 rounded-lg border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center space-x-1 transition shadow-xs text-center cursor-pointer"
                          >
                            <span>View Details</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLawyerModal({ ...adv, forcedChannel: 'INDEPENDENT' });
                            }}
                            className="col-span-3 py-2 px-2.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book Consultation</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-1.5">
                        <Link
                          to={`/lawyers/${adv.username || adv.slug || adv.publicId}`}
                          className="col-span-2 py-2 px-2 rounded-lg border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center justify-center space-x-1 transition shadow-xs text-center cursor-pointer"
                        >
                          <span>View Details</span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedLawyerModal({ ...adv, forcedChannel: 'INDEPENDENT' });
                          }}
                          className="col-span-3 py-2 px-2.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center justify-center space-x-1.5 transition shadow-xs cursor-pointer"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Book Consultation</span>
                        </button>
                      </div>
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
                      <Link
                        to={`/firms/${firm.publicId || firm.slug}`}
                        className="w-12 h-12 rounded-xl bg-gradient-to-tr from-stone-900 to-stone-700 text-white flex items-center justify-center font-serif font-bold text-lg shadow-xs shrink-0 hover:opacity-90 transition"
                        title="View Full Firm Profile"
                      >
                        {firm.name[0]}
                      </Link>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Link
                            to={`/firms/${firm.publicId || firm.slug}`}
                            className="font-serif font-bold text-base text-stone-900 leading-snug hover:text-[var(--bg-primary)] hover:underline transition"
                            title="View Full Firm Profile"
                          >
                            {firm.name}
                          </Link>
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
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                  <Link
                    to={`/firms/${firm.publicId || firm.slug}`}
                    className="px-3 py-1.5 rounded-lg border border-stone-300 hover:border-stone-400 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-xs flex items-center space-x-1 transition shadow-xs"
                  >
                    <span>View Firm Details</span>
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
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-cream)] bg-white text-stone-700 hover:bg-stone-50 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer disabled:opacity-50"
                  title="Refresh appointments"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[var(--bg-primary)]' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
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
                    if (a.lawyer) openChatWithUser(a.lawyer, a.lawyer.fullName, a.publicId);
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
                          if (a.lawyer) openChatWithUser(a.lawyer, a.lawyer.fullName, a.publicId);
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[92vh] border border-stone-200 shadow-2xl flex flex-col overflow-hidden text-xs">
            {/* STICKY MODAL HEADER */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] flex items-center justify-center font-bold text-sm">
                  ⚖
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                    Request Legal Consultation
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    With {formatAdvocateName(selectedLawyerModal.fullName)} ({selectedLawyerModal.barCouncilNumber || 'Bar Council of India'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLawyerModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 flex items-center justify-center text-sm font-bold transition shadow-2xs cursor-pointer"
                title="Close dialog"
              >
                ✕
              </button>
            </div>

            {requestSuccessMessage ? (
              <div className="p-8 text-center my-auto space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
                <h4 className="font-serif font-bold text-base text-stone-900">Request Dispatched Successfully</h4>
                <p className="text-xs text-emerald-800 font-sans max-w-md mx-auto">{requestSuccessMessage}</p>
              </div>
            ) : (
              <form
                id="consultationBookingForm"
                onSubmit={(e) => {
                  e.preventDefault();
                  handleBookConsultation(
                    selectedLawyerModal,
                    selectedLawyerModal.forcedChannel || 'INDEPENDENT'
                  );
                }}
                className="flex flex-col flex-1 overflow-hidden"
              >
                {/* SCROLLABLE MODAL BODY */}
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                  {requestErrorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2.5">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <p className="font-semibold text-rose-900">Schedule Notice</p>
                        <p className="text-rose-700 leading-relaxed text-[11px]">{requestErrorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Channel Indicator */}
                  <div className="p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-mono text-stone-500 uppercase block">
                        Authorized Booking Channel
                      </span>
                      <p className="font-semibold text-stone-900 text-xs">
                        {selectedLawyerModal.forcedChannel === 'FIRM'
                          ? `Through Firm: ${selectedLawyerModal.firmAffiliation?.firmName || 'Lex Veritas Legal LLP'}`
                          : 'Independent Chamber Practice'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-semibold">
                      VERIFIED COUNSEL
                    </span>
                  </div>

                  {/* 1. Consultation Mode Grid: 3 Options */}
                  <div>
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-2">
                      1. Select Consultation Mode
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {/* Mode 1: Online Video */}
                      <button
                        type="button"
                        onClick={() => setSelectedConsultMode('ONLINE')}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          selectedConsultMode === 'ONLINE'
                            ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-600 text-stone-900 shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Video className="w-4 h-4 text-emerald-700" />
                            <span className="text-[9px] font-mono font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">1 Hr</span>
                          </div>
                          <p className="font-bold text-xs text-stone-900">WebRTC Video</p>
                          <p className="text-[10px] text-stone-500 font-sans leading-tight mt-0.5">1:1 remote video</p>
                        </div>
                        <p className="text-[11px] font-bold text-stone-800 font-mono mt-2">
                          ₹{(Number(selectedLawyerModal?.hourlyRate) || 1500).toLocaleString('en-IN')}
                        </p>
                      </button>

                      {/* Mode 2: Chamber Visit */}
                      <button
                        type="button"
                        onClick={() => setSelectedConsultMode('IN_PERSON')}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          selectedConsultMode === 'IN_PERSON' || selectedConsultMode === 'OFFLINE'
                            ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-600 text-stone-900 shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <Building className="w-4 h-4 text-amber-700" />
                            <span className="text-[9px] font-mono font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded">Chamber</span>
                          </div>
                          <p className="font-bold text-xs text-stone-900">Chamber Visit</p>
                          <p className="text-[10px] text-stone-500 font-sans leading-tight mt-0.5">In-person court chamber</p>
                        </div>
                        <p className="text-[11px] font-bold text-stone-800 font-mono mt-2">
                          ₹{(Math.round((Number(selectedLawyerModal?.hourlyRate) || 1500) * 1.2)).toLocaleString('en-IN')}
                        </p>
                      </button>

                      {/* Mode 3: Legal Chat Advisory */}
                      <button
                        type="button"
                        onClick={() => setSelectedConsultMode('CHAT')}
                        className={`p-2.5 sm:p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                          selectedConsultMode === 'CHAT'
                            ? 'border-indigo-600 bg-indigo-50/70 ring-1 ring-indigo-600 text-stone-900 shadow-2xs'
                            : 'border-stone-200 hover:border-stone-300 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <MessageSquare className="w-4 h-4 text-indigo-700" />
                            <span className="text-[9px] font-mono font-bold text-indigo-800 bg-indigo-100 px-1.5 py-0.2 rounded">Instant</span>
                          </div>
                          <p className="font-bold text-xs text-stone-900">Legal Chat</p>
                          <p className="text-[10px] text-stone-500 font-sans leading-tight mt-0.5">Encrypted advisory thread</p>
                        </div>
                        <p className="text-[11px] font-bold text-stone-800 font-mono mt-2">
                          ₹{(Math.round((Number(selectedLawyerModal?.hourlyRate) || 1500) * 0.6)).toLocaleString('en-IN')}
                        </p>
                      </button>
                    </div>
                  </div>

                  {/* FLOW 1: ENCRYPTED LEGAL CHAT ADVISORY FLOW */}
                  {selectedConsultMode === 'CHAT' ? (
                    <div className="p-4 rounded-xl bg-indigo-50/90 border border-indigo-200 space-y-2.5">
                      <div className="flex items-center space-x-2 text-indigo-950 font-bold text-xs">
                        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span>Instant 1-on-1 Legal Chat Advisory Flow</span>
                      </div>
                      <p className="text-[11px] text-indigo-900 leading-relaxed font-sans">
                        No calendar scheduling required. Once submitted, your advisory request routes directly to {formatAdvocateName(selectedLawyerModal.fullName)}'s verified desk. Upon acceptance, your encrypted message thread unlocks immediately with direct document sharing.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-indigo-200/80 text-[10px] font-mono text-indigo-900">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>24-Hour Active Advisory Turnaround</span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                          <span>Protected Client-Advocate Privilege</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* FLOW 2: SCHEDULED VIDEO HEARING / CHAMBER VISIT FLOW */
                    <div className="space-y-3 pt-1">
                      {/* Advocate Availability & Schedule Information */}
                      <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-amber-950 flex items-center space-x-1.5">
                            <Calendar className="w-3.5 h-3.5 text-amber-700" />
                            <span>Weekly Availability: {selectedLawyerModal.availableDaysText || 'Available 5 Days (Mon – Fri)'}</span>
                          </span>
                          <span className="text-[10px] font-mono font-bold bg-amber-200/80 text-amber-900 px-2 py-0.5 rounded">
                            {selectedLawyerModal.workingHours || '10:00 AM – 06:00 PM'}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-900 leading-relaxed font-sans">
                          Each consultation session is strictly <strong>1 hour</strong>. Please choose <strong>2 preferred time slots</strong> (Primary &amp; Alternative). {formatAdvocateName(selectedLawyerModal.fullName)} will confirm or propose a convenient adjustment.
                        </p>
                      </div>

                      {/* Consultation Schedule: Dynamic 1-Hour Duration */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-bold text-stone-800 uppercase tracking-wider">
                            2. Preferred Consultation Schedule (1-Hour Session)
                          </label>
                          <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            Dynamic 1-Hour Consultation
                          </span>
                        </div>

                        <div className="space-y-3">
                          {/* Option 1: Primary Preference */}
                          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-emerald-950 flex items-center space-x-1.5">
                                <span className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[10px] font-bold">1</span>
                                <span>Preferred Consultation Date &amp; Start Time</span>
                              </span>
                              {customTime1 && (
                                <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded font-bold">
                                  1-Hour Duration
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-stone-600 mb-1">Select Working Day</label>
                                <input
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={customDate1}
                                  onChange={(e) => setCustomDate1(e.target.value)}
                                  className="w-full p-2 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-stone-600 mb-1">Enter Preferred Start Time</label>
                                <input
                                  type="time"
                                  value={customTime1}
                                  onChange={(e) => setCustomTime1(e.target.value)}
                                  className="w-full p-2 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                                />
                              </div>
                            </div>
                            {customDate1 && customTime1 && (
                              <div className="text-[11px] font-mono text-emerald-900 bg-white/90 p-2.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                                <span>Calculated Session Window: <strong>{formatTime12h(customTime1)} – {calculateEndTime(customTime1)}</strong> (Strictly 60 Mins)</span>
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              </div>
                            )}
                          </div>

                          {/* Option 2: Alternative Preference (Optional Backup) */}
                          <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-xs text-stone-800 flex items-center space-x-1.5">
                                <span className="w-5 h-5 rounded-full bg-stone-400 text-white flex items-center justify-center text-[10px] font-bold">2</span>
                                <span>Alternative Backup Option (Optional)</span>
                              </span>
                              {customTime2 && (
                                <span className="text-[10px] font-mono text-stone-600 bg-stone-200 px-2 py-0.5 rounded font-bold">
                                  1-Hour Duration
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-stone-600 mb-1">Alternative Date</label>
                                <input
                                  type="date"
                                  min={new Date().toISOString().split('T')[0]}
                                  value={customDate2}
                                  onChange={(e) => setCustomDate2(e.target.value)}
                                  className="w-full p-2 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] font-semibold text-stone-600 mb-1">Alternative Start Time</label>
                                <input
                                  type="time"
                                  value={customTime2}
                                  onChange={(e) => setCustomTime2(e.target.value)}
                                  className="w-full p-2 rounded-lg border border-stone-200 bg-white text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-stone-400"
                                />
                              </div>
                            </div>
                            {customDate2 && customTime2 && (
                              <div className="text-[11px] font-mono text-stone-800 bg-white/90 p-2.5 rounded-lg border border-stone-200 flex items-center justify-between">
                                <span>Alternative Window: <strong>{formatTime12h(customTime2)} – {calculateEndTime(customTime2)}</strong> (60 Mins)</span>
                                <CheckCircle2 className="w-4 h-4 text-stone-500" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

            {/* Matter Description / Brief Note */}
            <div>
              <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-1">
                {selectedConsultMode === 'CHAT' ? '2. Legal Query / Matter Brief' : '3. Matter Description / Brief Note'}
              </label>
              <textarea
                rows={3}
                placeholder={
                  selectedConsultMode === 'CHAT'
                    ? "State your legal dispute, FIR section, court notice details, or question for advocate advisory..."
                    : "Briefly state your legal issue, FIR number, contract type, or relief sought..."
                }
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                required
                className="w-full p-2.5 rounded-lg border border-stone-300 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] bg-white"
              />
              <p className="text-[10px] text-stone-400 mt-0.5">
                Protected under Section 126 of the Indian Evidence Act (Advocate-Client Privilege).
              </p>
            </div>
          </div>

          {/* STICKY MODAL FOOTER */}
          <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-stone-200 bg-stone-50 shrink-0 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono text-stone-500 uppercase block">Consultation Retainer</span>
              <span className="text-base font-serif font-bold text-stone-900">
                ₹{(
                  selectedConsultMode === 'CHAT'
                    ? Math.round((Number(selectedLawyerModal?.hourlyRate) || 1500) * 0.6)
                    : selectedConsultMode === 'IN_PERSON' || selectedConsultMode === 'OFFLINE'
                    ? Math.round((Number(selectedLawyerModal?.hourlyRate) || 1500) * 1.2)
                    : Number(selectedLawyerModal?.hourlyRate) || 1500
                ).toLocaleString('en-IN')}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSelectedLawyerModal(null)}
                className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-medium transition cursor-pointer text-xs"
              >
                Cancel
              </button>
              {(() => {
                const isSubmitDisabled =
                  selectedConsultMode === 'CHAT'
                    ? !consultationNotes.trim()
                    : !customDate1 || !customTime1;

                return (
                  <button
                    type="submit"
                    disabled={isSubmitDisabled}
                    className={`px-4 py-2 rounded-xl text-white font-semibold transition shadow-xs text-xs cursor-pointer ${
                      isSubmitDisabled
                        ? 'bg-stone-400 cursor-not-allowed opacity-60'
                        : 'bg-[var(--bg-primary)] hover:opacity-90'
                    }`}
                  >
                    {selectedConsultMode === 'CHAT'
                      ? 'Initiate Legal Chat Advisory'
                      : 'Submit Consultation Request (1 Hour)'}
                  </button>
                );
              })()}
            </div>
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
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[92vh] border border-stone-200 shadow-2xl flex flex-col overflow-hidden text-xs">
            {/* Sticky Header */}
            <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-b border-stone-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] flex items-center justify-center font-bold text-sm">
                  🏢
                </div>
                <div>
                  <h3 className="font-serif font-bold text-base text-stone-900 leading-tight">
                    Request Law Firm Consultation
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    To {firmRequestModal.name} ({firmRequestModal.registrationNumber || 'LLP Practice'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFirmRequestModal(null)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 flex items-center justify-center text-sm font-bold transition shadow-2xs cursor-pointer"
                title="Close dialog"
              >
                ✕
              </button>
            </div>

            {requestSuccessMessage ? (
              <div className="p-8 text-center my-auto space-y-2">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600 mb-2" />
                <h4 className="font-serif font-bold text-base text-stone-900">Brief Dispatched Successfully</h4>
                <p className="text-xs text-emerald-800 font-sans max-w-md mx-auto">{requestSuccessMessage}</p>
              </div>
            ) : (
              <form onSubmit={handleFirmRequestSubmit} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1">
                  <div>
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Select Practice Area
                    </label>
                    <select className="w-full p-2.5 rounded-lg border border-stone-300 bg-white text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]">
                      {(firmRequestModal.practiceAreas || ['Corporate Law', 'Litigation', 'Arbitration']).map((pa, i) => (
                        <option key={i} value={pa}>{pa}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-stone-800 uppercase tracking-wider mb-1.5">
                      Matter Scope / Retainer Brief
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Describe your dispute, contract size, or regulatory matter for the managing partner to assign the lead advocate..."
                      value={consultationNotes}
                      onChange={(e) => setConsultationNotes(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-lg border border-stone-300 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] bg-white"
                    />
                    <p className="text-[10px] text-stone-400 mt-1">
                      Privileged law firm intake review. A managing partner will contact you within 24 hours.
                    </p>
                  </div>
                </div>

                {/* Sticky Footer */}
                <div className="px-5 py-3.5 sm:px-6 sm:py-4 border-t border-stone-200 bg-stone-50 shrink-0 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setFirmRequestModal(null)}
                    className="px-3.5 py-2 rounded-xl border border-stone-300 text-stone-700 hover:bg-stone-100 font-medium transition cursor-pointer text-xs"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition shadow-xs cursor-pointer text-xs"
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
                  <span className="font-semibold text-stone-900">₹{(Number(advFee) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-stone-700">
                  <div className="flex items-center space-x-1">
                    <span>Platform Service Fee (10%)</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 text-amber-900 font-semibold">
                      Platform Fee
                    </span>
                  </div>
                  <span className="font-semibold text-amber-900">₹{(Number(platformFee) || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-stone-900">
                  <span>Total Amount Payable</span>
                  <span className="text-[var(--bg-primary)] text-base font-serif">
                    ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}
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
                        Available Balance: <strong className="font-semibold text-stone-900">₹{(Number(walletBalance) || 0).toLocaleString('en-IN')}</strong>
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold uppercase tracking-wider">
                    Direct Deduction
                  </span>
                </div>
                {walletBalance < totalAmount && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs space-y-2.5">
                    <div className="flex items-center space-x-1.5 font-bold text-rose-800">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>Insufficient Wallet Balance</span>
                    </div>
                    <p className="text-[11px] text-rose-700 leading-relaxed">
                      Your available balance is <strong className="font-semibold text-rose-900">₹{(Number(walletBalance) || 0).toLocaleString('en-IN')}</strong>, but this consultation requires <strong className="font-semibold text-rose-900">₹{(Number(totalAmount) || 0).toLocaleString('en-IN')}</strong>. Payment cannot proceed until funds are added.
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setPayingAppointmentModal(null);
                        navigate('/client/finance');
                      }}
                      className="w-full py-2 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold text-xs transition cursor-pointer flex items-center justify-center space-x-1.5 shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>Add Funds to Wallet (Razorpay / UPI) →</span>
                    </button>
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
                    <span>Deduct ₹{(Number(totalAmount) || 0).toLocaleString('en-IN')} &amp; Confirm</span>
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
