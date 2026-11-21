import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Shield,
  Lock,
  Sparkles,
  Info,
  Check,
  Video,
  Coffee,
  Globe,
  Radio,
  User,
  ArrowRight,
  Filter
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { userApi } from '../api/userApi';
import { appointmentApi } from '../api/appointmentApi';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';

const ALL_DAYS = [
  { key: 'MONDAY', label: 'Mon', full: 'Monday' },
  { key: 'TUESDAY', label: 'Tue', full: 'Tuesday' },
  { key: 'WEDNESDAY', label: 'Wed', full: 'Wednesday' },
  { key: 'THURSDAY', label: 'Thu', full: 'Thursday' },
  { key: 'FRIDAY', label: 'Fri', full: 'Friday' },
  { key: 'SATURDAY', label: 'Sat', full: 'Saturday' },
  { key: 'SUNDAY', label: 'Sun', full: 'Sunday' },
];

const PRESETS = [
  { id: '5_DAY', label: 'Mon – Fri (5 Days)', days: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY' },
  { id: '6_DAY', label: 'Mon – Sat (6 Days)', days: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY' },
  { id: '7_DAY', label: 'Mon – Sun (All 7 Days)', days: 'MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY,SATURDAY,SUNDAY' },
];

const TIME_ZONES = [
  { id: 'Asia/Kolkata', label: 'Asia/Kolkata (IST - UTC+05:30)' },
  { id: 'Asia/Dubai', label: 'Asia/Dubai (GST - UTC+04:00)' },
  { id: 'Europe/London', label: 'Europe/London (GMT - UTC+00:00)' },
  { id: 'America/New_York', label: 'America/New_York (EST - UTC-05:00)' },
  { id: 'America/Los_Angeles', label: 'America/Los_Angeles (PST - UTC-08:00)' },
  { id: 'Asia/Singapore', label: 'Asia/Singapore (SGT - UTC+08:00)' },
];

export const LawyerSlotsPage = () => {
  const { user } = useAuth();
  const hasFirmMembership = !!user?.firmMembership;

  // Profile Availability State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const [workingDays, setWorkingDays] = useState('MONDAY,TUESDAY,WEDNESDAY,THURSDAY,FRIDAY');
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('18:00');
  const [hasBreakTime, setHasBreakTime] = useState(true);
  const [breakStartTime, setBreakStartTime] = useState('13:00');
  const [breakEndTime, setBreakEndTime] = useState('14:00');
  const [timeZone, setTimeZone] = useState('Asia/Kolkata');
  const [availabilityStatus, setAvailabilityStatus] = useState('AVAILABLE'); // 'AVAILABLE' | 'BUSY' | 'ON_LEAVE'

  // Appointments Ledger State
  const [appointments, setAppointments] = useState([]);
  const [appointmentsLoading, setAppointmentsLoading] = useState(true);
  const [appointmentFilter, setAppointmentFilter] = useState('ALL'); // 'ALL' | 'CONFIRMED' | 'PENDING' | 'COMPLETED'

  // Fetch Lawyer Profile & Appointments
  const loadData = async () => {
    try {
      setLoading(true);
      const res = await userApi.getLawyerMe();
      if (res?.data) {
        const p = res.data;
        if (p.workingDays) setWorkingDays(p.workingDays);
        if (p.workingHoursStart) setWorkingHoursStart(p.workingHoursStart);
        if (p.workingHoursEnd) setWorkingHoursEnd(p.workingHoursEnd);
        if (p.breakStartTime && p.breakEndTime) {
          setHasBreakTime(true);
          setBreakStartTime(p.breakStartTime);
          setBreakEndTime(p.breakEndTime);
        } else {
          setHasBreakTime(false);
        }
        if (p.timeZone) setTimeZone(p.timeZone);
        if (p.availabilityStatus) setAvailabilityStatus(p.availabilityStatus);
      }
    } catch (err) {
      console.warn('Could not load lawyer availability profile:', err);
    } finally {
      setLoading(false);
    }

    try {
      setAppointmentsLoading(true);
      const res = await appointmentApi.getMyAppointments();
      const list = Array.isArray(res?.data) ? res.data : [];
      setAppointments(list);
    } catch (err) {
      console.warn('Could not load lawyer booked appointments:', err);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Selected days set
  const selectedDaysSet = useMemo(() => {
    return new Set(workingDays.split(',').map((d) => d.trim().toUpperCase()));
  }, [workingDays]);

  // Toggle single day
  const toggleDay = (dayKey) => {
    const updated = new Set(selectedDaysSet);
    if (updated.has(dayKey)) {
      if (updated.size === 1) {
        setError('At least one working day must remain active for client consultations.');
        return;
      }
      updated.delete(dayKey);
    } else {
      updated.add(dayKey);
    }
    setError('');
    const sorted = ALL_DAYS.filter((d) => updated.has(d.key)).map((d) => d.key);
    setWorkingDays(sorted.join(','));
  };

  // Apply quick preset
  const applyPreset = (presetDays) => {
    setError('');
    setWorkingDays(presetDays);
  };

  // Save Availability Settings
  const handleSaveAvailability = async (e) => {
    e?.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    // Validations
    if (!workingDays || workingDays.trim().length === 0) {
      setError('Please select at least one working day.');
      setSaving(false);
      return;
    }

    if (!workingHoursStart || !workingHoursEnd) {
      setError('Working hours start and end times are required.');
      setSaving(false);
      return;
    }

    if (workingHoursStart >= workingHoursEnd) {
      setError('Working hours start time must be earlier than the end time.');
      setSaving(false);
      return;
    }

    if (hasBreakTime && breakStartTime && breakEndTime) {
      if (breakStartTime >= breakEndTime) {
        setError('Recess / break start time must be earlier than break end time.');
        setSaving(false);
        return;
      }
      if (breakStartTime < workingHoursStart || breakEndTime > workingHoursEnd) {
        setError('Recess time must fall strictly within working hours.');
        setSaving(false);
        return;
      }
    }

    try {
      const payload = {
        workingDays,
        workingHoursStart,
        workingHoursEnd,
        breakStartTime: hasBreakTime ? breakStartTime : '',
        breakEndTime: hasBreakTime ? breakEndTime : '',
        timeZone,
        availabilityStatus,
      };

      const res = await userApi.updateLawyerProfile(payload);
      if (res?.success) {
        setMessage('Availability schedule & practice hours updated successfully.');
        setTimeout(() => setMessage(''), 5000);
      } else {
        setMessage('Availability settings updated.');
        setTimeout(() => setMessage(''), 5000);
      }
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Failed to update availability schedule.');
    } finally {
      setSaving(false);
    }
  };

  // Filtered Appointments
  const filteredAppointments = useMemo(() => {
    return appointments.filter((apt) => {
      if (appointmentFilter === 'CONFIRMED') {
        return apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS';
      }
      if (appointmentFilter === 'PENDING') {
        return apt.status === 'PENDING' || apt.status === 'AWAITING_PAYMENT';
      }
      if (appointmentFilter === 'COMPLETED') {
        return apt.status === 'COMPLETED' || apt.status === 'COMPLETION_REQUESTED';
      }
      return true;
    });
  }, [appointments, appointmentFilter]);

  // Derived metrics
  const activeDaysCount = selectedDaysSet.size;
  const activeDaysLabel =
    activeDaysCount === 7
      ? 'All 7 Days (Mon – Sun)'
      : activeDaysCount === 6 && !selectedDaysSet.has('SUNDAY')
      ? '6 Days (Mon – Sat)'
      : activeDaysCount === 5 && !selectedDaysSet.has('SATURDAY') && !selectedDaysSet.has('SUNDAY')
      ? '5 Days (Mon – Fri)'
      : `${activeDaysCount} Days Active`;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <PageHeader
        title="Practitioner Availability & Practice Hours"
        subtitle="Configure your working days, consultation practice hours, recess times, and availability status."
        badge={hasFirmMembership ? 'Firm & Personal Master Schedule' : 'Chamber Availability'}
        breadcrumbs={['Lawyer Console', 'Availability & Hours']}
        actions={
          <button
            type="button"
            onClick={handleSaveAvailability}
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer disabled:opacity-50"
          >
            <Check className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Availability'}</span>
          </button>
        }
      />

      {/* Architecture Explanatory Banner */}
      <div className="p-4 rounded-xl bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] flex items-start space-x-3 text-xs">
        <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-serif font-bold text-stone-900 text-xs">
            Dynamic 1-Hour Consultation Engine (No Predefined Slots Needed)
          </p>
          <p className="text-[11px] text-stone-600 font-sans leading-relaxed">
            LawinoMeet operates on dynamic client scheduling: you configure your weekly working days and daily consultation window below. Clients choose any active date and specify their preferred start time, and the system automatically calculates the 1-hour slot while preventing overlapping bookings and enforcing your recess periods.
          </p>
        </div>
      </div>

      {/* Feedback Alerts */}
      {message && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="p-3.5 px-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-medium flex items-center space-x-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <MetricCard
          label="Active Working Days"
          value={activeDaysLabel}
          subtext={`${activeDaysCount} days enabled on calendar`}
          icon={Calendar}
          badge={`${activeDaysCount} Days`}
          badgeType="accent"
        />
        <MetricCard
          label="Practice Hours"
          value={`${workingHoursStart} – ${workingHoursEnd}`}
          subtext="Daily consultation window"
          icon={Clock}
          badge="1-Hr Fixed Slots"
          badgeType="neutral"
        />
        <MetricCard
          label="Chamber Recess"
          value={hasBreakTime ? `${breakStartTime} – ${breakEndTime}` : 'No Recess'}
          subtext={hasBreakTime ? 'Recess protected from booking' : 'Continuous consultations'}
          icon={Coffee}
          badge={hasBreakTime ? 'Active' : 'Off'}
          badgeType={hasBreakTime ? 'neutral' : 'warning'}
        />
        <MetricCard
          label="Chamber Status"
          value={
            availabilityStatus === 'AVAILABLE'
              ? 'Accepting Bookings'
              : availabilityStatus === 'BUSY'
              ? 'In Court / Busy'
              : 'On Leave'
          }
          subtext={`Time Zone: ${timeZone.split('/')[1] || timeZone}`}
          icon={Shield}
          badge={availabilityStatus}
          badgeType={
            availabilityStatus === 'AVAILABLE'
              ? 'success'
              : availabilityStatus === 'BUSY'
              ? 'warning'
              : 'danger'
          }
        />
      </div>

      {/* Main 2-Column Work Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Availability Configuration Form (7 Cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[var(--border-cream)] p-5 sm:p-6 space-y-6 shadow-sm">
          <div className="border-b border-stone-200 pb-4">
            <h3 className="font-serif font-bold text-base text-stone-900">
              Practice Availability & Hours Configuration
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Define your working days, consultation practice hours, recess times, and availability status.
            </p>
          </div>

          <form onSubmit={handleSaveAvailability} className="space-y-6">
            {/* 1. Availability Status */}
            <div>
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider mb-2">
                Chamber Availability Status
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[
                  { id: 'AVAILABLE', label: 'Accepting Consultations', desc: 'Bookings open to clients', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                  { id: 'BUSY', label: 'Court / Busy', desc: 'In hearing or urgent matter', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                  { id: 'ON_LEAVE', label: 'On Leave', desc: 'Temporarily unavailable', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                ].map((s) => {
                  const isSelected = availabilityStatus === s.id;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setAvailabilityStatus(s.id)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? `${s.color} font-semibold ring-1 ring-[var(--bg-primary)]`
                          : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold">{s.label}</span>
                          <span
                            className={`w-2 h-2 rounded-full ${
                              s.id === 'AVAILABLE'
                                ? 'bg-emerald-500'
                                : s.id === 'BUSY'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}
                          />
                        </div>
                        <p className="text-[10px] text-stone-500 leading-tight">{s.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Working Days Presets & Individual Day Toggles */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                  Configurable Working Days
                </label>
                <span className="text-[11px] text-stone-500 font-mono">
                  {activeDaysCount} of 7 days selected
                </span>
              </div>

              {/* Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {PRESETS.map((p) => {
                  const isPresetActive = workingDays === p.days;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => applyPreset(p.days)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer border ${
                        isPresetActive
                          ? 'bg-[var(--bg-primary)] text-white border-[var(--bg-primary)] shadow-xs'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>

              {/* Individual Day Toggles */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2 pt-1">
                {ALL_DAYS.map((d) => {
                  const isSelected = selectedDaysSet.has(d.key);
                  return (
                    <button
                      key={d.key}
                      type="button"
                      onClick={() => toggleDay(d.key)}
                      title={d.full}
                      className={`py-3 rounded-xl text-center text-xs font-semibold transition cursor-pointer border flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-amber-900/10 border-amber-800/40 text-amber-950 font-bold ring-1 ring-amber-800/30'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-400 border-stone-200 opacity-60'
                      }`}
                    >
                      <span>{d.label}</span>
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-amber-700' : 'bg-transparent'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              <p className="text-[11px] text-stone-500">
                Clients can only request 1-hour consultation bookings on your selected working days.
              </p>
            </div>

            {/* 3. Working Hours (Practice Window) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Practice Working Hours
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Practice Start Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="time"
                      value={workingHoursStart}
                      onChange={(e) => setWorkingHoursStart(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] bg-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-600 mb-1">
                    Practice End Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                    <input
                      type="time"
                      value={workingHoursEnd}
                      onChange={(e) => setWorkingHoursEnd(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)] bg-white font-mono"
                    />
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-stone-500">
                1-hour consultation requests must begin and conclude within this daily operating window.
              </p>
            </div>

            {/* 4. Chamber Recess / Break Times */}
            <div className="space-y-3 p-4 rounded-xl bg-stone-50 border border-stone-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Coffee className="w-4 h-4 text-stone-600" />
                  <span className="text-xs font-bold text-stone-800">
                    Chamber Recess / Break Time
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasBreakTime}
                    onChange={(e) => setHasBreakTime(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--bg-primary)]"></div>
                </label>
              </div>

              {hasBreakTime && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Recess Start Time
                    </label>
                    <input
                      type="time"
                      value={breakStartTime}
                      onChange={(e) => setBreakStartTime(e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-300 text-xs text-stone-800 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-stone-600 mb-1">
                      Recess End Time
                    </label>
                    <input
                      type="time"
                      value={breakEndTime}
                      onChange={(e) => setBreakEndTime(e.target.value)}
                      className="w-full p-2 rounded-lg border border-stone-300 text-xs text-stone-800 bg-white font-mono focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                    />
                  </div>
                </div>
              )}
              <p className="text-[11px] text-stone-500">
                {hasBreakTime
                  ? 'Client bookings that overlap with your recess window will be automatically rejected.'
                  : 'Recess disabled: your entire practice window is continuously bookable.'}
              </p>
            </div>

            {/* 5. Time Zone */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800 uppercase tracking-wider">
                Practice Time Zone
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-stone-400 absolute left-3 top-3" />
                <select
                  value={timeZone}
                  onChange={(e) => setTimeZone(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-800 bg-white focus:outline-none focus:ring-1 focus:ring-[var(--bg-primary)]"
                >
                  {TIME_ZONES.map((tz) => (
                    <option key={tz.id} value={tz.id}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sticky/Submit Button */}
            <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-2 transition shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                <span>{saving ? 'Updating Chamber Settings...' : 'Save Availability Settings'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Booked Consultations Schedule (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-[var(--border-cream)] p-5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-stone-200 pb-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Booked Consultations Schedule
                </h3>
                <p className="text-[11px] text-stone-500">
                  1-hour client appointments reserved on your calendar.
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-[10px] font-mono font-bold">
                {appointments.length} Total
              </span>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center space-x-1 p-1 bg-stone-100 rounded-xl text-[11px]">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'CONFIRMED', label: 'Confirmed' },
                { id: 'PENDING', label: 'Pending' },
                { id: 'COMPLETED', label: 'Past' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setAppointmentFilter(tab.id)}
                  className={`flex-1 py-1 text-center rounded-lg font-medium transition cursor-pointer ${
                    appointmentFilter === tab.id
                      ? 'bg-white text-stone-900 shadow-xs font-bold'
                      : 'text-stone-600 hover:text-stone-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Appointments List */}
            {appointmentsLoading ? (
              <div className="py-12 text-center text-xs text-stone-400">
                Loading booked consultations...
              </div>
            ) : filteredAppointments.length === 0 ? (
              <div className="py-10 text-center space-y-2">
                <Calendar className="w-8 h-8 text-stone-300 mx-auto" />
                <p className="text-xs font-medium text-stone-700">No appointments found</p>
                <p className="text-[11px] text-stone-400 max-w-xs mx-auto">
                  {appointmentFilter === 'ALL'
                    ? 'As clients reserve 1-hour consultations during your working hours, they will appear here.'
                    : `No ${appointmentFilter.toLowerCase()} consultations on your ledger.`}
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[520px] overflow-y-auto pr-1">
                {filteredAppointments.map((apt) => {
                  const s = apt.slot?.startTime ? new Date(apt.slot.startTime) : (apt.requestedAt ? new Date(apt.requestedAt) : new Date());
                  const e = apt.slot?.endTime ? new Date(apt.slot.endTime) : new Date(s.getTime() + 60 * 60 * 1000);
                  const isConfirmed = apt.status === 'CONFIRMED' || apt.status === 'IN_PROGRESS';

                  return (
                    <div
                      key={apt.publicId}
                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <span className="font-semibold text-xs text-stone-900">
                              {apt.client?.fullName || apt.clientUsername || 'Rohit Verma'}
                            </span>
                            <span className="text-[10px] text-stone-400 font-mono">
                              #{apt.shortUid || apt.publicId?.slice(0, 8)}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 font-medium mt-0.5">
                            {s.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} &bull;{' '}
                            {s.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} –{' '}
                            {e.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <StatusBadge status={apt.status} />
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-stone-200/80 text-stone-600">
                        <span className="font-bold text-stone-900">
                          ₹{(apt.fee || 1500).toLocaleString('en-IN')}
                        </span>
                        {isConfirmed ? (
                          <Link
                            to={`/meeting/${apt.roomPublicId || apt.meetingRoomPublicId || apt.publicId}`}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold flex items-center space-x-1 text-[10px] transition"
                          >
                            <Video className="w-3 h-3" />
                            <span>Video Chamber</span>
                          </Link>
                        ) : (
                          <span className="text-[10px] text-stone-400 font-medium">
                            {apt.status === 'AWAITING_PAYMENT' ? 'Awaiting Client Payment' : 'Pending Review'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
