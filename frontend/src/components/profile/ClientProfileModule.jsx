import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Mail,
  Lock,
  Clock,
  CheckCircle2,
  AlertCircle,
  Save,
  FileText,
  Smartphone,
  Check,
} from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { Level2ChangeModal } from './Level2ChangeModal';
import { ProfileChangeHistory } from './ProfileChangeHistory';

export const ClientProfileModule = ({ user, onSaveToast }) => {
  const [activeTab, setActiveTab] = useState('personal');

  // Level 2 Modal State
  const [l2ModalOpen, setL2ModalOpen] = useState(false);
  const [activeL2Field, setActiveL2Field] = useState({ label: '', current: '' });

  // Client Personal Information (Private & Confidential)
  const [fullName, setFullName] = useState(user?.fullName || 'Rohit Verma');
  const [email, setEmail] = useState(user?.email || 'client@lawinomeet.com');
  const [phone, setPhone] = useState(user?.phone || '+91 98765 43210');
  const [dob, setDob] = useState('14 Aug 1992');
  const [gender, setGender] = useState('Male');
  const [preferredLanguage, setPreferredLanguage] = useState('English & Hindi');
  const [residentialAddress, setResidentialAddress] = useState(
    'Flat 402, Green Glen Apartments, Outer Ring Road, Bellandur, Bengaluru 560103'
  );
  const [city, setCity] = useState('Bengaluru');
  const [state, setState] = useState('Karnataka');
  const [pinCode, setPinCode] = useState('560103');

  // Active Sessions
  const [activeSessions, setActiveSessions] = useState([
    {
      id: 'sess-c01',
      device: 'Windows 11 PC (Chrome 122)',
      ip: '103.21.144.92 (Bengaluru, IN)',
      lastActive: 'Active now (Current session)',
      isCurrent: true,
    },
    {
      id: 'sess-c02',
      device: 'iPhone 15 Pro (Safari Mobile)',
      ip: '49.207.211.8 (Bengaluru, IN)',
      lastActive: '3 hours ago',
      isCurrent: false,
    },
  ]);

  // Client Activity (System Records)
  const clientActivity = {
    totalAppointments: 6,
    upcomingAppointments: 2,
    completedConsultations: 4,
    cancelledAppointments: 0,
    totalSpent: '₹12,500',
    refundHistoryCount: 0,
    reviewsSubmitted: 3,
  };

  // Profile Change History (Audit Trail)
  const [changeHistory, setChangeHistory] = useState([
    {
      id: 'cch-001',
      date: '16 Nov 2026, 01:40 AM',
      field: 'Preferred Language of Advice',
      oldValue: 'English Only',
      newValue: 'English & Hindi',
      status: 'UPDATED',
      level: 'Level 1 Standard',
      reviewer: 'Self (Client Update)',
      remarks: 'Updated language preferences for consultation dockets.',
    },
    {
      id: 'cch-002',
      date: '12 Jan 2026, 11:15 AM',
      field: 'Primary Contact Mobile (OTP)',
      oldValue: '+91 98112 00000',
      newValue: '+91 98765 43210',
      status: 'APPROVED',
      level: 'Level 2 OTP Verified',
      reviewer: 'SMS Gateway OTP Verification',
      remarks: 'Validated via 6-digit cryptographic SMS OTP.',
    },
  ]);

  // Handle Level 1 Save
  const handleLevel1Save = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `cch-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      field: 'Personal Identity & Address',
      oldValue: 'Previous Profile State',
      newValue: 'Updated Details',
      status: 'UPDATED',
      level: 'Level 1 Standard',
      reviewer: 'Self (Standard Update)',
      remarks: 'Client personal details updated.',
    };
    setChangeHistory([newEntry, ...changeHistory]);
    onSaveToast('Client details updated successfully.');
  };

  // Open Level 2 Change Modal
  const requestL2Change = (label, current) => {
    setActiveL2Field({ label, current });
    setL2ModalOpen(true);
  };

  // Handle Level 2 Submit
  const handleL2Submit = ({ fieldLabel, currentValue, newValue, reason }) => {
    const newRequest = {
      id: `cch-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      field: fieldLabel,
      oldValue: currentValue,
      newValue: newValue,
      status: 'UNDER_REVIEW',
      level: 'Level 2 Identity Verified',
      reviewer: 'Identity Verification Queue',
      remarks: `Reason: ${reason}. Verification in progress.`,
    };
    setChangeHistory([newRequest, ...changeHistory]);
    onSaveToast(`Verification request logged for [${fieldLabel}].`);
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'contact', label: 'Contact Details', icon: Mail },
    { id: 'privacy', label: 'Privacy & Statutory Privilege', icon: ShieldCheck },
    { id: 'security', label: 'Account & Security', icon: Lock },
    { id: 'history', label: 'History', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2B1216] via-[#1E1715] to-[#171412] border border-[#5A101B]/50 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              Client Legal Profile // Confidential &amp; Protected
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-cream-50">{fullName}</h2>
          <p className="text-xs text-stone-300 mt-0.5 font-sans">
            Client ID: <span className="font-mono text-amber-300">CL-2026-9812</span> • {email} • {city}, {state}
          </p>
          <div className="flex items-center space-x-2 mt-2 text-[10px] font-mono text-stone-400">
            <span className="px-1.5 py-0.5 rounded bg-stone-800 text-emerald-400">
              ✓ Email Verified
            </span>
            <span className="px-1.5 py-0.5 rounded bg-stone-800 text-emerald-400">
              ✓ Mobile OTP Verified
            </span>
            <span className="px-1.5 py-0.5 rounded bg-stone-800 text-stone-300">
              Section 126 Privilege Active
            </span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-stone-900/80 border border-stone-800 text-right text-xs shrink-0">
          <p className="text-[10px] font-mono text-stone-400 uppercase">Consultations Taken</p>
          <p className="text-base font-bold text-cream-100 font-serif">
            {clientActivity.completedConsultations} Completed • {clientActivity.upcomingAppointments} Scheduled
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-stone-200/80 overflow-x-auto pb-1 text-xs select-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-3.5 py-2.5 rounded-xl font-medium transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-[var(--bg-primary)] text-white shadow-xs font-semibold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* =====================================================================
          TAB 1: PERSONAL INFORMATION
      ====================================================================== */}
      {activeTab === 'personal' && (
        <form onSubmit={handleLevel1Save} className="space-y-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Client Confidential Identity Details
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Your identity is kept strictly confidential. Client profile information is never indexed or displayed publicly.
                </p>
              </div>
              <LevelBadge level={1} visibility="private" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Legal Name */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Full Legal Name
                  </label>
                  <LevelBadge level={2} visibility="private" />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    disabled
                    value={fullName}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100/80 text-stone-800 text-xs font-semibold cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => requestL2Change('Full Legal Name', fullName)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>

              {/* Date of Birth */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Date of Birth
                  </label>
                  <LevelBadge level={1} visibility="private" />
                </div>
                <input
                  type="text"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              {/* Gender */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Gender (Optional)
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-Binary">Non-Binary</option>
                  <option value="Prefer Not to Disclose">Prefer Not to Disclose</option>
                </select>
              </div>

              {/* Preferred Language */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Preferred Language of Advice
                </label>
                <input
                  type="text"
                  value={preferredLanguage}
                  onChange={(e) => setPreferredLanguage(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              {/* Residential Address */}
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Residential / Billing Address
                </label>
                <input
                  type="text"
                  value={residentialAddress}
                  onChange={(e) => setResidentialAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              {/* City, State & PIN */}
              <div className="md:col-span-2 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">PIN Code</label>
                  <input
                    type="text"
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Personal Information</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          TAB 2: CONTACT DETAILS
      ====================================================================== */}
      {activeTab === 'contact' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Contact Channels &amp; Verification Badges
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Official phone and email records used for WebRTC room invitations and billing invoices.
              </p>
            </div>
            <LevelBadge level={2} visibility="private" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Primary Email Address</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  VERIFIED
                </span>
              </div>
              <p className="font-mono text-stone-900 text-xs font-bold">{email}</p>
              <button
                type="button"
                onClick={() => requestL2Change('Primary Email Address', email)}
                className="text-[10px] text-[var(--bg-primary)] hover:underline font-semibold cursor-pointer"
              >
                Request Email Change
              </button>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-800">Primary Mobile Phone</span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  OTP VERIFIED
                </span>
              </div>
              <p className="font-mono text-stone-900 text-xs font-bold">{phone}</p>
              <button
                type="button"
                onClick={() => requestL2Change('Primary Mobile Phone', phone)}
                className="text-[10px] text-[var(--bg-primary)] hover:underline font-semibold cursor-pointer"
              >
                Change Number via OTP
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: PRIVACY & STATUTORY PRIVILEGE
      ====================================================================== */}
      {activeTab === 'privacy' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Statutory Legal Privilege &amp; DPDP Privacy</span>
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Constitutional and statutory attorney-client confidentiality rules.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              PRIVILEGE SHIELD ACTIVE
            </span>
          </div>

          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 text-stone-700 space-y-2">
            <p className="font-semibold text-stone-900 text-xs">
              Section 126 of Indian Evidence Act / Section 132 BSA Confidentiality
            </p>
            <p className="text-[11px] text-stone-600 leading-relaxed">
              All communications, case files, audio/video room interactions, and text consultations between you and verified practitioners are privileged legal communications. LawinoMeet does not monitor, sell, or disclose client legal briefs to third parties.
            </p>
          </div>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 rounded-xl border border-stone-200 bg-stone-50/50">
              <div>
                <p className="font-semibold text-stone-900">Request Complete Data Export</p>
                <p className="text-[10px] text-stone-500">Download all your appointment receipts, briefs, and personal audit trails (DPDP Compliance).</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Data archive export generated. Download link sent to your registered email.')}
                className="px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 font-semibold text-[11px] cursor-pointer"
              >
                Export Archive
              </button>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl border border-rose-200 bg-rose-50/40">
              <div>
                <p className="font-semibold text-rose-900">Account Deactivation or Erasure</p>
                <p className="text-[10px] text-rose-700">Submit a formal account erasure request under personal data regulations.</p>
              </div>
              <button
                type="button"
                onClick={() => alert('Account erasure request queued for compliance review.')}
                className="px-3.5 py-2 rounded-xl border border-rose-300 bg-white hover:bg-rose-50 text-rose-800 font-semibold text-[11px] cursor-pointer"
              >
                Request Erasure
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ACCOUNT & SECURITY (NO 2FA)
      ====================================================================== */}
      {activeTab === 'security' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Security &amp; Active Login Sessions
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Active device management and session controls.
              </p>
            </div>
            <LevelBadge level={1} visibility="private" />
          </div>

          {/* Active Sessions */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-serif font-bold text-sm text-stone-900">Active Login Sessions</h4>
              <button
                type="button"
                onClick={() => {
                  setActiveSessions(activeSessions.filter((s) => s.isCurrent));
                  onSaveToast('Terminated all other active device sessions.');
                }}
                className="text-[10px] text-rose-600 hover:underline font-semibold cursor-pointer"
              >
                Terminate Other Sessions
              </button>
            </div>
            <div className="space-y-2">
              {activeSessions.map((s) => (
                <div
                  key={s.id}
                  className="p-3 rounded-xl border border-stone-200 bg-stone-50/60 flex items-center justify-between"
                >
                  <div>
                    <p className="font-semibold text-stone-900">{s.device}</p>
                    <p className="text-[10px] text-stone-500 font-mono">
                      {s.ip} • {s.lastActive}
                    </p>
                  </div>
                  {s.isCurrent ? (
                    <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      CURRENT
                    </span>
                  ) : (
                    <span className="text-[10px] text-stone-400">Authenticated</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: HISTORY (CONSULTATION ACTIVITY + PROFILE AUDIT TRAIL)
      ====================================================================== */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Consultation Activity Snapshot */}
          <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-4 text-xs">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Consultation Records
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Summary of your past video hearings and consultation bookings.
                </p>
              </div>
              <LevelBadge level={3} visibility="private" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-mono uppercase text-stone-500">Total Consultations</span>
                <p className="font-serif font-bold text-stone-900 text-base mt-0.5">{clientActivity.totalAppointments}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="text-[10px] font-mono uppercase text-emerald-700">Completed Sessions</span>
                <p className="font-serif font-bold text-emerald-900 text-base mt-0.5">{clientActivity.completedConsultations}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-blue-50 border border-blue-200">
                <span className="text-[10px] font-mono uppercase text-blue-700">Upcoming Hearings</span>
                <p className="font-serif font-bold text-blue-900 text-base mt-0.5">{clientActivity.upcomingAppointments}</p>
              </div>
              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <span className="text-[10px] font-mono uppercase text-stone-500">Total Invoiced</span>
                <p className="font-serif font-bold text-stone-900 text-base mt-0.5">{clientActivity.totalSpent}</p>
              </div>
            </div>
          </div>

          {/* Profile Change Audit Trail */}
          <ProfileChangeHistory
            history={changeHistory}
            title="Profile Modification History"
          />
        </div>
      )}

      {/* =====================================================================
          MODAL: LEVEL 2 CHANGE MODAL
      ====================================================================== */}
      <Level2ChangeModal
        isOpen={l2ModalOpen}
        onClose={() => setL2ModalOpen(false)}
        fieldLabel={activeL2Field.label}
        currentValue={activeL2Field.current}
        onSubmit={handleL2Submit}
      />
    </div>
  );
};
