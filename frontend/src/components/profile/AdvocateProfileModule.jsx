import React, { useState } from 'react';
import {
  User,
  ShieldCheck,
  Scale,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Lock,
  Building,
  CheckCircle2,
  AlertCircle,
  Eye,
  Camera,
  ExternalLink,
  Save,
  KeyRound,
  FileText,
  Sparkles,
  Link2,
  Trash2,
  Smartphone,
  Shield,
  Layers,
  ArrowRight,
  Info,
  Send,
} from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { Level2ChangeModal } from './Level2ChangeModal';
import { ProfileChangeHistory } from './ProfileChangeHistory';
import { userApi } from '../../api/userApi';

export const AdvocateProfileModule = ({ user, onSaveToast }) => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const photoInputRef = React.useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setIsUploadingPhoto(true);
      const res = await userApi.uploadLawyerPhoto(file);
      const newUrl = res?.data?.profileImageUrl || res?.profileImageUrl;
      if (newUrl) {
        setProfileImageUrl(newUrl);
        onSaveToast('Profile photograph uploaded successfully.');
      }
    } catch (err) {
      console.warn('Failed to upload photo:', err);
      setProfileImageUrl(URL.createObjectURL(file));
      onSaveToast('Profile photograph preview updated.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  // Level 2 Modal State
  const [l2ModalOpen, setL2ModalOpen] = useState(false);
  const [activeL2Field, setActiveL2Field] = useState({ label: '', current: '' });

  // Unified Bar Council Credential Modal State (Single Request)
  const [isBarCredentialsModalOpen, setIsBarCredentialsModalOpen] = useState(false);
  const [newBarCouncil, setNewBarCouncil] = useState('Bar Council of Delhi');
  const [newEnrollmentNumber, setNewEnrollmentNumber] = useState('D/1482/2009');
  const [newEnrollmentYear, setNewEnrollmentYear] = useState(2009);
  const [barDriveLink, setBarDriveLink] = useState('');
  const [barChangeReason, setBarChangeReason] = useState('');

  // Public Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Advocate Profile State (Level 1: Immediately Editable)
  const [displayName, setDisplayName] = useState(user?.displayName || 'Adv. Raghavan Nambiar');
  const [headline, setHeadline] = useState(
    'Senior Criminal Defense & Appellate Counsel // Supreme Court of India & Delhi High Court'
  );
  const [bio, setBio] = useState(
    user?.bio ||
      'Senior criminal defense counsel with 15+ years of active litigation experience across the Supreme Court of India and Delhi High Court. Expert in urgent bail hearings, FIR quashing, economic offences, and cross-examination strategies. Known for clear, transparent counsel without unnecessary litigation delays.'
  );
  const [city, setCity] = useState(user?.city || 'Delhi NCR');
  const [state, setState] = useState('Delhi');
  const [languages, setLanguages] = useState('English, Hindi, Punjabi, Malayalam');
  const [consultLanguages, setConsultLanguages] = useState('English, Hindi');
  const [residentialAddress, setResidentialAddress] = useState(
    'B-14, Lawyers Colony, Mayur Vihar Phase 1, New Delhi 110091'
  );

  // Practice & Consultation Information (Level 1)
  const [onlineFee, setOnlineFee] = useState(1500);
  const [chamberFee, setChamberFee] = useState(2000);
  const [chatFee, setChatFee] = useState(800);
  const [consultDuration, setConsultDuration] = useState('30 mins');
  const [chamberAddress, setChamberAddress] = useState(
    'Chamber 412, Lawyers Chambers Block B, Delhi High Court, Sher Shah Road, New Delhi 110003'
  );
  const [workingHours, setWorkingHours] = useState('10:00 AM – 07:30 PM');
  const [workingDays, setWorkingDays] = useState('Monday to Saturday');
  const [advanceBookingDays, setAdvanceBookingDays] = useState('14 days');
  const [acceptingClients, setAcceptingClients] = useState(true);
  const [messagingEnabled, setMessagingEnabled] = useState(true);
  const [chatEnabled, setChatEnabled] = useState(true);

  // Professional Information (Level 2: Verified)
  const [legalName, setLegalName] = useState(user?.fullName || 'Raghavan Nambiar');
  const [barCouncil, setBarCouncil] = useState('Bar Council of Delhi');
  const [enrollmentNumber, setEnrollmentNumber] = useState('D/1482/2009');
  const [enrollmentYear, setEnrollmentYear] = useState(2009);
  const [education, setEducation] = useState(
    'LL.B - Faculty of Law, University of Delhi (2009) | LL.M (Criminal Law) - Indian Law Institute (2012)'
  );
  const [specializations, setSpecializations] = useState(
    'Criminal Defense, Anticipatory Bail, Economic Offences, Writs'
  );
  const [courtsPractice, setCourtsPractice] = useState(
    'Supreme Court of India, Delhi High Court, Patiala House District Court'
  );

  // Automatic Experience Calculation from Verified Enrollment Date
  const calculatedExperience = Math.max(1, new Date().getFullYear() - enrollmentYear);

  // Firm Association (Firm Controlled)
  const [associatedFirm, setAssociatedFirm] = useState({
    firmName: 'Lex Veritas Legal LLP',
    registrationNumber: 'LLP-DEL-2024-981',
    membershipStatus: 'ACTIVE',
    designation: 'Senior Managing Partner',
    joinedDate: '12 Jan 2024',
    workingHours: '09:30 AM – 06:30 PM (Mon-Fri)',
    practicePermission: 'FIRM_AND_INDEPENDENT', // 'FIRM_EXCLUSIVE' | 'FIRM_AND_INDEPENDENT'
    permissionEffectiveDate: '15 Jan 2024',
  });

  // Google Drive Verification Links (Private to Platform Admins)
  const [driveLinks, setDriveLinks] = useState({
    enrollmentLink: 'https://drive.google.com/drive/folders/1aBcDeFgHiJkLmNoPqRsTuVwXyZ',
    identityLink: 'https://drive.google.com/drive/folders/2bCdEfGhIjKlMnOpQrStUvWxYz',
    educationLink: 'https://drive.google.com/drive/folders/3cDeFgHiJkLmNoPqRsTuVwXyZa',
    additionalDocsLink: 'https://drive.google.com/drive/folders/4dEfGhIjKlMnOpQrStUvWxYb',
    submissionDate: '14 Jan 2024, 11:30 AM',
    status: 'VERIFIED',
    adminRemarks: 'Verified against Bar Council of Delhi Enrollment Rolls. Certificate of Practice on record.',
    lastReviewed: '18 Jan 2024',
  });

  // Profile Change History (Audit Trail)
  const [changeHistory, setChangeHistory] = useState([
    {
      id: 'ch-001',
      date: '16 Nov 2026, 02:15 AM',
      field: 'Online Consultation Fee',
      oldValue: '₹1,200',
      newValue: '₹1,500',
      status: 'UPDATED',
      level: 'Level 1 Standard',
      reviewer: 'Self (Standard Update)',
      remarks: 'Self-service fee adjustment. Confirmed existing bookings retained original fee.',
    },
    {
      id: 'ch-002',
      date: '10 Feb 2026, 04:30 PM',
      field: 'Bar Council Enrollment Number',
      oldValue: 'D/1482/2009',
      newValue: 'D/1482/2009 (Renewal Cert 2025-26)',
      status: 'APPROVED',
      level: 'Level 2 Admin Verified',
      reviewer: 'Adv. Suresh Rao (Verification Officer)',
      remarks: 'Bar Council of Delhi 2025 renewal certificate validated via official drive folder.',
    },
    {
      id: 'ch-003',
      date: '28 Jan 2026, 10:15 AM',
      field: 'Practice Permissions (Section 8.C)',
      oldValue: 'FIRM_EXCLUSIVE',
      newValue: 'FIRM_AND_INDEPENDENT',
      status: 'APPROVED',
      level: 'Level 2 Firm Verified',
      reviewer: 'Lex Veritas Legal LLP (Managing Partner)',
      remarks: 'Authorized dual booking for independent criminal appeals and high court writs.',
    },
  ]);

  // Handle Level 1 Save
  const handleLevel1Save = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `ch-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      field: 'General Profile Details',
      oldValue: 'Previous Profile Snapshot',
      newValue: 'Updated Details (Bio, Fees, Availability)',
      status: 'UPDATED',
      level: 'Level 1 Standard',
      reviewer: 'Self (Standard Update)',
      remarks: 'Self-service update saved to public profile.',
    };
    setChangeHistory([newEntry, ...changeHistory]);
    onSaveToast('Profile details saved and logged in change history.');
  };

  // Open Level 2 Change Modal
  const requestL2Change = (label, current) => {
    setActiveL2Field({ label, current });
    setL2ModalOpen(true);
  };

  // Handle Level 2 Submission
  const handleL2Submit = ({ fieldLabel, currentValue, newValue, reason }) => {
    const newRequest = {
      id: `ch-${Date.now()}`,
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
      level: 'Level 2 Admin Verified',
      reviewer: 'Pending Platform Review',
      remarks: `Reason: ${reason}. Existing verified value remains active publicly until approved.`,
    };
    setChangeHistory([newRequest, ...changeHistory]);
    onSaveToast(
      `Verification Request Submitted for [${fieldLabel}]. Pending review by Platform Compliance Officer.`
    );
  };

  // Handle Unified Single Bar Credentials Amendment
  const handleBarCredentialsSubmit = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `ch-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      field: 'Bar Council Statutory Credentials',
      oldValue: `${barCouncil} • ${enrollmentNumber} (${enrollmentYear})`,
      newValue: `${newBarCouncil} • ${newEnrollmentNumber} (${newEnrollmentYear})`,
      status: 'UNDER_REVIEW',
      level: 'Level 2 Admin Verified',
      reviewer: 'Bar Council Compliance Queue',
      remarks: `Reason: ${barChangeReason || 'Bar Council credential update'}. Proof: ${barDriveLink}. Existing verified records remain active publicly until approved.`,
    };
    setChangeHistory([newEntry, ...changeHistory]);
    setIsBarCredentialsModalOpen(false);
    onSaveToast(
      `Submitted 1 unified verification request for Bar Council credentials (${newEnrollmentNumber}).`
    );
  };

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'professional', label: 'Professional Details', icon: Scale },
    { id: 'practice', label: 'Practice & Availability', icon: Calendar },
    { id: 'firm', label: 'Firm Association', icon: Building },
    { id: 'verification', label: 'Verification (Drive)', icon: ShieldCheck },
    { id: 'history', label: 'History', icon: HistoryBadgeIcon },
  ];

  function HistoryBadgeIcon(props) {
    return <FileText {...props} />;
  }

  return (
    <div className="space-y-6">
      {/* Top Banner & Public Preview Trigger */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2B1216] via-[#1E1715] to-[#171412] border border-[#5A101B]/50 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              Advocate Practitioner Portal // Verified Counsel
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-cream-50">
            {displayName} ({legalName})
          </h2>
          <p className="text-xs text-stone-300 mt-0.5 font-sans max-w-2xl">
            {headline}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-400 font-mono">
            <span>Bar Enrollment: <strong className="text-amber-300">{enrollmentNumber}</strong></span>
            <span>•</span>
            <span>Experience: <strong className="text-emerald-300">{calculatedExperience} Years Active</strong> (From {enrollmentYear})</span>
            <span>•</span>
            <span>Firm: <strong className="text-stone-200">{associatedFirm.firmName}</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-2 shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Preview Public Profile</span>
          </button>
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
                  Personal &amp; Contact Details
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Core identity details. Public items are displayed on your advocate discovery card.
                </p>
              </div>
              <LevelBadge level={1} visibility="public" />
            </div>

            {/* Profile Photo */}
            <div className="flex items-center space-x-4">
              <input
                type="file"
                ref={photoInputRef}
                accept="image/png, image/jpeg, image/webp"
                className="hidden"
                onChange={handlePhotoUpload}
              />
              <div className="relative group">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#941B2B] to-amber-700 text-white flex items-center justify-center font-serif font-bold text-2xl shadow-md overflow-hidden">
                  {profileImageUrl ? (
                    <img src={profileImageUrl} alt="Advocate profile" className="w-full h-full object-cover" />
                  ) : (
                    displayName
                      ?.replace('Adv. ', '')
                      .split(' ')
                      .map((n) => n[0])
                      .join('')
                      .slice(0, 2)
                      .toUpperCase() || 'RN'
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => photoInputRef.current?.click()}
                  disabled={isUploadingPhoto}
                  className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 rounded-2xl transition cursor-pointer"
                  title="Upload New Photograph (Level 1)"
                >
                  <Camera className="w-5 h-5 mb-0.5" />
                  <span className="text-[9px] font-mono">{isUploadingPhoto ? 'Uploading...' : 'Change'}</span>
                </button>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-semibold text-stone-900 text-sm">Profile Photograph</h4>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  Professional court attire recommended (dark jacket with advocate neckband).
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Legal Name (Level 2 Restricted) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Full Legal Name (As per Bar Enrollment)
                  </label>
                  <LevelBadge level={2} visibility="public" />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    disabled
                    value={legalName}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100/80 text-stone-800 text-xs font-semibold cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => requestL2Change('Full Legal Name', legalName)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Request Edit
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Protected under Bar Council identity records. Changing requires gazette/bar review.
                </p>
              </div>

              {/* Public Display Name (Level 1 Editable) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Public Display Name
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                />
                <p className="text-[10px] text-stone-400 mt-1">
                  The client-facing title shown on search cards and appointment invites.
                </p>
              </div>

              {/* Email Address */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Official Email Address
                  </label>
                  <LevelBadge level={1} visibility="private" />
                </div>
                <input
                  type="email"
                  defaultValue="raghavan.nambiar@lexveritas.com"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              {/* Mobile Phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Primary Contact Number (OTP Verified)
                  </label>
                  <LevelBadge level={1} visibility="private" />
                </div>
                <input
                  type="text"
                  defaultValue="+91 98102 34819"
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              {/* City & State */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Practice City &amp; State
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="City"
                    className="p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                  />
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="State"
                    className="p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                  />
                </div>
              </div>

              {/* Languages Known */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Languages Known
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={languages}
                  onChange={(e) => setLanguages(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Residential Address (Private) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-700">
                  Residential / Postal Address (Private Confidential Record)
                </label>
                <LevelBadge level={1} visibility="private" />
              </div>
              <input
                type="text"
                value={residentialAddress}
                onChange={(e) => setResidentialAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Never disclosed publicly. Used only for statutory compliance and platform tax invoicing.
              </p>
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
          TAB 2: PROFESSIONAL DETAILS
      ====================================================================== */}
      {activeTab === 'professional' && (
        <form onSubmit={handleLevel1Save} className="space-y-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Bar Credentials &amp; Legal Qualifications
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Statutory enrollment records and practice jurisdictions.
                </p>
              </div>
              <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
                BAR VERIFIED
              </span>
            </div>

            {/* Bar Council & Enrollment Grid */}
            <div className="p-4 rounded-xl bg-stone-50/80 border border-stone-200 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-200/60 flex-wrap gap-2">
                <div>
                  <span className="text-[11px] font-semibold text-stone-800">
                    Statutory Enrollment &amp; Bar Authority
                  </span>
                  <p className="text-[10px] text-stone-500 font-sans">
                    Updating Bar Council, Enrollment Number or Year requires statutory proof and is submitted in 1 unified request.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setNewBarCouncil(barCouncil);
                    setNewEnrollmentNumber(enrollmentNumber);
                    setNewEnrollmentYear(enrollmentYear);
                    setIsBarCredentialsModalOpen(true);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-[11px] flex items-center space-x-1.5 cursor-pointer transition shadow-xs"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Update Bar Council Credentials (1 Request)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                      State Bar Council
                    </span>
                    <LevelBadge level={2} visibility="public" />
                  </div>
                  <p className="font-serif font-bold text-stone-900 text-xs">{barCouncil}</p>
                  <span className="text-[10px] text-stone-400 mt-1 block font-mono">Governing Bar</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                      Enrollment Number
                    </span>
                    <LevelBadge level={2} visibility="verified" />
                  </div>
                  <p className="font-mono font-bold text-stone-900 text-xs">{enrollmentNumber}</p>
                  <span className="text-[10px] text-stone-400 mt-1 block font-mono">Statutory Roll ID</span>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                      Derived Experience
                    </span>
                    <LevelBadge level={3} visibility="public" />
                  </div>
                  <p className="font-bold text-emerald-700 text-sm">{calculatedExperience} Years Active</p>
                  <p className="text-[9px] text-stone-500 mt-0.5 font-mono">
                    Calculated automatically from {enrollmentYear} enrollment date (Statutory Rule).
                  </p>
                </div>
              </div>
            </div>

            {/* Professional Headline */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-700">
                  Professional Headline
                </label>
                <LevelBadge level={1} visibility="public" />
              </div>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
              />
            </div>

            {/* About / Biography */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-700">
                  Counsel Biography &amp; Practice Narrative
                </label>
                <LevelBadge level={1} visibility="public" />
              </div>
              <textarea
                rows={4}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full p-3 rounded-xl border border-stone-300 text-xs text-stone-900 leading-relaxed focus:outline-none focus:border-[var(--bg-primary)]"
              />
            </div>

            {/* Education & Qualifications */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-700">
                  Education &amp; Law Degrees
                </label>
                <LevelBadge level={2} visibility="public" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  disabled
                  value={education}
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100/80 text-stone-800 text-xs font-semibold cursor-not-allowed"
                />
                <button
                  type="button"
                  onClick={() => requestL2Change('Law Education & Degrees', education)}
                  className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                >
                  Add Degree
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Practice Areas */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Primary Practice Areas
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={specializations}
                  onChange={(e) => setSpecializations(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              {/* Courts / Jurisdictions */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Courts of Regular Practice
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={courtsPractice}
                  onChange={(e) => setCourtsPractice(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Professional Details</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          TAB 3: PRACTICE & AVAILABILITY
      ====================================================================== */}
      {activeTab === 'practice' && (
        <form onSubmit={handleLevel1Save} className="space-y-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Consultation Modes, Fees &amp; Working Hours
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Update consultation pricing and chamber booking rules. Confirmed appointments retain original agreed fees.
                </p>
              </div>
              <LevelBadge level={1} visibility="public" />
            </div>

            {/* Fee Policy Banner */}
            <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-900 flex items-start space-x-2.5">
              <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Statutory Fee-Retention Guarantee:</strong> When you increase or decrease your consultation fees, the new rate applies to future bookings immediately. All existing scheduled or confirmed client appointments retain the fee originally agreed upon at booking.
              </p>
            </div>

            {/* Consultation Types & Fees (Video, Chamber, Chat) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-stone-900">Online-Video Conferencing</span>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Standard Fee per Session (₹)
                  </label>
                  <input
                    type="number"
                    value={onlineFee}
                    onChange={(e) => setOnlineFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 font-bold"
                  />
                </div>
                <p className="text-[10px] text-stone-500">
                  30-minute encrypted WebRTC video conference with optional local-device recording.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-stone-900">In-Office (Physical)</span>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Chamber Session Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={chamberFee}
                    onChange={(e) => setChamberFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 font-bold"
                  />
                </div>
                <p className="text-[10px] text-stone-500">
                  45-minute in-person briefing at your verified High Court chamber.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-serif font-bold text-stone-900">Online Chat Service</span>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Chat Advisory Fee (₹)
                  </label>
                  <input
                    type="number"
                    value={chatFee}
                    onChange={(e) => setChatFee(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 bg-white text-xs text-stone-900 font-bold"
                  />
                </div>
                <p className="text-[10px] text-stone-500">
                  24-hour privileged chat consultation with secure document review &amp; legal opinion.
                </p>
              </div>
            </div>

            {/* Chamber Physical Address */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-700">
                  Verified Chamber Location
                </label>
                <LevelBadge level={1} visibility="public" />
              </div>
              <input
                type="text"
                value={chamberAddress}
                onChange={(e) => setChamberAddress(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Working Hours
                </label>
                <input
                  type="text"
                  value={workingHours}
                  onChange={(e) => setWorkingHours(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Weekly Operating Days
                </label>
                <input
                  type="text"
                  value={workingDays}
                  onChange={(e) => setWorkingDays(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Advance Booking Window
                </label>
                <input
                  type="text"
                  value={advanceBookingDays}
                  onChange={(e) => setAdvanceBookingDays(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center space-x-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acceptingClients}
                  onChange={(e) => setAcceptingClients(e.target.checked)}
                  className="rounded text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
                />
                <div>
                  <p className="font-semibold text-stone-900 text-xs">Online-Video Conferencing</p>
                  <p className="text-[10px] text-stone-500">Accept client bookings for encrypted online WebRTC video consultations</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={messagingEnabled}
                  onChange={(e) => setMessagingEnabled(e.target.checked)}
                  className="rounded text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
                />
                <div>
                  <p className="font-semibold text-stone-900 text-xs">In-Office (Physical)</p>
                  <p className="text-[10px] text-stone-500">Accept client bookings for in-person office &amp; chamber consultations</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 rounded-xl border border-stone-200 bg-stone-50/50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={chatEnabled}
                  onChange={(e) => setChatEnabled(e.target.checked)}
                  className="rounded text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
                />
                <div>
                  <p className="font-semibold text-stone-900 text-xs">Online Chat Service</p>
                  <p className="text-[10px] text-stone-500">Accept client bookings for direct document advice &amp; legal chat consultations</p>
                </div>
              </label>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Practice Settings</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          TAB 4: FIRM ASSOCIATION
      ====================================================================== */}
      {activeTab === 'firm' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Institutional Law Firm Affiliation
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Practice arrangement governed by firm partnership contract and platform roster policies.
              </p>
            </div>
            <LevelBadge level={2} visibility="public" />
          </div>

          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-lg shrink-0">
                LV
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="font-serif font-bold text-stone-900 text-sm">
                    {associatedFirm.firmName}
                  </h4>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                    {associatedFirm.membershipStatus}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 mt-0.5 font-mono">
                  Registration: {associatedFirm.registrationNumber} • Joined: {associatedFirm.joinedDate}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  'Change Request dispatched to Firm Managing Partner. Changes to practice arrangement require firm admin sign-off.'
                )
              }
              className="px-3 py-2 rounded-xl border border-amber-300 bg-white hover:bg-amber-50 text-amber-900 font-semibold text-[11px] shadow-xs cursor-pointer"
            >
              Request Affiliation Amendment
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
              <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                Firm Designation
              </span>
              <p className="font-semibold text-stone-900">{associatedFirm.designation}</p>
              <p className="text-[10px] text-stone-500 font-mono">Department: Criminal Defense &amp; White Collar</p>
            </div>

            <div className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 space-y-1">
              <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                Practice Permissions (Section 8.C)
              </span>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800">
                  {associatedFirm.practicePermission === 'FIRM_AND_INDEPENDENT'
                    ? 'Dual Practice (Firm + Independent)'
                    : 'Firm Exclusive'}
                </span>
              </div>
              <p className="text-[10px] text-stone-500">
                Counsel can accept firm briefs AND receive direct client consultations on their shared calendar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: VERIFICATION INFORMATION (GOOGLE DRIVE LINKS)
      ====================================================================== */}
      {activeTab === 'verification' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Verification &amp; Statutory Documents (Google Drive)</span>
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Google Drive repository links for bar council credentials, degrees, and government IDs.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              STATUS: {driveLinks.status}
            </span>
          </div>

          {/* Privacy & Re-review Warning */}
          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
            <p className="font-semibold text-[11px] flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Strict Document Privacy &amp; Re-Verification Policy</span>
            </p>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              Google Drive links are strictly confidential and accessible exclusively by Platform Verification Officers. <strong>Drive links are never exposed publicly.</strong> If you replace a submitted link, it automatically initiates a new review rather than retaining the previous verified status.
            </p>
          </div>

          <div className="space-y-4">
            {/* Enrollment Link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-800">
                  Bar Council Enrollment Verification Link (Google Drive Folder)
                </label>
                <LevelBadge level={2} visibility="private" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={driveLinks.enrollmentLink}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-700 text-xs"
                />
                <button
                  type="button"
                  onClick={() => requestL2Change('Enrollment Drive Link', driveLinks.enrollmentLink)}
                  className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                >
                  Replace Link
                </button>
              </div>
            </div>

            {/* Degree Link */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-800">
                  Law Degree / University Certificates Link (Google Drive)
                </label>
                <LevelBadge level={2} visibility="private" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={driveLinks.educationLink}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-700 text-xs"
                />
                <button
                  type="button"
                  onClick={() => requestL2Change('Education Proof Link', driveLinks.educationLink)}
                  className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                >
                  Replace Link
                </button>
              </div>
            </div>

            {/* Additional Docs */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-800">
                  Additional Supporting Documents (Chamber Allotment, GST, COP)
                </label>
                <LevelBadge level={2} visibility="private" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={driveLinks.additionalDocsLink}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-700 text-xs"
                />
                <button
                  type="button"
                  onClick={() => requestL2Change('Additional Documents Link', driveLinks.additionalDocsLink)}
                  className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                >
                  Replace Link
                </button>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 font-mono text-[10px] space-y-1">
            <div className="flex justify-between">
              <span>Last Review Date:</span>
              <span className="text-stone-900 font-bold">{driveLinks.lastReviewed}</span>
            </div>
            <div className="flex justify-between">
              <span>Admin Compliance Remarks:</span>
              <span className="text-stone-800">{driveLinks.adminRemarks}</span>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: PROFILE CHANGE HISTORY (AUDIT TRAIL)
      ====================================================================== */}
      {activeTab === 'history' && (
        <ProfileChangeHistory
          history={changeHistory}
          title="Advocate Profile Change Ledger &amp; Verification Trail"
        />
      )}

      {/* =====================================================================
          MODAL: LEVEL 2 CHANGE REQUEST MODAL
      ====================================================================== */}
      <Level2ChangeModal
        isOpen={l2ModalOpen}
        onClose={() => setL2ModalOpen(false)}
        fieldLabel={activeL2Field.label}
        currentValue={activeL2Field.current}
        onSubmit={handleL2Submit}
      />

      {/* =====================================================================
          MODAL: UNIFIED BAR CREDENTIALS AMENDMENT MODAL (1 REQUEST)
      ====================================================================== */}
      {isBarCredentialsModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200 mb-4">
              <div className="flex items-center space-x-2.5">
                <span className="p-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
                  <ShieldCheck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="font-serif font-bold text-sm text-stone-900">
                    Update Bar Council Credentials (1 Unified Request)
                  </h3>
                  <p className="text-[11px] text-stone-500 font-sans">
                    Update State Bar Council, Enrollment Number &amp; Year in 1 single statutory verification request.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBarCredentialsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleBarCredentialsSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    State Bar Council *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBarCouncil}
                    onChange={(e) => setNewBarCouncil(e.target.value)}
                    placeholder="e.g. Bar Council of Delhi"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Enrollment Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={newEnrollmentNumber}
                    onChange={(e) => setNewEnrollmentNumber(e.target.value)}
                    placeholder="e.g. D/1482/2009"
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono focus:outline-none focus:border-[var(--bg-primary)]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Enrollment Year (Derived Experience recalculates from this) *
                </label>
                <input
                  type="number"
                  min="1950"
                  max={new Date().getFullYear()}
                  required
                  value={newEnrollmentYear}
                  onChange={(e) => setNewEnrollmentYear(Number(e.target.value))}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Google Drive Folder Link (Bar Certificate / ID Card Proof) *
                </label>
                <input
                  type="url"
                  required
                  value={barDriveLink}
                  onChange={(e) => setBarDriveLink(e.target.value)}
                  placeholder="https://drive.google.com/drive/folders/..."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono focus:outline-none focus:border-[var(--bg-primary)]"
                />
                <p className="text-[10px] text-stone-500 mt-1">
                  Ensure compliance officers have view access to verify Bar enrollment documentation.
                </p>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Reason for Amendment / Bar Transfer Details
                </label>
                <textarea
                  rows={2}
                  value={barChangeReason}
                  onChange={(e) => setBarChangeReason(e.target.value)}
                  placeholder="e.g. Inter-State Bar transfer or corrected enrollment certificate number."
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              <div className="pt-3 border-t border-stone-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsBarCredentialsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold flex items-center space-x-1.5 shadow-sm cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit 1 Unified Request</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: PUBLIC PROFILE PREVIEW MODAL
      ====================================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Client Discovery View (Public Profile Snapshot)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsPreviewModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xl shrink-0">
                  RN
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-serif font-bold text-base text-stone-900">{displayName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      ✓ VERIFIED ADVOCATE
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">{headline}</p>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    {barCouncil} • {calculatedExperience} Years Active • {city}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <h5 className="font-semibold text-stone-900 mb-1">About the Counsel</h5>
                <p className="text-[11px] text-stone-600 leading-relaxed">{bio}</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border border-stone-200 bg-white">
                  <span className="text-[10px] font-mono uppercase text-stone-500">Video Consultation</span>
                  <p className="font-serif font-bold text-base text-stone-900">₹{onlineFee.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-stone-400">30 mins WebRTC</span>
                </div>
                <div className="p-3 rounded-xl border border-stone-200 bg-white">
                  <span className="text-[10px] font-mono uppercase text-stone-500">Chamber Meeting</span>
                  <p className="font-serif font-bold text-base text-stone-900">₹{chamberFee.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-stone-400">45 mins In-Person</span>
                </div>
                <div className="p-3 rounded-xl border border-stone-200 bg-white">
                  <span className="text-[10px] font-mono uppercase text-stone-500">Chat Advisory</span>
                  <p className="font-serif font-bold text-base text-stone-900">₹{chatFee.toLocaleString('en-IN')}</p>
                  <span className="text-[10px] text-stone-400">24-hr Advisory</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 text-[11px] text-amber-900 font-mono">
                Affiliated Firm: <strong>{associatedFirm.firmName}</strong> ({associatedFirm.designation})
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsPreviewModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] text-white font-semibold text-xs"
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
