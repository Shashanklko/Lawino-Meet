import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ShieldCheck,
  Clock,
  DollarSign,
  Zap,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminSettingsPage = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updateReason, setUpdateReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Editable Form fields
  const [commissionRate, setCommissionRate] = useState(10);
  const [expiryHours, setExpiryHours] = useState(24);
  const [cancelHours, setCancelHours] = useState(4);
  const [minWithdrawal, setMinWithdrawal] = useState(1000);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    const res = await adminApi.getSettings();
    if (res.success) {
      setSettings(res.data);
      setCommissionRate(res.data.platformCommissionPercent || 10);
      setExpiryHours(res.data.appointmentResponseExpiryHours || 24);
      setCancelHours(res.data.cancellationFreeWindowHours || 4);
      setMinWithdrawal(res.data.minimumWithdrawalAmount || 1000);
      setMaintenanceMode(res.data.maintenanceMode || false);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    if (!updateReason.trim()) {
      alert('Please state a valid administrative reason for modifying platform configuration.');
      return;
    }

    const payload = {
      platformCommissionPercent: Number(commissionRate),
      appointmentResponseExpiryHours: Number(expiryHours),
      cancellationFreeWindowHours: Number(cancelHours),
      minimumWithdrawalAmount: Number(minWithdrawal),
      maintenanceMode,
    };

    await adminApi.updateSettings(payload, updateReason.trim());
    setToastMessage('Platform configuration updated and recorded in audit log.');
    setUpdateReason('');
    loadSettings();
    setTimeout(() => setToastMessage(''), 3500);
  };

  if (loading || !settings) {
    return <div className="py-20 text-center text-xs text-stone-400 font-mono">Loading System Settings...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="p-3.5 px-4 rounded-xl bg-emerald-950/80 border border-emerald-700 text-emerald-200 text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button type="button" onClick={() => setToastMessage('')} className="text-emerald-400 font-bold ml-2">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="pb-4 border-b border-stone-800">
        <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-amber-500" />
          <span>Global Platform Configuration &amp; Business Rules</span>
        </h2>
        <p className="text-xs text-stone-400 font-sans mt-0.5">
          Configure statutory platform commission percentages, cancellation windows, and operational safety guardrails.
        </p>
      </div>

      {/* Super Admin Authorization Notice */}
      <div className="p-3.5 rounded-xl border border-purple-900/40 bg-purple-950/30 text-[11px] text-purple-200 flex items-start space-x-2.5">
        <Lock className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cream-100">Super Administrator Authority Required:</strong> Changes to platform business parameters immediately affect nationwide consultation checkout totals, settlement balances, and auto-expiry schedulers. All modifications require an audit reason.
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Platform Commission Card */}
          <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-800">
              <DollarSign className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Statutory Platform Commission Surcharge
              </h3>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Configured rate added to client checkout invoices (e.g. 10% on advocate's fee). Advocate only receives their set consultation fee.
            </p>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Platform Surcharge Percentage (%)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={commissionRate}
                onChange={(e) => setCommissionRate(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Appointment Lifecycle Timers */}
          <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-800">
              <Clock className="w-4 h-4 text-amber-500" />
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Appointment Lifecycle Expiration Rules
              </h3>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Hours allowed for advocate/firm to respond before the request automatically expires and unblocks client escrow hold.
            </p>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Advocate Acceptance Expiry Window (Hours)
              </label>
              <input
                type="number"
                min="1"
                max="72"
                value={expiryHours}
                onChange={(e) => setExpiryHours(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Cancellation Policy Window */}
          <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-800">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Free Cancellation Threshold Window
              </h3>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Minimum hours before hearing start where client cancellation results in 100% full refund without penalty.
            </p>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Free Cancellation Window (Hours prior to start)
              </label>
              <input
                type="number"
                min="1"
                max="48"
                value={cancelHours}
                onChange={(e) => setCancelHours(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Settlement Minimum Threshold */}
          <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3 text-xs">
            <div className="flex items-center space-x-2 pb-2 border-b border-stone-800">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Payout &amp; Settlement Minimum
              </h3>
            </div>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Minimum available withdrawable balance required for an independent advocate or law firm to trigger IMPS/NEFT payout.
            </p>

            <div>
              <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                Minimum Withdrawal (INR)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                value={minWithdrawal}
                onChange={(e) => setMinWithdrawal(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 font-mono font-bold focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Maintenance Mode Toggle Card */}
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-rose-900/40 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif font-bold text-sm text-rose-300">Emergency Platform Maintenance Mode</h4>
              <p className="text-[11px] text-stone-400 mt-0.5">
                When active, blocks new appointment booking requests and holds incoming checkouts while ongoing video calls continue safely.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={(e) => setMaintenanceMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-stone-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-rose-700"></div>
            </label>
          </div>
        </div>

        {/* Mandatory Reason & Submission */}
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3 text-xs">
          <div>
            <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
              Mandatory Audit Reason For Global Policy Change
            </label>
            <textarea
              rows={2}
              required
              placeholder="e.g. Periodic fiscal review of platform take rate; annual BCI compliance timing update..."
              value={updateReason}
              onChange={(e) => setUpdateReason(e.target.value)}
              className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={!updateReason.trim()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:opacity-90 disabled:opacity-40 text-stone-950 font-bold text-xs flex items-center space-x-1.5 shadow-xs cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Apply Global Policy &amp; Record Audit</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
