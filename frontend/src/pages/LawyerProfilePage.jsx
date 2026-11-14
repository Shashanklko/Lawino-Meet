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
  const [selectedService, setSelectedService] = useState(null);
  const [consultationType, setConsultationType] = useState('ONLINE'); // 'ONLINE' | 'OFFLINE'
  const [clientNotes, setClientNotes] = useState('');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

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

        if (lawyerRes.status === 'fulfilled' && lawyerRes.value.success) {
          setLawyer(lawyerRes.value.data);
        }
        if (servicesRes.status === 'fulfilled' && servicesRes.value.success) {
          setServices(servicesRes.value.data || []);
        }
        if (slotsRes.status === 'fulfilled' && slotsRes.value.success) {
          setSlots(slotsRes.value.data || []);
        }
      } catch (err) {
        console.error('Failed to load advocate profile:', err);
        setError('Failed to load advocate profile');
      } finally {
        setLoading(false);
      }
    };

    fetchLawyerData();
  }, [lawyerPublicId]);

  const handleBookSlot = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!selectedSlot) return;

    setBookingLoading(true);
    setError('');

    try {
      const payload = {
        slotPublicId: selectedSlot.publicId,
        servicePublicId: selectedService?.publicId || null,
        clientNotes: `[${consultationType}] ${clientNotes.trim()}`,
      };

      const res = await appointmentApi.reserveAppointment(payload);
      if (res.success) {
        setBookingSuccess(true);
        setTimeout(() => {
          navigate('/dashboard/client');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to reserve appointment');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3 bg-cream-50 min-h-screen">
        <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-serif text-maroon-800">Loading advocate chamber profile...</p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="max-w-3xl mx-auto py-24 px-4 text-center bg-cream-50">
        <h2 className="text-2xl font-serif font-bold text-maroon-950">Advocate Not Found</h2>
        <p className="text-xs text-stone-500 mt-2">The requested legal practitioner could not be found.</p>
      </div>
    );
  }

  return (
    <div className="bg-cream-50 min-h-screen py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Profile Header Card */}
        <div className="bg-white rounded-3xl border border-cream-300 p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-maroon-900 to-maroon-800 text-luxury-gold font-serif font-black flex items-center justify-center text-3xl shadow-lg border border-luxury-gold/40">
              {lawyer.fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-2xl font-serif font-extrabold text-maroon-950">{lawyer.fullName}</h1>
                <ShieldCheck className="w-5 h-5 text-emerald-600" title="State Bar Verified" />
              </div>
              <p className="text-xs text-stone-500 font-mono mt-0.5">
                Bar Council Enrollment: <span className="text-maroon-900 font-semibold">{lawyer.barCouncilNumber}</span>
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-stone-600">
                <span className="flex items-center space-x-1">
                  <Briefcase className="w-3.5 h-3.5 text-luxury-gold" />
                  <span>{lawyer.yearsOfExperience || 5}+ Years Practice</span>
                </span>
                {lawyer.city && (
                  <span className="flex items-center space-x-1">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{lawyer.city}</span>
                  </span>
                )}
                {lawyer.firmName && (
                  <span className="px-2 py-0.5 rounded-md bg-maroon-50 text-maroon-900 text-[11px] font-semibold border border-maroon-200">
                    {lawyer.firmName}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4 w-full md:w-auto">
            <button
              onClick={() => openChatWithUser(lawyer.userPublicId, lawyer.fullName)}
              className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-maroon-800 text-maroon-900 hover:bg-maroon-50 text-xs font-serif font-bold flex items-center justify-center space-x-2 transition"
            >
              <MessageSquare className="w-4 h-4 text-luxury-gold" />
              <span>Direct Chat</span>
            </button>
            <div className="text-right pl-4 border-l border-cream-300">
              <span className="text-2xl font-serif font-extrabold text-maroon-900">
                ₹{lawyer.hourlyRate || '1,500'}
              </span>
              <span className="text-[10px] text-stone-500 block font-sans">/ consultation retainer</span>
            </div>
          </div>
        </div>

        {/* Grid: Bio & Services (Left) vs. Mode Selector & Slots (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Background & Legal Services */}
          <div className="lg:col-span-2 space-y-6">
            {/* Background Bio */}
            <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm space-y-3">
              <h2 className="text-base font-serif font-bold text-maroon-950">Professional Background</h2>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed whitespace-pre-line">
                {lawyer.bio ||
                  'High Court and Supreme Court advocate specializing in complex civil litigation, corporate dispute resolution, commercial arbitration, and criminal trial defense with complete confidentiality.'}
              </p>
            </div>

            {/* Chamber Address Information */}
            <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm space-y-3">
              <div className="flex items-center space-x-2 text-maroon-900 font-serif font-bold text-sm">
                <Building className="w-4 h-4 text-luxury-gold" />
                <span>Chamber & Court Practice Location</span>
              </div>
              <p className="text-xs text-stone-600">
                {lawyer.city || 'New Delhi'} Jurisdiction • High Court Bar Association Member
              </p>
              <div className="p-3 bg-cream-100 rounded-xl border border-cream-300 text-xs text-stone-600 flex items-start space-x-2">
                <Info className="w-4 h-4 text-maroon-800 shrink-0 mt-0.5" />
                <span>
                  <strong>Chamber Privacy Policy:</strong> In-person meetings take place at advocate's chamber. Exact room/hall location and payment details unlock in your dashboard after the advocate accepts your requested matter.
                </span>
              </div>
            </div>

            {/* Legal Services Offered */}
            <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-sm space-y-4">
              <h2 className="text-base font-serif font-bold text-maroon-950">Legal Consultation Tiers</h2>
              {services.length === 0 ? (
                <p className="text-xs text-stone-500">
                  Standard legal advisory available at ₹{lawyer.hourlyRate || '1,500'}.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {services.map((svc) => (
                    <div
                      key={svc.publicId}
                      onClick={() => setSelectedService(svc)}
                      className={`p-4 rounded-2xl border cursor-pointer transition flex flex-col justify-between ${
                        selectedService?.publicId === svc.publicId
                          ? 'border-maroon-800 bg-maroon-50/50 ring-2 ring-maroon-800/20'
                          : 'border-cream-300 hover:border-luxury-gold bg-cream-50/50'
                      }`}
                    >
                      <div>
                        <h4 className="font-serif font-bold text-xs text-maroon-950">{svc.title}</h4>
                        <p className="text-[11px] text-stone-500 mt-1 line-clamp-2">{svc.description}</p>
                      </div>
                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-cream-200">
                        <span className="text-[10px] text-stone-400">{svc.durationMinutes} mins</span>
                        <span className="text-xs font-serif font-bold text-maroon-900">₹{svc.fee}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Consultation Mode + Slot Booking */}
          <div className="space-y-6">
            <div className="bg-white rounded-3xl border border-cream-300 p-6 shadow-xl space-y-6">
              {/* Step 1: Select Consultation Mode */}
              <div className="space-y-2">
                <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-maroon-900">
                  1. Choose Consultation Mode
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConsultationType('ONLINE')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                      consultationType === 'ONLINE'
                        ? 'border-maroon-800 bg-maroon-900 text-cream-100 shadow-md'
                        : 'border-cream-300 bg-cream-100/60 text-stone-700 hover:border-luxury-gold'
                    }`}
                  >
                    <Video className={`w-4 h-4 ${consultationType === 'ONLINE' ? 'text-luxury-gold' : 'text-stone-500'}`} />
                    <span className="text-xs font-serif font-bold">Online Video</span>
                    <span className="text-[9px] opacity-80">Encrypted WebRTC</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConsultationType('OFFLINE')}
                    className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center space-y-1 ${
                      consultationType === 'OFFLINE'
                        ? 'border-maroon-800 bg-maroon-900 text-cream-100 shadow-md'
                        : 'border-cream-300 bg-cream-100/60 text-stone-700 hover:border-luxury-gold'
                    }`}
                  >
                    <Building className={`w-4 h-4 ${consultationType === 'OFFLINE' ? 'text-luxury-gold' : 'text-stone-500'}`} />
                    <span className="text-xs font-serif font-bold">Chamber In-Person</span>
                    <span className="text-[9px] opacity-80">Court Chamber</span>
                  </button>
                </div>
              </div>

              {/* Consultation Mode Explanatory Pill */}
              {consultationType === 'OFFLINE' ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold font-serif flex items-center space-x-1">
                    <Lock className="w-3.5 h-3.5 text-amber-700" />
                    <span>Chamber Approval Protocol</span>
                  </p>
                  <p className="text-[10px] leading-relaxed text-amber-800">
                    You submit matter notes for the advocate to review court calendar. Once approved, exact chamber address and payment details unlock.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 space-y-1">
                  <p className="font-bold font-serif flex items-center space-x-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Instant Virtual Consultation</span>
                  </p>
                  <p className="text-[10px] leading-relaxed text-emerald-800">
                    High definition peer-to-peer video conference accessible from any browser on scheduled time.
                  </p>
                </div>
              )}

              {/* Step 2: Choose Slot */}
              <div className="space-y-3">
                <label className="block text-[11px] font-serif font-bold uppercase tracking-wider text-maroon-900">
                  2. Select Calendar Slot
                </label>

                {slots.length === 0 ? (
                  <div className="py-8 text-center text-stone-400 text-xs space-y-1">
                    <Clock className="w-7 h-7 mx-auto text-stone-300" />
                    <p>No open slots currently available.</p>
                    <p className="text-[10px]">Send a direct message to request an ad-hoc session.</p>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {slots.map((slot) => {
                      const startTime = new Date(slot.startTime);
                      const isSelected = selectedSlot?.publicId === slot.publicId;
                      return (
                        <button
                          key={slot.publicId}
                          onClick={() => setSelectedSlot(slot)}
                          className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between ${
                            isSelected
                              ? 'border-maroon-800 bg-maroon-900 text-cream-100 shadow-md'
                              : 'border-cream-300 hover:border-luxury-gold bg-cream-50/60 text-stone-800'
                          }`}
                        >
                          <div>
                            <p className={`text-xs font-serif font-bold ${isSelected ? 'text-cream-50' : 'text-maroon-950'}`}>
                              {startTime.toLocaleDateString(undefined, {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className={`text-[10px] ${isSelected ? 'text-luxury-gold-light' : 'text-stone-500'}`}>
                              {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                              {new Date(slot.endTime).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <span
                            className={`text-[10px] font-serif font-bold px-2 py-0.5 rounded-lg ${
                              isSelected ? 'bg-luxury-gold text-maroon-950' : 'bg-cream-200 text-maroon-900'
                            }`}
                          >
                            {isSelected ? 'Selected' : 'Select'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Step 3: Action Button */}
              <button
                disabled={!selectedSlot}
                onClick={() => setIsBookingModalOpen(true)}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 disabled:opacity-40 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center space-x-2"
              >
                <span>{consultationType === 'OFFLINE' ? 'Request Chamber Meeting' : 'Proceed to Book Video'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Booking Modal */}
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-cream-300">
              <h3 className="text-xl font-serif font-black text-maroon-950">
                Confirm {consultationType === 'OFFLINE' ? 'Chamber' : 'Video'} Consultation
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
                  <h4 className="text-base font-serif font-bold text-maroon-950">
                    {consultationType === 'OFFLINE' ? 'Chamber Request Dispatched!' : 'Video Slot Reserved!'}
                  </h4>
                  <p className="text-xs text-stone-500">
                    {consultationType === 'OFFLINE'
                      ? 'Advocate will review and confirm. Chamber address and payment will unlock upon approval.'
                      : 'Redirecting to your consultations dashboard...'}
                  </p>
                </div>
              ) : (
                <>
                  <div className="space-y-3 bg-cream-100 p-4 rounded-2xl border border-cream-300 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Advocate:</span>
                      <span className="font-serif font-bold text-maroon-950">{lawyer.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Consultation Format:</span>
                      <span className="font-bold text-maroon-900">
                        {consultationType === 'OFFLINE' ? '🏛️ Chamber In-Person' : '🌐 Online Video'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Scheduled Date & Time:</span>
                      <span className="font-semibold text-stone-800">
                        {new Date(selectedSlot?.startTime).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Estimated Retainer:</span>
                      <span className="font-serif font-bold text-maroon-900">
                        ₹{selectedService?.fee || lawyer.hourlyRate || '1,500'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-serif font-bold text-maroon-900 uppercase tracking-wider mb-1">
                      Brief Matter Statement / Documents
                    </label>
                    <textarea
                      rows={3}
                      value={clientNotes}
                      onChange={(e) => setClientNotes(e.target.value)}
                      placeholder="Briefly state your dispute, court jurisdiction, or legal advisory need..."
                      className="w-full text-xs border border-cream-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-luxury-gold"
                    />
                  </div>

                  <div className="flex items-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsBookingModalOpen(false)}
                      className="flex-1 py-2.5 rounded-xl border border-stone-300 text-stone-700 text-xs font-serif font-bold hover:bg-stone-50 transition"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={bookingLoading}
                      onClick={handleBookSlot}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 disabled:opacity-50 text-maroon-950 text-xs font-serif font-black uppercase tracking-wider shadow-md transition"
                    >
                      {bookingLoading ? 'Submitting...' : 'Confirm Request'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
