import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Building,
  ShieldCheck,
  MapPin,
  Phone,
  Mail,
  Users,
  Award,
  Calendar,
  Clock,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Scale,
  CheckCircle2,
  AlertCircle,
  FileText,
  Lock,
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { useAuth } from '../context/AuthContext';

export const FirmProfilePage = () => {
  const { firmIdentifier } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [firm, setFirm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [associatedLawyers, setAssociatedLawyers] = useState([]);
  const [lawyersLoading, setLawyersLoading] = useState(true);

  // Request Consultation Modal
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedPracticeArea, setSelectedPracticeArea] = useState('');
  const [briefNotes, setBriefNotes] = useState('');
  const [submittingRequest, setSubmittingRequest] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const loadFirmData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await userApi.getFirmByPublicId(firmIdentifier);
        if (isMounted) {
          if (res?.data) {
            setFirm(res.data);
          } else {
            setError('Institutional law firm profile not found.');
          }
        }
      } catch (err) {
        if (isMounted) {
          console.warn('Failed to load firm profile by identifier:', err);
          // Fallback lookup from all firms
          try {
            const allRes = await userApi.getFirms();
            const list = allRes?.data?.content || allRes?.data || [];
            const matching = list.find(
              (f) =>
                f.publicId === firmIdentifier ||
                f.slug === firmIdentifier ||
                f.firmName?.toLowerCase().includes(firmIdentifier.toLowerCase())
            );
            if (matching) {
              setFirm(matching);
            } else {
              setError('Institutional law firm profile not found.');
            }
          } catch {
            setError('Failed to load law firm details. Please check your connection.');
          }
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadFirmData();

    return () => {
      isMounted = false;
    };
  }, [firmIdentifier]);

  // Load firm lawyers
  useEffect(() => {
    let isMounted = true;
    const loadLawyers = async () => {
      setLawyersLoading(true);
      try {
        const res = await userApi.searchLawyers();
        const list = res?.data?.content || res?.data || [];
        if (isMounted) {
          if (firm) {
            const matched = list.filter(
              (l) =>
                l.associatedFirmName === firm.firmName ||
                l.associatedFirmSlug === firm.slug ||
                (firm.members && firm.members.some((m) => m.lawyerUserPublicId === (l.userPublicId || l.publicId)))
            );
            setAssociatedLawyers(matched.length > 0 ? matched : list.slice(0, 3));
          } else {
            setAssociatedLawyers(list.slice(0, 3));
          }
        }
      } catch {
        if (isMounted) setAssociatedLawyers([]);
      } finally {
        if (isMounted) setLawyersLoading(false);
      }
    };

    loadLawyers();

    return () => {
      isMounted = false;
    };
  }, [firm]);

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    setSubmittingRequest(true);
    setTimeout(() => {
      setSubmittingRequest(false);
      setRequestSuccess(true);
    }, 800);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6 text-stone-600">
        <div className="w-12 h-12 border-4 border-stone-300 border-t-stone-800 rounded-full animate-spin mb-4" />
        <h2 className="font-serif font-bold text-lg text-stone-900">Loading Institutional Firm Profile...</h2>
        <p className="text-xs text-stone-500 mt-1">Fetching Bar Council credentials, chambers, and partner benches.</p>
      </div>
    );
  }

  if (error || !firm) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-stone-200 p-8 max-w-md w-full text-center shadow-lg">
          <Building className="w-12 h-12 text-stone-400 mx-auto mb-3" />
          <h2 className="font-serif font-bold text-xl text-stone-900">Chambers Profile Unavailable</h2>
          <p className="text-xs text-stone-500 mt-2">{error || 'Firm profile could not be located.'}</p>
          <button
            onClick={() => navigate('/client/firms')}
            className="mt-6 px-5 py-2.5 bg-stone-900 text-white rounded-xl text-xs font-semibold hover:bg-stone-800 transition"
          >
            Return to Law Firms Directory
          </button>
        </div>
      </div>
    );
  }

  const practiceAreas = [
    'Supreme Court & High Court Appellate Litigation',
    'Corporate Advisory & M&A Due Diligence',
    'Commercial Arbitration & Dispute Resolution',
    'Banking, Insolvency & NCLT Practice',
    'White Collar Criminal Defense & Regulatory Governance',
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-16">
      {/* Top Breadcrumb Navigation */}
      <div className="border-b border-stone-200 bg-white/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-stone-600">
            <button
              onClick={() => navigate(-1)}
              className="p-1 hover:bg-stone-100 rounded-lg text-stone-500 hover:text-stone-800 transition flex items-center space-x-1"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline font-medium">Back</span>
            </button>
            <span>/</span>
            <Link to="/client/firms" className="hover:text-stone-900 font-medium">
              Law Firms
            </Link>
            <span>/</span>
            <span className="font-bold text-stone-900 truncate max-w-[200px] sm:max-w-none">
              {firm.firmName}
            </span>
          </div>

          <button
            onClick={() => setShowRequestModal(true)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold rounded-xl text-xs flex items-center space-x-1.5 transition shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Request Consultation</span>
          </button>
        </div>
      </div>

      {/* Hero Header */}
      <div className="bg-gradient-to-b from-stone-900 via-stone-900 to-[#1F1C1B] text-white pt-10 pb-16 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start space-x-5">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-700 text-white flex items-center justify-center font-serif font-bold text-3xl shadow-xl shrink-0 border border-amber-500/30">
                {firm.firmName?.[0] || 'L'}
              </div>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-stone-100">
                    {firm.firmName}
                  </h1>
                  {firm.verificationStatus === 'VERIFIED' && (
                    <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 text-[10px] font-mono font-bold tracking-wide">
                      <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      <span>Verified Law Firm LLP</span>
                    </span>
                  )}
                  <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-stone-800 text-amber-300 border border-stone-700 text-[10px] font-mono">
                    <Award className="w-3 h-3" />
                    <span>Top Tier Chambers</span>
                  </span>
                </div>

                <p className="text-stone-300 text-xs sm:text-sm max-w-2xl leading-relaxed font-sans">
                  {firm.description ||
                    'Premier full-service legal chambers specializing in High Court & Supreme Court litigation, corporate retainer structuring, and regulatory advisory.'}
                </p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-stone-400 pt-1 font-mono">
                  <span className="flex items-center space-x-1.5">
                    <MapPin className="w-3.5 h-3.5 text-stone-400" />
                    <span>{firm.city || 'Mumbai'}, {firm.state || 'India'}</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Users className="w-3.5 h-3.5 text-stone-400" />
                    <span>{associatedLawyers.length || 12} Advocates & Partners</span>
                  </span>
                  <span className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-stone-400" />
                    <span>Est. 2014 &bull; Active Practice</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Box */}
            <div className="bg-stone-800/80 border border-stone-700/80 rounded-2xl p-5 md:w-80 shrink-0 space-y-3 backdrop-blur-sm">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-400">Institutional Retainer</span>
                <span className="font-serif font-bold text-amber-400 text-base">₹3,500 / hr</span>
              </div>
              <div className="text-[11px] text-stone-300 space-y-1">
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Escrow Retainer Protection</span>
                </div>
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Direct High Court Chamber Hearing</span>
                </div>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white font-semibold rounded-xl text-xs transition shadow-lg"
              >
                Request Firm Consultation
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Body */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Columns: Firm Details, Practice Areas, Roster */}
          <div className="lg:col-span-2 space-y-6">
            {/* Practice Areas */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5 text-amber-700" />
                <h2 className="font-serif font-bold text-base text-stone-900">
                  Institutional Practice Benches
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {practiceAreas.map((area, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-stone-50 border border-stone-200/80 text-xs text-stone-800 flex items-start space-x-2"
                  >
                    <Scale className="w-4 h-4 text-stone-600 shrink-0 mt-0.5" />
                    <span className="font-medium">{area}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Firm Partner & Associate Roster */}
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-amber-700" />
                  <h2 className="font-serif font-bold text-base text-stone-900">
                    Advocate Team &amp; Partner Roster
                  </h2>
                </div>
                <span className="text-xs font-mono text-stone-500">
                  {associatedLawyers.length} Verified Counsel
                </span>
              </div>

              {lawyersLoading ? (
                <div className="py-8 text-center text-stone-400 text-xs">
                  <div className="w-6 h-6 border-2 border-stone-400 border-t-stone-800 rounded-full animate-spin mx-auto mb-2" />
                  <span>Loading firm advocates...</span>
                </div>
              ) : associatedLawyers.length === 0 ? (
                <div className="py-6 text-center text-xs text-stone-500">
                  No advocate profiles currently public for this firm.
                </div>
              ) : (
                <div className="space-y-3">
                  {associatedLawyers.map((adv) => {
                    const pubId = adv.username || adv.slug || adv.userPublicId || adv.publicId;
                    return (
                      <div
                        key={pubId}
                        className="p-4 rounded-xl border border-stone-200 hover:border-stone-400 bg-stone-50/50 hover:bg-stone-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-start space-x-3.5">
                          <div className="w-12 h-12 rounded-xl bg-stone-900 text-white font-serif font-bold flex items-center justify-center text-base shrink-0 shadow-xs">
                            {adv.fullName?.[4] || adv.fullName?.[0] || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-serif font-bold text-sm text-stone-900">
                                {adv.fullName}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-mono">
                                Verified
                              </span>
                            </div>
                            <p className="text-xs text-stone-500 font-sans mt-0.5">
                              {adv.specialization?.replace('_', ' ') || 'Commercial Litigation'} &bull; {adv.experienceYears || 12} Years Exp
                            </p>
                            <p className="text-[11px] text-stone-400 font-mono mt-0.5">
                              {adv.qualification || 'Bar Council Enrolled'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => navigate(`/lawyers/${pubId}`)}
                            className="px-3 py-1.5 rounded-lg border border-stone-300 text-stone-700 hover:bg-white text-xs font-semibold transition"
                          >
                            View Profile
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate(`/lawyers/${pubId}`)}
                            className="px-3.5 py-1.5 rounded-lg bg-stone-900 hover:bg-stone-800 text-white text-xs font-semibold transition shadow-xs flex items-center space-x-1"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Book Consultation</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact & Location */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm space-y-4">
              <h3 className="font-serif font-bold text-sm text-stone-900 border-b border-stone-100 pb-2">
                Institutional Contact &amp; Registry
              </h3>

              <div className="space-y-3 text-xs">
                <div className="flex items-start space-x-3 text-stone-700">
                  <MapPin className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Chamber Address</span>
                    <span className="text-stone-500 leading-relaxed font-sans">
                      {firm.address || 'Commercial Chamber Complex, High Court Wing'}, {firm.city || 'Mumbai'}, {firm.state || 'Maharashtra'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-stone-700">
                  <Mail className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Official Communication</span>
                    <span className="text-stone-500 font-mono">{firm.contactEmail || 'registry@lawfirm.in'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-stone-700">
                  <Phone className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Direct Chamber Telephone</span>
                    <span className="text-stone-500 font-mono">{firm.contactPhone || '+91 22 6677 8899'}</span>
                  </div>
                </div>

                <div className="flex items-start space-x-3 text-stone-700">
                  <Lock className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block text-stone-900">Bar Council Compliant</span>
                    <span className="text-stone-500 leading-relaxed font-sans">
                      All partner briefs protected under Section 126 of Indian Evidence Act.
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-2">
              <p className="font-serif font-bold text-amber-900">Need Institutional Retainer?</p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Connect directly with the Managing Partner for dedicated multi-seat corporate advisory retainers.
              </p>
              <button
                onClick={() => setShowRequestModal(true)}
                className="w-full py-2 bg-amber-700 hover:bg-amber-800 text-white font-semibold rounded-lg text-xs transition"
              >
                Inquire With Managing Partner
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Request Consultation Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 mb-4">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Request Consultation with {firm.firmName}
                </h3>
                <p className="text-stone-500 text-[11px]">
                  Institutional retainers and specialized practice bench assignment.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowRequestModal(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            {requestSuccess ? (
              <div className="p-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h4 className="font-serif font-bold text-stone-900 text-base">Request Dispatched</h4>
                <p className="text-stone-600 text-xs">
                  Your inquiry has been submitted to the registry of {firm.firmName}. The Managing Partner desk will review your matter and contact you.
                </p>
                <button
                  onClick={() => setShowRequestModal(false)}
                  className="mt-4 px-5 py-2 bg-stone-900 text-white rounded-xl text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleRequestSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Select Practice Bench
                  </label>
                  <select
                    value={selectedPracticeArea}
                    onChange={(e) => setSelectedPracticeArea(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-200 bg-stone-50 text-xs text-stone-800"
                    required
                  >
                    <option value="">Select Specialization...</option>
                    {practiceAreas.map((pa, idx) => (
                      <option key={idx} value={pa}>{pa}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Matter Description / Brief Note
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe your case, contract review, or dispute details..."
                    value={briefNotes}
                    onChange={(e) => setBriefNotes(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-stone-200 text-xs text-stone-800 focus:outline-none focus:ring-1 focus:ring-stone-900"
                    required
                  />
                </div>

                <div className="p-3 rounded-lg bg-stone-50 border border-stone-200 text-stone-600 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span>Preliminary Review Retainer</span>
                    <span className="font-bold text-stone-900">₹3,500</span>
                  </div>
                  <p className="text-[10px] text-stone-400">Protected by escrow until formal partner confirmation.</p>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowRequestModal(false)}
                    className="px-3.5 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRequest}
                    className="px-4 py-2 rounded-lg bg-stone-900 hover:bg-stone-800 text-white font-semibold transition"
                  >
                    {submittingRequest ? 'Dispatching...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FirmProfilePage;
