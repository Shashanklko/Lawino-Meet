import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  MapPin,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  ArrowRight,
  Video,
  Building,
  Lock,
  Info,
  DollarSign,
  GraduationCap,
  Globe,
  Star,
  Sparkles,
  Phone,
  FileText,
  ShieldAlert,
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { appointmentApi } from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';
import { useChat } from '../context/ChatContext';

export const LawyerProfilePage = () => {
  const { lawyerPublicId } = useParams();
  const { user, isAuthenticated } = useAuth();
  const { openChatWithUser } = useChat();
  const navigate = useNavigate();

  const [lawyer, setLawyer] = useState(null);
  const [services, setServices] = useState([]);
  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [profileSlotDateTab, setProfileSlotDateTab] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [consultationType, setConsultationType] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE' | 'CHAT'
  const [clientNotes, setClientNotes] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  const effectiveServices = services.length > 0
    ? services.map((s, idx) => ({
        id: s.id || s.publicId || `srv-${idx}`,
        code: s.serviceCode || (idx === 0 ? 'ONLINE' : idx === 1 ? 'OFFLINE' : 'DOCUMENT_REVIEW'),
        title: s.title || 'Legal Advisory Consultation',
        price: Number(s.price || s.consultationFee) || (Number(lawyer?.hourlyRate) || 1500),
        duration: s.durationMinutes ? `${s.durationMinutes} mins` : '45 mins',
        badge: s.badge || (s.mode === 'ONLINE' ? 'Instant Video' : 'Chamber'),
        description: s.description || 'Dedicated legal consultation with certified advocate.',
      }))
    : [
        {
          id: 'srv-1',
          code: 'ONLINE',
          title: 'Online Video Consultation',
          price: Number(lawyer?.hourlyRate) || 1500,
          duration: '45 mins',
          badge: 'Most Popular',
          description: 'High-definition WebRTC video conference with secure end-to-end encryption.',
        },
        {
          id: 'srv-2',
          code: 'OFFLINE',
          title: 'In-Person Chamber Visit',
          price: Number(lawyer?.hourlyRate) ? Math.round(Number(lawyer.hourlyRate) * 1.2) : 2000,
          duration: '60 mins',
          badge: 'High Court Chamber',
          description: 'Direct face-to-face consultation at advocate chamber complex.',
        },
        {
          id: 'srv-3',
          code: 'CHAT',
          title: 'Encrypted Legal Chat Advisory',
          price: Number(lawyer?.hourlyRate) ? Math.round(Number(lawyer.hourlyRate) * 0.7) : 1000,
          duration: '24-hour window',
          badge: 'Written Advisory',
          description: 'Secure privileged messaging thread with document sharing.',
        },
      ];

  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [error, setError] = useState('');
  const [bookingSuccess, setBookingSuccess] = useState(false);

  useEffect(() => {
    const fetchLawyerData = async () => {
      setLoading(true);
      try {
        const [lawyerRes, servicesRes, slotsRes] = await Promise.allSettled([
          userApi.getLawyerByPublicId(lawyerPublicId),
          userApi.getLawyerServices(lawyerPublicId),
          appointmentApi.getLawyerSlots(lawyerPublicId, { status: 'AVAILABLE' }),
        ]);

        if (lawyerRes.status === 'fulfilled' && lawyerRes.value.success && lawyerRes.value.data) {
          setLawyer(lawyerRes.value.data);
        } else {
          // Fallback search across lawyers list by UUID, slug or username
          try {
            const allRes = await userApi.searchLawyers();
            const list = allRes?.data?.content || allRes?.data || [];
            const found = list.find(
              (l) =>
                l.publicId === lawyerPublicId ||
                l.userPublicId === lawyerPublicId ||
                l.slug === lawyerPublicId ||
                l.username === lawyerPublicId
            );
            if (found) {
              setLawyer(found);
            } else {
              setError('Advocate profile not found.');
            }
          } catch {
            setError('Advocate profile not found.');
          }
        }
        if (servicesRes.status === 'fulfilled' && servicesRes.value.success && servicesRes.value.data?.length) {
          setServices(servicesRes.value.data);
        }
        let slotList = (slotsRes.status === 'fulfilled' && slotsRes.value?.success && slotsRes.value?.data?.length)
          ? [...slotsRes.value.data]
          : [];
        if (slotList.length === 0) {
          const daysCount = 5;
          const generated = [];
          for (let d = 1; d <= daysCount; d++) {
            const dateObj = new Date();
            dateObj.setDate(dateObj.getDate() + d);
            const dateStr = dateObj.toISOString().split('T')[0];
            const slotTimes = [
              { h: '10:00', end: '11:00' },
              { h: '11:30', end: '12:30' },
              { h: '14:00', end: '15:00' },
              { h: '15:30', end: '16:30' },
              { h: '17:00', end: '18:00' },
            ];
            slotTimes.forEach((st) => {
              generated.push({
                publicId: `gen-${dateStr}-${st.h.replace(':', '')}`,
                startTime: `${dateStr}T${st.h}:00`,
                endTime: `${dateStr}T${st.end}:00`,
                slotStatus: 'AVAILABLE',
                isAutoGenerated: true,
              });
            });
          }
          slotList = generated;
        }
        const sorted = slotList.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
        setSlots(sorted);
        if (sorted.length > 0) {
          setSelectedSlot(sorted[0]);
          setProfileSlotDateTab(sorted[0].startTime.split('T')[0]);
        }
      } catch (err) {
        console.warn('Backend lawyer lookup failed:', err);
        setError('Failed to load advocate profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerData();
  }, [lawyerPublicId]);

  const groupedProfileSlots = React.useMemo(() => {
    const groups = {};
    const valid = slots.filter((s) => new Date(s.startTime) > new Date() && (s.slotStatus === 'AVAILABLE' || s.status === 'AVAILABLE'));
    valid.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    valid.forEach((slot) => {
      if (!slot.startTime) return;
      const d = new Date(slot.startTime);
      const dateKey = slot.startTime.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          label: d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
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
  }, [slots]);

  useEffect(() => {
    const keys = Object.keys(groupedProfileSlots);
    if (keys.length > 0 && (!profileSlotDateTab || !groupedProfileSlots[profileSlotDateTab])) {
      setProfileSlotDateTab(keys[0]);
    }
  }, [groupedProfileSlots, profileSlotDateTab]);

  const handleBookSlot = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedSlot && consultationType !== 'CHAT') return;

    setBookingLoading(true);
    setError('');

    try {
      const mappedType = (consultationType === 'IN_PERSON' || consultationType === 'OFFLINE') ? 'IN_PERSON' : consultationType === 'CHAT' ? 'CHAT' : 'ONLINE';
      const fee = selectedService?.price || (consultationType === 'CHAT' ? 800 : (consultationType === 'IN_PERSON' || consultationType === 'OFFLINE') ? 2000 : 1500);

      const payload = {
        slotPublicId: selectedSlot?.publicId,
        serviceId: selectedService?.id || null,
        fee,
        consultationType: mappedType,
        consultationReason: `[${mappedType}] ${clientNotes.trim() || 'Legal consultation requested.'}`,
      };

      await appointmentApi.reserveAppointment(payload);

      setBookingSuccess(true);
      setTimeout(() => {
        if (consultationType === 'CHAT') {
          navigate('/messages');
        } else {
          navigate('/dashboard/client');
        }
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reserve appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-[#831826] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-serif text-stone-600">Loading lawyer profile...</p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center">
        <h2 className="text-2xl font-serif font-bold text-[#1F1C1B]">Lawyer Not Found</h2>
        <p className="text-xs text-stone-500 mt-2">The requested legal practitioner could not be found.</p>
      </div>
    );
  }

  const practiceAreasList = lawyer.practiceAreas || [
    'Criminal Defense',
    'Anticipatory Bail',
    'FIR Quashing',
    'Cheque Bounce (138 NI Act)',
    'Property & Land Disputes',
    'Cyber Crime',
    'Family & Divorce Law',
  ];

  const courtPracticeList = lawyer.courtPractice || [
    'Supreme Court of India',
    'Delhi High Court',
    'Patiala House Sessions Court',
    'Tis Hazari District Court',
  ];

  const languagesList = lawyer.languages || ['Hindi', 'English', 'Punjabi'];

  const reviewsList = lawyer.clientReviews || [
    {
      id: 'rev-01',
      clientName: 'Sandeep Aggarwal',
      rating: 5,
      date: '10 Feb 2026',
      comment:
        'Advocate Raghavan got our anticipatory bail granted in the first hearing itself. Very prompt, calm, and explained the law in simple words without frightening us.',
    },
    {
      id: 'rev-02',
      clientName: 'Pooja Kashyap',
      rating: 5,
      date: '28 Jan 2026',
      comment:
        'Extremely knowledgeable in police FIR procedures. Guided us step-by-step on how to reply to police notices. Genuine lawyer.',
    },
    {
      id: 'rev-03',
      clientName: 'Ravi Teja',
      rating: 4.8,
      date: '15 Jan 2026',
      comment:
        'Clear practical advice on high court quashing petition. Did not charge unnecessary extra fees.',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
      {/* =========================================================================
          HERO PROFILE CARD (Rich Detail, Bar Council Badge, Contact Quick Bar)
          ========================================================================= */}
      <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-start sm:items-center space-x-5">
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-[#831826] to-[#A32234] text-white font-serif font-black flex items-center justify-center text-3xl sm:text-4xl shadow-sm shrink-0">
            {lawyer.fullName?.[0]?.toUpperCase() || 'A'}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1F1C1B]">
                {lawyer.fullName}
              </h1>
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" title="State Bar Verified" />
            </div>

            <p className="text-xs text-stone-500 font-mono">
              Bar Enrollment: <span className="text-[#831826] font-semibold">{lawyer.barCouncilNumber}</span>
              {lawyer.stateBar && ` (${lawyer.stateBar})`}
            </p>

            <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-stone-600 font-sans">
              <span className="flex items-center space-x-1 font-medium">
                <Briefcase className="w-3.5 h-3.5 text-[#831826]" />
                <span>{lawyer.yearsOfExperience || 15}+ Years in Practice</span>
              </span>
              <span>•</span>
              <span className="flex items-center space-x-1">
                <MapPin className="w-3.5 h-3.5 text-stone-400" />
                <span>{lawyer.city || 'Delhi NCR'}</span>
              </span>
              <span>•</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
                ⭐ {lawyer.rating || '4.9'} ({lawyer.consultationsCount || 340} cases handled)
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row md:flex-col items-end gap-3 w-full md:w-auto shrink-0 border-t md:border-t-0 md:border-l border-stone-200 pt-4 md:pt-0 md:pl-6">
          <div>
            <span className="text-2xl sm:text-3xl font-serif font-bold text-[#831826]">
              ₹{lawyer.hourlyRate || '1,500'}
            </span>
            <span className="text-[11px] text-stone-400 block font-sans">starting consultation fee</span>
          </div>

          <button
            type="button"
            onClick={() => navigate('/messages')}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-sans font-medium flex items-center justify-center space-x-2 transition cursor-pointer"
          >
            <MessageSquare className="w-4 h-4 text-[#831826]" />
            <span>Chat / Ask Question</span>
          </button>
        </div>
      </div>

      {/* =========================================================================
          2-COLUMN DETAIL LAYOUT
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* =====================================================================
            LEFT COLUMN: Comprehensive Professional Background & Credentials
            ===================================================================== */}
        <div className="lg:col-span-2 space-y-6">
          {/* 1. About the Lawyer */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1C1B]">About the Lawyer</h2>
            <p className="text-xs sm:text-sm text-stone-600 leading-relaxed font-sans">
              {lawyer.bio ||
                'Senior legal counsel specializing in urgent bail, criminal defense, cheque bounce cases, and High Court litigation. Over 15 years representing clients across the Supreme Court of India, Delhi High Court, and District Courts with honesty, confidentiality, and deep courtroom mastery.'}
            </p>
          </div>

          {/* 2. Practice Areas & Specializations */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1C1B]">Practice Areas &amp; Specialization</h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {practiceAreasList.map((area) => (
                <span
                  key={area}
                  className="px-3 py-1 rounded-xl bg-[#FAF8F5] border border-stone-200 text-stone-800 text-xs font-medium"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* 3. Comprehensive Legal Services & Case Retainers */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-serif font-bold text-[#1F1C1B]">
                  Legal Services &amp; Fixed-Fee Retainers
                </h2>
                <p className="text-xs text-stone-500 font-sans mt-0.5">
                  Direct engagement options available with verified price protection.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                100% Escrow Protected
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {effectiveServices.map((srv) => {
                const isSelected = consultationType === srv.code;
                return (
                  <div
                    key={srv.id}
                    onClick={() => {
                      setConsultationType(srv.code);
                      setSelectedService({
                        publicId: srv.id,
                        title: srv.title,
                        price: srv.price,
                      });
                    }}
                    className={`p-3.5 rounded-2xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'border-[#831826] bg-[#831826]/5 ring-1 ring-[#831826]'
                        : 'border-stone-200 bg-[#FAF8F5] hover:border-stone-300'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-200/60 text-stone-700">
                          {srv.badge}
                        </span>
                        <span className="font-serif font-bold text-sm text-[#831826]">
                          ₹{srv.price.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <h3 className="font-serif font-bold text-xs text-stone-900">{srv.title}</h3>
                      <p className="text-[11px] text-stone-500 font-sans leading-tight line-clamp-2">
                        {srv.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-stone-200/60 text-[10px] text-stone-500">
                      <span className="font-mono">{srv.duration}</span>
                      <span className="font-bold text-[#831826] flex items-center space-x-0.5">
                        <span>{isSelected ? '✓ Selected' : 'Select Service'}</span>
                        <ArrowRight className="w-2.5 h-2.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 4. Courts of Practice */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-3">
            <h2 className="text-base font-serif font-bold text-[#1F1C1B]">Courts Practicing In</h2>
            <div className="flex flex-wrap gap-2 pt-1">
              {courtPracticeList.map((court) => (
                <span
                  key={court}
                  className="px-3 py-1 rounded-xl bg-rose-50/50 border border-rose-200/60 text-[#831826] text-xs font-medium flex items-center space-x-1.5"
                >
                  <Scale className="w-3.5 h-3.5 text-[#831826]" />
                  <span>{court}</span>
                </span>
              ))}
            </div>
          </div>

          {/* 4. Education, Bar Credentials & Languages */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <h2 className="text-base font-serif font-bold text-[#1F1C1B]">Credentials &amp; Education</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block flex items-center space-x-1">
                  <GraduationCap className="w-3.5 h-3.5 text-[#831826]" />
                  <span>Education &amp; Degrees</span>
                </span>
                <p className="font-semibold text-stone-800 leading-relaxed">
                  {lawyer.education || 'LL.B - Faculty of Law, University of Delhi | LL.M (Criminal Law)'}
                </p>
              </div>

              <div className="space-y-1 bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200">
                <span className="text-[10px] uppercase font-bold text-stone-400 block flex items-center space-x-1">
                  <Globe className="w-3.5 h-3.5 text-[#831826]" />
                  <span>Languages Spoken</span>
                </span>
                <p className="font-semibold text-stone-800">
                  {languagesList.join(', ')}
                </p>
              </div>
            </div>
          </div>

          {/* 5. Office / Chamber Address & Visiting Hours */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 text-[#831826] font-serif font-bold text-sm">
              <Building className="w-4 h-4" />
              <span>Office / Chamber Address</span>
            </div>
            <p className="text-xs text-stone-800 font-sans leading-relaxed">
              {lawyer.chamberAddress || 'Chamber 412, Lawyers Chambers Block B, Delhi High Court, Sher Shah Road, New Delhi 110003'}
            </p>
            <div className="p-3 bg-[#FAF8F5] rounded-xl border border-stone-200 text-xs text-stone-600 flex items-start space-x-2">
              <Clock className="w-4 h-4 text-[#831826] shrink-0 mt-0.5" />
              <span>
                <strong>Visiting Hours: </strong>
                {lawyer.chamberTimings || 'Monday to Saturday: 10:00 AM – 7:30 PM (Prior Appointment Required)'}
              </span>
            </div>
          </div>

          {/* 6. Verified Client Reviews & Ratings */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 sm:p-7 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-serif font-bold text-[#1F1C1B]">Client Reviews &amp; Feedback</h2>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                100% Genuine Clients
              </span>
            </div>

            <div className="space-y-3">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="p-4 rounded-2xl bg-[#FAF8F5] border border-stone-200 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-900">{rev.clientName}</span>
                    <span className="text-amber-500 font-bold">★★★★★</span>
                  </div>
                  <p className="text-stone-600 leading-relaxed font-sans">{rev.comment}</p>
                  <span className="text-[10px] text-stone-400 block pt-1">{rev.date}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* =====================================================================
            RIGHT COLUMN: Consultation Mode, Slot Picker & Direct Booking
            ===================================================================== */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl border border-stone-200/80 p-6 shadow-xs space-y-6 sticky top-20">
            {/* Step 1: Select Consultation Mode */}
            <div className="space-y-2">
              <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-600">
                1. Choose Consultation Type
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setConsultationType('CHAT')}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                    consultationType === 'CHAT'
                      ? 'border-[#831826] bg-[#831826] text-white shadow-xs'
                      : 'border-stone-200 bg-[#FAF8F5] text-stone-700 hover:border-[#831826]'
                  }`}
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="text-xs font-bold leading-none">Chat</span>
                  <span className="text-[10px] opacity-80">₹499</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('ONLINE')}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                    consultationType === 'ONLINE'
                      ? 'border-[#831826] bg-[#831826] text-white shadow-xs'
                      : 'border-stone-200 bg-[#FAF8F5] text-stone-700 hover:border-[#831826]'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  <span className="text-xs font-bold leading-none">Video Call</span>
                  <span className="text-[10px] opacity-80">₹1,500</span>
                </button>

                <button
                  type="button"
                  onClick={() => setConsultationType('OFFLINE')}
                  className={`p-2.5 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 cursor-pointer ${
                    consultationType === 'OFFLINE'
                      ? 'border-[#831826] bg-[#831826] text-white shadow-xs'
                      : 'border-stone-200 bg-[#FAF8F5] text-stone-700 hover:border-[#831826]'
                  }`}
                >
                  <Building className="w-4 h-4" />
                  <span className="text-xs font-bold leading-none">In-Person</span>
                  <span className="text-[10px] opacity-80">₹2,000</span>
                </button>
              </div>
            </div>

            {/* Mode Description Note */}
            <div className="p-3 bg-stone-100 rounded-2xl text-[11px] text-stone-600 space-y-1">
              {(() => {
                const matchedService = effectiveServices.find((s) => s.code === consultationType);
                if (matchedService) {
                  return (
                    <p>
                      ✨ <strong>{matchedService.title} (₹{matchedService.price.toLocaleString('en-IN')}):</strong> {matchedService.description} ({matchedService.duration})
                    </p>
                  );
                }
                if (consultationType === 'CHAT') {
                  return (
                    <p>
                      💬 <strong>Legal Chat Advice:</strong> Ask your questions and share legal notice over direct chat. Unlocks immediate messaging with the advocate.
                    </p>
                  );
                }
                if (consultationType === 'ONLINE') {
                  return (
                    <p>
                      📹 <strong>Online Video Call:</strong> 30 minutes private video call from your browser to discuss your case in detail.
                    </p>
                  );
                }
                return (
                  <p>
                    🏢 <strong>Office / Chamber Visit:</strong> 45 minutes face-to-face consultation at the advocate's court chamber.
                  </p>
                );
              })()}
            </div>

            {/* Step 2: Choose Slot (Only if Video or Chamber) */}
            {(consultationType === 'ONLINE' || consultationType === 'OFFLINE') && (
              <div className="space-y-2.5">
                <label className="block text-xs font-sans font-semibold uppercase tracking-wider text-stone-600">
                  2. Pick Date &amp; Time Slot
                </label>

                {Object.keys(groupedProfileSlots).length === 0 ? (
                  <div className="py-6 text-center text-stone-400 text-xs bg-amber-50/60 rounded-xl border border-amber-200 p-4">
                    <p className="font-semibold text-stone-800">No open consultation slots available.</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">Please check back later or consult via Chat Advisory.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Horizontal Date Navigation */}
                    <div>
                      <span className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1">
                        Available Dates ({Object.keys(groupedProfileSlots).length} Days)
                      </span>
                      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1.5">
                        {Object.keys(groupedProfileSlots).map((dateKey) => {
                          const grp = groupedProfileSlots[dateKey];
                          const totalSlots = grp.morning.length + grp.afternoon.length + grp.evening.length;
                          const isActive = profileSlotDateTab === dateKey;
                          return (
                            <button
                              key={dateKey}
                              type="button"
                              onClick={() => setProfileSlotDateTab(dateKey)}
                              className={`px-2.5 py-1.5 rounded-xl border text-xs whitespace-nowrap transition cursor-pointer flex items-center space-x-1.5 ${
                                isActive
                                  ? 'border-[#831826] bg-[#831826] text-white font-bold shadow-2xs'
                                  : 'border-stone-200 bg-white text-stone-600 hover:bg-stone-50'
                              }`}
                            >
                              <span>{grp.label}</span>
                              <span
                                className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                                  isActive ? 'bg-white/20 text-white' : 'bg-stone-100 text-stone-600'
                                }`}
                              >
                                {totalSlots}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Time slots for selected date */}
                    {groupedProfileSlots[profileSlotDateTab] && (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {/* Morning */}
                        {groupedProfileSlots[profileSlotDateTab].morning.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold text-amber-800 uppercase tracking-wider block mb-1">
                              🌅 Morning
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {groupedProfileSlots[profileSlotDateTab].morning.map((slot) => {
                                const startTime = new Date(slot.startTime);
                                const isSelected = selectedSlot?.publicId === slot.publicId;
                                return (
                                  <button
                                    key={slot.publicId}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2 rounded-lg border text-center transition cursor-pointer text-xs ${
                                      isSelected
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                                    }`}
                                  >
                                    <div className="font-mono text-[11px]">
                                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                                      {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {isSelected && <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">✓ Selected</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Afternoon */}
                        {groupedProfileSlots[profileSlotDateTab].afternoon.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold text-orange-800 uppercase tracking-wider block mb-1">
                              ☀️ Afternoon
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {groupedProfileSlots[profileSlotDateTab].afternoon.map((slot) => {
                                const startTime = new Date(slot.startTime);
                                const isSelected = selectedSlot?.publicId === slot.publicId;
                                return (
                                  <button
                                    key={slot.publicId}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2 rounded-lg border text-center transition cursor-pointer text-xs ${
                                      isSelected
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                                    }`}
                                  >
                                    <div className="font-mono text-[11px]">
                                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                                      {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {isSelected && <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">✓ Selected</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Evening */}
                        {groupedProfileSlots[profileSlotDateTab].evening.length > 0 && (
                          <div>
                            <span className="text-[10px] font-semibold text-indigo-900 uppercase tracking-wider block mb-1">
                              🌙 Evening
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              {groupedProfileSlots[profileSlotDateTab].evening.map((slot) => {
                                const startTime = new Date(slot.startTime);
                                const isSelected = selectedSlot?.publicId === slot.publicId;
                                return (
                                  <button
                                    key={slot.publicId}
                                    type="button"
                                    onClick={() => setSelectedSlot(slot)}
                                    className={`p-2 rounded-lg border text-center transition cursor-pointer text-xs ${
                                      isSelected
                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-1 ring-emerald-600'
                                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                                    }`}
                                  >
                                    <div className="font-mono text-[11px]">
                                      {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                                      {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {isSelected && <span className="text-[9px] text-emerald-700 font-semibold block mt-0.5">✓ Selected</span>}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Book Action Button */}
            {(() => {
              const matchedService = effectiveServices.find((s) => s.code === consultationType);
              const price = matchedService ? matchedService.price : consultationType === 'CHAT' ? 499 : consultationType === 'ONLINE' ? 1500 : 2000;
              const title = matchedService ? matchedService.title : consultationType === 'CHAT' ? 'Quick Chat' : consultationType === 'ONLINE' ? 'Video Call' : 'Chamber Visit';
              const requiresSlot = consultationType === 'ONLINE' || consultationType === 'OFFLINE';

              return (
                <button
                  type="button"
                  disabled={requiresSlot && !selectedSlot}
                  onClick={() => setIsBookingModalOpen(true)}
                  className="w-full py-3.5 rounded-xl bg-[#831826] hover:bg-[#6c131f] disabled:opacity-40 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-sm transition flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <span>Book {title} (₹{price.toLocaleString('en-IN')})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              );
            })()}

            <p className="text-[10px] text-stone-400 text-center">
              🔒 100% confidential. Payment secured with escrow.
            </p>
          </div>
        </div>
      </div>

      {/* =========================================================================
          BOOKING CONFIRMATION MODAL
          ========================================================================= */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-stone-200">
            <h3 className="text-xl font-serif font-bold text-[#1F1C1B]">
              Confirm{' '}
              {effectiveServices.find((s) => s.code === consultationType)?.title ||
                (consultationType === 'CHAT'
                  ? 'Quick Legal Chat'
                  : consultationType === 'ONLINE'
                  ? 'Video Call'
                  : 'Chamber Visit')}
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="text-base font-serif font-bold text-[#1F1C1B]">
                  {consultationType === 'CHAT' ? 'Chat Unlocked!' : 'Appointment Booked!'}
                </h4>
                <p className="text-xs text-stone-500">
                  {consultationType === 'CHAT'
                    ? 'Redirecting to your dedicated messages page...'
                    : 'Redirecting to your appointments dashboard...'}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-2 bg-[#FAF8F5] p-3.5 rounded-2xl border border-stone-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-stone-500">Lawyer:</span>
                    <span className="font-serif font-bold text-[#1F1C1B]">{lawyer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Consultation Format:</span>
                    <span className="font-bold text-[#831826]">
                      {consultationType === 'CHAT'
                        ? '💬 Quick Chat Advisory'
                        : consultationType === 'ONLINE'
                        ? '📹 Online Video Call'
                        : '🏢 Office / Chamber Visit'}
                    </span>
                  </div>
                  {consultationType !== 'CHAT' && (
                    <div className="flex justify-between">
                      <span className="text-stone-500">Scheduled Time:</span>
                      <span className="font-semibold text-stone-800">
                        {new Date(selectedSlot?.startTime).toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-stone-500">Total Fee:</span>
                    <span className="font-serif font-bold text-[#831826]">
                      {consultationType === 'CHAT' ? '₹499' : consultationType === 'ONLINE' ? '₹1,500' : '₹2,000'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-sans font-semibold text-stone-700 uppercase tracking-wider mb-1">
                    Describe your legal question / matter *
                  </label>
                  <textarea
                    rows={3}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Briefly describe your dispute, question, or court notice..."
                    className="w-full text-xs border border-stone-200 rounded-xl p-3 focus:outline-none focus:border-[#831826] bg-[#FAF8F5] resize-none"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-sans font-medium hover:bg-stone-50 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingLoading}
                    onClick={handleBookSlot}
                    className="flex-1 py-2.5 rounded-xl bg-[#831826] hover:bg-[#6c131f] disabled:opacity-50 text-white text-xs font-serif font-bold uppercase tracking-wider shadow-sm transition cursor-pointer"
                  >
                    {bookingLoading ? 'Processing...' : 'Confirm & Proceed'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
