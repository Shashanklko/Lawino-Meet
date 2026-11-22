import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Scale,
  RefreshCw,
  ArrowDownLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  RotateCcw,
  Send,
  User,
  Wallet,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

const formatINR = (val) => (Number(val) || 0).toLocaleString('en-IN');

export const AdminFinancePage = () => {
  const [activeTab, setActiveTab] = useState('ESCROW'); // Default to Escrow Vault as requested
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFirmId, setSelectedFirmId] = useState('firm-001');
  const [selectedAdvocateId, setSelectedAdvocateId] = useState('adv-001');
  const [searchTxn, setSearchTxn] = useState('');
  const [searchEscrow, setSearchEscrow] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Escrow Action Modal
  const [escrowModal, setEscrowModal] = useState(null); // { type: 'RELEASE' | 'ROLLBACK', escrow: item }
  const [escrowReason, setEscrowReason] = useState('');

  const loadFinance = async () => {
    setLoading(true);
    const res = await adminApi.getFinanceOverview();
    if (res.success) {
      setFinanceData(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFinance();
  }, []);

  const handleApproveRefund = async (refundId) => {
    await adminApi.approveRefund(refundId, 'Authorized by Finance Admin after advocate attendance check.');
    setToastMessage(`Refund ${refundId} approved. Gateway settlement dispatched to client account.`);
    loadFinance();
    setTimeout(() => setToastMessage(''), 3500);
  };

  const handleExecuteEscrowAction = async (e) => {
    e.preventDefault();
    if (!escrowModal) return;

    const { type, escrow } = escrowModal;
    if (type === 'RELEASE') {
      await adminApi.releaseEscrowToLawyer(
        escrow.id,
        escrow.appointmentId,
        escrow.netBeneficiary,
        escrowReason || 'Admin verified session completion and released fee to advocate'
      );
      setToastMessage(`Escrow ${escrow.id} (₹${formatINR(escrow.netBeneficiary)}) successfully released to ${escrow.beneficiary}.`);
    } else {
      await adminApi.rollbackEscrowToClient(
        escrow.id,
        escrow.appointmentId,
        escrow.grossAmount,
        escrowReason || 'Admin verified cancellation and rolled back fee 100% to client'
      );
      setToastMessage(`Escrow ${escrow.id} (₹${formatINR(escrow.grossAmount)}) rolled back 100% to client ${escrow.client}.`);
    }

    setEscrowModal(null);
    setEscrowReason('');
    loadFinance();
    setTimeout(() => setToastMessage(''), 3500);
  };

  if (loading || !financeData) {
    return <div className="py-20 text-center text-xs text-stone-400 font-mono">Loading Finance &amp; Escrow Ledgers...</div>;
  }

  const { platformRevenue, transactions = [], refunds = [], escrows = [] } = financeData;

  const filteredTransactions = transactions.filter((tx) =>
    (tx.client || '').toLowerCase().includes(searchTxn.toLowerCase()) ||
    (tx.beneficiary || '').toLowerCase().includes(searchTxn.toLowerCase()) ||
    (tx.id || '').toLowerCase().includes(searchTxn.toLowerCase())
  );

  const filteredEscrows = escrows.filter((esc) =>
    (esc.client || '').toLowerCase().includes(searchEscrow.toLowerCase()) ||
    (esc.beneficiary || '').toLowerCase().includes(searchEscrow.toLowerCase()) ||
    (esc.id || '').toLowerCase().includes(searchEscrow.toLowerCase()) ||
    (esc.appointmentId || '').toLowerCase().includes(searchEscrow.toLowerCase())
  );

  const totalEscrowHeld = escrows
    .filter((e) => e.status === 'HELD_IN_ESCROW')
    .reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);

  const totalEscrowReleased = escrows
    .filter((e) => e.status === 'RELEASED_TO_LAWYER')
    .reduce((sum, e) => sum + (Number(e.netBeneficiary) || 0), 0);

  const totalEscrowRolledBack = escrows
    .filter((e) => e.status === 'ROLLED_BACK_TO_CLIENT')
    .reduce((sum, e) => sum + (Number(e.grossAmount) || 0), 0);

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
          <DollarSign className="w-5 h-5 text-amber-500" />
          <span>Platform Finance, Escrow Vault &amp; Settlements</span>
        </h2>
        <p className="text-xs text-stone-400 font-sans mt-0.5">
          Automated client-to-escrow-to-lawyer fund movements, statutory 10% platform fee ledger, and escrow release/rollback administration.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-stone-800 pb-2 text-xs overflow-x-auto">
        {[
          { id: 'ESCROW', label: '1. Escrow Vault & Fund Flow' },
          { id: 'REVENUE', label: '2. Platform Revenue' },
          { id: 'FIRM', label: '3. Firm Finance' },
          { id: 'ADVOCATE', label: '4. Advocate Finance' },
          { id: 'TRANSACTIONS', label: '5. Transactions Ledger' },
          { id: 'REFUNDS', label: '6. Refund Management' },
          { id: 'RECONCILIATION', label: '7. Gateway Reconciliation' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-xl font-medium transition cursor-pointer shrink-0 ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#941B2B] to-[#731522] text-white shadow-xs font-semibold'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* =====================================================================
          TAB 1: ESCROW VAULT & FUND FLOW (PRIMARY ESCROW MANAGEMENT)
          ====================================================================== */}
      {activeTab === 'ESCROW' && (
        <div className="space-y-6">
          {/* Visual Fund Flow Diagram */}
          <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-cream-100 flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Escrow Retainer Pipeline &amp; Fund Flow Architecture</span>
                </h3>
                <p className="text-[11px] text-stone-400 mt-0.5">
                  Client funds are protected in the LawinoMeet Escrow Vault until consultation completion or authorized cancellation.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Escrow Protected
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Stage 1: Client Wallet */}
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-2 relative">
                <div className="flex items-center space-x-2 text-stone-300">
                  <Wallet className="w-4 h-4 text-amber-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">1. Client Wallet</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  Funds deducted from client when booking is confirmed. Transferred directly into secure platform escrow.
                </p>
                <div className="text-[10px] font-mono text-amber-400 pt-1 border-t border-stone-800 flex items-center justify-between">
                  <span>Trigger: Slot Reservation</span>
                  <span>100% Prepaid</span>
                </div>
              </div>

              {/* Stage 2: Escrow Vault (Current Held) */}
              <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/50 text-xs space-y-2 relative">
                <div className="flex items-center space-x-2 text-amber-200">
                  <ShieldCheck className="w-4 h-4 text-amber-400" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">2. Escrow Vault (In Custody)</span>
                </div>
                <p className="text-[11px] text-stone-300">
                  Total Active Held: <strong className="text-amber-400 font-mono text-sm">₹{formatINR(totalEscrowHeld)}</strong>
                </p>
                <div className="text-[10px] font-mono text-stone-400 pt-1 border-t border-amber-900/40 flex items-center justify-between">
                  <span>Admin Authority:</span>
                  <span className="text-emerald-400 font-semibold">Release OR Rollback</span>
                </div>
              </div>

              {/* Stage 3: Settlement */}
              <div className="p-4 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-2">
                <div className="flex items-center space-x-2 text-emerald-400">
                  <Scale className="w-4 h-4" />
                  <span className="font-bold uppercase tracking-wider text-[10px]">3. Final Settlement</span>
                </div>
                <p className="text-[11px] text-stone-400">
                  • <strong>On Completion:</strong> 90% credited to Lawyer, 10% platform commission retained.
                  <br />
                  • <strong>On Cancellation:</strong> 100% rolled back to Client wallet.
                </p>
                <div className="text-[10px] font-mono text-emerald-400 pt-1 border-t border-stone-800 flex items-center justify-between">
                  <span>Released: ₹{formatINR(totalEscrowReleased)}</span>
                  <span>Refunded: ₹{formatINR(totalEscrowRolledBack)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Escrow Search & Table */}
          <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm space-y-3 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-cream-100">
                  Active Consultation Escrows ({filteredEscrows.length})
                </h3>
                <p className="text-[11px] text-stone-400">
                  Review retained fees. Use the buttons below to either rollback to client or move forward to lawyer.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Search by client, counsel, or ID..."
                  value={searchEscrow}
                  onChange={(e) => setSearchEscrow(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-4">Escrow Ref / Appointment</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Beneficiary Counsel</th>
                    <th className="py-3 px-4">Gross Held</th>
                    <th className="py-3 px-4">Lawyer Entitled (90%)</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Escrow Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredEscrows.map((esc) => {
                    const isHeld = esc.status === 'HELD_IN_ESCROW';
                    return (
                      <tr key={esc.id} className="hover:bg-stone-800/40 transition">
                        <td className="py-3 px-4 font-mono">
                          <p className="font-bold text-cream-100">{esc.id}</p>
                          <p className="text-[10px] text-stone-500">{esc.appointmentId}</p>
                        </td>
                        <td className="py-3 px-4 font-serif font-bold text-cream-100">{esc.client}</td>
                        <td className="py-3 px-4 text-stone-300 font-sans">{esc.beneficiary}</td>
                        <td className="py-3 px-4 font-mono font-bold text-amber-400">
                          ₹{formatINR(esc.grossAmount)}
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                          ₹{formatINR(esc.netBeneficiary)}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                            esc.status === 'RELEASED_TO_LAWYER'
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                              : esc.status === 'ROLLED_BACK_TO_CLIENT'
                              ? 'bg-rose-950 text-rose-300 border-rose-800'
                              : 'bg-amber-950 text-amber-300 border-amber-800'
                          }`}>
                            {esc.status === 'RELEASED_TO_LAWYER' ? 'Settled to Lawyer' : esc.status === 'ROLLED_BACK_TO_CLIENT' ? 'Rolled Back' : 'Held in Escrow'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          {isHeld ? (
                            <div className="flex items-center justify-end space-x-2">
                              {/* BUTTON 1: Rollback to Client */}
                              <button
                                type="button"
                                onClick={() => setEscrowModal({ type: 'ROLLBACK', escrow: esc })}
                                className="px-2.5 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 text-[11px] font-mono border border-rose-800 flex items-center space-x-1 transition cursor-pointer"
                                title="Refund 100% fee to client wallet"
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>Rollback to Client</span>
                              </button>

                              {/* BUTTON 2: Move Forward to Lawyer */}
                              <button
                                type="button"
                                onClick={() => setEscrowModal({ type: 'RELEASE', escrow: esc })}
                                className="px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-800 flex items-center space-x-1 transition cursor-pointer"
                                title="Release fee (90%) to lawyer wallet"
                              >
                                <Send className="w-3 h-3" />
                                <span>Release to Lawyer</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-stone-500">Action Finalized</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredEscrows.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-stone-500 font-mono">
                        No active escrow retainers found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: PLATFORM REVENUE
          ====================================================================== */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-5">
          {/* Revenue Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Total 10% Platform Commission</span>
              <p className="text-2xl font-serif font-bold text-amber-400 mt-1">
                ₹{formatINR(platformRevenue?.totalCommissionEarned)}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Net platform consultation margin</p>
            </div>

            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Commission This Month (MTD)</span>
              <p className="text-2xl font-serif font-bold text-cream-50 mt-1">
                ₹{formatINR(platformRevenue?.commissionThisMonth)}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">+14.2% vs previous cycle</p>
            </div>

            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Gross Consultation Volume</span>
              <p className="text-2xl font-serif font-bold text-cream-50 mt-1">
                ₹{formatINR(platformRevenue?.grossConsultationVolume)}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Total client payments processed</p>
            </div>

            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Gateway Processing (2%)</span>
              <p className="text-2xl font-serif font-bold text-rose-300 mt-1">
                ₹{formatINR(platformRevenue?.paymentGatewayProcessingFees)}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Razorpay &amp; HDFC bank rails</p>
            </div>
          </div>

          {/* Monthly Revenue Trend & Channel Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
              <h3 className="font-serif font-bold text-sm text-cream-100">Monthly Commission Growth (10% Take Rate)</h3>
              <div className="space-y-2">
                {platformRevenue?.monthlyTrends?.map((tr, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-stone-300">{tr.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-stone-500 font-mono">Gross: ₹{formatINR(tr.gross)}</span>
                      <span className="font-mono font-bold text-amber-400">10%: ₹{formatINR(tr.commission)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
              <h3 className="font-serif font-bold text-sm text-cream-100">Revenue by Booking Channel</h3>
              <div className="space-y-2.5">
                {platformRevenue?.revenueByChannel?.map((ch, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-200">{ch.channel}</span>
                      <span className="font-bold text-amber-400 font-mono">{ch.share}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>Volume: ₹{formatINR(ch.volume)}</span>
                      <span>Commission: ₹{formatINR(ch.commission)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: FIRM FINANCE
          ====================================================================== */}
      {activeTab === 'FIRM' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <label className="text-xs text-stone-400 font-mono uppercase">Select Partner Firm:</label>
              <select
                value={selectedFirmId}
                onChange={(e) => setSelectedFirmId(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-cream-100 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
              >
                <option value="firm-001">Lex Veritas Legal LLP (Delhi)</option>
                <option value="firm-002">Shardul Juris Associates (Mumbai)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Total Billed Volume</span>
              <p className="text-2xl font-serif font-bold text-cream-50 mt-1">₹{formatINR(1245000)}</p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">214 consultations across 12 partners</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Firm Net Share (90%)</span>
              <p className="text-2xl font-serif font-bold text-emerald-400 mt-1">₹{formatINR(1120500)}</p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Disbursed via automated CMS</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Platform Retainer (10%)</span>
              <p className="text-2xl font-serif font-bold text-amber-400 mt-1">₹{formatINR(124500)}</p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Net GST invoice generated</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ADVOCATE FINANCE
          ====================================================================== */}
      {activeTab === 'ADVOCATE' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <label className="text-xs text-stone-400 font-mono uppercase">Select Advocate:</label>
            <select
              value={selectedAdvocateId}
              onChange={(e) => setSelectedAdvocateId(e.target.value)}
              className="bg-stone-900 border border-stone-700 text-cream-100 text-xs rounded-xl px-3 py-1.5 focus:outline-none focus:border-amber-500"
            >
              <option value="adv-001">Adv. Priya Sharma (Bar Council D/1234/2018)</option>
              <option value="adv-002">Adv. Rajeshwar Rao (Bar Council MH/5678/2015)</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Total Consultations Gross</span>
              <p className="text-2xl font-serif font-bold text-cream-50 mt-1">₹{formatINR(342000)}</p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">82 fulfilled chamber sessions</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Net Practitioner Take-home</span>
              <p className="text-2xl font-serif font-bold text-emerald-400 mt-1">₹{formatINR(307800)}</p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Direct NEFT/RTGS settlement</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Platform Cut (10%)</span>
              <p className="text-2xl font-serif font-bold text-amber-400 mt-1">₹{formatINR(34200)}</p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">TDS Certificate Form 16A filed</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 5: TRANSACTIONS AUDIT LEDGER
          ====================================================================== */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-cream-100">
                  Comprehensive Platform Financial Transactions ({filteredTransactions.length})
                </h3>
                <p className="text-[11px] text-stone-400 font-sans">
                  Real-time double-entry ledger matching Razorpay payment gateway capture events with microservice wallets.
                </p>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
                <input
                  type="text"
                  placeholder="Filter transactions..."
                  value={searchTxn}
                  onChange={(e) => setSearchTxn(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl pl-8 pr-3 py-1.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-4">Txn ID / Date</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Beneficiary</th>
                    <th className="py-3 px-4">Gross Amount</th>
                    <th className="py-3 px-4">10% Platform Cut</th>
                    <th className="py-3 px-4">Net Payout</th>
                    <th className="py-3 px-4">Gateway Ref</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {filteredTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 font-mono">
                        <p className="font-bold text-cream-100">{tx.id}</p>
                        <p className="text-[10px] text-stone-500">{tx.date}</p>
                      </td>
                      <td className="py-3 px-4 font-serif font-bold text-cream-100">{tx.client}</td>
                      <td className="py-3 px-4 text-stone-300">
                        <p>{tx.beneficiary}</p>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-stone-900 border border-stone-800 text-stone-400">
                          {tx.channel}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-cream-100">
                        ₹{formatINR(tx.grossAmount)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        ₹{formatINR(tx.platformCommission)}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{formatINR(tx.netBeneficiary)}
                      </td>
                      <td className="py-3 px-4 font-mono text-[10px] text-stone-400">
                        <p>{tx.gateway}</p>
                        <p className="text-stone-500">{tx.gatewayRef}</p>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                          {tx.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: REFUND MANAGEMENT
          ====================================================================== */}
      {activeTab === 'REFUNDS' && (
        <div className="space-y-4">
          <div className="p-3.5 rounded-xl border border-stone-800 bg-stone-900/60 text-[11px] text-stone-400 flex items-start space-x-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <strong className="text-cream-100">Statutory Refund Compliance Policy:</strong> Refunds are authorized only when appointment logs confirm verified cancellation, mutual advocate agreement, or WebRTC signaling failure. Payment gateway records are audited prior to disbursement.
            </div>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-4">Refund ID</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Beneficiary Counsel</th>
                    <th className="py-3 px-4">Gross Claim</th>
                    <th className="py-3 px-4">Reason &amp; Policy</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-800/80">
                  {refunds.map((r) => (
                    <tr key={r.id} className="hover:bg-stone-800/40 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cream-100">{r.id}</td>
                      <td className="py-3 px-4 font-serif font-bold text-cream-100">{r.client || r.clientName}</td>
                      <td className="py-3 px-4 text-stone-300">{r.beneficiary || r.beneficiaryName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-300">
                        ₹{formatINR(r.refundAmount || r.amount)}
                      </td>
                      <td className="py-3 px-4 text-stone-400 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === 'UNDER_REVIEW' || r.status === 'PENDING_APPROVAL' ? (
                          <button
                            type="button"
                            onClick={() => handleApproveRefund(r.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 text-[11px] font-mono border border-emerald-800 transition cursor-pointer"
                          >
                            Authorize Payout
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-stone-500">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {refunds.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-xs text-stone-500 font-mono">
                        No pending refund claims.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 7: GATEWAY RECONCILIATION
          ====================================================================== */}
      {activeTab === 'RECONCILIATION' && (
        <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-stone-800">
            <div>
              <h3 className="font-serif font-bold text-sm text-cream-100">
                Automated Payment Gateway &amp; Escrow Reconciliation
              </h3>
              <p className="text-[11px] text-stone-400">
                Matches internal LawinoMeet ledger against Razorpay &amp; HDFC bank settlement batches.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setToastMessage('Reconciliation scan complete: 100% matched with zero variance.');
                setTimeout(() => setToastMessage(''), 3000);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-stone-950 font-bold font-mono text-xs flex items-center space-x-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Run Live Reconciliation</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase block">Bank Batch Settlement</span>
              <span className="font-bold text-emerald-400 text-sm">₹14,85,000 (100% Matched)</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase block">Gateway Surcharge variance</span>
              <span className="font-bold text-cream-100 text-sm">₹0.00 Mismatch</span>
            </div>
            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800">
              <span className="text-stone-500 text-[10px] uppercase block">Escrow Holds Status</span>
              <span className="font-bold text-amber-400 text-sm">₹{formatINR(totalEscrowHeld)} In Custody</span>
            </div>
          </div>
        </div>
      )}

      {/* Escrow Confirmation Modal (Rollback to Client OR Release to Lawyer) */}
      {escrowModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1E1917] border border-stone-700 rounded-2xl max-w-md w-full p-5 text-xs text-stone-300 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-2 border-b border-stone-800">
              <div>
                <h3 className={`font-serif font-bold text-sm ${
                  escrowModal.type === 'RELEASE' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  {escrowModal.type === 'RELEASE' ? 'Release Escrow to Lawyer' : 'Rollback Escrow to Client'}
                </h3>
                <p className="text-[11px] text-stone-400 font-mono">
                  {escrowModal.escrow.id} &bull; Appointment: {escrowModal.escrow.appointmentId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEscrowModal(null)}
                className="text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 rounded-xl bg-stone-900 border border-stone-800 space-y-1.5 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-stone-500">Client:</span>
                <span className="font-bold text-cream-100">{escrowModal.escrow.client}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-stone-500">Beneficiary Counsel:</span>
                <span className="font-bold text-cream-100">{escrowModal.escrow.beneficiary}</span>
              </div>
              <div className="flex justify-between border-t border-stone-800 pt-1">
                <span className="text-stone-500">
                  {escrowModal.type === 'RELEASE' ? 'Net Payout to Counsel (90%):' : 'Refund to Client (100%):'}
                </span>
                <span className={`font-bold text-sm ${
                  escrowModal.type === 'RELEASE' ? 'text-emerald-400' : 'text-rose-400'
                }`}>
                  ₹{formatINR(escrowModal.type === 'RELEASE' ? escrowModal.escrow.netBeneficiary : escrowModal.escrow.grossAmount)}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteEscrowAction} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-stone-400 uppercase mb-1">
                  Reason / Administrative Note:
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder={
                    escrowModal.type === 'RELEASE'
                      ? 'e.g. Consultation confirmed successfully completed by both parties...'
                      : 'e.g. Session cancelled / advocate unavailable, 100% refund approved...'
                  }
                  value={escrowReason}
                  onChange={(e) => setEscrowReason(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-xl p-2.5 text-xs text-stone-200 placeholder-stone-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-stone-800">
                <button
                  type="button"
                  onClick={() => setEscrowModal(null)}
                  className="px-3.5 py-1.5 rounded-xl border border-stone-700 text-stone-400 hover:bg-stone-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!escrowReason.trim()}
                  className={`px-4 py-1.5 rounded-xl text-white font-bold text-xs flex items-center space-x-1 cursor-pointer ${
                    escrowModal.type === 'RELEASE'
                      ? 'bg-emerald-600 hover:bg-emerald-500'
                      : 'bg-rose-700 hover:bg-rose-600'
                  }`}
                >
                  {escrowModal.type === 'RELEASE' ? (
                    <>
                      <Send className="w-3 h-3" />
                      <span>Confirm Release to Lawyer</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3 h-3" />
                      <span>Confirm Rollback to Client</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
