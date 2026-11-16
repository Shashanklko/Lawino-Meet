import React, { useState } from 'react';
import {
  Building,
  ShieldCheck,
  Scale,
  Users,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Lock,
  Plus,
  Edit,
  Save,
  Eye,
  FileText,
  ExternalLink,
  Layers,
  Globe,
  Mail,
  Phone,
  Trash2,
} from 'lucide-react';
import { LevelBadge } from './LevelBadge';
import { Level2ChangeModal } from './Level2ChangeModal';
import { ProfileChangeHistory } from './ProfileChangeHistory';

export const FirmProfileModule = ({ firmData, onSaveToast }) => {
  const [activeTab, setActiveTab] = useState('organization');

  // Level 2 Modal State
  const [l2ModalOpen, setL2ModalOpen] = useState(false);
  const [activeL2Field, setActiveL2Field] = useState({ label: '', current: '' });

  // Public Preview Modal
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  // Level 1: Immediately Editable Organization Information
  const [shortName, setShortName] = useState('Lex Veritas');
  const [tagline, setTagline] = useState(
    firmData?.tagline ||
      'Premier Full-Service Corporate Advisory & Multi-Bench Litigation Chambers'
  );
  const [aboutFirm, setAboutFirm] = useState(
    firmData?.description ||
      'Lex Veritas Legal LLP is a leading Indian legal enterprise offering institutional representation in corporate mergers, high-stakes commercial arbitration, white-collar criminal defense, and constitutional writs across the Supreme Court of India, Delhi High Court, and Bombay High Court.'
  );
  const [firmType, setFirmType] = useState('Limited Liability Partnership (LLP)');
  const [officialEmail, setOfficialEmail] = useState('intake@lexveritas.com');
  const [officialPhone, setOfficialPhone] = useState('+91 11 4982 0100');
  const [website, setWebsite] = useState('https://www.lexveritas.com');
  const [operatingHours, setOperatingHours] = useState('Monday to Friday: 09:00 AM – 08:00 PM | Sat: 10:00 AM – 05:00 PM');
  const [languagesSupported, setLanguagesSupported] = useState('English, Hindi, Marathi, Kannada');
  const [hqAddress, setHqAddress] = useState(
    'Chamber 412, Block B, Delhi High Court & 14 Barakhamba Road, Connaught Place, New Delhi 110001'
  );

  // Level 2: Verified Organization Details
  const [firmLegalName, setFirmLegalName] = useState(firmData?.name || 'Lex Veritas Legal LLP');
  const [registrationNumber, setRegistrationNumber] = useState(
    firmData?.registrationNumber || 'LLP-DEL-2024-981'
  );
  const [registrationAuthority, setRegistrationAuthority] = useState(
    'Ministry of Corporate Affairs (Registrar of LLPs, NCT of Delhi)'
  );
  const [yearEstablished, setYearEstablished] = useState(firmData?.foundedYear || '2014');
  const [authorizedRepresentative, setAuthorizedRepresentative] = useState(
    'Adv. Raghavan Nambiar (Designated Managing Partner)'
  );

  // Legal Services Management (Interactive Table)
  const [services, setServices] = useState([
    {
      id: 'srv-01',
      title: 'Corporate Legal Retainer & M&A Due Diligence',
      practiceArea: 'Corporate Law',
      consultationType: 'Online / Chamber',
      price: 25000,
      duration: 'Case / Monthly Retainer',
      status: 'ACTIVE',
    },
    {
      id: 'srv-02',
      title: 'Commercial Arbitration & NCLT Recovery Representation',
      practiceArea: 'Insolvency & Arbitration',
      consultationType: 'Chamber / In-Person',
      price: 18000,
      duration: 'Per Hearing Appearance',
      status: 'ACTIVE',
    },
    {
      id: 'srv-03',
      title: 'White Collar Criminal Defense & Anticipatory Bail Briefing',
      practiceArea: 'Criminal Litigation',
      consultationType: 'Online / Chamber',
      price: 15000,
      duration: 'Emergency Intake',
      status: 'ACTIVE',
    },
    {
      id: 'srv-04',
      title: 'IPR & Trademark Protection Filing',
      practiceArea: 'Intellectual Property',
      consultationType: 'Online Video',
      price: 8500,
      duration: 'Filing Package',
      status: 'ACTIVE',
    },
  ]);

  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [newSrvTitle, setNewSrvTitle] = useState('');
  const [newSrvArea, setNewSrvArea] = useState('Corporate Law');
  const [newSrvPrice, setNewSrvPrice] = useState(10000);
  const [newSrvType, setNewSrvType] = useState('Online / Chamber');

  // Chambers & Benches (Multi-City Locations)
  const [chamberBenches, setChamberBenches] = useState(() => {
    try {
      const stored = localStorage.getItem('lawino_firm_chamber_benches');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      {
        id: 'bench-01',
        title: 'Delhi Litigation HQ',
        address: 'Chamber 412, Block B, Delhi High Court & 14 Barakhamba Road',
        benches: 'Supreme Court & Delhi High Court',
      },
      {
        id: 'bench-02',
        title: 'Mumbai Commercial Desk',
        address: '102 Maker Chambers V, Nariman Point & Bombay High Court',
        benches: 'Bombay HC, NCLT, SEBI Appellate',
      },
      {
        id: 'bench-03',
        title: 'Bengaluru Tech & IPR Hub',
        address: '4th Floor, Prestige Meridian, MG Road, Bengaluru',
        benches: 'Karnataka HC, Tech Contracts & Patents',
      },
    ];
  });
  const [isAddBenchOpen, setIsAddBenchOpen] = useState(false);
  const [newBench, setNewBench] = useState({ title: '', address: '', benches: '' });

  const handleRemoveBench = (id) => {
    setChamberBenches((prev) => {
      const updated = prev.filter((b) => b.id !== id);
      try {
        localStorage.setItem('lawino_firm_chamber_benches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    onSaveToast('Chamber bench location removed successfully.');
  };

  const handleAddBench = (e) => {
    e.preventDefault();
    if (!newBench.title.trim() || !newBench.address.trim()) return;
    const added = {
      id: `bench-${Date.now()}`,
      title: newBench.title.trim(),
      address: newBench.address.trim(),
      benches: newBench.benches.trim() || 'High Court Jurisdiction',
    };
    setChamberBenches((prev) => {
      const updated = [...prev, added];
      try {
        localStorage.setItem('lawino_firm_chamber_benches', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setNewBench({ title: '', address: '', benches: '' });
    setIsAddBenchOpen(false);
    onSaveToast(`Chamber bench "${added.title}" registered successfully.`);
  };

  // Firm Verification Information (Google Drive Folder)
  const [verificationData, setVerificationData] = useState({
    driveFolderUrl: 'https://drive.google.com/drive/folders/5eFgHiJkLmNoPqRsTuVwXyZab',
    submissionDate: '12 Jan 2024, 03:45 PM',
    status: 'VERIFIED',
    adminRemarks:
      'LLP Agreement, Certificate of Incorporation (Form 16 MCA), and Managing Partner Bar Council enrollment validated.',
    lastReviewed: '16 Jan 2024',
  });

  // Profile Change History (Firm Audit Trail)
  const [changeHistory, setChangeHistory] = useState([
    {
      id: 'fch-001',
      date: '15 Nov 2026, 11:20 AM',
      field: 'Operating Hours & Chamber Timings',
      oldValue: 'Mon-Fri 09:00 AM – 06:00 PM',
      newValue: 'Mon-Fri 09:00 AM – 08:00 PM | Sat 10:00 AM – 05:00 PM',
      status: 'UPDATED',
      level: 'Level 1 Standard',
      reviewer: 'Firm Managing Partner',
      remarks: 'Extended chamber consultation timings for Saturday commercial benches.',
    },
    {
      id: 'fch-002',
      date: '02 Feb 2026, 03:00 PM',
      field: 'LLP Registered Headquarters Address',
      oldValue: '14 Barakhamba Road, Connaught Place, New Delhi',
      newValue: 'Chamber 412, Block B, Delhi High Court & 14 Barakhamba Road',
      status: 'APPROVED',
      level: 'Level 2 Admin Verified',
      reviewer: 'Platform Compliance Officer (Suresh Rao)',
      remarks: 'Delhi High Court Chamber block allotment certificate verified against Bar Association registry.',
    },
  ]);

  // Handle Level 1 Save
  const handleLevel1Save = (e) => {
    e.preventDefault();
    const newEntry = {
      id: `fch-${Date.now()}`,
      date: new Date().toLocaleString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
      field: 'Firm Profile & Services',
      oldValue: 'Previous Firm Details',
      newValue: 'Updated Organization Details',
      status: 'UPDATED',
      level: 'Level 1 Standard',
      reviewer: 'Firm Admin (Standard Update)',
      remarks: 'Live organization settings updated.',
    };
    setChangeHistory([newEntry, ...changeHistory]);
    onSaveToast('Firm settings updated successfully.');
  };

  // Open Level 2 Change Modal
  const requestL2Change = (label, current) => {
    setActiveL2Field({ label, current });
    setL2ModalOpen(true);
  };

  // Handle Level 2 Submit
  const handleL2Submit = ({ fieldLabel, currentValue, newValue, reason }) => {
    const newRequest = {
      id: `fch-${Date.now()}`,
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
      remarks: `Reason: ${reason}. Existing verified legal entity record remains active until approved.`,
    };
    setChangeHistory([newRequest, ...changeHistory]);
    onSaveToast(
      `Verification Request Submitted for [${fieldLabel}]. Pending review by Platform Compliance Officer.`
    );
  };

  // Add Service Handler
  const handleAddServiceSubmit = (e) => {
    e.preventDefault();
    if (!newSrvTitle.trim()) return;
    const srv = {
      id: `srv-${Date.now()}`,
      title: newSrvTitle.trim(),
      practiceArea: newSrvArea,
      consultationType: newSrvType,
      price: Number(newSrvPrice),
      duration: 'Standard Package',
      status: 'ACTIVE',
    };
    setServices([...services, srv]);
    setIsAddServiceModalOpen(false);
    setNewSrvTitle('');
    onSaveToast(`Added new legal practice service: ${srv.title}`);
  };

  const tabs = [
    { id: 'organization', label: 'Organization Info', icon: Building },
    { id: 'practice', label: 'Practice & Specializations', icon: Scale },
    { id: 'services', label: 'Legal Services Management', icon: Layers },
    { id: 'team', label: 'Team & Roster', icon: Users },
    { id: 'verification', label: 'Firm Verification (Drive)', icon: ShieldCheck },
    { id: 'history', label: 'Change History', icon: FileText },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner & Public Preview Trigger */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-[#2B1216] via-[#1E1715] to-[#171412] border border-[#5A101B]/50 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
              Legal Enterprise Profile // {firmType}
            </span>
          </div>
          <h2 className="text-xl font-serif font-bold text-cream-50">
            {firmLegalName} ({shortName})
          </h2>
          <p className="text-xs text-stone-300 mt-0.5 font-sans max-w-2xl">
            {tagline}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-stone-400 font-mono">
            <span>LLP Reg: <strong className="text-amber-300">{registrationNumber}</strong></span>
            <span>•</span>
            <span>Est. {yearEstablished}</span>
            <span>•</span>
            <span>Associate Roster: <strong className="text-stone-200">{firmData?.members?.length || 14} Advocates</strong></span>
            <span>•</span>
            <span>Managing Partner: <strong className="text-emerald-300">{authorizedRepresentative.split('(')[0]}</strong></span>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsPreviewModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-2 shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-amber-400" />
            <span>Preview Public Firm Profile</span>
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
          TAB 1: ORGANIZATION INFORMATION
      ====================================================================== */}
      {activeTab === 'organization' && (
        <form onSubmit={handleLevel1Save} className="space-y-6">
          <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
            <div className="flex items-start justify-between pb-4 border-b border-stone-100">
              <div>
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Institutional Organization Details
                </h3>
                <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                  Official LLP identity, registered chambers, operating hours, and corporate contact records.
                </p>
              </div>
              <LevelBadge level={1} visibility="public" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Firm Legal Name (Level 2) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Registered Legal Entity Name
                  </label>
                  <LevelBadge level={2} visibility="public" />
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    disabled
                    value={firmLegalName}
                    className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-100/80 text-stone-800 text-xs font-semibold cursor-not-allowed"
                  />
                  <button
                    type="button"
                    onClick={() => requestL2Change('Registered Legal Entity Name', firmLegalName)}
                    className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                  >
                    Request Edit
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 mt-1">
                  Validated against Ministry of Corporate Affairs registrar filing.
                </p>
              </div>

              {/* Short Display Name (Level 1) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Firm Brand / Short Name
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              {/* Tagline */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Firm Tagline / Institutional Mission
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              {/* About the Firm */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    About the Firm &amp; Practice Narrative
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <textarea
                  rows={4}
                  value={aboutFirm}
                  onChange={(e) => setAboutFirm(e.target.value)}
                  className="w-full p-3 rounded-xl border border-stone-300 text-xs text-stone-900 leading-relaxed focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              {/* Official Email */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Official Intake Email
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="email"
                  value={officialEmail}
                  onChange={(e) => setOfficialEmail(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              {/* Official Phone */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Chamber PBX / Switchboard Phone
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={officialPhone}
                  onChange={(e) => setOfficialPhone(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono"
                />
              </div>

              {/* Website */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Official Website
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 font-mono"
                />
              </div>

              {/* Operating Hours */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Operating Hours
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              {/* Registered HQ Address */}
              <div className="md:col-span-2">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-semibold text-stone-700">
                    Registered Headquarters Chamber Address
                  </label>
                  <LevelBadge level={1} visibility="public" />
                </div>
                <input
                  type="text"
                  value={hqAddress}
                  onChange={(e) => setHqAddress(e.target.value)}
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
                <span>Save Organization Information</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* =====================================================================
          TAB 2: PRACTICE AREAS & SPECIALIZATIONS
      ====================================================================== */}
      {activeTab === 'practice' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Institutional Practice Areas &amp; Chambers Benches
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Core legal disciplines and multi-city chamber benches.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <LevelBadge level={1} visibility="public" />
              <button
                type="button"
                onClick={() => setIsAddBenchOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-xs flex items-center space-x-1.5 shadow-2xs transition cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Chamber Bench</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {chamberBenches.map((bench) => (
              <div
                key={bench.id}
                className="p-4 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col justify-between space-y-3 group hover:border-stone-300 transition"
              >
                <div className="space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-serif font-bold text-stone-900 block text-sm">
                      {bench.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBench(bench.id)}
                      className="p-1 rounded-lg text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                      title="Remove this chamber location"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600 leading-snug">{bench.address}</p>
                </div>

                <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[10px] text-stone-500 font-mono">
                  <span className="truncate">Benches: {bench.benches}</span>
                  <span className="text-emerald-700 font-semibold shrink-0">Active</span>
                </div>
              </div>
            ))}

            {/* "+ Add Bench" Dashed Card */}
            <button
              type="button"
              onClick={() => setIsAddBenchOpen(true)}
              className="p-5 rounded-xl border-2 border-dashed border-stone-300 hover:border-[var(--bg-primary)] hover:bg-stone-50/50 flex flex-col items-center justify-center space-y-1.5 text-stone-500 hover:text-stone-900 transition cursor-pointer min-h-[120px]"
            >
              <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                <Plus className="w-4 h-4" />
              </div>
              <span className="font-serif font-bold text-xs">Add More Chamber Bench</span>
              <span className="text-[10px] text-stone-400 font-sans">Register additional high court or branch desk</span>
            </button>
          </div>

          {/* Add Chamber Bench Modal */}
          {isAddBenchOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in zoom-in-95">
                <div className="flex items-start justify-between pb-3 border-b border-stone-100">
                  <div>
                    <h3 className="font-serif font-bold text-base text-stone-900">
                      Add Chamber Bench / Office Branch
                    </h3>
                    <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                      Register a verified physical chamber location where firm advocates represent clients.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAddBenchOpen(false)}
                    className="text-stone-400 hover:text-stone-700 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleAddBench} className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Chamber Title / Desk Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chennai Appellate Desk / Chandigarh High Court Chamber"
                      value={newBench.title}
                      onChange={(e) => setNewBench({ ...newBench, title: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Physical Chamber Address *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Chamber 18, Madras High Court Buildings, Chennai 600104"
                      value={newBench.address}
                      onChange={(e) => setNewBench({ ...newBench, address: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                      Governing Benches / Tribunals
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Madras High Court, NCLT Chennai, DRT"
                      value={newBench.benches}
                      onChange={(e) => setNewBench({ ...newBench, benches: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-[var(--bg-primary)]"
                    />
                  </div>

                  <div className="pt-2 flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddBenchOpen(false)}
                      className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-5 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-serif font-bold text-xs uppercase tracking-wider shadow-sm cursor-pointer"
                    >
                      Add Bench Location
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: LEGAL SERVICES MANAGEMENT
      ====================================================================== */}
      {activeTab === 'services' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-[var(--bg-primary)]" />
                <span>Firm Legal Services &amp; Fixed-Fee Retainers</span>
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Configure practice packages, consultation modes, and standard retainer fees.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddServiceModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs flex items-center space-x-1.5 shadow-sm cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Service Package</span>
            </button>
          </div>

          <div className="border border-stone-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-serif border-b border-stone-200">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Service Package Title</th>
                  <th className="py-2.5 px-4 font-semibold">Practice Area</th>
                  <th className="py-2.5 px-4 font-semibold">Consultation Mode</th>
                  <th className="py-2.5 px-4 font-semibold">Standard Retainer</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {services.map((srv) => (
                  <tr key={srv.id} className="hover:bg-stone-50/50 transition">
                    <td className="py-3 px-4 font-semibold text-stone-900">
                      {srv.title}
                    </td>
                    <td className="py-3 px-4 text-stone-600 font-mono text-[11px]">
                      {srv.practiceArea}
                    </td>
                    <td className="py-3 px-4 text-stone-600 text-[11px]">
                      {srv.consultationType}
                    </td>
                    <td className="py-3 px-4 font-serif font-bold text-stone-900 text-xs">
                      ₹{srv.price.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                        {srv.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() =>
                          setServices(
                            services.map((s) =>
                              s.id === srv.id
                                ? { ...s, status: s.status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE' }
                                : s
                            )
                          )
                        }
                        className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 cursor-pointer"
                      >
                        {srv.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ORGANIZATION TEAM ROSTER
      ====================================================================== */}
      {activeTab === 'team' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900">
                Associated Advocates &amp; Counsel Roster ({firmData?.members?.length || 14})
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Managing partners, associate counsel, and practice permission arrangements.
              </p>
            </div>
            <LevelBadge level={2} visibility="public" />
          </div>

          <div className="space-y-3">
            {(firmData?.members || []).slice(0, 6).map((mem) => (
              <div
                key={mem.publicId}
                className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0">
                    {mem.fullName.replace(/^Adv\.?\s*/, '')[0] || 'A'}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <p className="font-serif font-bold text-stone-900 text-xs">{mem.fullName}</p>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono bg-stone-200 text-stone-800 font-bold">
                        {mem.designation}
                      </span>
                    </div>
                    <p className="text-[10px] text-stone-500 font-mono mt-0.5">
                      Bar: {mem.barCouncilNumber} • Dept: {mem.department}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-100 text-emerald-800 font-semibold">
                    {mem.practiceArrangement || 'FIRM_EXCLUSIVE'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: FIRM VERIFICATION (GOOGLE DRIVE)
      ====================================================================== */}
      {activeTab === 'verification' && (
        <div className="p-6 rounded-2xl border border-stone-200 bg-white shadow-xs space-y-5 text-xs">
          <div className="flex items-start justify-between pb-4 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-base text-stone-900 flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>Enterprise LLP Registration &amp; Drive Verification</span>
              </h3>
              <p className="text-[11px] text-stone-500 font-sans mt-0.5">
                Statutory registration dossiers and Google Drive repository verification.
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
              STATUS: {verificationData.status}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-900 space-y-1">
            <p className="font-semibold text-[11px] flex items-center space-x-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span>Multi-Structure Verification Architecture</span>
            </p>
            <p className="text-[10px] text-amber-800 leading-relaxed">
              LawinoMeet verifies organizations across LLPs, Partnership Chambers, and Private Legal Societies. <strong>Google Drive links are strictly confidential and never displayed publicly.</strong> Updating registration documents or replacing folder links triggers a fresh administrative review.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-stone-800">
                  Firm Verification Folder (Google Drive Repository)
                </label>
                <LevelBadge level={2} visibility="private" />
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="url"
                  value={verificationData.driveFolderUrl}
                  readOnly
                  className="w-full p-2.5 rounded-xl border border-stone-200 bg-stone-50 font-mono text-stone-700 text-xs"
                />
                <button
                  type="button"
                  onClick={() => requestL2Change('Firm Verification Drive Link', verificationData.driveFolderUrl)}
                  className="px-3 py-2.5 rounded-xl border border-stone-300 hover:bg-stone-50 text-stone-700 font-semibold text-[11px] whitespace-nowrap cursor-pointer"
                >
                  Replace Link
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                  Registration Authority
                </span>
                <p className="font-semibold text-stone-900 mt-0.5">{registrationAuthority}</p>
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-500 font-semibold">
                  Authorized Representative
                </span>
                <p className="font-semibold text-stone-900 mt-0.5">{authorizedRepresentative}</p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-stone-50 border border-stone-200 text-stone-600 font-mono text-[10px] space-y-1">
              <div className="flex justify-between">
                <span>Last Verified Date:</span>
                <span className="text-stone-900 font-bold">{verificationData.lastReviewed}</span>
              </div>
              <div className="flex justify-between">
                <span>Compliance Remarks:</span>
                <span className="text-stone-800">{verificationData.adminRemarks}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: PROFILE CHANGE HISTORY
      ====================================================================== */}
      {activeTab === 'history' && (
        <ProfileChangeHistory
          history={changeHistory}
          title="Law Firm Profile Audit Trail &amp; Verification History"
        />
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

      {/* =====================================================================
          MODAL: ADD SERVICE PACKAGE
      ====================================================================== */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-sm text-stone-900 mb-1">
              Add Firm Practice Service Package
            </h3>
            <p className="text-[11px] text-stone-500 mb-4 font-sans">
              Create an institutional retainer package or fixed consultation offering.
            </p>

            <form onSubmit={handleAddServiceSubmit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Service Package Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Insolvency Resolution Advisory"
                  value={newSrvTitle}
                  onChange={(e) => setNewSrvTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Practice Area
                  </label>
                  <select
                    value={newSrvArea}
                    onChange={(e) => setNewSrvArea(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 bg-white"
                  >
                    <option value="Corporate Law">Corporate Law</option>
                    <option value="Criminal Defense">Criminal Defense</option>
                    <option value="Civil & Property">Civil &amp; Property</option>
                    <option value="Insolvency & Arbitration">Insolvency &amp; Arbitration</option>
                    <option value="Intellectual Property">Intellectual Property</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Retainer Fee (₹)
                  </label>
                  <input
                    type="number"
                    required
                    value={newSrvPrice}
                    onChange={(e) => setNewSrvPrice(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-stone-300 text-xs text-stone-900"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAddServiceModalOpen(false)}
                  className="px-3.5 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] text-white font-semibold cursor-pointer shadow-sm"
                >
                  Create Package
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: PUBLIC FIRM PROFILE PREVIEW
      ====================================================================== */}
      {isPreviewModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 border border-stone-200 shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[90vh] overflow-y-auto flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Prospective Client View (Public Firm Profile)
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
                  LV
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-serif font-bold text-base text-stone-900">{firmLegalName}</h4>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-mono font-bold bg-emerald-100 text-emerald-800">
                      ✓ VERIFIED LEGAL LLP
                    </span>
                  </div>
                  <p className="text-xs text-stone-600 font-medium mt-0.5">{tagline}</p>
                  <p className="text-[11px] text-stone-500 font-mono mt-0.5">
                    Registration: {registrationNumber} • Est. {yearEstablished} • {hqAddress}
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200">
                <h5 className="font-semibold text-stone-900 mb-1">About the Firm</h5>
                <p className="text-[11px] text-stone-600 leading-relaxed">{aboutFirm}</p>
              </div>

              <div>
                <h5 className="font-semibold text-stone-900 mb-2">Practice Offerings</h5>
                <div className="grid grid-cols-2 gap-2">
                  {services.slice(0, 4).map((srv) => (
                    <div key={srv.id} className="p-2.5 rounded-xl border border-stone-200 bg-white">
                      <p className="font-semibold text-stone-900 truncate">{srv.title}</p>
                      <p className="font-serif font-bold text-xs text-[var(--bg-primary)] mt-0.5">
                        ₹{srv.price.toLocaleString('en-IN')}
                      </p>
                    </div>
                  ))}
                </div>
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
