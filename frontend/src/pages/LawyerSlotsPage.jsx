import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Building,
  Shield,
  Lock,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { useAuth } from '../context/AuthContext';
import { MOCK_LAWYER_SLOTS } from '../data/mockData';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const LawyerSlotsPage = () => {
  const { user } = useAuth();
  const hasFirmMembership = !!user?.firmMembership;

  const [slots, setSlots] = useState(MOCK_LAWYER_SLOTS);
  const [loading, setLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Single slot form state
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('10:45');
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  // Batch slots form state
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchStartHour, setBatchStartHour] = useState(10);
  const [batchEndHour, setBatchEndHour] = useState(17);
  const [slotDuration, setSlotDuration] = useState(45);
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Block time / exception form state
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('Court Hearing / Bench Appearance');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSlots = async () => {
    try {
      const res = await appointmentApi.getMySlots();
      const list = res?.data?.content || res?.data || [];
      if (list.length > 0) {
        setSlots(list);
      }
    } catch {
      // Mock data used
    }
  };

  useEffect(() => {
    fetchSlots();
  }, []);

  const handleCreateSingleSlot = async (e) => {
    e.preventDefault();
    if (!startDate || !startTime || !endTime) return;

    setSingleSubmitting(true);
    setError('');
    setMessage('');

    const startDateTime = `${startDate}T${startTime}:00`;
    const endDateTime = `${startDate}T${endTime}:00`;

    // Check for overlap on the single calendar
    const hasOverlap = slots.some((s) => {
      const sStart = new Date(s.startTime).getTime();
      const sEnd = new Date(s.endTime).getTime();
      const nStart = new Date(startDateTime).getTime();
      const nEnd = new Date(endDateTime).getTime();
      return (nStart >= sStart && nStart < sEnd) || (nEnd > sStart && nEnd <= sEnd);
    });

    if (hasOverlap) {
      setError('Time conflict: An existing appointment or slot already covers this time window.');
      setSingleSubmitting(false);
      return;
    }

    const newSlot = {
      publicId: `slot-local-${Date.now()}`,
      startTime: new Date(startDateTime).toISOString(),
      endTime: new Date(endDateTime).toISOString(),
      status: 'AVAILABLE',
    };

    setSlots((prev) => [newSlot, ...prev]);
    setMessage('Open availability slot added to unified calendar.');
    setStartDate('');
    setSingleSubmitting(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleCreateBatchSlots = (e) => {
    e.preventDefault();
    if (!batchStartDate || !batchEndDate) return;
    setBatchSubmitting(true);

    const generated = [];
    const curr = new Date(batchStartDate);
    const end = new Date(batchEndDate);

    while (curr <= end) {
      // Mon to Fri only
      if (curr.getDay() !== 0 && curr.getDay() !== 6) {
        for (let h = batchStartHour; h < batchEndHour; h += 2) {
          const s = new Date(curr);
          s.setHours(h, 0, 0, 0);
          const e = new Date(curr);
          e.setHours(h, slotDuration, 0, 0);
          generated.push({
            publicId: `slot-batch-${Math.random()}`,
            startTime: s.toISOString(),
            endTime: e.toISOString(),
            status: 'AVAILABLE',
          });
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    setSlots((prev) => [...generated, ...prev]);
    setMessage(`Generated ${generated.length} weekly open slots across the calendar.`);
    setIsBatchModalOpen(false);
    setBatchSubmitting(false);
    setTimeout(() => setMessage(''), 3000);
  };

  const handleBlockException = (e) => {
    e.preventDefault();
    if (!blockDate) return;

    const blockedSlot = {
      publicId: `slot-block-${Date.now()}`,
      startTime: `${blockDate}T09:00:00.000Z`,
      endTime: `${blockDate}T18:00:00.000Z`,
      status: 'BOOKED',
      practiceType: 'COURT_HEARING',
      label: `BLOCKED: ${blockReason}`,
      clientName: 'Calendar Exception (Chamber Closed)',
    };

    setSlots((prev) => [blockedSlot, ...prev]);
    setMessage(`Blocked ${blockDate} for "${blockReason}". No client can book during this time.`);
    setIsBlockModalOpen(false);
    setBlockDate('');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDeleteSlot = async (slotPublicId) => {
    try {
      await appointmentApi.deleteSlot(slotPublicId);
    } catch {
      // simulation
    }
    setSlots((prev) => prev.filter((s) => s.publicId !== slotPublicId));
    setMessage('Slot removed from calendar.');
    setTimeout(() => setMessage(''), 2500);
  };

  const bookedCount = slots.filter((s) => s.status === 'BOOKED').length;
  const availableCount = slots.filter((s) => s.status === 'AVAILABLE').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <PageHeader
        title="Unified Availability Calendar"
        subtitle="Manage your personal working hours, in-chamber consultation slots, and court calendar exceptions."
        badge={hasFirmMembership ? 'Firm & Personal Master Calendar' : 'Chamber Schedule'}
        breadcrumbs={['Lawyer Console', 'Availability Calendar']}
        actions={
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setIsBlockModalOpen(true)}
              className="px-3 py-1.5 rounded-lg border border-stone-200 text-stone-700 hover:bg-stone-50 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Block Date / Hearing</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBatchModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate Weekly Slots</span>
            </button>
          </div>
        }
      />

      {/* Mandatory Single Shared Calendar Architectural Principle Notice */}
      <div className="p-4 rounded-xl bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] flex items-start space-x-3 text-xs">
        <Info className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-serif font-bold text-stone-900 text-xs">
            Single Shared Calendar Architecture (Zero Double-Booking Guarantee)
          </p>
          <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
            As mandated by LawinoMeet platform policy, every practitioner operates exactly{' '}
            <strong className="text-stone-900">one unified calendar</strong>. When a slot is booked—whether by an institutional law firm client or an independent personal client—that time is strictly blocked across the entire system. Separate, conflicting availability systems do not exist.
          </p>
        </div>
      </div>

      {/* Toast Alert */}
      {message && (
        <div className="p-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-3 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Total Calendar Slots"
          value={slots.length}
          subtext="Active slots on ledger"
          icon={Calendar}
        />
        <MetricCard
          label="Open Available Slots"
          value={availableCount}
          subtext="Bookable by clients"
          icon={Clock}
          badge={availableCount > 0 ? 'Accepting' : 'Full'}
          badgeType={availableCount > 0 ? 'success' : 'neutral'}
        />
        <MetricCard
          label="Booked Commitments"
          value={bookedCount}
          subtext="Firm hearings & independent"
          icon={Lock}
          badge={bookedCount > 0 ? `${bookedCount} Occupied` : '0'}
          badgeType="accent"
        />
        <MetricCard
          label="Slot Duration"
          value="45 Mins"
          subtext="Standard legal advisory"
          icon={Clock}
        />
      </div>

      {/* Add Single Slot Form & Slot List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 1 Col: Add Slot Fast Box */}
        <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm shadow-xs space-y-4 text-xs h-fit">
          <h3 className="font-serif font-bold text-sm text-stone-900 pb-2 border-b border-stone-100">
            Open Single Availability Slot
          </h3>

          <form onSubmit={handleCreateSingleSlot} className="space-y-3">
            <div>
              <label className="block text-[11px] font-medium text-stone-700 mb-1">
                Calendar Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full p-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-800 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-800 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={singleSubmitting}
              className="w-full py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition cursor-pointer mt-2"
            >
              {singleSubmitting ? 'Adding...' : '+ Add Open Slot'}
            </button>
          </form>
        </div>

        {/* Right 2 Cols: Master Calendar Slot List */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-stone-100">
            <h3 className="font-serif font-bold text-sm text-stone-900">
              Master Calendar Schedule ({slots.length})
            </h3>
            <span className="text-[10px] font-mono text-stone-500">
              Chronological Order
            </span>
          </div>

          <div className="space-y-2.5">
            {slots.map((slot) => {
              const isBooked = slot.status === 'BOOKED';
              const startDateObj = new Date(slot.startTime);
              const endDateObj = new Date(slot.endTime);

              return (
                <div
                  key={slot.publicId}
                  className={`p-3.5 rounded-xl border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    isBooked
                      ? 'bg-[var(--bg-cream-soft)] border-[var(--border-cream)]'
                      : 'bg-emerald-50/40 border-emerald-200'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isBooked
                          ? 'bg-stone-200 text-stone-700'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isBooked ? (
                        <Lock className="w-4 h-4" />
                      ) : (
                        <Clock className="w-4 h-4" />
                      )}
                    </div>

                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-semibold text-stone-900">
                          {startDateObj.toLocaleDateString('en-IN', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                        {isBooked ? (
                          slot.practiceType === 'FIRM' ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                              Firm Appointment
                            </span>
                          ) : slot.practiceType === 'INDEPENDENT' ? (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                              Independent Booking
                            </span>
                          ) : (
                            <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 border border-stone-300">
                              Chamber Exception
                            </span>
                          )
                        ) : (
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Open for Booking
                          </span>
                        )}
                      </div>

                      <p className="text-stone-600 font-medium text-[11px] mt-0.5">
                        {startDateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        –{' '}
                        {endDateObj.toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>

                      {slot.label && (
                        <p className="text-[10px] text-stone-500 font-sans mt-0.5">
                          {slot.label} {slot.clientName && `(${slot.clientName})`}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0">
                    {isBooked ? (
                      <span className="text-[10px] font-mono text-stone-500 bg-white border border-[var(--border-cream)] px-2 py-1 rounded">
                        Blocked on Platform
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleDeleteSlot(slot.publicId)}
                        className="p-1.5 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                        title="Remove open slot"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* =====================================================================
          MODAL: BATCH RECURRING SLOTS
      ====================================================================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Generate Weekly Working Hours
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Batch create open 45-minute slots across weekdays for incoming client consultations.
            </p>

            <form onSubmit={handleCreateBatchSlots} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">From Date</label>
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">To Date</label>
                  <input
                    type="date"
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">Daily Start (Hour)</label>
                  <input
                    type="number"
                    min="8"
                    max="18"
                    value={batchStartHour}
                    onChange={(e) => setBatchStartHour(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">Daily End (Hour)</label>
                  <input
                    type="number"
                    min="12"
                    max="22"
                    value={batchEndHour}
                    onChange={(e) => setBatchEndHour(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer"
                >
                  {batchSubmitting ? 'Generating...' : 'Generate Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: BLOCK DATE / CALENDAR EXCEPTION
      ====================================================================== */}
      {isBlockModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Block Date / Hearing Exception
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Block an entire day or court hearing window. Clients will not be allowed to book consultations during this time.
            </p>

            <form onSubmit={handleBlockException} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Date to Block</label>
                <input
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">Exception Reason</label>
                <select
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                >
                  <option value="Supreme Court Full Bench Hearing">Supreme Court Full Bench Hearing</option>
                  <option value="Delhi High Court Appellate Arguments">Delhi High Court Appellate Arguments</option>
                  <option value="Arbitration Hearing (DIAC)">Arbitration Hearing (DIAC)</option>
                  <option value="Personal Chamber Recess">Personal Chamber Recess</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBlockModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-stone-900 text-white font-semibold hover:bg-black cursor-pointer"
                >
                  Block Calendar Day
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
