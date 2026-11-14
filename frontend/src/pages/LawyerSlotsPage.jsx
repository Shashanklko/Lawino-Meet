import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { appointmentApi } from '../api/appointmentApi';
import { StatusBadge } from '../components/common/StatusBadge';

export const LawyerSlotsPage = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);

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

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const fetchSlots = async () => {
    setLoading(true);
    try {
      const res = await appointmentApi.getMySlots();
      if (res.success && res.data) {
        setSlots(res.data.content || res.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch lawyer slots:', err);
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

    try {
      const startDateTime = `${startDate}T${startTime}:00`;
      const endDateTime = `${startDate}T${endTime}:00`;

      await appointmentApi.createSlot({
        startTime: startDateTime,
        endTime: endDateTime,
      });

      setMessage('Slot added successfully');
      setStartDate('');
      await fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create slot');
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

    try {
      await appointmentApi.batchCreateSlots({
        startDate: batchStartDate,
        endDate: batchEndDate,
        startHour: parseInt(batchStartHour, 10),
        endHour: parseInt(batchEndHour, 10),
        durationMinutes: parseInt(slotDuration, 10),
      });

      setMessage('Batch slots created successfully');
      setIsBatchModalOpen(false);
      await fetchSlots();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate batch slots');
    } finally {
      setBatchSubmitting(false);
    }
  };

  const handleDeleteSlot = async (slotPublicId) => {
    try {
      await appointmentApi.deleteSlot(slotPublicId);
      await fetchSlots();
    } catch (err) {
      console.error('Failed to delete slot:', err);
      alert('Unable to delete slot. It may already be reserved.');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Availability Slots Manager</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure open time intervals when clients can schedule video hearings and consultations.
          </p>
        </div>
        <button
          onClick={() => setIsBatchModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition flex items-center space-x-1.5"
        >
          <Clock className="w-4 h-4 text-blue-400" />
          <span>Batch Generate Slots</span>
        </button>
      </div>

      {message && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Single Slot Creator Form */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
            <Plus className="w-4 h-4 text-blue-600" />
            <span>Add Single Slot</span>
          </h2>

          <form onSubmit={handleCreateSingleSlot} className="space-y-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={singleSubmitting}
              className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs shadow-sm transition"
            >
              {singleSubmitting ? 'Creating...' : 'Create Availability Slot'}
            </button>
          </form>
        </div>

        {/* Existing Slots List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <h2 className="text-sm font-bold text-slate-900 flex items-center justify-between">
            <span>Configured Availability Slots</span>
            <span className="text-xs font-normal text-slate-400">Total: {slots.length}</span>
          </h2>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-500">Loading slots...</div>
          ) : slots.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
              <Calendar className="w-8 h-8 mx-auto text-slate-300" />
              <p>No slots created yet. Use the form on the left or batch generate slots.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-1">
              {slots.map((slot) => {
                const start = new Date(slot.startTime);
                const isAvailable = slot.slotStatus === 'AVAILABLE';
                return (
                  <div
                    key={slot.publicId}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-slate-900">
                        {start.toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          weekday: 'short',
                        })}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -{' '}
                        {new Date(slot.endTime).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <div className="mt-1">
                        <StatusBadge status={slot.slotStatus} />
                      </div>
                    </div>

                    {isAvailable && (
                      <button
                        onClick={() => handleDeleteSlot(slot.publicId)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Batch Generation Modal */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl">
            <h3 className="text-base font-extrabold text-slate-900">
              Batch Generate Availability Slots
            </h3>
            <p className="text-xs text-slate-500">
              Automatically populate calendar slots across multiple days within your preferred working hours.
            </p>

            <form onSubmit={handleCreateBatchSlots} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchStartDate}
                    onChange={(e) => setBatchStartDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={batchEndDate}
                    onChange={(e) => setBatchEndDate(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Start Hour (24h)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="23"
                    value={batchStartHour}
                    onChange={(e) => setBatchStartHour(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    End Hour (24h)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={batchEndHour}
                    onChange={(e) => setBatchEndHour(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    step="15"
                    value={slotDuration}
                    onChange={(e) => setSlotDuration(e.target.value)}
                    className="w-full text-xs border border-slate-300 rounded-lg p-2.5"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsBatchModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={batchSubmitting}
                  className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition"
                >
                  {batchSubmitting ? 'Generating...' : 'Generate Slots'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
