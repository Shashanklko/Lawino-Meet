import React, { useState, useEffect } from 'react';
import {
  Building,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Users,
  Shield,
  Eye,
  Lock,
  X,
  ExternalLink,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminFirmsPage = () => {
  const [firms, setFirms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');

  const [selectedFirm, setSelectedFirm] = useState(null);
  const [actionModal, setActionModal] = useState(null); // { firm, actionType: 'APPROVE' | 'SUSPEND' | 'ACTIVATE' }
  const [actionReason, setActionReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadFirms = async () => {
    setLoading(true);
    const res = await adminApi.getFirms();
    if (res.success) {
      setFirms(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFirms();
  }, []);

  const filteredFirms = firms.filter((f) => {
    const matchesSearch =
      (f.name || f.firmName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.registrationNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.city || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (f.firmAdminName || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVerif =
      verificationFilter === 'ALL' || f.verificationStatus === verificationFilter;

    return matchesSearch && matchesVerif;
  });

  const handleExecuteAction = async (e) => {
    e.preventDefault();
    if (!actionModal || !actionReason.trim()) return;

    if (actionModal.actionType === 'APPROVE') {
      await adminApi.updateFirmVerification(actionModal.firm.publicId, 'VERIFIED', actionReason.trim());
      setToastMessage(`Firm ${actionModal.firm.name} verified successfully.`);
    } else {
      const targetStatus = actionModal.actionType === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE';
      await adminApi.updateFirmAccountStatus(actionModal.firm.publicId, targetStatus, actionReason.trim());
      setToastMessage(`Firm ${actionModal.firm.name} account status updated to [${targetStatus}].`);
    }

    setActionModal(null);
    setActionReason('');
    loadFirms();
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
            <Building className="w-5 h-5 text-amber-500" />
            <span>Law Firm Institutional Governance</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Audit registered LLPs, verify Ministry of Corporate Affairs filings, and monitor institutional counsel dockets.
          </p>
        </div>

        <div className="flex items-center space-x-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search firm, LLP reg, partner..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none focus:border-amber-500 w-48 sm:w-64"
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="VERIFIED">Verified LLPs</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
        </div>
      </div>

      {/* Firms Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Law Firm Entity</th>
                <th className="py-3 px-4">LLP Filing Credentials</th>
                <th className="py-3 px-4">Managing Partner</th>
                <th className="py-3 px-4">Counsel Roster</th>
                <th className="py-3 px-4">Active Matters</th>
                <th className="py-3 px-4">Verification</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredFirms.map((firm) => {
                const isVerified = firm.verificationStatus === 'VERIFIED';
                const isUnderReview = firm.verificationStatus === 'UNDER_REVIEW';

                return (
                  <tr key={firm.publicId} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-stone-900 border border-stone-700 flex items-center justify-center font-serif font-bold text-xs text-cream-100">
                          {firm.name[0]}
                        </div>
                        <div>
                          <p className="font-serif font-bold text-cream-100">{firm.name}</p>
                          <p className="text-[10px] text-stone-400 font-sans">{firm.city}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <p className="font-semibold text-cream-100">{firm.registrationNumber}</p>
                      <p className="text-[10px] text-stone-500">Est. {firm.founded}</p>
                    </td>
                    <td className="py-3 px-4 text-stone-300">
                      <p>{firm.firmAdminName}</p>
                      <p className="text-[10px] text-stone-500">{firm.firmAdminEmail}</p>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-stone-300">
                      {firm.associatedAdvocatesCount} Advocates
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-stone-300">
                      {firm.activeMatters} Matters
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border ${
                          isVerified
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : isUnderReview
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                            : 'bg-rose-950/80 text-rose-300 border-rose-800'
                        }`}
                      >
                        {firm.verificationStatus}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedFirm(firm)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition cursor-pointer"
                      >
                        Inspect
                      </button>

                      {!isVerified && (
                        <button
                          type="button"
                          onClick={() => setActionModal({ firm, actionType: 'APPROVE' })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-800 transition cursor-pointer"
                        >
                          Approve LLP
                        </button>
                      )}

                      {firm.accountStatus === 'ACTIVE' ? (
                        <button
                          type="button"
                          onClick={() => setActionModal({ firm, actionType: 'SUSPEND' })}
                          className="px-2.5 py-1 rounded-lg bg-rose-950/70 hover:bg-rose-900 text-rose-300 text-[11px] font-mono border border-rose-800/60 transition cursor-pointer"
                        >
                          Suspend
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setActionModal({ firm, actionType: 'ACTIVATE' })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-800/60 transition cursor-pointer"
                        >
                          Reactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Firm Inspection Modal */}
      {selectedFirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-xs text-stone-300 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div>
                <h3 className="font-serif font-bold text-base text-cream-50">{selectedFirm.name}</h3>
                <p className="text-[11px] font-mono text-stone-400">
                  {selectedFirm.registrationNumber} • Founded {selectedFirm.founded}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedFirm(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Firm Overview Box */}
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
              <p className="font-serif font-bold text-cream-100 text-xs">Institutional Registration &amp; Benches</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-500 block">Managing Partner:</span>
                  <span className="font-medium text-stone-200">{selectedFirm.firmAdminName}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">HQ Chamber Complex:</span>
                  <span className="font-medium text-stone-200">{selectedFirm.hqAddress}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Advocate Roster:</span>
                  <span className="font-medium text-stone-200">{selectedFirm.associatedAdvocatesCount} Verified Counsel</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Monthly Run Rate:</span>
                  <span className="font-medium text-amber-400 font-mono">{selectedFirm.monthlyRunRate}</span>
                </div>
              </div>
            </div>

            {/* Practice Areas */}
            <div className="space-y-1.5">
              <p className="font-semibold text-stone-300">Practice Areas</p>
              <div className="flex flex-wrap gap-1.5">
                {selectedFirm.practiceAreas?.map((pa, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 text-stone-300 text-[10px]">
                    {pa}
                  </span>
                ))}
              </div>
            </div>

            {/* Submitted LLP Artifacts */}
            <div className="space-y-1.5">
              <p className="font-semibold text-stone-300">Submitted Corporate Documents</p>
              <div className="space-y-1">
                {selectedFirm.documents?.map((d, i) => (
                  <div key={i} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-[11px]">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-3.5 h-3.5 text-amber-500" />
                      <span>{d.name}</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400">LLP Verified</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-stone-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedFirm(null)}
                className="px-4 py-1.5 rounded-xl bg-stone-800 text-stone-300 hover:bg-stone-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-2xl max-w-md w-full p-5 text-xs text-stone-300 shadow-2xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-cream-50">
              Confirm {actionModal.actionType} Action for {actionModal.firm.name}
            </h3>
            <p className="text-[11px] text-stone-400">
              {actionModal.actionType === 'SUSPEND'
                ? 'Under Bar Council rules, existing scheduled client appointments will be safeguarded and handled under controlled operational transition.'
                : 'Action will update verification status and generate an administrative audit log.'}
            </p>

            <form onSubmit={handleExecuteAction} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                  Audit Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Record operational reason for audit trail..."
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
                    actionModal.actionType === 'SUSPEND'
                      ? 'bg-rose-700 hover:bg-rose-800 text-white'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-stone-950'
                  }`}
                >
                  Confirm &amp; Record Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
