import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  Shield,
  Users,
  UserPlus,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building,
  Scale,
  Briefcase,
  TrendingUp,
  DollarSign,
  MapPin,
  ArrowRight,
  Filter,
  Search,
  ChevronRight,
  Sparkles,
  ExternalLink,
  Plus,
  FileText,
  UserCheck,
  Lock,
  Layers,
  Inbox,
  FileSpreadsheet,
  Edit,
  EyeOff,
  UserX,
  Send,
  Mail,
  X,
  Check,
} from 'lucide-react';
import { StatusBadge } from '../components/common/StatusBadge';
import { userApi } from '../api/userApi';
import { appointmentApi } from '../api/appointmentApi';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';
import { StatusTabs } from '../components/dashboard/StatusTabs';
import { EmptyState } from '../components/dashboard/EmptyState';
import { FirmProfileModule } from '../components/profile/FirmProfileModule';

export const FirmAdminDashboardPage = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  const isProfileView = currentPath.includes('/firm/profile');
  const isLawyersView = currentPath.includes('/firm/lawyers');
  const isSubAdminsView = currentPath.includes('/firm/sub-admins');
  const isRequestsView = currentPath.includes('/firm/requests');
  const isAppointmentsView = currentPath.includes('/firm/appointments');
  const isServicesView = currentPath.includes('/firm/services');
  const isFinanceView = currentPath.includes('/firm/finance');
  const isOverview =
    !isProfileView &&
    !isLawyersView &&
    !isSubAdminsView &&
    !isRequestsView &&
    !isAppointmentsView &&
    !isServicesView &&
    !isFinanceView;

  const [firmData, setFirmData] = useState({
    firmId: 'firm-001-lex-veritas',
    name: 'Lex Veritas Legal LLP',
    slug: 'lex-veritas-legal-llp',
    registrationNumber: 'LLP-IN-2014-08912',
    panTaxId: 'AAACL9821K',
    gstNumber: '27AAACL9821K1ZM',
    barCouncilRegistration: 'BCI/CORP/MUM/2014/991',
    foundedYear: 2014,
    description: 'Premier full-service legal counsel with High Court chambers in Mumbai and New Delhi.',
    city: 'Mumbai',
    state: 'Maharashtra',
    address: 'Chamber 412, High Court Commercial Wing, Fort, Mumbai - 400001',
    phone: '+91 22 6677 8899',
    email: 'admin@lexveritas.com',
    verificationStatus: 'VERIFIED',
    members: [
      {
        id: 'mem-001',
        userPublicId: '33333333-3333-3333-3333-333333333333',
        fullName: 'Adv. Raghavan Nambiar',
        username: 'adv_raghavan',
        designation: 'Managing Partner',
        department: 'Corporate Litigation & Arbitrations',
        permission: 'FIRM_AND_INDEPENDENT',
        status: 'ACTIVE',
        hourlyRate: '₹8,500 / hr',
        revenueShare: '75% Counsel / 25% Firm Treasury',
        avatar: 'R',
      },
    ],
    subAdmins: [],
  });
  const [firmRequests, setFirmRequests] = useState([]);
  const [legalServices, setLegalServices] = useState([
    {
      id: 'srv-001',
      title: 'High Court Commercial Division Representation',
      category: 'COMMERCIAL_LITIGATION',
      baseFee: 15000,
      turnaroundDays: 3,
      mode: 'HYBRID',
      status: 'ACTIVE',
      assignedBench: 'High Court of Bombay & Delhi',
    },
    {
      id: 'srv-002',
      title: 'Cross-Border M&A and Retainer Structuring',
      category: 'CORPORATE',
      baseFee: 25000,
      turnaroundDays: 5,
      mode: 'ONLINE',
      status: 'ACTIVE',
      assignedBench: 'National Company Law Tribunal (NCLT)',
    },
  ]);
  const [registeredAdvocatesList, setRegisteredAdvocatesList] = useState([]);
  const [requestTab, setRequestTab] = useState('ALL'); // 'ALL' | 'UNASSIGNED' | 'AWAITING' | 'REASSIGNMENT'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const loadFirmData = async () => {
      try {
        const [firmsRes, lawyersRes] = await Promise.allSettled([
          userApi.getFirms(),
          userApi.searchLawyers(),
        ]);

        if (firmsRes.status === 'fulfilled' && firmsRes.value?.data) {
          const list = firmsRes.value.data.content || (Array.isArray(firmsRes.value.data) ? firmsRes.value.data : []);
          if (list.length > 0) {
            const f = list[0];
            setFirmData((prev) => ({
              ...prev,
              firmId: f.publicId || prev.firmId,
              name: f.firmName || prev.name,
              description: f.description || prev.description,
              email: f.contactEmail || prev.email,
              phone: f.contactPhone || prev.phone,
              city: f.city || prev.city,
            }));
          }
        }

        if (lawyersRes.status === 'fulfilled' && lawyersRes.value?.data) {
          const raw = lawyersRes.value.data.content || (Array.isArray(lawyersRes.value.data) ? lawyersRes.value.data : []);
          const mapped = raw.map((adv) => ({
            ...adv,
            fullName: adv.fullName || adv.username,
            username: adv.username,
            email: adv.email || `${adv.username}@lawinomeet.com`,
            barCouncilNumber: adv.barCouncilNumber || 'Bar Council Enrolled',
            specialization: adv.specialization || 'Corporate Law',
            city: adv.city || 'Delhi NCR',
            hourlyRate: Number(adv.hourlyRate) || 1500,
          }));
          setRegisteredAdvocatesList(mapped);
        }
      } catch (err) {
        console.warn('Could not load backend firm data:', err);
      }
    };
    loadFirmData();
  }, []);

  // Advocate Roster Search & Invitation States
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [advocateSearchInput, setAdvocateSearchInput] = useState('');
  const [selectedAdvocate, setSelectedAdvocate] = useState(null);
  const [inviteDesignation, setInviteDesignation] = useState('Senior Associate Advocate');
  const [inviteDepartment, setInviteDepartment] = useState('Corporate Litigation & M&A');
  const [invitePermission, setInvitePermission] = useState('FIRM_EXCLUSIVE');
  const [inviteHourlyRate, setInviteHourlyRate] = useState('₹6,000 / hr');
  const [inviteRevenueShare, setInviteRevenueShare] = useState('70% Counsel / 30% Firm Treasury');
  const [inviteCustomNote, setInviteCustomNote] = useState('');

  // Permissions Modal
  const [selectedLawyerPermissionModal, setSelectedLawyerPermissionModal] = useState(null);
  const [selectedPermissionVal, setSelectedPermissionVal] = useState('FIRM_EXCLUSIVE');

  // Request Assignment Modal
  const [assigningRequest, setAssigningRequest] = useState(null);
  const [selectedAssignLawyer, setSelectedAssignLawyer] = useState('');

  // Service Modal
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [newServiceTitle, setNewServiceTitle] = useState('');
  const [newServicePrice, setNewServicePrice] = useState(5000);
  const [newServiceCategory, setNewServiceCategory] = useState('CORPORATE');

  // Sub-Admin Delegation States
  const [subAdmins, setSubAdmins] = useState([
    {
      id: 'sub-001',
      fullName: 'Pooja Kashyap',
      email: 'pooja.kashyap@lexveritas.com',
      username: 'pooja_kashyap',
      role: 'INTAKE_COORDINATOR',
      roleTitle: 'Intake & Matter Assignment Clerk',
      department: 'Corporate Litigation & Criminal Intake',
      assignedPermissions: ['ASSIGN_REQUESTS', 'VIEW_ROSTER', 'SCHEDULE_APPOINTMENTS'],
      status: 'ACTIVE',
      lastActive: '12 mins ago',
      appointedAt: '12 Jan 2025',
      avatar: 'P',
    },
    {
      id: 'sub-002',
      fullName: 'Gaurav Singhal',
      email: 'gaurav.singhal@lexveritas.com',
      username: 'gaurav_finance',
      role: 'BILLING_CONTROLLER',
      roleTitle: 'Firm Billing & Escrow Controller',
      department: 'Finance & Partner Treasury',
      assignedPermissions: ['VIEW_FINANCES', 'APPROVE_PAYOUTS', 'GENERATE_INVOICES'],
      status: 'ACTIVE',
      lastActive: '2 hours ago',
      appointedAt: '05 Nov 2024',
      avatar: 'G',
    },
    {
      id: 'sub-003',
      fullName: 'Ritika Sharma',
      email: 'ritika.sharma@lexveritas.com',
      username: 'ritika_roster',
      role: 'ROSTER_COORDINATOR',
      roleTitle: 'Advocate Bench Coordinator',
      department: 'Appellate & Commercial Writs',
      assignedPermissions: ['INVITE_ADVOCATES', 'VIEW_ROSTER', 'MANAGE_SERVICES'],
      status: 'INVITED',
      lastActive: 'Awaiting Acceptance',
      appointedAt: '15 Feb 2026',
      avatar: 'R',
    },
  ]);

  const [isAppointSubAdminModalOpen, setIsAppointSubAdminModalOpen] = useState(false);
  const [newSubAdminName, setNewSubAdminName] = useState('');
  const [newSubAdminEmail, setNewSubAdminEmail] = useState('');
  const [newSubAdminUsername, setNewSubAdminUsername] = useState('');
  const [newSubAdminRole, setNewSubAdminRole] = useState('INTAKE_COORDINATOR');
  const [newSubAdminDept, setNewSubAdminDept] = useState('Corporate Litigation & M&A');
  const [newSubAdminPermissions, setNewSubAdminPermissions] = useState([
    'ASSIGN_REQUESTS',
    'VIEW_ROSTER',
  ]);
  const [editingSubAdmin, setEditingSubAdmin] = useState(null);

  const [actionMessage, setActionMessage] = useState('');

  // Filter requests
  const filteredRequests = firmRequests.filter((r) => {
    if (requestTab === 'UNASSIGNED') return r.status === 'UNASSIGNED';
    if (requestTab === 'AWAITING') return r.status === 'AWAITING_LAWYER_RESPONSE';
    if (requestTab === 'REASSIGNMENT') return r.status === 'REASSIGNMENT_REQUIRED';
    return true;
  });

  const unassignedCount = firmRequests.filter((r) => r.status === 'UNASSIGNED').length;
  const awaitingCount = firmRequests.filter((r) => r.status === 'AWAITING_LAWYER_RESPONSE').length;
  const reassignmentCount = firmRequests.filter((r) => r.status === 'REASSIGNMENT_REQUIRED').length;

  // Normalized registered advocates for firm search
  const registeredAdvocates = registeredAdvocatesList.map((adv) => {
    const handle =
      adv.username ||
      adv.fullName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/^adv_?/, 'adv_');
    const email = adv.email || `${handle.replace(/^adv_/, '')}@lawinomeet.com`;
    return {
      ...adv,
      username: handle,
      email,
    };
  });

  // Filtered advocates matching search input
  const filteredSearchAdvocates = registeredAdvocates.filter((adv) => {
    if (!advocateSearchInput.trim()) return true;
    const q = advocateSearchInput.trim().toLowerCase().replace(/^@/, '');
    return (
      adv.fullName.toLowerCase().includes(q) ||
      adv.username.toLowerCase().includes(q) ||
      adv.email.toLowerCase().includes(q) ||
      (adv.barCouncilNumber && adv.barCouncilNumber.toLowerCase().includes(q)) ||
      (adv.specialization && adv.specialization.toLowerCase().includes(q)) ||
      (adv.city && adv.city.toLowerCase().includes(q))
    );
  });

  // Select advocate from search
  const handleSelectAdvocate = (adv) => {
    setSelectedAdvocate(adv);
    if (adv.hourlyRate) {
      setInviteHourlyRate(`₹${adv.hourlyRate.toLocaleString('en-IN')} / hr`);
    }
  };

  // Handle Send Roster Invitation
  const handleSendRosterInvite = (e) => {
    e.preventDefault();
    if (!selectedAdvocate) return;

    // Check if already in roster
    const alreadyExists = firmData.members.some(
      (m) =>
        m.username === selectedAdvocate.username ||
        m.fullName.toLowerCase() === selectedAdvocate.fullName.toLowerCase()
    );
    if (alreadyExists) {
      alert(`${selectedAdvocate.fullName} is already an active member of your firm roster.`);
      return;
    }

    const newMember = {
      publicId: `mem-${Date.now()}`,
      lawyerPublicId: selectedAdvocate.publicId,
      fullName: selectedAdvocate.fullName,
      username: selectedAdvocate.username,
      email: selectedAdvocate.email,
      designation: inviteDesignation,
      department: inviteDepartment,
      barCouncilNumber: selectedAdvocate.barCouncilNumber || 'D/4910/2021',
      court: selectedAdvocate.courtPractice?.[0] || 'Delhi High Court & Supreme Court',
      activeCases: 0,
      billableRate: inviteHourlyRate || '₹6,000 / hr',
      revenueShare: inviteRevenueShare,
      status: 'INVITED', // Invited status
      practiceArrangement: invitePermission,
      avatar: selectedAdvocate.fullName.replace(/^Adv\.?\s*/, '')[0]?.toUpperCase() || 'A',
      invitedAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
    };

    setFirmData((prev) => ({
      ...prev,
      totalTeamSize: prev.totalTeamSize + 1,
      members: [newMember, ...prev.members],
    }));

    setActionMessage(
      `Roster invitation sent to ${selectedAdvocate.fullName} (@${selectedAdvocate.username}) for ${inviteDesignation}. Advocate notified via LawinoMeet Portal.`
    );
    setSelectedAdvocate(null);
    setAdvocateSearchInput('');
    setIsInviteModalOpen(false);
    setTimeout(() => setActionMessage(''), 5000);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
    setSelectedAdvocate(null);
    setAdvocateSearchInput('');
  };

  // Handle Practice Permission Change (Section 8.C)
  const handleSavePermission = (e) => {
    e.preventDefault();
    if (!selectedLawyerPermissionModal) return;

    setFirmData((prev) => ({
      ...prev,
      members: prev.members.map((m) =>
        m.publicId === selectedLawyerPermissionModal.publicId
          ? { ...m, practiceArrangement: selectedPermissionVal }
          : m
      ),
    }));

    setActionMessage(`Updated practice permissions for ${selectedLawyerPermissionModal.fullName} to [${selectedPermissionVal.replace('_', ' ')}]`);
    setSelectedLawyerPermissionModal(null);
    setTimeout(() => setActionMessage(''), 3000);
  };

  // Handle Request Assignment
  const handleAssignRequestSubmit = (e) => {
    e.preventDefault();
    if (!assigningRequest || !selectedAssignLawyer) return;

    const assignedMember = firmData.members.find((m) => m.fullName === selectedAssignLawyer);

    setFirmRequests((prev) =>
      prev.map((r) =>
        r.publicId === assigningRequest.publicId
          ? {
              ...r,
              status: 'AWAITING_LAWYER_RESPONSE',
              assignedLawyer: {
                fullName: selectedAssignLawyer,
                designation: assignedMember?.designation || 'Counsel',
              },
            }
          : r
      )
    );

    setActionMessage(`Assigned request ${assigningRequest.requestNumber} to ${selectedAssignLawyer}. Advocate notified.`);
    setAssigningRequest(null);
    setSelectedAssignLawyer('');
    setTimeout(() => setActionMessage(''), 3000);
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newServiceTitle.trim()) return;

    const newSrv = {
      id: `srv-${Date.now()}`,
      code: 'RETAINER',
      title: newServiceTitle.trim(),
      price: Number(newServicePrice),
      duration: 'Case Duration',
      category: newServiceCategory,
      description: 'Institutional legal representation docket.',
      badge: 'Firm Specialty',
      icon: 'Scale',
    };

    setLegalServices((prev) => [newSrv, ...prev]);
    setActionMessage(`Created practice service: ${newServiceTitle.trim()}`);
    setIsServiceModalOpen(false);
    setNewServiceTitle('');
    setTimeout(() => setActionMessage(''), 3000);
  };

  // Sub-Admin Delegation Action Handlers
  const handleAppointSubAdmin = (e) => {
    e.preventDefault();
    if (!newSubAdminName.trim() || !newSubAdminEmail.trim()) return;

    const handle =
      newSubAdminUsername.trim().replace(/^@/, '') ||
      newSubAdminName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    const roleTitles = {
      INTAKE_COORDINATOR: 'Intake & Matter Assignment Clerk',
      BILLING_CONTROLLER: 'Firm Billing & Escrow Controller',
      ROSTER_COORDINATOR: 'Advocate Bench Coordinator',
      OPERATIONS_LEAD: 'Practice Operations Lead',
    };

    const newSub = {
      id: `sub-${Date.now()}`,
      fullName: newSubAdminName.trim(),
      email: newSubAdminEmail.trim(),
      username: handle,
      role: newSubAdminRole,
      roleTitle: roleTitles[newSubAdminRole] || 'Practice Sub-Admin',
      department: newSubAdminDept,
      assignedPermissions: newSubAdminPermissions,
      status: 'INVITED',
      lastActive: 'Invitation Dispatched',
      appointedAt: new Date().toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      avatar: newSubAdminName.trim().replace(/^Adv\.?\s*/, '')[0]?.toUpperCase() || 'S',
    };

    setSubAdmins((prev) => [newSub, ...prev]);
    setActionMessage(
      `Appointed ${newSub.fullName} as Sub-Admin (${newSub.roleTitle}). Institutional invitation dispatched to ${newSub.email}.`
    );
    setIsAppointSubAdminModalOpen(false);
    setNewSubAdminName('');
    setNewSubAdminEmail('');
    setNewSubAdminUsername('');
    setTimeout(() => setActionMessage(''), 5000);
  };

  const handleRevokeSubAdmin = (id, name) => {
    if (window.confirm(`Are you sure you want to revoke sub-administrative access for ${name}?`)) {
      setSubAdmins((prev) => prev.filter((s) => s.id !== id));
      setActionMessage(`Revoked administrative delegation for ${name}. Access terminated immediately.`);
      setTimeout(() => setActionMessage(''), 4000);
    }
  };

  const handleSaveSubAdminPermissions = (e) => {
    e.preventDefault();
    if (!editingSubAdmin) return;
    setSubAdmins((prev) =>
      prev.map((s) =>
        s.id === editingSubAdmin.id
          ? {
              ...s,
              assignedPermissions: editingSubAdmin.assignedPermissions,
              role: editingSubAdmin.role,
              department: editingSubAdmin.department,
            }
          : s
      )
    );
    setActionMessage(`Updated administrative permissions for ${editingSubAdmin.fullName}.`);
    setEditingSubAdmin(null);
    setTimeout(() => setActionMessage(''), 4000);
  };

  const requestTabs = [
    { id: 'ALL', label: 'All Firm Intake Requests', count: firmRequests.length },
    { id: 'UNASSIGNED', label: 'Unassigned', count: unassignedCount },
    { id: 'AWAITING', label: 'Awaiting Advocate Response', count: awaitingCount },
    { id: 'REASSIGNMENT', label: 'Reassignment Required', count: reassignmentCount },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Toast Banner */}
      {actionMessage && (
        <div className="p-3 px-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-medium flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionMessage}</span>
          </div>
          <button type="button" onClick={() => setActionMessage('')} className="text-emerald-700">
            ✕
          </button>
        </div>
      )}

      {/* =====================================================================
          VIEW 1: FIRM OVERVIEW (/firm)
      ====================================================================== */}
      {isOverview && (
        <>
          <PageHeader
            title="Overview"
            subtitle={`${firmData.name} (${firmData.registrationNumber}) — Multi-Bench Litigation & Corporate Retainer Management.`}
            actions={
              <div className="flex items-center space-x-2">
                <Link
                  to="/firm/requests"
                  className="px-3.5 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs"
                >
                  <Inbox className="w-3.5 h-3.5" />
                  <span>Assign Requests ({unassignedCount})</span>
                </Link>
                <button
                  type="button"
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-3.5 py-2 rounded-lg border border-[var(--border-cream)] bg-white text-stone-800 hover:bg-stone-50 text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite Advocate to Roster</span>
                </button>
              </div>
            }
          />

          {/* Firm KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <MetricCard
              label="Active Advocates"
              value={`${firmData.members.length} Counsel`}
              subtext="Supreme Court & High Court"
              icon={Users}
            />
            <MetricCard
              label="Unassigned Requests"
              value={unassignedCount}
              subtext="Requires partner assignment"
              icon={Clock}
              badge={unassignedCount > 0 ? 'Urgent' : 'Clear'}
              badgeType={unassignedCount > 0 ? 'warning' : 'neutral'}
            />
            <MetricCard
              label="Active Court Matters"
              value={firmData.mattersInCourts}
              subtext="Benches: Delhi, Mumbai, NCLT"
              icon={Scale}
            />
            <MetricCard
              label="Monthly Run Rate"
              value={firmData.monthlyRunRate}
              subtext="Corporate client retainers"
              icon={DollarSign}
            />
          </div>

          {/* Main Grid: Urgent Unassigned Requests & High Court Hearings */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Cols: Unassigned Consultation Requests Queue */}
            <div className="lg:col-span-2 space-y-6">
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <Inbox className="w-4 h-4 text-amber-700" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Unassigned Client Consultation Requests
                    </h3>
                  </div>
                  <Link
                    to="/firm/requests"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    View All Workflow ({firmRequests.length}) &rarr;
                  </Link>
                </div>

                {firmRequests.filter((r) => r.status === 'UNASSIGNED' || r.status === 'REASSIGNMENT_REQUIRED').length === 0 ? (
                  <p className="text-xs text-stone-500 py-6 text-center font-sans">
                    All client requests are assigned to lead counsel.
                  </p>
                ) : (
                  <div className="space-y-3 text-xs">
                    {firmRequests
                      .filter((r) => r.status === 'UNASSIGNED' || r.status === 'REASSIGNMENT_REQUIRED')
                      .map((req) => (
                        <div
                          key={req.publicId}
                          className="p-4 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-[10px] text-stone-500">
                                {req.requestNumber}
                              </span>
                              {req.status === 'REASSIGNMENT_REQUIRED' ? (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                                  Reassignment Required
                                </span>
                              ) : (
                                <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                                  Unassigned Intake
                                </span>
                              )}
                            </div>

                            <p className="font-serif font-bold text-sm text-stone-900 mt-1">
                              {req.client?.fullName}
                            </p>
                            <p className="text-stone-600 font-medium">{req.practiceArea}</p>
                            <p className="text-[11px] text-stone-500 line-clamp-1 mt-0.5">
                              {req.brief}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center space-x-2">
                            <span className="font-serif font-bold text-stone-900 text-xs">
                              {req.budget}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setAssigningRequest(req);
                                setSelectedAssignLawyer(firmData.members[0]?.fullName || '');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition cursor-pointer"
                            >
                              Assign Lawyer
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Active Matters in Benches */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                  <div className="flex items-center space-x-2">
                    <Scale className="w-4 h-4 text-stone-700" />
                    <h3 className="font-serif font-bold text-sm text-stone-900">
                      Firm Litigation Matters & Retainers ({firmData.matters.length})
                    </h3>
                  </div>
                  <Link
                    to="/firm/appointments"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    View Consultations &rarr;
                  </Link>
                </div>

                <div className="space-y-3 text-xs">
                  {firmData.matters.map((m) => (
                    <div
                      key={m.matterId}
                      className="p-3.5 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] text-stone-400">{m.matterId}</span>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-800">
                            {m.court}
                          </span>
                        </div>
                        <h4 className="font-serif font-bold text-sm text-stone-900 mt-0.5">
                          {m.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 font-sans">
                          Client: <span className="font-medium text-stone-700">{m.client}</span> • Lead: <span className="font-medium text-[var(--bg-primary)]">{m.leadCounsel}</span>
                        </p>
                      </div>

                      <div className="sm:text-right shrink-0">
                        <span className="font-serif font-bold text-stone-900 text-xs">
                          {m.retainerValue}
                        </span>
                        <p className="text-[10px] text-stone-500 font-mono">Next: {m.nextHearing}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right 1 Col: Branch Offices & Roster Snapshot */}
            <div className="space-y-6 text-xs">
              {/* Branch Chambers */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="font-serif font-bold text-sm text-stone-900">
                    Firm Chambers & Benches
                  </h3>
                  <Link
                    to="/firm/profile"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    Manage &rarr;
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {firmData.branches.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)]"
                    >
                      <p className="font-semibold text-stone-900">{b.name}</p>
                      <p className="text-[11px] text-stone-500 mt-0.5">{b.address}</p>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-stone-200/60 text-[10px] text-stone-600 font-mono">
                        <span>Lead: {b.partnerInCharge}</span>
                        <span>{b.teamCount} Advocates</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Roster & Practice Permission Quick Links */}
              <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/90 backdrop-blur-sm shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                  <h3 className="font-serif font-bold text-sm text-stone-900">
                    Counsel Roster ({firmData.members.length})
                  </h3>
                  <Link
                    to="/firm/lawyers"
                    className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline"
                  >
                    Permissions &rarr;
                  </Link>
                </div>

                <div className="space-y-2">
                  {firmData.members.slice(0, 4).map((m) => (
                    <div
                      key={m.publicId}
                      className="p-2.5 rounded-lg bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold text-stone-900">{m.fullName}</p>
                        <p className="text-[10px] text-stone-500">{m.designation}</p>
                      </div>
                      <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {m.practiceArrangement ? m.practiceArrangement.replace('_', ' ') : 'Firm Partner'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 2: FIRM PROFILE (/firm/profile)
      ====================================================================== */}
      {isProfileView && (
        <div className="space-y-4">
          <FirmProfileModule
            firmData={firmData}
            onSaveToast={(msg) => {
              setActionMessage(msg);
              setTimeout(() => setActionMessage(''), 4000);
            }}
          />
        </div>
      )}

      {/* =====================================================================
          VIEW 3: LAWYER MANAGEMENT & PRACTICE PERMISSIONS (/firm/lawyers)
      ====================================================================== */}
      {isLawyersView && (
        <>
          <PageHeader
            title="Advocate Roster & Practice Permissions"
            subtitle="Configure firm exclusivity, independent practice permissions, and litigation roles across your associate and partner bench."
            badge="Counsel Governance"
            breadcrumbs={['Firm Admin', 'Lawyer Management']}
            actions={
              <button
                type="button"
                onClick={() => setIsInviteModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Invite Advocate to Roster</span>
              </button>
            }
          />

          {/* Practice Permissions Explanation (Section 8.C) */}
          <div className="p-4 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-white border border-[var(--border-cream)]">
              <p className="font-serif font-bold text-blue-950 mb-1">1. Firm Exclusive</p>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                Counsel practices exclusively under the firm banner. Independent booking is disabled on public profile.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-[var(--border-cream)]">
              <p className="font-serif font-bold text-purple-950 mb-1">2. Firm + Independent</p>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                Counsel can accept firm-assigned matters AND take direct independent client bookings on the shared calendar.
              </p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-[var(--border-cream)]">
              <p className="font-serif font-bold text-amber-950 mb-1">3. Restricted Independent</p>
              <p className="text-[11px] text-stone-600 leading-relaxed font-sans">
                Counsel may accept independent appointments only for approved non-competing legal specializations.
              </p>
            </div>
          </div>

          {/* Counsel Roster Table */}
          <div className="rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[var(--bg-cream-card)] text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    <th className="py-2.5 px-4">Counsel Name</th>
                    <th className="py-2.5 px-4">Firm Designation</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Bar Council #</th>
                    <th className="py-2.5 px-4">Practice Permission</th>
                    <th className="py-2.5 px-4">Membership</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {firmData.members.map((member) => (
                    <tr key={member.publicId} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0">
                            {member.avatar || member.fullName[4] || 'A'}
                          </div>
                          <div>
                            <p className="font-serif font-bold text-stone-900">{member.fullName}</p>
                            <div className="flex items-center space-x-1.5 text-[10px] font-mono">
                              {member.username && (
                                <span className="text-[var(--bg-primary)] font-semibold">@{member.username}</span>
                              )}
                              {member.username && <span className="text-stone-300">•</span>}
                              <span className="text-stone-400">{member.court}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-medium text-stone-800">{member.designation}</td>
                      <td className="py-3 px-4 text-stone-600">{member.department}</td>
                      <td className="py-3 px-4 font-mono text-stone-500 text-[11px]">
                        {member.barCouncilNumber}
                      </td>
                      <td className="py-3 px-4">
                        {member.practiceArrangement === 'FIRM_EXCLUSIVE' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 font-medium">
                            Firm Exclusive
                          </span>
                        ) : member.practiceArrangement === 'RESTRICTED_INDEPENDENT' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                            Restricted Indep.
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 font-medium">
                            Firm + Independent
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {member.status === 'INVITED' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 font-semibold inline-flex items-center space-x-1">
                            <Clock className="w-2.5 h-2.5 inline mr-1" />
                            <span>Pending Acceptance</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                            {member.status || 'ACTIVE'}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {member.status === 'INVITED' ? (
                          <div className="flex items-center justify-end space-x-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setActionMessage(
                                  `Roster invitation re-dispatched to ${member.fullName} (@${member.username})`
                                );
                                setTimeout(() => setActionMessage(''), 3000);
                              }}
                              className="px-2 py-1 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-[10px] font-semibold text-amber-900 transition cursor-pointer"
                            >
                              Resend
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setFirmData((prev) => ({
                                  ...prev,
                                  totalTeamSize: Math.max(1, prev.totalTeamSize - 1),
                                  members: prev.members.filter((m) => m.publicId !== member.publicId),
                                }));
                                setActionMessage(`Cancelled roster invitation for ${member.fullName}`);
                                setTimeout(() => setActionMessage(''), 3000);
                              }}
                              className="px-2 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-[10px] font-medium text-stone-600 transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedLawyerPermissionModal(member);
                              setSelectedPermissionVal(member.practiceArrangement || 'FIRM_EXCLUSIVE');
                            }}
                            className="px-2.5 py-1 rounded-lg border border-[var(--border-cream)] hover:bg-[var(--bg-cream-card)] text-[11px] font-medium text-stone-700 transition cursor-pointer"
                          >
                            Edit Permissions
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 3B: SUB-ADMIN MANAGEMENT PORTAL (/firm/sub-admins)
      ====================================================================== */}
      {isSubAdminsView && (
        <>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <PageHeader
              title="Firm Sub-Admin Delegation & RBAC"
              subtitle="Delegate matter routing, escrow billing review, and advocate bench coordination to appointed firm administrators under Managing Partner oversight."
              badge="Admin Delegation"
              breadcrumbs={['Firm Admin', 'Sub-Admin Delegation']}
            />
            <button
              type="button"
              onClick={() => setIsAppointSubAdminModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-2 shrink-0 self-start sm:self-auto shadow-sm"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Appoint Sub-Admin</span>
            </button>
          </div>

          {/* Statutory Section 126 & Scope Boundary Notice */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 text-stone-700 text-xs flex items-start space-x-3">
            <Shield className="w-4 h-4 text-stone-600 mt-0.5 shrink-0" />
            <div className="space-y-1">
              <p className="font-semibold text-stone-900">
                Statutory Privilege &amp; RBAC Boundary Notice (Section 126 Indian Evidence Act / Section 132 BSA)
              </p>
              <p className="text-stone-600 leading-relaxed text-[11px]">
                Appointed sub-administrators are bound by statutory client-advocate privilege. Administrative credentials grant operational privileges (intake routing, fee structure management, escrow monitoring) but strictly <strong>do not permit legal representation or client consultation appearances</strong> without verified State Bar Council enrollment.
              </p>
            </div>
          </div>

          {/* KPI Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <MetricCard
              label="Appointed Sub-Admins"
              value={subAdmins.length}
              subtext="Active delegated staff"
              icon="Users"
            />
            <MetricCard
              label="Active RBAC Scopes"
              value={new Set(subAdmins.flatMap((s) => s.assignedPermissions)).size}
              subtext="Operational privilege gates"
              icon="Layers"
            />
            <MetricCard
              label="Managing Partner Clearance"
              value="Master"
              subtext="Sole revoke & appoint authority"
              icon="Lock"
            />
          </div>

          {/* Sub-Admin Roster Table */}
          <div className="border border-[var(--border-cream)] rounded-2xl bg-white overflow-hidden shadow-xs">
            <div className="p-4 border-b border-stone-100 flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-900">
                  Appointed Administrative Staff ({subAdmins.length})
                </h3>
                <p className="text-[11px] text-stone-500 font-sans">
                  Granular permission control per delegated staff member.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-cream)]/70 text-stone-600 font-serif border-b border-stone-200">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Staff Member</th>
                    <th className="py-3 px-4 font-semibold">Delegated Role</th>
                    <th className="py-3 px-4 font-semibold">Department</th>
                    <th className="py-3 px-4 font-semibold">RBAC Permissions</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold">Last Active</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {subAdmins.map((sub) => (
                    <tr key={sub.id} className="hover:bg-stone-50/50 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0">
                            {sub.avatar}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{sub.fullName}</p>
                            <p className="text-[10px] text-stone-500 font-mono">
                              @{sub.username} • {sub.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                          {sub.roleTitle}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-stone-600 font-medium text-[11px]">
                        {sub.department}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap gap-1 max-w-xs">
                          {sub.assignedPermissions.map((perm) => (
                            <span
                              key={perm}
                              className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-stone-100 text-stone-700 border border-stone-200"
                            >
                              {perm}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                            sub.status === 'ACTIVE'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {sub.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-stone-500 text-[11px] font-mono">
                        {sub.lastActive}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            type="button"
                            onClick={() => setEditingSubAdmin({ ...sub })}
                            className="px-2.5 py-1 rounded-lg border border-stone-200 hover:bg-stone-100 text-[11px] font-medium text-stone-700 transition cursor-pointer"
                          >
                            Edit Scopes
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRevokeSubAdmin(sub.id, sub.fullName)}
                            className="px-2.5 py-1 rounded-lg border border-rose-200 hover:bg-rose-50 text-[11px] font-medium text-rose-700 transition cursor-pointer"
                          >
                            Revoke
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 4: APPOINTMENT REQUESTS WORKFLOW (/firm/requests)
      ====================================================================== */}
      {isRequestsView && (
        <>
          <PageHeader
            title="Client Consultation Intake Workflow"
            subtitle="Manage firm-wide consultation requests through the 3 lifecycle states: Unassigned Intake, Awaiting Advocate Response, and Reassignment Required."
            badge="Intake Workflow"
            breadcrumbs={['Firm Admin', 'Appointment Requests']}
          />

          {/* Workflow Status Tabs */}
          <StatusTabs
            tabs={requestTabs}
            activeTab={requestTab}
            onChange={(tabId) => setRequestTab(tabId)}
          />

          {/* Request Items */}
          <div className="space-y-3">
            {filteredRequests.length === 0 ? (
              <EmptyState
                title="No requests in this workflow state"
                description="There are currently no firm consultation requests in this status."
              />
            ) : (
              filteredRequests.map((req) => (
                <div
                  key={req.publicId}
                  className="p-4 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs shadow-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] text-stone-500">{req.requestNumber}</span>
                      {req.status === 'UNASSIGNED' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                          1. Unassigned Intake
                        </span>
                      ) : req.status === 'AWAITING_LAWYER_RESPONSE' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          2. Awaiting Advocate Acceptance
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-100 text-rose-900 border border-rose-200">
                          3. Reassignment Required
                        </span>
                      )}
                    </div>

                    <h4 className="font-serif font-bold text-sm text-stone-900">
                      {req.client?.fullName}
                    </h4>
                    <p className="text-stone-600 font-medium">{req.practiceArea}</p>
                    <p className="text-[11px] text-stone-500 font-sans leading-relaxed max-w-2xl">
                      {req.brief}
                    </p>

                    {req.assignedLawyer && (
                      <p className="text-[11px] text-blue-800 font-medium pt-1">
                        Currently Assigned: {req.assignedLawyer.fullName} ({req.assignedLawyer.designation})
                      </p>
                    )}

                    {req.previousLawyer && (
                      <div className="p-2 rounded bg-rose-50 border border-rose-200 text-rose-900 text-[10px] mt-1">
                        Declined by {req.previousLawyer.fullName}: {req.previousLawyer.reason}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center space-x-2">
                    <div className="text-right mr-2">
                      <p className="font-serif font-bold text-stone-900">{req.budget}</p>
                      <p className="text-[10px] text-stone-400 font-mono">
                        Pref Date: {new Date(req.preferredDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setAssigningRequest(req);
                        setSelectedAssignLawyer(firmData.members[0]?.fullName || '');
                      }}
                      className="px-3.5 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold transition cursor-pointer shadow-xs"
                    >
                      {req.status === 'REASSIGNMENT_REQUIRED' ? 'Reassign Counsel' : 'Assign Counsel'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 5: FIRM APPOINTMENTS (/firm/appointments)
      ====================================================================== */}
      {isAppointmentsView && (
        <>
          <PageHeader
            title="Firm Consultations & Retainer Ledger"
            subtitle="Firm-contracted consultations across all active practice benches and associate advocates."
            breadcrumbs={['Firm Admin', 'Firm Appointments']}
          />

          {/* Matters & Consultations Table */}
          <div className="rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[var(--bg-cream-card)] text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    <th className="py-2.5 px-4">Ref Matter</th>
                    <th className="py-2.5 px-4">Client Representative</th>
                    <th className="py-2.5 px-4">Lead Counsel</th>
                    <th className="py-2.5 px-4">Bench / Court</th>
                    <th className="py-2.5 px-4">Department</th>
                    <th className="py-2.5 px-4">Next Hearing</th>
                    <th className="py-2.5 px-4">Retainer Value</th>
                    <th className="py-2.5 px-4 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {firmData.matters.map((matter) => (
                    <tr key={matter.matterId} className="hover:bg-stone-50/70 transition">
                      <td className="py-3 px-4 font-mono font-medium text-stone-600">
                        {matter.matterId}
                      </td>
                      <td className="py-3 px-4 font-semibold text-stone-900">{matter.client}</td>
                      <td className="py-3 px-4 font-medium text-[var(--bg-primary)]">
                        {matter.leadCounsel}
                      </td>
                      <td className="py-3 px-4 text-stone-600">{matter.court}</td>
                      <td className="py-3 px-4 text-stone-500">{matter.department}</td>
                      <td className="py-3 px-4 font-medium text-stone-800">{matter.nextHearing}</td>
                      <td className="py-3 px-4 font-serif font-bold text-stone-900">
                        {matter.retainerValue}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                          {matter.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 6: LEGAL SERVICES (/firm/services)
      ====================================================================== */}
      {isServicesView && (
        <>
          <PageHeader
            title="Firm Legal Practice Services"
            subtitle="Configure firm-wide service packages, commercial retainer schedules, and statutory notice offerings."
            badge="Service Directory"
            breadcrumbs={['Firm Admin', 'Legal Services']}
            actions={
              <button
                type="button"
                onClick={() => setIsServiceModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Legal Offering</span>
              </button>
            }
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {legalServices.map((srv) => (
              <div
                key={srv.id}
                className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm flex flex-col justify-between shadow-xs text-xs space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[var(--bg-cream-card)] border border-[var(--border-cream)] text-stone-700">
                      {srv.category}
                    </span>
                    <span className="font-serif font-bold text-stone-900 text-sm">
                      ₹{srv.price.toLocaleString('en-IN')}
                    </span>
                  </div>
                  <h4 className="font-serif font-bold text-sm text-stone-900">{srv.title}</h4>
                  <p className="text-[11px] text-stone-500 font-sans leading-relaxed mt-1">
                    {srv.description}
                  </p>
                </div>

                <div className="pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
                  <span>Duration: {srv.duration}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">
                    Active
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* =====================================================================
          VIEW 7: FIRM FINANCE (/firm/finance)
      ====================================================================== */}
      {isFinanceView && (
        <div className="space-y-6">
          <PageHeader
            title="Firm Treasury & Payout Ledger"
            subtitle="Corporate client retainers, escrow settlement tracking, and partner dividend disbursements."
            badge="Firm Treasury"
            breadcrumbs={['Firm Admin', 'Firm Finance']}
          />
          <div className="p-4 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] text-xs text-stone-600">
            <p className="font-serif font-bold text-stone-900 text-sm mb-1">
              Institutional Partnership Treasury
            </p>
            <p className="font-sans leading-relaxed">
              Consolidated revenue across New Delhi, Mumbai, and Bengaluru practice desks. All partner dividend allocations settle to registered institutional LLP accounts.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: SEARCH & INVITE REGISTERED ADVOCATE TO FIRM ROSTER
      ====================================================================== */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Invite Advocate to Firm Roster
                  </h3>
                </div>
                <p className="text-[11px] text-stone-500 font-sans leading-relaxed">
                  Advocates are already registered on LawinoMeet. Search any verified advocate by{' '}
                  <span className="font-semibold text-stone-700">@username</span> or{' '}
                  <span className="font-semibold text-stone-700">email address</span> to dispatch an official firm affiliation invitation.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseInviteModal}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="overflow-y-auto py-3 space-y-4 flex-1">
              {!selectedAdvocate ? (
                /* Step 1: Search & Browse Registered Advocates */
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-semibold text-stone-700 mb-1.5">
                      Search Registered Advocates
                    </label>
                    <div className="relative flex items-center">
                      <Search className="w-4 h-4 text-stone-400 absolute left-3 pointer-events-none" />
                      <input
                        type="text"
                        placeholder="Search by @username, email, or advocate name (e.g. @adv_meera, @adv_kabir)..."
                        value={advocateSearchInput}
                        onChange={(e) => setAdvocateSearchInput(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-[var(--border-cream)] bg-stone-50/50 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-[var(--bg-primary)] focus:bg-white transition"
                        autoFocus
                      />
                      {advocateSearchInput && (
                        <button
                          type="button"
                          onClick={() => setAdvocateSearchInput('')}
                          className="absolute right-2.5 text-stone-400 hover:text-stone-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Quick Suggestions Chips */}
                  <div>
                    <p className="text-[10px] font-mono uppercase tracking-wider text-stone-500 mb-1.5">
                      Available Registered Practitioners:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {registeredAdvocates.slice(0, 4).map((adv) => (
                        <button
                          key={adv.publicId}
                          type="button"
                          onClick={() => handleSelectAdvocate(adv)}
                          className="px-2.5 py-1 rounded-lg border border-stone-200 bg-stone-50 hover:bg-white hover:border-[var(--bg-primary)] text-stone-700 text-[11px] flex items-center space-x-1.5 transition cursor-pointer"
                        >
                          <span className="font-semibold">{adv.fullName}</span>
                          <span className="text-[10px] text-[var(--bg-primary)] font-mono">@{adv.username}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Search Results List */}
                  <div className="space-y-2">
                    <p className="text-[10px] font-mono text-stone-500 uppercase">
                      {advocateSearchInput ? `Matching Results (${filteredSearchAdvocates.length})` : 'All Registered Advocates'}
                    </p>

                    {filteredSearchAdvocates.length === 0 ? (
                      <div className="p-6 text-center rounded-xl bg-stone-50 border border-stone-200 text-stone-500">
                        <AlertCircle className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
                        <p className="font-semibold text-stone-700 text-xs">No registered advocate found</p>
                        <p className="text-[11px] text-stone-500 mt-0.5">
                          No practitioner matches &ldquo;{advocateSearchInput}&rdquo;. Please verify the @username or email address.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {filteredSearchAdvocates.map((adv) => {
                          const isAlreadyMember = firmData.members.some(
                            (m) =>
                              m.username === adv.username ||
                              m.fullName.toLowerCase() === adv.fullName.toLowerCase()
                          );

                          return (
                            <div
                              key={adv.publicId}
                              className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                                isAlreadyMember
                                  ? 'bg-stone-50/70 border-stone-200 opacity-70'
                                  : 'bg-white border-[var(--border-cream)] hover:border-stone-400 shadow-xs'
                              }`}
                            >
                              <div className="flex items-center space-x-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-xs shrink-0">
                                  {adv.fullName.replace(/^Adv\.?\s*/, '')[0]?.toUpperCase() || 'A'}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center space-x-1.5">
                                    <p className="font-serif font-bold text-stone-900 truncate">
                                      {adv.fullName}
                                    </p>
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  </div>
                                  <div className="flex items-center space-x-2 text-[10px] font-mono text-stone-500">
                                    <span className="text-[var(--bg-primary)] font-semibold">@{adv.username}</span>
                                    <span>•</span>
                                    <span className="truncate">{adv.email}</span>
                                  </div>
                                  <div className="flex items-center space-x-2 text-[10px] text-stone-500 mt-0.5">
                                    <span>Bar: {adv.barCouncilNumber}</span>
                                    <span>•</span>
                                    <span>{adv.specialization?.replace(/_/g, ' ') || 'General Practice'}</span>
                                    <span>•</span>
                                    <span>{adv.city || 'Delhi NCR'}</span>
                                  </div>
                                </div>
                              </div>

                              <div className="shrink-0">
                                {isAlreadyMember ? (
                                  <span className="px-2.5 py-1 rounded-lg bg-stone-100 text-stone-500 text-[10px] font-mono">
                                    On Roster
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAdvocate(adv)}
                                    className="px-3 py-1.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer flex items-center space-x-1"
                                  >
                                    <span>Select</span>
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Selected Advocate Preview & Affiliation Terms */
                <form onSubmit={handleSendRosterInvite} className="space-y-3.5">
                  {/* Selected Advocate Profile Card */}
                  <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--bg-primary)] text-white flex items-center justify-center font-serif font-bold text-sm shrink-0">
                        {selectedAdvocate.fullName.replace(/^Adv\.?\s*/, '')[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <p className="font-serif font-bold text-stone-900 text-sm">
                            {selectedAdvocate.fullName}
                          </p>
                          <span className="px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 text-[9px] font-mono font-semibold">
                            VERIFIED ADVOCATE
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 text-[11px] text-stone-600 mt-0.5 font-mono">
                          <span className="text-[var(--bg-primary)] font-semibold">@{selectedAdvocate.username}</span>
                          <span>•</span>
                          <span>{selectedAdvocate.email}</span>
                        </div>
                        <p className="text-[10px] text-stone-500 mt-0.5">
                          Bar Council ID: <strong className="text-stone-700">{selectedAdvocate.barCouncilNumber}</strong> ({selectedAdvocate.stateBar || 'Bar Council of Delhi'})
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedAdvocate(null)}
                      className="text-[11px] font-semibold text-stone-600 hover:text-stone-900 underline shrink-0 cursor-pointer"
                    >
                      Change Advocate
                    </button>
                  </div>

                  {/* Terms Configuration */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Proposed Firm Designation <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={inviteDesignation}
                        onChange={(e) => setInviteDesignation(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 bg-white"
                      >
                        <option value="Senior Associate Advocate">Senior Associate Advocate</option>
                        <option value="Associate Advocate">Associate Advocate</option>
                        <option value="Associate Partner">Associate Partner</option>
                        <option value="Senior Partner">Senior Partner</option>
                        <option value="Equity Partner">Equity Partner</option>
                        <option value="Of Counsel">Of Counsel</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Assigned Department <span className="text-rose-600">*</span>
                      </label>
                      <select
                        value={inviteDepartment}
                        onChange={(e) => setInviteDepartment(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 bg-white"
                      >
                        <option value="Corporate Litigation & M&A">Corporate Litigation &amp; M&amp;A</option>
                        <option value="Criminal Litigation & White Collar">Criminal Defense &amp; White Collar</option>
                        <option value="Commercial Arbitration & Recovery">Commercial Arbitration &amp; Recovery</option>
                        <option value="IPR, Patent & Technology Law">IPR, Patents &amp; Tech</option>
                        <option value="Constitutional & Commercial Writs">Constitutional &amp; Appellate</option>
                        <option value="Banking & Real Estate (RERA)">Banking &amp; Real Estate (RERA)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Practice Permissions (Section 8.C) <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={invitePermission}
                      onChange={(e) => setInvitePermission(e.target.value)}
                      className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 bg-white"
                    >
                      <option value="FIRM_EXCLUSIVE">Firm Exclusive (No independent booking)</option>
                      <option value="FIRM_AND_INDEPENDENT">Firm + Independent (Dual Booking)</option>
                      <option value="RESTRICTED_INDEPENDENT">Restricted Independent Practice</option>
                    </select>
                    <p className="text-[10px] text-stone-500 mt-1">
                      {invitePermission === 'FIRM_EXCLUSIVE'
                        ? 'Counsel practices solely under the firm banner. Client direct bookings on their public profile are automatically redirected to the firm intake pool.'
                        : invitePermission === 'FIRM_AND_INDEPENDENT'
                        ? 'Counsel can accept firm-assigned briefs AND take private direct client consultations on their shared calendar.'
                        : 'Counsel can take independent bookings only for approved non-competing legal domains.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Proposed Billable Hourly Rate
                      </label>
                      <input
                        type="text"
                        value={inviteHourlyRate}
                        onChange={(e) => setInviteHourlyRate(e.target.value)}
                        placeholder="e.g. ₹6,000 / hr"
                        className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Revenue Allocation Split
                      </label>
                      <select
                        value={inviteRevenueShare}
                        onChange={(e) => setInviteRevenueShare(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 bg-white"
                      >
                        <option value="70% Counsel / 30% Firm Treasury">70% Counsel / 30% Firm Treasury</option>
                        <option value="80% Counsel / 20% Firm Treasury">80% Counsel / 20% Firm Treasury</option>
                        <option value="60% Counsel / 40% Firm Treasury">60% Counsel / 40% Firm Treasury</option>
                        <option value="100% Salaried / Retainer Only">Fixed Salaried Partner Retainer</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Invitation Message / Terms Note (Optional)
                    </label>
                    <textarea
                      rows={2}
                      value={inviteCustomNote}
                      onChange={(e) => setInviteCustomNote(e.target.value)}
                      placeholder="e.g. Lex Veritas Legal LLP invites you to join our high-stakes corporate litigation bench with full chamber privileges..."
                      className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 resize-none"
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 flex items-center justify-between border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => setSelectedAdvocate(null)}
                      className="text-xs text-stone-600 hover:text-stone-900 underline"
                    >
                      &larr; Back to Search
                    </button>

                    <div className="flex items-center space-x-2">
                      <button
                        type="button"
                        onClick={handleCloseInviteModal}
                        className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Roster Invitation</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT PRACTICE PERMISSIONS
      ====================================================================== */}
      {selectedLawyerPermissionModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Configure Practice Permissions
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Adjust independent practice permissions for{' '}
              <strong className="text-stone-900">{selectedLawyerPermissionModal.fullName}</strong>.
            </p>

            <form onSubmit={handleSavePermission} className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                  <input
                    type="radio"
                    name="permission"
                    value="FIRM_EXCLUSIVE"
                    checked={selectedPermissionVal === 'FIRM_EXCLUSIVE'}
                    onChange={() => setSelectedPermissionVal('FIRM_EXCLUSIVE')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-stone-900">Firm Exclusive</p>
                    <p className="text-[11px] text-stone-500 font-sans">
                      Practices exclusively under the firm. Client independent booking buttons are disabled.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                  <input
                    type="radio"
                    name="permission"
                    value="FIRM_AND_INDEPENDENT"
                    checked={selectedPermissionVal === 'FIRM_AND_INDEPENDENT'}
                    onChange={() => setSelectedPermissionVal('FIRM_AND_INDEPENDENT')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-stone-900">Firm + Independent</p>
                    <p className="text-[11px] text-stone-500 font-sans">
                      Allows accepting firm appointments AND personal independent consultations on the unified calendar.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-2.5 p-3 rounded-xl border border-stone-200 cursor-pointer hover:bg-stone-50">
                  <input
                    type="radio"
                    name="permission"
                    value="RESTRICTED_INDEPENDENT"
                    checked={selectedPermissionVal === 'RESTRICTED_INDEPENDENT'}
                    onChange={() => setSelectedPermissionVal('RESTRICTED_INDEPENDENT')}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="font-semibold text-stone-900">Restricted Independent</p>
                    <p className="text-[11px] text-stone-500 font-sans">
                      Limited independent consultations for non-competing legal specializations only.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedLawyerPermissionModal(null)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer"
                >
                  Save Practice Settings
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ASSIGN / REASSIGN LAWYER TO REQUEST
      ====================================================================== */}
      {assigningRequest && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Assign Lead Counsel to Intake
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Client: <strong className="text-stone-900">{assigningRequest.client?.fullName}</strong> •{' '}
              {assigningRequest.practiceArea}
            </p>

            <form onSubmit={handleAssignRequestSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Select Advocate from Active Firm Roster
                </label>
                <select
                  value={selectedAssignLawyer}
                  onChange={(e) => setSelectedAssignLawyer(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                >
                  {firmData.members.map((m) => (
                    <option key={m.publicId} value={m.fullName}>
                      {m.fullName} ({m.designation} - {m.department})
                    </option>
                  ))}
                </select>
              </div>

              <p className="text-[10px] text-stone-500 leading-relaxed">
                The assigned advocate will receive an immediate high-priority alert to review the client brief and accept or decline on their master calendar.
              </p>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setAssigningRequest(null)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer"
                >
                  Confirm Assignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: ADD PRACTICE SERVICE
      ====================================================================== */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Add Firm Practice Offering
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Define a new fixed-retainer or case consultation service package.
            </p>

            <form onSubmit={handleAddService} className="space-y-3">
              <div>
                <label className="block text-[11px] font-medium text-stone-700 mb-1">
                  Service Package Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. NCLT Insolvency Petition Drafting"
                  value={newServiceTitle}
                  onChange={(e) => setNewServiceTitle(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Standard Retainer (₹)
                  </label>
                  <input
                    type="number"
                    value={newServicePrice}
                    onChange={(e) => setNewServicePrice(e.target.value)}
                    required
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Category
                  </label>
                  <select
                    value={newServiceCategory}
                    onChange={(e) => setNewServiceCategory(e.target.value)}
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  >
                    <option value="CORPORATE">Corporate & M&A</option>
                    <option value="CRIMINAL">Criminal Litigation</option>
                    <option value="ARBITRATION">Arbitration & Writs</option>
                    <option value="IPR">IPR & Patents</option>
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsServiceModalOpen(false)}
                  className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer"
                >
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: APPOINT SUB-ADMIN WITH RBAC DELEGATION
      ====================================================================== */}
      {isAppointSubAdminModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="space-y-0.5">
                <div className="flex items-center space-x-2">
                  <div className="w-7 h-7 rounded-lg bg-[var(--bg-primary)]/10 text-[var(--bg-primary)] flex items-center justify-center">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h3 className="font-serif font-bold text-base text-stone-900">
                    Appoint Firm Sub-Admin
                  </h3>
                </div>
                <p className="text-[11px] text-stone-500 font-sans">
                  Delegate operational and administrative permissions to authorized chamber staff.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAppointSubAdminModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAppointSubAdmin} className="overflow-y-auto py-3 space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Full Staff Member Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Pooja Kashyap"
                  value={newSubAdminName}
                  onChange={(e) => setNewSubAdminName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-[var(--border-cream)] bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-[var(--bg-primary)]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Institutional Email <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="pooja@lexveritas.com"
                    value={newSubAdminEmail}
                    onChange={(e) => setNewSubAdminEmail(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-[var(--border-cream)] bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-[var(--bg-primary)]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    System Handle (@username)
                  </label>
                  <input
                    type="text"
                    placeholder="pooja_kashyap"
                    value={newSubAdminUsername}
                    onChange={(e) => setNewSubAdminUsername(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-cream)] bg-stone-50/50 text-xs text-stone-800 focus:outline-none focus:border-[var(--bg-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Administrative Sub-Role <span className="text-rose-600">*</span>
                  </label>
                  <select
                    value={newSubAdminRole}
                    onChange={(e) => {
                      const r = e.target.value;
                      setNewSubAdminRole(r);
                      if (r === 'INTAKE_COORDINATOR') {
                        setNewSubAdminPermissions(['ASSIGN_REQUESTS', 'VIEW_ROSTER', 'SCHEDULE_APPOINTMENTS']);
                      } else if (r === 'BILLING_CONTROLLER') {
                        setNewSubAdminPermissions(['VIEW_FINANCES', 'APPROVE_PAYOUTS']);
                      } else if (r === 'ROSTER_COORDINATOR') {
                        setNewSubAdminPermissions(['INVITE_ADVOCATES', 'VIEW_ROSTER', 'MANAGE_SERVICES']);
                      } else {
                        setNewSubAdminPermissions(['ASSIGN_REQUESTS', 'SCHEDULE_APPOINTMENTS', 'MANAGE_SERVICES']);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-cream)] bg-white text-xs text-stone-800"
                  >
                    <option value="INTAKE_COORDINATOR">Intake & Matter Coordinator</option>
                    <option value="BILLING_CONTROLLER">Billing & Escrow Controller</option>
                    <option value="ROSTER_COORDINATOR">Advocate Bench Coordinator</option>
                    <option value="OPERATIONS_LEAD">Practice Operations Lead</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                    Department Assignment <span className="text-rose-600">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Corporate Litigation & Criminal Intake"
                    value={newSubAdminDept}
                    onChange={(e) => setNewSubAdminDept(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-[var(--border-cream)] bg-stone-50/50 text-xs text-stone-800"
                  />
                </div>
              </div>

              {/* RBAC Permission Checkboxes */}
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-2">
                  Granular RBAC Scopes &amp; Operational Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                  {[
                    { id: 'ASSIGN_REQUESTS', label: 'Route & Assign Intake Briefs', desc: 'Distribute client consultations to advocates' },
                    { id: 'VIEW_ROSTER', label: 'View Roster Schedules', desc: 'Inspect advocate single-shared availability' },
                    { id: 'SCHEDULE_APPOINTMENTS', label: 'Coordinate Hearing Slots', desc: 'Manage hearing slots & video chambers' },
                    { id: 'VIEW_FINANCES', label: 'View Firm Financial Ledger', desc: 'Inspect fee collections & billing statements' },
                    { id: 'APPROVE_PAYOUTS', label: 'Authorize Partner Disbursements', desc: 'Sign off on treasury disbursements' },
                    { id: 'INVITE_ADVOCATES', label: 'Dispatch Roster Invitations', desc: 'Search & invite registered practitioners' },
                    { id: 'MANAGE_SERVICES', label: 'Configure Practice Packages', desc: 'Edit chamber fee schedules' },
                  ].map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-start space-x-2 p-2 rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newSubAdminPermissions.includes(perm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewSubAdminPermissions([...newSubAdminPermissions, perm.id]);
                          } else {
                            setNewSubAdminPermissions(newSubAdminPermissions.filter((p) => p !== perm.id));
                          }
                        }}
                        className="mt-0.5 rounded text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
                      />
                      <div>
                        <p className="text-[11px] font-semibold text-stone-800">{perm.label}</p>
                        <p className="text-[10px] text-stone-500 leading-tight">{perm.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setIsAppointSubAdminModalOpen(false)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Confirm &amp; Appoint Sub-Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT SUB-ADMIN RBAC PERMISSIONS
      ====================================================================== */}
      {editingSubAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs max-h-[92vh] flex flex-col">
            <div className="flex items-start justify-between pb-3 border-b border-stone-100 shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-serif font-bold text-base text-stone-900">
                  Edit Scopes for {editingSubAdmin.fullName}
                </h3>
                <p className="text-[11px] text-stone-500 font-mono">
                  @{editingSubAdmin.username} • {editingSubAdmin.email}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingSubAdmin(null)}
                className="text-stone-400 hover:text-stone-700 p-1 rounded-lg hover:bg-stone-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSubAdminPermissions} className="overflow-y-auto py-3 space-y-4 flex-1">
              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-1">
                  Department
                </label>
                <input
                  type="text"
                  value={editingSubAdmin.department}
                  onChange={(e) =>
                    setEditingSubAdmin({ ...editingSubAdmin, department: e.target.value })
                  }
                  className="w-full p-2.5 rounded-xl border border-[var(--border-cream)] text-xs text-stone-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-700 mb-2">
                  Active Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-xl border border-stone-200 bg-stone-50/50">
                  {[
                    { id: 'ASSIGN_REQUESTS', label: 'Route & Assign Intake Briefs' },
                    { id: 'VIEW_ROSTER', label: 'View Roster Schedules' },
                    { id: 'SCHEDULE_APPOINTMENTS', label: 'Coordinate Hearing Slots' },
                    { id: 'VIEW_FINANCES', label: 'View Firm Financial Ledger' },
                    { id: 'APPROVE_PAYOUTS', label: 'Authorize Partner Disbursements' },
                    { id: 'INVITE_ADVOCATES', label: 'Dispatch Roster Invitations' },
                    { id: 'MANAGE_SERVICES', label: 'Configure Practice Packages' },
                  ].map((perm) => (
                    <label
                      key={perm.id}
                      className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white transition cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={editingSubAdmin.assignedPermissions.includes(perm.id)}
                        onChange={(e) => {
                          const current = editingSubAdmin.assignedPermissions;
                          const updated = e.target.checked
                            ? [...current, perm.id]
                            : current.filter((p) => p !== perm.id);
                          setEditingSubAdmin({
                            ...editingSubAdmin,
                            assignedPermissions: updated,
                          });
                        }}
                        className="rounded text-[var(--bg-primary)] focus:ring-[var(--bg-primary)]"
                      />
                      <span className="text-[11px] font-semibold text-stone-800">{perm.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t border-stone-100">
                <button
                  type="button"
                  onClick={() => setEditingSubAdmin(null)}
                  className="px-3 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer shadow-sm"
                >
                  Save Permission Scopes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
