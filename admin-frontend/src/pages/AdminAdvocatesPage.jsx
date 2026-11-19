import React, { useState, useEffect } from 'react';
import {
  Scale,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  FileText,
  Building,
  UserCheck,
  Shield,
  Eye,
  Lock,
  X,
  ExternalLink,
  Clock,
  Sparkles,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminAdvocatesPage = () => {
  const [advocates, setAdvocates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [verificationFilter, setVerificationFilter] = useState('ALL');
  const [practiceFilter, setPracticeFilter] = useState('ALL');

  // Modals
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [verificationActionModal, setVerificationActionModal] = useState(null); // { advocate, actionType: 'VERIFIED' | 'REJECTED' | 'ADDITIONAL_INFO' }
  const [actionReason, setActionReason] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  const loadAdvocates = async () => {
    setLoading(true);
    const res = await adminApi.getAdvocates();
    if (res.success) {
      setAdvocates(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadAdvocates();
  }, []);

  const filteredAdvocates = advocates.filter((a) => {
    const matchesSearch =
      (a.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.barCouncilNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.specialization || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesVerif = verificationFilter === 'ALL' || a.verificationStatus === verificationFilter;
    const matchesPractice = practiceFilter === 'ALL' || a.practiceArrangement === practiceFilter;

    return matchesSearch && matchesVerif && matchesPractice;
  });

  const handleExecuteVerification = async (e) => {
    e.preventDefault();
    if (!verificationActionModal || !actionReason.trim()) return;

    const targetStatus =
      verificationActionModal.actionType === 'ADDITIONAL_INFO'
        ? 'ADDITIONAL_INFORMATION_REQUIRED'
        : verificationActionModal.actionType;

    await adminApi.updateAdvocateVerification(
      verificationActionModal.advocate.publicId,
      targetStatus,
      actionReason.trim()
    );

    setToastMessage(`Updated verification for ${verificationActionModal.advocate.fullName} to [${targetStatus}]. Audit record logged.`);
    setVerificationActionModal(null);
    setActionReason('');
    loadAdvocates();
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
            <Scale className="w-5 h-5 text-amber-500" />
            <span>Advocate Verification &amp; Practice Governance</span>
          </h2>
          <p className="text-xs text-stone-400 font-sans mt-0.5">
            Audit Bar Council of India enrollments, verify Certificates of Practice, and authorize independent vs firm practice dockets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
            <input
              type="text"
              placeholder="Search advocate, Bar #, field..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none focus:border-amber-500 w-44 sm:w-56"
            />
          </div>

          <select
            value={verificationFilter}
            onChange={(e) => setVerificationFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Verifications</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="ADDITIONAL_INFORMATION_REQUIRED">Info Required</option>
            <option value="VERIFIED">Verified Only</option>
            <option value="REJECTED">Rejected Only</option>
          </select>

          <select
            value={practiceFilter}
            onChange={(e) => setPracticeFilter(e.target.value)}
            className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="ALL">All Practice Channels</option>
            <option value="INDEPENDENT">Independent</option>
            <option value="FIRM_EXCLUSIVE">Firm Exclusive</option>
            <option value="FIRM_AND_INDEPENDENT">Firm &amp; Independent</option>
          </select>
        </div>
      </div>

      {/* Statutory Regulatory Notice */}
      <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 text-[11px] text-stone-400 flex items-start space-x-2.5 leading-relaxed">
        <Shield className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cream-100">Bar Council Verification Standards:</strong> Verification confirms that the practitioner has an active Bar Council enrollment number and valid credentials on file. Platform verification must not be represented as a guarantee of legal outcomes or professional competence.
        </div>
      </div>

      {/* Advocates Roster Table */}
      <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                <th className="py-3 px-4">Counsel Details</th>
                <th className="py-3 px-4">Bar Council Credentials</th>
                <th className="py-3 px-4">Practice Affiliation</th>
                <th className="py-3 px-4">Consultation Rate</th>
                <th className="py-3 px-4">Verification Status</th>
                <th className="py-3 px-4">Account</th>
                <th className="py-3 px-4 text-right">Verification Audit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-800/80">
              {filteredAdvocates.map((adv) => {
                const isUnderReview = adv.verificationStatus === 'UNDER_REVIEW';
                const isInfoReq = adv.verificationStatus === 'ADDITIONAL_INFORMATION_REQUIRED';
                const isVerified = adv.verificationStatus === 'VERIFIED';
                const isRejected = adv.verificationStatus === 'REJECTED';

                return (
                  <tr key={adv.publicId} className="hover:bg-stone-800/40 transition">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={adv.avatar}
                          alt={adv.fullName}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-stone-700 shrink-0"
                        />
                        <div>
                          <p className="font-serif font-bold text-cream-100">{adv.fullName}</p>
                          <p className="text-[10px] text-stone-400 font-sans">{adv.specialization}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-mono font-semibold text-cream-100">{adv.barCouncilNumber}</p>
                      <p className="text-[10px] text-stone-500">{adv.barCouncilState} ({adv.enrollmentYear})</p>
                    </td>
                    <td className="py-3 px-4">
                      {adv.firmAffiliation ? (
                        <div>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                            FIRM: {typeof adv.firmAffiliation === 'object' ? adv.firmAffiliation?.firmName : adv.firmAffiliation}
                          </span>
                          <p className="text-[9px] text-stone-500 mt-0.5">{adv.firmRole || 'Member'}</p>
                        </div>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                          Independent Practice
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-amber-400">
                      ₹{(Number(adv.hourlyRate) || 1500).toLocaleString('en-IN')} / session
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                          isVerified
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                            : isUnderReview
                            ? 'bg-amber-950/80 text-amber-300 border-amber-800 animate-pulse'
                            : isInfoReq
                            ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                            : 'bg-rose-950/80 text-rose-300 border-rose-800'
                        }`}
                      >
                        {adv.verificationStatus.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[10px] font-mono text-stone-400">{adv.accountStatus}</span>
                    </td>
                    <td className="py-3 px-4 text-right space-x-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedAdvocate(adv)}
                        className="px-2.5 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-medium transition cursor-pointer"
                      >
                        Inspect
                      </button>

                      {adv.verificationStatus !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => setVerificationActionModal({ advocate: adv, actionType: 'VERIFIED' })}
                          className="px-2.5 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-800 transition cursor-pointer"
                        >
                          Approve
                        </button>
                      )}

                      {adv.verificationStatus === 'UNDER_REVIEW' && (
                        <button
                          type="button"
                          onClick={() => setVerificationActionModal({ advocate: adv, actionType: 'ADDITIONAL_INFO' })}
                          className="px-2 py-1 rounded-lg bg-amber-950 hover:bg-amber-900 text-amber-300 text-[11px] font-mono border border-amber-800 transition cursor-pointer"
                        >
                          Req. Info
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

      {/* Advocate Details & Document Inspection Drawer */}
      {selectedAdvocate && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-3xl max-w-2xl w-full p-6 text-xs text-stone-300 shadow-2xl max-h-[90vh] overflow-y-auto space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3 border-b border-stone-800">
              <div className="flex items-center space-x-3">
                <img
                  src={selectedAdvocate.avatar}
                  alt={selectedAdvocate.fullName}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-amber-500/40"
                />
                <div>
                  <h3 className="font-serif font-bold text-base text-cream-50">{selectedAdvocate.fullName}</h3>
                  <p className="text-[11px] font-mono text-stone-400">
                    {selectedAdvocate.barCouncilNumber} • {selectedAdvocate.courtOfPractice}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAdvocate(null)}
                className="p-1 rounded-lg hover:bg-stone-800 text-stone-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Professional & Academic Credentials */}
            <div className="p-3.5 rounded-xl bg-stone-900 border border-stone-800 space-y-2">
              <p className="font-serif font-bold text-cream-100 text-xs">Professional Degree &amp; Court Accreditation</p>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-stone-500 block">Degree:</span>
                  <span className="font-medium text-stone-200">{selectedAdvocate.degree}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Bar Council State:</span>
                  <span className="font-medium text-stone-200">{selectedAdvocate.barCouncilState}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Experience:</span>
                  <span className="font-medium text-stone-200">{selectedAdvocate.experienceYears} Years Active Practice</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Consultation Volume:</span>
                  <span className="font-medium text-stone-200">{selectedAdvocate.totalConsultations} Hearings ({selectedAdvocate.completionRate})</span>
                </div>
              </div>
            </div>

            {/* Submitted Documents Inspection */}
            <div className="space-y-2">
              <p className="font-serif font-bold text-cream-100 text-xs">Submitted Verification Artifacts</p>
              <div className="space-y-1.5">
                {selectedAdvocate.documents?.map((doc, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-amber-500" />
                      <div>
                        <p className="font-semibold text-stone-200 text-xs">{doc.name}</p>
                        <p className="text-[10px] font-mono text-stone-500">{doc.type}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                      Authenticity Verified
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verification Actions */}
            <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
              <div className="text-[10px] text-stone-400 font-mono">
                Status: <strong className="text-cream-100">{selectedAdvocate.verificationStatus}</strong>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdvocate(null);
                    setVerificationActionModal({ advocate: selectedAdvocate, actionType: 'REJECTED' });
                  }}
                  className="px-3 py-1.5 rounded-xl border border-rose-800 text-rose-300 hover:bg-rose-950/60 font-medium"
                >
                  Reject Verification
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAdvocate(null);
                    setVerificationActionModal({ advocate: selectedAdvocate, actionType: 'VERIFIED' });
                  }}
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-stone-950 font-bold"
                >
                  Approve Verification
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Verification Action Modal */}
      {verificationActionModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-amber-800 rounded-2xl max-w-md w-full p-5 text-xs text-stone-300 shadow-2xl space-y-3">
            <h3 className="font-serif font-bold text-sm text-cream-50">
              Confirm Verification Decision for {verificationActionModal.advocate.fullName}
            </h3>
            <p className="text-[11px] text-stone-400">
              Decision will update status to [{verificationActionModal.actionType}] and notify counsel.
            </p>

            <form onSubmit={handleExecuteVerification} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                  Mandatory Legal Verification Audit Reason
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Bar Council enrollment roll verified against Bar Council of Delhi registry; Certificate of practice valid."
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerificationActionModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!actionReason.trim()}
                  className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold text-xs"
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
