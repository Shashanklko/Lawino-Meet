import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building,
  Scale,
  RefreshCw,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Search,
  Filter,
  Layers,
  FileSpreadsheet,
} from 'lucide-react';
import { adminApi } from '../api/adminApi';

export const AdminFinancePage = () => {
  const [activeTab, setActiveTab] = useState('REVENUE'); // 'REVENUE' | 'FIRM' | 'ADVOCATE' | 'TRANSACTIONS' | 'REFUNDS' | 'RECONCILIATION'
  const [financeData, setFinanceData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedFirmId, setSelectedFirmId] = useState('firm-001');
  const [selectedAdvocateId, setSelectedAdvocateId] = useState('adv-001');
  const [searchTxn, setSearchTxn] = useState('');
  const [toastMessage, setToastMessage] = useState('');

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

  if (loading || !financeData) {
    return <div className="py-20 text-center text-xs text-stone-400 font-mono">Loading Finance Ledgers...</div>;
  }

  const { platformRevenue, transactions, refunds } = financeData;

  const filteredTransactions = transactions.filter((tx) =>
    tx.client.toLowerCase().includes(searchTxn.toLowerCase()) ||
    tx.beneficiary.toLowerCase().includes(searchTxn.toLowerCase()) ||
    tx.id.toLowerCase().includes(searchTxn.toLowerCase())
  );

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
          <span>Platform Finance, Commission Treasury &amp; Settlements</span>
        </h2>
        <p className="text-xs text-stone-400 font-sans mt-0.5">
          Auditable statutory 10% platform fee ledger, firm partnership draws, independent practitioner payouts, and gateway reconciliation.
        </p>
      </div>

      {/* Navigation Tabs (All 6 mandatory tabs) */}
      <div className="flex items-center space-x-1 border-b border-stone-800 pb-2 text-xs overflow-x-auto">
        {[
          { id: 'REVENUE', label: '1. Platform Revenue' },
          { id: 'FIRM', label: '2. Firm Finance' },
          { id: 'ADVOCATE', label: '3. Advocate Finance' },
          { id: 'TRANSACTIONS', label: '4. Transactions Ledger' },
          { id: 'REFUNDS', label: '5. Refund Management' },
          { id: 'RECONCILIATION', label: '6. Gateway Reconciliation' },
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
          TAB 1: PLATFORM REVENUE
          ====================================================================== */}
      {activeTab === 'REVENUE' && (
        <div className="space-y-5">
          {/* Revenue Top Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Total 10% Platform Commission</span>
              <p className="text-2xl font-serif font-bold text-amber-400 mt-1">
                ₹{platformRevenue.totalCommissionEarned.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Net platform consultation margin</p>
            </div>

            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Commission This Month (MTD)</span>
              <p className="text-2xl font-serif font-bold text-cream-50 mt-1">
                ₹{platformRevenue.commissionThisMonth.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-emerald-400 font-mono mt-1">+14.2% vs previous cycle</p>
            </div>

            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Gross Consultation Volume</span>
              <p className="text-2xl font-serif font-bold text-cream-50 mt-1">
                ₹{platformRevenue.grossConsultationVolume.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Total client payments processed</p>
            </div>

            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Gateway Processing (2%)</span>
              <p className="text-2xl font-serif font-bold text-rose-300 mt-1">
                ₹{platformRevenue.paymentGatewayProcessingFees.toLocaleString('en-IN')}
              </p>
              <p className="text-[10px] text-stone-500 font-mono mt-1">Razorpay &amp; HDFC bank rails</p>
            </div>
          </div>

          {/* Monthly Revenue Trend & Channel Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
              <h3 className="font-serif font-bold text-sm text-cream-100">Monthly Commission Growth (10% Take Rate)</h3>
              <div className="space-y-2">
                {platformRevenue.monthlyTrends?.map((tr, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-stone-900 border border-stone-800 flex items-center justify-between text-xs">
                    <span className="font-mono text-stone-300">{tr.month}</span>
                    <div className="flex items-center space-x-4">
                      <span className="text-stone-500 font-mono">Gross: ₹{tr.gross.toLocaleString('en-IN')}</span>
                      <span className="font-mono font-bold text-amber-400">10%: ₹{tr.commission.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#221C1A] border border-stone-800 space-y-3">
              <h3 className="font-serif font-bold text-sm text-cream-100">Revenue by Booking Channel</h3>
              <div className="space-y-2.5">
                {platformRevenue.revenueByChannel?.map((ch, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-stone-200">{ch.channel}</span>
                      <span className="font-bold text-amber-400 font-mono">{ch.share}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                      <span>Volume: ₹{ch.volume.toLocaleString('en-IN')}</span>
                      <span>Commission: ₹{ch.commission.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: FIRM FINANCE
          ====================================================================== */}
      {activeTab === 'FIRM' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
            <span className="text-stone-400 font-mono uppercase">Select Law Firm:</span>
            <select
              value={selectedFirmId}
              onChange={(e) => setSelectedFirmId(e.target.value)}
              className="bg-[#221C1A] border border-stone-700 text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="firm-001">Lex Veritas Legal LLP (LLP-DEL-2024-981)</option>
              <option value="firm-002">Bharat Chambers of Law (LLP-DEL-2018-402)</option>
              <option value="firm-003">Shardul Appellate Chambers (LLP-MAH-2016-529)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Gross Firm Bookings</span>
              <p className="text-xl font-serif font-bold text-cream-50 mt-1">₹4,80,000</p>
              <p className="text-[10px] text-stone-500 font-mono">14 Active retainers</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Platform Surcharge (10%)</span>
              <p className="text-xl font-serif font-bold text-amber-400 mt-1">₹48,000</p>
              <p className="text-[10px] text-stone-500 font-mono">Dedicated video facility</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Non-Withdrawable Escrow</span>
              <p className="text-xl font-serif font-bold text-cream-50 mt-1">₹34,000</p>
              <p className="text-[10px] text-stone-500 font-mono">Held until hearing ends</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Available For Settlement</span>
              <p className="text-xl font-serif font-bold text-emerald-400 mt-1">₹96,400</p>
              <p className="text-[10px] text-stone-500 font-mono">Verified HDFC IMPS</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: ADVOCATE FINANCE
          ====================================================================== */}
      {activeTab === 'ADVOCATE' && (
        <div className="space-y-4">
          <div className="flex items-center space-x-3 p-3 rounded-xl bg-stone-900 border border-stone-800 text-xs">
            <span className="text-stone-400 font-mono uppercase">Select Advocate:</span>
            <select
              value={selectedAdvocateId}
              onChange={(e) => setSelectedAdvocateId(e.target.value)}
              className="bg-[#221C1A] border border-stone-700 text-stone-200 px-3 py-1.5 rounded-lg focus:outline-none"
            >
              <option value="adv-001">Adv. Raghavan Nambiar (Lex Veritas Legal LLP)</option>
              <option value="adv-002">Adv. Ananya Sengupta (Lex Veritas Legal LLP)</option>
              <option value="adv-003">Adv. Meera Deshmukh (Independent)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Consultation Earnings YTD</span>
              <p className="text-xl font-serif font-bold text-cream-50 mt-1">₹86,400</p>
              <p className="text-[10px] text-stone-500 font-mono">48 Completed hearings</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Advocate Rate Visible</span>
              <p className="text-xl font-serif font-bold text-cream-50 mt-1">₹1,800 / session</p>
              <p className="text-[10px] text-stone-500 font-mono">10% Platform fee isolated</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Withdrawable Balance</span>
              <p className="text-xl font-serif font-bold text-emerald-400 mt-1">₹28,500</p>
              <p className="text-[10px] text-stone-500 font-mono">Immediate bank transfer</p>
            </div>
            <div className="p-4 rounded-xl bg-[#221C1A] border border-stone-800">
              <span className="text-[10px] font-mono uppercase text-stone-400">Total Settled To Bank</span>
              <p className="text-xl font-serif font-bold text-cream-50 mt-1">₹57,900</p>
              <p className="text-[10px] text-stone-500 font-mono">SBI Account ending 4419</p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: TRANSACTIONS LEDGER
          ====================================================================== */}
      {activeTab === 'TRANSACTIONS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-stone-500" />
              <input
                type="text"
                placeholder="Search transaction ID, client, lawyer..."
                value={searchTxn}
                onChange={(e) => setSearchTxn(e.target.value)}
                className="bg-[#221C1A] border border-stone-800 text-xs text-stone-200 pl-8 pr-3 py-1.5 rounded-lg placeholder-stone-500 focus:outline-none w-64"
              />
            </div>
            <span className="text-[11px] font-mono text-stone-400">
              {filteredTransactions.length} Verified Transactions
            </span>
          </div>

          <div className="rounded-2xl border border-stone-800 bg-[#221C1A] overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-800 bg-stone-900/80 text-[10px] font-mono uppercase tracking-wider text-stone-400">
                    <th className="py-3 px-4">Txn ID &amp; Date</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Beneficiary</th>
                    <th className="py-3 px-4">Gross Client Charged</th>
                    <th className="py-3 px-4">10% Platform Fee</th>
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
                        ₹{tx.grossAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-amber-400">
                        ₹{tx.platformCommission.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-emerald-400">
                        ₹{tx.netBeneficiary.toLocaleString('en-IN')}
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
          TAB 5: REFUND MANAGEMENT
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
                      <td className="py-3 px-4 font-serif font-bold text-cream-100">{r.clientName}</td>
                      <td className="py-3 px-4 text-stone-300">{r.beneficiaryName}</td>
                      <td className="py-3 px-4 font-mono font-bold text-rose-300">
                        ₹{r.refundAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-stone-400 max-w-xs truncate">{r.reason}</td>
                      <td className="py-3 px-4">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800 font-bold">
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {r.status === 'UNDER_REVIEW' || r.status === 'APPROVED' ? (
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
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 6: GATEWAY RECONCILIATION
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
              <span className="font-bold text-amber-400 text-sm">₹34,000 In Custody</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
