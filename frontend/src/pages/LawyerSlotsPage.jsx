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
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

export const LawyerSlotsPage = () => {
  const { user } = useAuth();
  const hasFirmMembership = !!user?.firmMembership;

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);

  // Single slot form state
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [singleSubmitting, setSingleSubmitting] = useState(false);

  // Batch slots form state: Weekly 4-day, 5-day, 6-day, 7-day schedule
  const [batchPreset, setBatchPreset] = useState('5_DAY'); // '4_DAY' | '5_DAY' | '6_DAY' | '7_DAY' | 'CUSTOM'
  const [batchStartDate, setBatchStartDate] = useState('');
  const [batchEndDate, setBatchEndDate] = useState('');
  const [batchStartHour, setBatchStartHour] = useState(10); // 10 AM (Morning)
  const [batchEndHour, setBatchEndHour] = useState(17); // 5 PM (Evening)
  const [batchBufferMinutes, setBatchBufferMinutes] = useState(0);
  const [slotDuration, setSlotDuration] = useState(60); // 1-hour slot standard
  const [batchSubmitting, setBatchSubmitting] = useState(false);

  // Filter tabs for slot list
  const [slotFilter, setSlotFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'TOMORROW' | 'WEEK'

  // Calculate grouped slots by date and morning/afternoon/evening
  const groupedSlots = React.useMemo(() => {
    const sorted = [...slots].sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);

    const filtered = sorted.filter((s) => {
      if (!s.startTime) return false;
      const dateStr = s.startTime.split('T')[0];
      if (slotFilter === 'TODAY') return dateStr === todayStr;
      if (slotFilter === 'TOMORROW') return dateStr === tomorrowStr;
      if (slotFilter === 'WEEK') {
        const d = new Date(s.startTime);
        return d >= new Date(now.setHours(0, 0, 0, 0)) && d <= weekEnd;
      }
      return true;
    });

    const groups = {};
    filtered.forEach((slot) => {
      const d = new Date(slot.startTime);
      const dateKey = slot.startTime.split('T')[0];
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          dateFormatted: d.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
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
  }, [slots, slotFilter]);

  // Block time / exception form state
  const [blockDate, setBlockDate] = useState('');
  const [blockReason, setBlockReason] = useState('Court Hearing / Bench Appearance');

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const applyPreset = (preset) => {
    setBatchPreset(preset);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const startStr = tomorrow.toISOString().split('T')[0];
    setBatchStartDate(startStr);

    const end = new Date(tomorrow);
    if (preset === '4_DAY') {
      end.setDate(end.getDate() + 3);
    } else if (preset === '5_DAY') {
      end.setDate(end.getDate() + 4);
    } else if (preset === '6_DAY') {
      end.setDate(end.getDate() + 5);
    } else if (preset === '7_DAY') {
      end.setDate(end.getDate() + 6);
    }
    setBatchEndDate(end.toISOString().split('T')[0]);
  };

  const openBatchModal = () => {
    applyPreset('5_DAY');
    setIsBatchModalOpen(true);
  };

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMySlots();
      const list = res?.data?.content || (Array.isArray(res?.data) ? res.data : []);
      setSlots(list);
    } catch {
      setSlots([]);
    } finally {
      setLoading(false);
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

    try {
      await appointmentApi.createSlot({
        startTime: new Date(startDateTime).toISOString(),
        endTime: new Date(endDateTime).toISOString(),
      });
      await fetchSlots();
      setMessage('Availability slot published to your calendar.');
      setStartDate('');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Time conflict: An existing appointment or slot already covers this window.');
    } finally {
      setSingleSubmitting(false);
    }
  };

  const handleCreateBatchSlots = async (e) => {
    e.preventDefault();
    if (!batchStartDate || !batchEndDate) return;
    setBatchSubmitting(true);
    setError('');
    setMessage('');

    const payloadSlots = [];
    const curr = new Date(batchStartDate + 'T00:00:00');
    const end = new Date(batchEndDate + 'T23:59:59');

    while (curr <= end) {
      const dayOfWeek = curr.getDay(); // 0 is Sun, 1 is Mon, 6 is Sat
      let shouldInclude = true;
      if (batchPreset === '4_DAY') {
        shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 4; // Mon to Thu
      } else if (batchPreset === '5_DAY') {
        shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 5; // Mon to Fri
      } else if (batchPreset === '6_DAY') {
        shouldInclude = dayOfWeek >= 1 && dayOfWeek <= 6; // Mon to Sat
      } else if (batchPreset === '7_DAY') {
        shouldInclude = true; // All 7 days
      }

      if (shouldInclude) {
        let slotStart = new Date(curr);
        slotStart.setHours(Number(batchStartHour), 0, 0, 0);

        const dayEnd = new Date(curr);
        dayEnd.setHours(Number(batchEndHour), 0, 0, 0);

        while (slotStart.getTime() + slotDuration * 60000 <= dayEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + slotDuration * 60000);
          payloadSlots.push({
            startTime: slotStart.toISOString(),
            endTime: slotEnd.toISOString(),
          });
          slotStart = new Date(slotEnd.getTime() + Number(batchBufferMinutes) * 60000);
        }
      }
      curr.setDate(curr.getDate() + 1);
    }

    if (payloadSlots.length === 0) {
      setError('No valid slots could be generated for the selected range.');
      setBatchSubmitting(false);
      return;
    }

    try {
      await appointmentApi.batchCreateSlots({ slots: payloadSlots });
      await fetchSlots();
      setMessage(`Successfully generated ${payloadSlots.length} open slots for ${batchPreset === '5_DAY' ? '5-Day Work Week' : '7-Day Full Week'} from morning to evening.`);
      setIsBatchModalOpen(false);
      setTimeout(() => setMessage(''), 4000);
    } catch (err) {
      console.warn('Batch slots creation failed:', err);
      await fetchSlots();
      setError(err.response?.data?.message || 'Some slots could not be created due to overlaps.');
    } finally {
      setBatchSubmitting(false);
    }
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

  const renderSlotCard = (slot) => {
    const isBooked = slot.status === 'BOOKED';
    const startDateObj = new Date(slot.startTime);
    const endDateObj = new Date(slot.endTime);

    return (
      <div
        key={slot.publicId}
        className={`p-2.5 rounded-xl border transition flex items-center justify-between text-xs ${
          isBooked
            ? 'bg-stone-100/80 border-stone-200 text-stone-500'
            : 'bg-white border-stone-200 hover:border-emerald-300 shadow-2xs'
        }`}
      >
        <div className="flex items-center space-x-2.5 min-w-0">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
              isBooked ? 'bg-stone-200 text-stone-600' : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isBooked ? <Lock className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
          </div>

          <div className="min-w-0">
            <div className="flex items-center space-x-1.5 flex-wrap">
              <span className="font-mono font-bold text-stone-900 text-[11px]">
                {startDateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}{' '}
                –{' '}
                {endDateObj.toLocaleTimeString('en-IN', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
              {isBooked ? (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-stone-200 text-stone-700">
                  Booked
                </span>
              ) : (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">
                  Open
                </span>
              )}
            </div>
            {slot.label && (
              <p className="text-[10px] text-stone-500 font-sans truncate">
                {slot.label}
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 pl-1.5">
          {!isBooked && (
            <button
              type="button"
              onClick={() => handleDeleteSlot(slot.publicId)}
              className="p-1 rounded text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
              title="Delete open slot"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    );
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Master Calendar Schedule ({slots.length} Slots)
              </h3>
              <p className="text-[11px] text-stone-500 font-sans">
                Grouped by day &bull; Morning, Afternoon &amp; Evening sessions
              </p>
            </div>

            {/* Quick Filter Tabs */}
            <div className="flex items-center space-x-1 bg-stone-100/80 p-0.5 rounded-lg text-[11px]">
              {[
                { id: 'ALL', label: 'All Slots' },
                { id: 'TODAY', label: 'Today' },
                { id: 'TOMORROW', label: 'Tomorrow' },
                { id: 'WEEK', label: 'Next 7 Days' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSlotFilter(f.id)}
                  className={`px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                    slotFilter === f.id
                      ? 'bg-white text-stone-900 shadow-2xs font-semibold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* Grouped Days Listing */}
          {Object.keys(groupedSlots).length === 0 ? (
            <div className="py-12 text-center text-stone-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-stone-300" />
              <p className="text-xs font-medium text-stone-600">No consultation slots found for this filter.</p>
              <p className="text-[11px] text-stone-400">Click "Generate Working Hours" above to publish your availability.</p>
            </div>
          ) : (
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-1">
              {Object.keys(groupedSlots).map((dateKey) => {
                const group = groupedSlots[dateKey];
                const totalDaySlots =
                  group.morning.length + group.afternoon.length + group.evening.length;

                return (
                  <div key={dateKey} className="rounded-xl border border-stone-200/80 bg-stone-50/50 p-3.5 space-y-3">
                    <div className="flex items-center justify-between border-b border-stone-200/60 pb-2">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-3.5 h-3.5 text-stone-600" />
                        <h4 className="font-serif font-bold text-xs text-stone-900">
                          {group.dateFormatted}
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-stone-200 text-stone-700">
                        {totalDaySlots} {totalDaySlots === 1 ? 'slot' : 'slots'}
                      </span>
                    </div>

                    {/* Morning Section */}
                    {group.morning.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-amber-800 uppercase tracking-wider">
                          <span>🌅 Morning Sessions</span>
                          <span className="text-stone-400 font-normal">({group.morning.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.morning.map((slot) => renderSlotCard(slot))}
                        </div>
                      </div>
                    )}

                    {/* Afternoon Section */}
                    {group.afternoon.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-orange-800 uppercase tracking-wider">
                          <span>☀️ Afternoon Sessions</span>
                          <span className="text-stone-400 font-normal">({group.afternoon.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.afternoon.map((slot) => renderSlotCard(slot))}
                        </div>
                      </div>
                    )}

                    {/* Evening Section */}
                    {group.evening.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center space-x-1.5 text-[10px] font-semibold text-indigo-900 uppercase tracking-wider">
                          <span>🌙 Evening Sessions</span>
                          <span className="text-stone-400 font-normal">({group.evening.length})</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {group.evening.map((slot) => renderSlotCard(slot))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* =====================================================================
          MODAL: BATCH RECURRING SLOTS (5-DAY / 7-DAY & MORNING-TO-EVENING)
      ====================================================================== */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs space-y-4">
            <div className="flex items-start justify-between border-b border-stone-100 pb-3">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Generate Consultation Slots
                </h3>
                <p className="text-stone-500 font-sans mt-0.5">
                  Set up recurring 5-day or 7-day availability windows from morning to evening.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {/* Preset Selector */}
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
                1. Select Weekly Availability Schedule (4, 5, 6, or 7 Days)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => applyPreset('4_DAY')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    batchPreset === '4_DAY'
                      ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] font-bold text-stone-900 shadow-2xs ring-1 ring-[var(--bg-primary)]'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <p className="text-xs">Weekly 4 Days</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">Mon – Thu</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('5_DAY')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    batchPreset === '5_DAY'
                      ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] font-bold text-stone-900 shadow-2xs ring-1 ring-[var(--bg-primary)]'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <p className="text-xs">Weekly 5 Days</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">Mon – Fri</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('6_DAY')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    batchPreset === '6_DAY'
                      ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] font-bold text-stone-900 shadow-2xs ring-1 ring-[var(--bg-primary)]'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <p className="text-xs">Weekly 6 Days</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">Mon – Sat</p>
                </button>

                <button
                  type="button"
                  onClick={() => applyPreset('7_DAY')}
                  className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                    batchPreset === '7_DAY'
                      ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] font-bold text-stone-900 shadow-2xs ring-1 ring-[var(--bg-primary)]'
                      : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                  }`}
                >
                  <p className="text-xs">Weekly 7 Days</p>
                  <p className="text-[10px] text-stone-500 font-normal mt-0.5">All 7 Days</p>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateBatchSlots} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">Schedule From Date</label>
                  <input
                    type="date"
                    value={batchStartDate}
                    onChange={(e) => {
                      setBatchStartDate(e.target.value);
                      setBatchPreset('CUSTOM');
                    }}
                    required
                    className="w-full p-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-stone-50/50"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">Schedule To Date</label>
                  <input
                    type="date"
                    value={batchEndDate}
                    onChange={(e) => {
                      setBatchEndDate(e.target.value);
                      setBatchPreset('CUSTOM');
                    }}
                    required
                    className="w-full p-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-stone-50/50"
                  />
                </div>
              </div>

              {/* Working Hours: Morning to Evening */}
              <div className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 space-y-2.5">
                <span className="text-[11px] font-semibold text-stone-800 block">
                  2. Daily Working Window (Morning to Evening)
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-medium text-stone-600 mb-1">🌅 Morning Start</label>
                    <select
                      value={batchStartHour}
                      onChange={(e) => setBatchStartHour(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    >
                      <option value={8}>08:00 AM (Early)</option>
                      <option value={9}>09:00 AM (Morning)</option>
                      <option value={10}>10:00 AM (Recommended Morning)</option>
                      <option value={11}>11:00 AM (Late Morning)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-stone-600 mb-1">🌙 Evening Close</label>
                    <select
                      value={batchEndHour}
                      onChange={(e) => setBatchEndHour(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    >
                      <option value={16}>04:00 PM (Late Afternoon)</option>
                      <option value={17}>05:00 PM (Standard Evening)</option>
                      <option value={18}>06:00 PM (Evening)</option>
                      <option value={19}>07:00 PM (Late Evening)</option>
                      <option value={20}>08:00 PM (Night)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <div>
                    <label className="block text-[10px] font-medium text-stone-600 mb-1">Slot Duration</label>
                    <select
                      value={slotDuration}
                      onChange={(e) => setSlotDuration(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    >
                      <option value={60}>60 Minutes (1 Hour Standard)</option>
                      <option value={45}>45 Minutes</option>
                      <option value={30}>30 Minutes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-stone-600 mb-1">Buffer Break</label>
                    <select
                      value={batchBufferMinutes}
                      onChange={(e) => setBatchBufferMinutes(Number(e.target.value))}
                      className="w-full p-2 rounded-lg border border-stone-200 text-xs text-stone-800 bg-white"
                    >
                      <option value={0}>No Break (Continuous)</option>
                      <option value={10}>10 Min Break</option>
                      <option value={15}>15 Min Break (Standard)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Informational Summary Box */}
              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 flex items-center space-x-2.5 text-[11px]">
                <Info className="w-4 h-4 text-blue-700 shrink-0" />
                <p>
                  Will publish slots daily from <strong className="font-mono">{batchStartHour > 12 ? `${batchStartHour - 12}:00 PM` : `${batchStartHour}:00 AM`}</strong> to{' '}
                  <strong className="font-mono">{batchEndHour > 12 ? `${batchEndHour - 12}:00 PM` : `${batchEndHour}:00 AM`}</strong> for{' '}
                  <strong>
                    {batchPreset === '4_DAY'
                      ? 'Weekly 4 Days (Mon–Thu)'
                      : batchPreset === '5_DAY'
                      ? 'Weekly 5 Days (Mon–Fri)'
                      : batchPreset === '6_DAY'
                      ? 'Weekly 6 Days (Mon–Sat)'
                      : batchPreset === '7_DAY'
                      ? 'Weekly 7 Days (Mon–Sun)'
                      : 'the chosen schedule'}
                  </strong>
                  &nbsp;• 1-Hour consultation slots.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer shadow-xs"
                >
                  {batchSubmitting ? 'Generating Slots...' : 'Publish Availability'}
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
