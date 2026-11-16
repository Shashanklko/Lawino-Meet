import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Shield,
  Eye,
  Lock,
  X,
  FileText,
  UserX,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadReports = async () => {
    setLoading(true);
    const res = await adminApi.getReports();
    if (res.success) {
      setReports(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadReports();
  }, []);

  const filtered = reports.filter((r) => {
    return statusFilter === 'ALL' || r.status === statusFilter;
  });

  const handleResolveReport = async (status) => {
    if (!selectedReport) return;
    await adminApi.updateReportStatus(
      selectedReport.id,
      status,
      actionNotes.trim() || `Report action [${status}] taken by Compliance Admin.`
    );
    setToastMessage(`Report ${selectedReport.id} updated to [${status}].`);
    setSelectedReport(null);
    setActionNotes('');
    loadReports();
    setTimeout(() => setToastMessage(''), 3500);
  };

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span>Platform Reviews &amp; Content Moderation Reports</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Audit user complaints, investigate suspected fake accounts, and take proportionate disciplinary actions.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none cursor-pointer"
        >
          <option value="ALL">All Moderation Statuses</option>
          <option value="INVESTIGATING">Under Investigation</option>
          <option value="WARNING_ISSUED">Warning Issued</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {/* Reports Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Report ID</th>
                <th className="py-3 px-4">Reported Target</th>
                <th className="py-3 px-4">Infraction Category</th>
                <th className="py-3 px-4">Reporter Information</th>
                <th className="py-3 px-4">Evidence Summary</th>
                <th className="py-3 px-4">Current Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-stone-800/40 transition">
                  <td className="py-3 px-4 font-mono font-bold text-cream-100">{r.id}</td>
                  <td className="py-3 px-4">
                    <p className="font-serif font-bold text-cream-100">{r.targetName}</p>
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-900 border border-stone-700 text-stone-400">
                      {r.targetType}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                      {r.infraction.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-stone-300">
                    <p>{r.reporterName}</p>
                    <p className="text-[10px] text-stone-500 font-mono">{r.reporterRole}</p>
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate text-stone-300">{r.description}</td>
                  <td className="py-3 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                      {r.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      type="button"
                      onClick={() => setSelectedReport(r)}
                      className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition cursor-pointer"
                    >
                      Audit Report
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Moderation Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-3xl max-w-lg w-full p-6 text-xs text-stone-300 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <span className="text-[10px] font-mono text-amber-400 font-bold">{selectedReport.id}</span>
                <h3 className="font-serif font-bold text-base text-cream-50">
                  Moderation Audit: {selectedReport.targetName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
              <p className="font-semibold text-stone-200">Incident Description</p>
              <p className="text-stone-300 leading-relaxed font-sans">{selectedReport.description}</p>
              <p className="text-[10px] text-amber-400 font-mono pt-1">
                Prior Administrative Action: {selectedReport.actionTaken}
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-mono text-stone-400 uppercase">
                Action / Disciplinary Decision Note
              </label>
              <textarea
                rows={3}
                placeholder="Record disciplinary reasoning or policy justification..."
                value={actionNotes}
                onChange={(e) => setActionNotes(e.target.value)}
                className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleResolveReport('DISMISSED')}
                className="px-3 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800 font-medium"
              >
                Dismiss Report
              </button>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => handleResolveReport('WARNING_ISSUED')}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold"
                >
                  Issue Formal Warning
                </button>
                <button
                  type="button"
                  onClick={() => handleResolveReport('ACCOUNT_RESTRICTED')}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white font-bold"
                >
                  Throttle / Restrict
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
