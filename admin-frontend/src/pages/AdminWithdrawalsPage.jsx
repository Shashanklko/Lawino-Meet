import React, { useState, useEffect } from 'react';
import {
  ArrowDownLeft,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Building,
  Scale,
  CreditCard,
  Lock,
  X,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const [actionModal, setActionModal] = useState(null); // { withdrawal, action: 'APPROVE' | 'REJECT' }
  const [actionReason, setActionReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadWithdrawals = async () => {
    setLoading(true);
    const res = await adminApi.getWithdrawals();
    if (res.success) {
      setWithdrawals(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const filtered = withdrawals.filter((w) => {
    const matchesSearch =
      w.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || w.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!actionModal || !actionReason.trim()) return;

    const targetStatus = actionModal.action === 'APPROVE' ? 'COMPLETED' : 'REJECTED';
    await adminApi.updateWithdrawalStatus(actionModal.withdrawal.id, targetStatus, actionReason.trim());

    setToastMessage(`Payout ${actionModal.withdrawal.id} marked as [${targetStatus}]. Audit record generated.`);
    setActionModal(null);
    setActionReason('');
    loadWithdrawals();
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

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div>
          <h2 className="text-lg font-serif font-bold text-cream-100 flex items-center space-x-2">
            <ArrowDownLeft className="w-5 h-5 text-amber-500" />
            <span>Withdrawals &amp; Advocate Settlement Authorizations</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Audit bank account IMPS/NEFT verification, enforce single-payout idempotency, and execute partnership treasury disbursements.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search beneficiary, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Payout Statuses</option>
            <option value="REQUESTED">Requested Only</option>
            <option value="COMPLETED">Completed Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Withdrawal ID</th>
                <th className="py-3 px-4">Beneficiary</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Claimed Amount</th>
                <th className="py-3 px-4">Bank &amp; Verification</th>
                <th className="py-3 px-4">Idempotency Key</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filtered.map((w) => {
                const isRequested = w.status === 'REQUESTED';
                const isCompleted = w.status === 'COMPLETED';

                return (
                  <tr key={w.id} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4 font-mono font-bold text-cream-100">
                      <p>{w.id}</p>
                      <p className="text-[10px] text-stone-500">{w.date}</p>
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-cream-100">{w.beneficiaryName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-stone-900 border border-stone-700 text-stone-300">
                        {w.beneficiaryType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-emerald-400 text-sm">
                      ₹{w.requestedAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-300">
                      <p className="font-semibold text-cream-100">{w.bankDetails.bankName}</p>
                      <p className="text-[10px] text-stone-500">{w.bankDetails.accountNumber} ({w.bankDetails.ifsc})</p>
                      <span className="text-[9px] text-emerald-400 font-bold">● IMPS Validated</span>
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-stone-500">{w.idempotencyKey}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          isCompleted
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                        }`}
                      >
                        {w.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      {isRequested ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setActionModal({ withdrawal: w, action: 'APPROVE' })}
                            className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-800 transition cursor-pointer"
                          >
                            Authorize Transfer
                          </button>
                          <button
                            type="button"
                            onClick={() => setActionModal({ withdrawal: w, action: 'REJECT' })}
                            className="px-2 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-[11px] font-mono border border-rose-800/60 transition cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <span className="text-[11px] font-mono text-stone-500">Transferred</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Settlement Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-amber-800 rounded-2xl max-w-md w-full p-5 text-xs text-stone-300 shadow-2xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-cream-50">
              {actionModal.action === 'APPROVE' ? 'Authorize Bank Disbursement' : 'Reject Settlement Request'}
            </h3>
            <p className="text-[11px] text-stone-400">
              Payout of ₹{actionModal.withdrawal.requestedAmount.toLocaleString('en-IN')} to {actionModal.withdrawal.beneficiaryName}.
            </p>

            <form onSubmit={handleExecuteAction} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                  Settlement Authorization Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record banking audit reason (e.g. verified against completed consultations ledger)..."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!actionReason.trim()}
                  className={`px-4 py-1.5 rounded-xl font-bold text-xs ${
                    actionModal.action === 'APPROVE'
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-stone-950'
                      : 'bg-rose-700 hover:bg-rose-800 text-white'
                  }`}
                >
                  Execute Disbursement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
