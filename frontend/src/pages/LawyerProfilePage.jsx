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
        clientNotes: clientNotes.trim(),
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
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500">Loading advocate profile...</p>
      </div>
    );
  }

  if (!lawyer) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4 text-center">
        <h2 className="text-xl font-bold text-slate-800">Advocate Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">The requested profile could not be found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white font-extrabold flex items-center justify-center text-3xl shadow-lg">
            {lawyer.fullName?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900">{lawyer.fullName}</h1>
              <ShieldCheck className="w-5 h-5 text-emerald-500" title="Verified Advocate" />
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              Bar Council Enrollment: <span className="text-slate-800 font-semibold">{lawyer.barCouncilNumber}</span>
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-500">
              <span className="flex items-center space-x-1">
                <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                <span>{lawyer.yearsOfExperience || 5}+ Years Experience</span>
              </span>
              {lawyer.city && (
                <span className="flex items-center space-x-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lawyer.city}</span>
                </span>
              )}
              {lawyer.firmName && (
                <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 text-[11px] font-semibold">
                  {lawyer.firmName}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <button
            onClick={() => openChatWithUser(lawyer.userPublicId, lawyer.fullName)}
            className="flex-1 md:flex-none px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center space-x-2 transition"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Direct Message</span>
          </button>
          <div className="text-right pl-4 border-l border-slate-200">
            <span className="text-2xl font-extrabold text-blue-600">
              ₹{lawyer.hourlyRate || '1,500'}
            </span>
            <span className="text-[10px] text-slate-400 block font-medium">/ 60 mins consultation</span>
          </div>
        </div>
      </div>

      {/* Grid: Bio & Services (Left) vs. Available Slots (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Bio & Services) */}
        <div className="lg:col-span-2 space-y-6">
          {/* About / Bio */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <h2 className="text-base font-bold text-slate-900">Professional Background</h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {lawyer.bio ||
                'Experienced legal practitioner handling High Court and trial court litigation, dispute resolution, contract negotiation, and client advisory with high ethical standards.'}
            </p>
          </div>

          {/* Legal Services Offered */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900">Legal Consultation Services</h2>
            {services.length === 0 ? (
              <p className="text-xs text-slate-500">
                Standard legal video consultation available at ₹{lawyer.hourlyRate || '1,500'} / hour.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map((svc) => (
                  <div
                    key={svc.publicId}
                    onClick={() => setSelectedService(svc)}
                    className={`p-4 rounded-xl border cursor-pointer transition flex flex-col justify-between ${
                      selectedService?.publicId === svc.publicId
                        ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{svc.title}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{svc.description}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className="text-[10px] text-slate-400">{svc.durationMinutes} mins</span>
                      <span className="text-xs font-bold text-blue-600">₹{svc.fee}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Live Slot Picker) */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span>Available Slots</span>
              </h2>
              <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Live Calendar
              </span>
            </div>

            {slots.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs space-y-1">
                <Clock className="w-8 h-8 mx-auto text-slate-300" />
                <p>No open slots currently available.</p>
                <p className="text-[11px]">Send a direct message to request an ad-hoc meeting.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                {slots.map((slot) => {
                  const startTime = new Date(slot.startTime);
                  const isSelected = selectedSlot?.publicId === slot.publicId;
                  return (
                    <button
                      key={slot.publicId}
                      onClick={() => setSelectedSlot(slot)}
                      className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-600 text-white shadow-md'
                          : 'border-slate-200 hover:border-blue-400 bg-slate-50 text-slate-800'
                      }`}
                    >
                      <div>
                        <p className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                          {startTime.toLocaleDateString(undefined, {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                        <p className={`text-[11px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                          {new Date(slot.endTime).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                          isSelected ? 'bg-blue-700 text-white' : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Book'}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Book Now Button */}
            <button
              disabled={!selectedSlot}
              onClick={() => setIsBookingModalOpen(true)}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white font-bold text-xs shadow-md transition flex items-center justify-center space-x-2"
            >
              <span>Proceed to Book Slot</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Booking Modal */}
      {isBookingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900">Confirm Consultation Booking</h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {bookingSuccess ? (
              <div className="p-6 text-center space-y-2">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
                <h4 className="text-base font-bold text-slate-900">Slot Reserved Successfully!</h4>
                <p className="text-xs text-slate-500">
                  Redirecting to your client consultations dashboard...
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Advocate:</span>
                    <span className="font-bold text-slate-900">{lawyer.fullName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Time:</span>
                    <span className="font-bold text-slate-900">
                      {new Date(selectedSlot?.startTime).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Fee:</span>
                    <span className="font-bold text-blue-600">
                      ₹{selectedService?.fee || lawyer.hourlyRate || '1,500'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Matter Description / Brief Notes
                  </label>
                  <textarea
                    rows={3}
                    value={clientNotes}
                    onChange={(e) => setClientNotes(e.target.value)}
                    placeholder="Briefly describe your legal query or documents to review..."
                    className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsBookingModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingLoading}
                    onClick={handleBookSlot}
                    className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                  >
                    {bookingLoading ? 'Reserving Slot...' : 'Confirm & Reserve'}
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
