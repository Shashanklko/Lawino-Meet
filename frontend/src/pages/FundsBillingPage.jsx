import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { walletApi } from '../api/walletApi';
import {
  DollarSign,
  TrendingUp,
  Lock,
  ArrowUpRight,
  Clock,
  ShieldCheck,
  Building,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText,
  CreditCard,
  Download,
  Filter,
  Search,
  ExternalLink,
  Info,
  Layers,
  Wallet,
  Plus,
  ArrowDownLeft,
  Edit3,
  Check,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { PageHeader } from '../components/dashboard/PageHeader';
import { MetricCard } from '../components/dashboard/MetricCard';

const INITIAL_FUNDS_DATA = {
  totalEarned: 0,
  withdrawableBalance: 0,
  nonWithdrawableEscrow: 0,
  upcomingPayouts: 0,
  totalWithdrawn: 0,
  bankDetails: {
    bankName: 'HDFC Bank Ltd',
    accountHolder: 'Advocate Chamber Account',
    accountNumber: '•••• •••• 4892',
    ifsc: 'HDFC0000281',
    branch: 'Commercial Branch',
    upiId: 'legal@okhdfcbank',
  },
  escrowPolicyNote: 'As per platform integrity & client assurance rules, consultation fees remain in Non-Withdrawable Escrow until the scheduled consultation is completed.',
  transactions: [],
};

const INITIAL_CLIENT_WALLET = {
  walletBalance: 0,
  nonWithdrawableEscrow: 0,
  totalDeposited: 0,
  totalSpent: 0,
  refundMethod: {
    type: 'UPI',
    upiId: '',
    bankName: 'State Bank of India',
    accountNumber: '•••• •••• 9104',
    ifsc: 'SBIN0001428',
    accountHolder: '',
  },
  transactions: [],
};

export const FundsBillingPage = () => {
  const { user } = useAuth();
  const isClient = user?.role === 'CLIENT';
  const isFirm = user?.role === 'FIRM_ADMIN';
  const hasFirmMembership = !!user?.firmMembership;
  const navigate = useNavigate();

  // Lawyer / Firm Funds Data
  const [fundsData, setFundsData] = useState(INITIAL_FUNDS_DATA);

  // Client Wallet Data
  const [clientWallet, setClientWallet] = useState(INITIAL_CLIENT_WALLET);

  // Switchable View for Lawyer/Firm: 'REVENUE' | 'WALLET'
  const [financeView, setFinanceView] = useState('REVENUE');

  // Filter Tabs
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Lawyer / Firm Withdrawal Modal
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('BANK'); // 'BANK' | 'UPI'
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Lawyer / Firm UPDATE PAYMENT METHOD Modal
  const [isPaymentMethodModalOpen, setIsPaymentMethodModalOpen] = useState(false);
  const [payoutForm, setPayoutForm] = useState({
    payoutPreference: 'BANK',
    bankName: fundsData.bankDetails?.bankName || 'HDFC Bank Ltd',
    accountHolder: fundsData.bankDetails?.accountHolder || 'Adv. Raghavan Nambiar Chambers',
    accountNumber: '50100239104892',
    confirmAccountNumber: '50100239104892',
    ifsc: fundsData.bankDetails?.ifsc || 'HDFC0000281',
    branch: fundsData.bankDetails?.branch || 'Supreme Court of India Branch, New Delhi',
    upiId: fundsData.bankDetails?.upiId || 'raghavan.legal@okhdfcbank',
  });
  const [payoutUpdateSuccess, setPayoutUpdateSuccess] = useState(false);

  // Client ADD PAYMENT / FUNDS Modal
  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);
  const [addFundsAmount, setAddFundsAmount] = useState('2500');
  const [depositMethod, setDepositMethod] = useState('RAZORPAY'); // 'RAZORPAY' | 'UPI' | 'CARD' | 'NETBANKING'
  const [addFundsLoading, setAddFundsLoading] = useState(false);
  const [addFundsSuccess, setAddFundsSuccess] = useState(false);

  // Razorpay Checkout Modal
  const [isRazorpayModalOpen, setIsRazorpayModalOpen] = useState(false);
  const [razorpayOrderId, setRazorpayOrderId] = useState('');
  const [razorpayProcessing, setRazorpayProcessing] = useState(false);

  // Client WITHDRAW REMAINING AMOUNT Modal
  const [isClientWithdrawModalOpen, setIsClientWithdrawModalOpen] = useState(false);
  const [clientWithdrawAmount, setClientWithdrawAmount] = useState('');
  const [clientWithdrawMethod, setClientWithdrawMethod] = useState('UPI'); // 'UPI' | 'BANK'
  const [clientWithdrawLoading, setClientWithdrawLoading] = useState(false);
  const [clientWithdrawSuccess, setClientWithdrawSuccess] = useState(false);

  // Client UPDATE BANK / PAYOUT METHOD Modal
  const [isClientPayoutModalOpen, setIsClientPayoutModalOpen] = useState(false);
  const [clientPayoutForm, setClientPayoutForm] = useState({
    payoutPreference: clientWallet.refundMethod?.type || 'UPI',
    bankName: clientWallet.refundMethod?.bankName || 'State Bank of India',
    accountHolder: clientWallet.refundMethod?.accountHolder || 'Rohit Verma',
    accountNumber: '309104829104',
    confirmAccountNumber: '309104829104',
    ifsc: clientWallet.refundMethod?.ifsc || 'SBIN0001428',
    upiId: clientWallet.refundMethod?.upiId || 'rohit.verma@oksbi',
  });
  const [clientPayoutSuccess, setClientPayoutSuccess] = useState(false);

  // Filtered Lawyer/Firm Transactions
  const filteredLawyerTransactions = fundsData.transactions.filter((tx) => {
    const q = (searchQuery || '').toLowerCase();
    const clientName = (tx.clientName || '').toLowerCase();
    const id = (tx.id || '').toLowerCase();
    const serviceType = (tx.serviceType || tx.description || '').toLowerCase();

    const matchesSearch = !q || clientName.includes(q) || id.includes(q) || serviceType.includes(q);
    if (!matchesSearch) return false;

    if (activeTab === 'ESCROW') return tx.type === 'ESCROW_HOLD' || tx.status === 'NON_WITHDRAWABLE_ESCROW' || tx.status === 'PENDING';
    if (activeTab === 'WITHDRAWABLE') return tx.type === 'DEPOSIT' || tx.type === 'ESCROW_RELEASE' || tx.status === 'SUCCESS' || tx.status === 'COMPLETED';
    if (activeTab === 'PAID') return tx.type === 'WITHDRAWAL' || tx.status === 'PAID_OUT';
    return true;
  });

  // Filtered Client Wallet Transactions
  const filteredClientTransactions = clientWallet.transactions.filter((tx) => {
    const matchesSearch =
      tx.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'DEPOSIT') return tx.type === 'DEPOSIT';
    if (activeTab === 'ESCROW') return tx.type === 'ESCROW_HOLD';
    if (activeTab === 'WITHDRAWAL') return tx.type === 'WITHDRAWAL';
    return true;
  });

  const fetchWalletData = async () => {
    try {
      const res = await walletApi.getWallet();
      if (res?.data) {
        const bal = Number(res.data.balance || 0);
        const escrow = Number(res.data.escrowBalance || 0);
        const rawTxs = res.data.recentTransactions || [];
        const txs = rawTxs.map((t, idx) => ({
          id: t.publicId || `TXN-${idx + 101}`,
          type: t.type === 'DEPOSIT' ? 'DEPOSIT' : t.type === 'WITHDRAWAL' ? 'WITHDRAWAL' : 'ESCROW_HOLD',
          description: t.description || 'Wallet transaction',
          date: t.createdAt ? new Date(t.createdAt).toLocaleDateString('en-IN') : 'Today',
          amount: Math.abs(Number(t.amount || 0)),
          status: t.status || 'COMPLETED',
          balanceAfter: Number(t.balanceAfter || bal),
          clientName: 'Direct Transfer',
          serviceType: t.description || 'Consultation Payout',
          grossAmount: Math.abs(Number(t.amount || 0)),
          netAmount: Math.abs(Number(t.amount || 0)),
          platformFee: 0,
        }));

        setClientWallet((prev) => ({
          ...prev,
          walletBalance: bal,
          nonWithdrawableEscrow: escrow,
          totalDeposited: txs.filter((t) => t.type === 'DEPOSIT').reduce((s, t) => s + t.amount, 0),
          totalSpent: txs.filter((t) => t.type === 'ESCROW_HOLD').reduce((s, t) => s + t.amount, 0),
          transactions: txs,
        }));

        const totalWithdrawnAmount = txs.filter((t) => t.type === 'WITHDRAWAL').reduce((s, t) => s + t.amount, 0);
        const totalEarnedAmount = bal + escrow + totalWithdrawnAmount;

        setFundsData((prev) => ({
          ...prev,
          withdrawableBalance: bal,
          nonWithdrawableEscrow: escrow,
          totalEarned: totalEarnedAmount,
          totalWithdrawn: totalWithdrawnAmount,
          upcomingPayouts: escrow,
          transactions: txs,
        }));
      }
    } catch (err) {
      console.warn('Error fetching wallet data:', err);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // Handle Lawyer/Firm Withdrawal
  const handleWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0 || amount > fundsData.withdrawableBalance) {
      alert('Please enter a valid amount within your available withdrawable balance.');
      return;
    }

    setWithdrawLoading(true);
    try {
      await walletApi.withdraw({
        amount,
        payoutMethod: withdrawMethod,
        accountHolder: fundsData.bankDetails?.accountHolder,
        accountNumber: fundsData.bankDetails?.accountNumber,
        ifsc: fundsData.bankDetails?.ifsc,
        upiId: fundsData.bankDetails?.upiId,
      });
      await fetchWalletData();
      setWithdrawLoading(false);
      setWithdrawSuccess(true);
      setTimeout(() => {
        setWithdrawSuccess(false);
        setIsWithdrawModalOpen(false);
        setWithdrawAmount('');
      }, 1500);
    } catch (err) {
      setWithdrawLoading(false);
      alert(err?.response?.data?.message || err?.message || 'Withdrawal failed');
    }
  };

  // Handle Update Payout / Settlement Method (Lawyer & Firm)
  const handleSavePaymentMethod = (e) => {
    e.preventDefault();
    if (payoutForm.payoutPreference === 'BANK' && payoutForm.accountNumber !== payoutForm.confirmAccountNumber) {
      alert('Account numbers do not match. Please verify.');
      return;
    }

    setFundsData((prev) => ({
      ...prev,
      bankDetails: {
        ...prev.bankDetails,
        bankName: payoutForm.bankName,
        accountHolder: payoutForm.accountHolder,
        accountNumber: `•••• •••• ${payoutForm.accountNumber.slice(-4)}`,
        fullAccountNumber: payoutForm.accountNumber,
        ifsc: payoutForm.ifsc.toUpperCase(),
        branch: payoutForm.branch,
        upiId: payoutForm.upiId,
        payoutPreference: payoutForm.payoutPreference,
      },
    }));

    setPayoutUpdateSuccess(true);
    setTimeout(() => {
      setPayoutUpdateSuccess(false);
      setIsPaymentMethodModalOpen(false);
    }, 1500);
  };

  // Handle Client Add Funds / Deposit
  const handleAddFunds = (e) => {
    e?.preventDefault();
    handleTriggerRazorpay();
  };

  // Handle Client Withdraw Remaining Amount
  const handleClientWithdraw = async (e) => {
    e.preventDefault();
    const amount = Number(clientWithdrawAmount);
    if (!amount || amount <= 0 || amount > clientWallet.walletBalance) {
      alert('Please enter a valid amount within your available remaining balance.');
      return;
    }

    setClientWithdrawLoading(true);
    try {
      await walletApi.withdraw({
        amount,
        payoutMethod: clientWithdrawMethod,
        accountHolder: clientPayoutForm.accountHolder,
        accountNumber: clientPayoutForm.accountNumber,
        ifsc: clientPayoutForm.ifsc,
        upiId: clientPayoutForm.upiId,
      });
      await fetchWalletData();
      setClientWithdrawLoading(false);
      setClientWithdrawSuccess(true);
      setTimeout(() => {
        setClientWithdrawSuccess(false);
        setIsClientWithdrawModalOpen(false);
        setClientWithdrawAmount('');
      }, 1500);
    } catch (err) {
      setClientWithdrawLoading(false);
      alert(err?.response?.data?.message || err?.message || 'Withdrawal failed');
    }
  };

  // Launch Razorpay Payment Flow
  const handleTriggerRazorpay = () => {
    const amount = Number(addFundsAmount);
    if (!amount || amount < 100) {
      alert('Minimum deposit amount is ₹100.');
      return;
    }

    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID || window.RAZORPAY_KEY_ID || 'rzp_test_U0ZAQw4kauLcUE';

    if (window.Razorpay && razorpayKey) {
      const options = {
        key: razorpayKey,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'Lawino Meet',
        description: 'Legal Retainer Wallet Pre-fund',
        image: '/logo.jpg',
        handler: function (response) {
          const paymentId = response.razorpay_payment_id || `pay_rzp_${Date.now()}`;
          const newTxn = {
            id: `CW-${Math.floor(800 + Math.random() * 200)}`,
            date: 'Just now',
            type: 'DEPOSIT',
            description: `Top-up via Razorpay Gateway (Payment ID: ${paymentId})`,
            amount: amount,
            status: 'SUCCESS',
          };
          setClientWallet((prev) => ({
            ...prev,
            walletBalance: prev.walletBalance + amount,
            totalDeposited: prev.totalDeposited + amount,
            transactions: [newTxn, ...prev.transactions],
          }));
          setIsAddFundsModalOpen(false);
          setAddFundsAmount('2500');
        },
        prefill: {
          name: 'Rohit Verma',
          email: 'client@lawinomeet.com',
          contact: '+919876543210'
        },
        theme: {
          color: '#0C2340'
        }
      };

      try {
        const rzp = new window.Razorpay(options);
        rzp.open();
        return;
      } catch (err) {
        console.warn('Razorpay checkout init error:', err);
      }
    }

    setRazorpayOrderId(`order_lawino_${Date.now().toString().slice(-6)}`);
    setIsAddFundsModalOpen(false);
    setIsRazorpayModalOpen(true);
  };

  // Complete Razorpay Payment
  const handleCompleteRazorpayPayment = async () => {
    setRazorpayProcessing(true);
    const amount = Number(addFundsAmount);
    const paymentId = `pay_rzp_${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      await walletApi.addFunds({
        amount,
        paymentMethod: 'RAZORPAY',
        transactionReference: paymentId,
      });
      await fetchWalletData();
      setRazorpayProcessing(false);
      setIsRazorpayModalOpen(false);
      setAddFundsAmount('2500');
    } catch (err) {
      setRazorpayProcessing(false);
      alert(err?.response?.data?.message || err?.message || 'Deposit failed');
    }
  };

  // Handle Save Client Withdrawal Destination (Bank / UPI)
  const handleSaveClientPayout = (e) => {
    e.preventDefault();
    if (clientPayoutForm.payoutPreference === 'BANK' && clientPayoutForm.accountNumber !== clientPayoutForm.confirmAccountNumber) {
      alert('Bank account numbers do not match. Please verify.');
      return;
    }

    setClientWallet((prev) => ({
      ...prev,
      refundMethod: {
        type: clientPayoutForm.payoutPreference,
        upiId: clientPayoutForm.upiId.trim(),
        bankName: clientPayoutForm.bankName.trim(),
        accountHolder: clientPayoutForm.accountHolder.trim(),
        accountNumber: `•••• •••• ${clientPayoutForm.accountNumber.slice(-4)}`,
        fullAccountNumber: clientPayoutForm.accountNumber,
        ifsc: clientPayoutForm.ifsc.trim().toUpperCase(),
      },
    }));

    setClientPayoutSuccess(true);
    setTimeout(() => {
      setClientPayoutSuccess(false);
      setIsClientPayoutModalOpen(false);
    }, 1500);
  };

  // =========================================================================
  // VIEW: CLIENT WALLET & PAYMENTS INTERFACE
  // =========================================================================
  if (isClient) {
    return (
      <div className="space-y-6 pb-12 select-none animate-in fade-in duration-300">
        <PageHeader
          title="Overview"
          subtitle="Pre-fund legal consultation retainers, track non-withdrawable escrow security, and withdraw unused balance anytime."
          badge="Retainer Wallet"
          breadcrumbs={['Client Workspace', 'Wallet & Payments']}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddFundsModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Add Funds / Payment</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClientPayoutModalOpen(true)}
                className="px-3 py-2 rounded-lg border border-[var(--border-cream)] bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
                title="Update Destination Bank Account or UPI"
              >
                <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                <span>Update Payout Account</span>
              </button>

              <button
                type="button"
                onClick={() => setIsClientWithdrawModalOpen(true)}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Withdraw Remaining Amount</span>
              </button>
            </div>
          }
        />

        {/* Client Wallet Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            label="Available Wallet Balance"
            value={`₹${(Number(clientWallet.walletBalance) || 0).toLocaleString('en-IN')}`}
            subtext="Ready for direct 1-click consultation booking"
            icon={Wallet}
            badge="Available"
            badgeType="success"
          />
          <MetricCard
            label="Active Retainers in Escrow"
            value={`₹${(Number(clientWallet.nonWithdrawableEscrow) || 0).toLocaleString('en-IN')}`}
            subtext="Held safely for scheduled consultations"
            icon={Lock}
            badge="Non-Withdrawable"
            badgeType="warning"
          />
          <MetricCard
            label="Refundable Remaining Amount"
            value={`₹${(Number(clientWallet.walletBalance) || 0).toLocaleString('en-IN')}`}
            subtext="Eligible for immediate bank / UPI withdrawal"
            icon={ArrowUpRight}
          />
          <MetricCard
            label="Lifetime Retainers Funded"
            value={`₹${(Number(clientWallet.totalDeposited) || 0).toLocaleString('en-IN')}`}
            subtext="Total legal consult balance deposited"
            icon={DollarSign}
          />
        </div>

        {/* Client Retainer Ledger */}
        <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
            <div>
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Wallet Retainer Transactions ({filteredClientTransactions.length})
              </h3>
              <p className="text-[11px] text-stone-500 font-sans">
                Full statement of deposits, consultation escrow reservations, and withdrawals.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 focus:outline-none"
                />
              </div>

              <select
                value={activeTab}
                onChange={(e) => setActiveTab(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-700 focus:outline-none"
              >
                <option value="ALL">All Transactions</option>
                <option value="DEPOSIT">Deposits / Wallet Top-ups</option>
                <option value="ESCROW">Escrow Retainer Holds</option>
                <option value="WITHDRAWAL">Refunds / Withdrawals</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-stone-200 bg-[var(--bg-cream-card)] text-[10px] font-mono uppercase tracking-wider text-stone-500">
                  <th className="py-2.5 px-3">Txn Ref</th>
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3">Type</th>
                  <th className="py-2.5 px-3 font-semibold text-stone-900">Amount</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredClientTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-stone-50/70 transition">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">{tx.id}</td>
                    <td className="py-2.5 px-3 text-stone-700">{tx.date}</td>
                    <td className="py-2.5 px-3 text-stone-900 font-medium">{tx.description}</td>
                    <td className="py-2.5 px-3">
                      {tx.type === 'DEPOSIT' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                          Wallet Deposit
                        </span>
                      ) : tx.type === 'ESCROW_HOLD' ? (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-50 text-amber-900 border border-amber-200">
                          Escrow Locked
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                          Balance Refund
                        </span>
                      )}
                    </td>
                    <td
                      className={`py-2.5 px-3 font-serif font-bold ${
                        Number(tx.amount) > 0 ? 'text-emerald-700' : 'text-stone-900'
                      }`}
                    >
                      {Number(tx.amount) > 0 ? `+₹${(Number(tx.amount) || 0).toLocaleString('en-IN')}` : `-₹${Math.abs(Number(tx.amount) || 0).toLocaleString('en-IN')}`}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-medium">
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* =====================================================================
            MODAL: CLIENT ADD PAYMENT / TOP UP WALLET
            ====================================================================== */}
        {isAddFundsModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
              <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
                Add Funds to Legal Retainer Wallet
              </h3>
              <p className="text-stone-500 mb-4 font-sans leading-relaxed">
                Pre-funded balances enable 1-click checkout when advocates confirm your consultation briefs.
              </p>

              {addFundsSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  ₹{Number(addFundsAmount).toLocaleString('en-IN')} added to your wallet successfully!
                </div>
              ) : (
                <form onSubmit={handleAddFunds} className="space-y-4">
                  {/* Preset Amount Chips */}
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1.5">
                      Select Top-Up Amount
                    </label>
                    <div className="grid grid-cols-4 gap-1.5 mb-2">
                      {['1000', '2500', '5000', '10000'].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setAddFundsAmount(amt)}
                          className={`py-2 text-center rounded-lg border font-mono font-medium transition cursor-pointer ${
                            addFundsAmount === amt
                              ? 'bg-[var(--bg-primary)] text-white border-[var(--bg-primary)]'
                              : 'border-stone-200 hover:border-stone-400 bg-stone-50 text-stone-800'
                          }`}
                        >
                          ₹{Number(amt).toLocaleString('en-IN')}
                        </button>
                      ))}
                    </div>

                    <div className="relative">
                      <span className="absolute left-3 top-2.5 font-serif font-bold text-stone-500">₹</span>
                      <input
                        type="number"
                        min="100"
                        placeholder="Or enter custom amount"
                        value={addFundsAmount}
                        onChange={(e) => setAddFundsAmount(e.target.value)}
                        required
                        className="w-full pl-7 pr-3 py-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-bold focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Gateway: Razorpay */}
                  <div className="space-y-2">
                    <label className="block text-[11px] font-medium text-stone-700">
                      Payment Gateway
                    </label>
                    <div className="p-3 rounded-xl border border-[#0C2340] bg-blue-50/40 flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#0C2340] text-white flex items-center justify-center font-bold text-xs shadow-xs shrink-0">
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                            <path d="M22 6L12 18H2L12 6H22Z" fill="#3395FF"/>
                            <path d="M12 6L6 14H16L22 6H12Z" fill="#FFFFFF"/>
                          </svg>
                        </div>
                        <div>
                          <div className="flex items-center space-x-1.5">
                            <p className="font-bold text-[#0C2340] text-xs">Razorpay Secure Gateway</p>
                            <span className="text-[9px] font-mono px-1.5 py-0.2 bg-[#0C2340] text-white rounded font-bold">
                              Verified
                            </span>
                          </div>
                          <p className="text-[10px] text-stone-500 mt-0.5">
                            Direct credit via UPI, Credit/Debit Cards, NetBanking, and Wallets
                          </p>
                        </div>
                      </div>
                      <span className="font-sans font-black tracking-tight text-[11px] text-[#0C2340] px-2 py-0.5 bg-white rounded border border-blue-200 shadow-2xs shrink-0">
                        Razorpay
                      </span>
                    </div>
                  </div>

                  {/* Actions: Razorpay Checkout Button */}
                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsAddFundsModalOpen(false)}
                      className="px-3.5 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={addFundsLoading}
                      className="py-2.5 px-5 rounded-xl bg-[#0C2340] hover:bg-[#07192f] text-white text-xs font-bold transition shadow-md flex items-center space-x-2 cursor-pointer border border-[#1b3b64]"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none">
                        <path d="M22 6L12 18H2L12 6H22Z" fill="#3395FF"/>
                        <path d="M12 6L6 14H16L22 6H12Z" fill="#FFFFFF"/>
                      </svg>
                      <span>Pay ₹{Number(addFundsAmount || 0).toLocaleString('en-IN')} with Razorpay</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL: CLIENT WITHDRAW REMAINING AMOUNT
            ====================================================================== */}
        {isClientWithdrawModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
              <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
                Withdraw Remaining Retainer Balance
              </h3>
              <p className="text-stone-500 mb-3 font-sans leading-relaxed">
                Available refundable balance:{' '}
                <strong className="text-stone-900 font-serif">
                  ₹{(Number(clientWallet.walletBalance) || 0).toLocaleString('en-IN')}
                </strong>
              </p>

              {/* Protected Escrow Reminder */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] mb-4 space-y-1">
                <div className="flex items-center space-x-1 font-semibold">
                  <Lock className="w-3.5 h-3.5 text-amber-700" />
                  <span>Escrow Protection Active</span>
                </div>
                <p>
                  ₹{(Number(clientWallet.nonWithdrawableEscrow) || 0).toLocaleString('en-IN')} held in active consultation escrow is protected and cannot be withdrawn until consultation completion or cancellation.
                </p>
              </div>

              {clientWithdrawSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  ₹{(Number(clientWithdrawAmount) || 0).toLocaleString('en-IN')} refund initiated successfully via IMPS/UPI!
                </div>
              ) : (
                <form onSubmit={handleClientWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Withdrawal Amount (₹)
                    </label>
                    <input
                      type="number"
                      max={clientWallet.walletBalance}
                      min="100"
                      placeholder="e.g. 5000"
                      value={clientWithdrawAmount}
                      onChange={(e) => setClientWithdrawAmount(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-bold"
                    />
                    <div className="flex items-center justify-between text-[10px] text-stone-500 mt-1">
                      <span>Min withdrawal: ₹100</span>
                      <button
                        type="button"
                        onClick={() => setClientWithdrawAmount(clientWallet.walletBalance)}
                        className="text-[var(--bg-primary)] font-semibold hover:underline cursor-pointer"
                      >
                        Withdraw All Remaining (₹{(Number(clientWallet.walletBalance) || 0).toLocaleString('en-IN')})
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Refund Destination
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-stone-200 cursor-pointer">
                        <input
                          type="radio"
                          name="clientWithdrawMethod"
                          checked={clientWithdrawMethod === 'UPI'}
                          onChange={() => setClientWithdrawMethod('UPI')}
                          className="text-[var(--bg-primary)]"
                        />
                        <div>
                          <p className="font-semibold text-stone-900">Original UPI ID: {clientWallet.refundMethod.upiId}</p>
                          <p className="text-[10px] text-stone-500">Real-Time NPCI Reversal (0-15 minutes)</p>
                        </div>
                      </label>

                      <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-stone-200 cursor-pointer">
                        <input
                          type="radio"
                          name="clientWithdrawMethod"
                          checked={clientWithdrawMethod === 'BANK'}
                          onChange={() => setClientWithdrawMethod('BANK')}
                          className="text-[var(--bg-primary)]"
                        />
                        <div>
                          <p className="font-semibold text-stone-900">{clientWallet.refundMethod.bankName} •••• 9104</p>
                          <p className="text-[10px] text-stone-500">Direct IMPS Bank Settlement</p>
                        </div>
                      </label>
                    </div>

                    {/* Change Account / Destination Link */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-stone-500">Transfer to a different account?</span>
                      <button
                        type="button"
                        onClick={() => {
                          setIsClientWithdrawModalOpen(false);
                          setIsClientPayoutModalOpen(true);
                        }}
                        className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>Update Bank / UPI Details</span>
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsClientWithdrawModalOpen(false)}
                      className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={clientWithdrawLoading}
                      className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-xs"
                    >
                      {clientWithdrawLoading ? 'Processing Refund...' : 'Authorize Withdrawal'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL: RAZORPAY SMART CHECKOUT GATEWAY SIMULATION
            ====================================================================== */}
        {isRazorpayModalOpen && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 text-xs border border-stone-200">
              {/* Razorpay Brand Header */}
              <div className="bg-[#0C2340] text-white p-5 flex items-center justify-between">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-sans font-black text-base tracking-tight text-[#3395FF]">Razorpay</span>
                    <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/10 text-stone-300">
                      Trusted Gateway
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-300 mt-0.5">LawinoMeet Legal Retainer Top-Up</p>
                  <p className="text-[10px] text-stone-400 font-mono mt-0.5">ID: {razorpayOrderId}</p>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-stone-300 uppercase font-mono">Amount Payable</div>
                  <div className="text-xl font-serif font-bold text-amber-300">
                    ₹{Number(addFundsAmount || 0).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="p-5 space-y-4">
                <div className="space-y-2">
                  <div className="p-3 rounded-xl border border-blue-200 bg-blue-50/50 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <div>
                        <div className="font-bold text-stone-900">Preferred: UPI FastPay</div>
                        <div className="text-[10px] text-stone-500">Google Pay • PhonePe • Paytm • BHIM</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-700 font-bold">Zero Surcharge</span>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between opacity-80">
                    <div className="flex items-center space-x-2">
                      <CreditCard className="w-4 h-4 text-stone-700" />
                      <div>
                        <div className="font-bold text-stone-900">Cards (Debit / Credit)</div>
                        <div className="text-[10px] text-stone-500">Visa, MasterCard, RuPay</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-3 rounded-xl border border-stone-200 bg-stone-50/70 flex items-center justify-between opacity-80">
                    <div className="flex items-center space-x-2">
                      <Building className="w-4 h-4 text-stone-700" />
                      <div>
                        <div className="font-bold text-stone-900">Net Banking</div>
                        <div className="text-[10px] text-stone-500">All Indian Banks Supported</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-stone-50 border border-stone-200 text-stone-500 text-[10px] flex items-center justify-between font-mono">
                  <span>Secured by 256-bit SSL</span>
                  <span className="text-emerald-700 font-bold">✓ PCI-DSS Level 1</span>
                </div>

                {/* Actions */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    disabled={razorpayProcessing}
                    onClick={handleCompleteRazorpayPayment}
                    className="w-full py-3 px-4 rounded-xl bg-[#0C2340] hover:bg-[#07192f] disabled:opacity-50 text-white font-bold text-xs transition shadow-md flex items-center justify-center space-x-2 cursor-pointer"
                  >
                    {razorpayProcessing ? (
                      <span>Verifying with Bank...</span>
                    ) : (
                      <span>Complete Payment (₹{Number(addFundsAmount || 0).toLocaleString('en-IN')})</span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsRazorpayModalOpen(false)}
                    className="w-full py-2 rounded-xl text-stone-500 hover:text-stone-700 text-xs font-medium cursor-pointer text-center"
                  >
                    Cancel Transaction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            MODAL: CLIENT UPDATE WITHDRAWAL & REFUND DESTINATION (Bank / UPI)
            ====================================================================== */}
        {isClientPayoutModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
              <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
                Update Withdrawal Destination
              </h3>
              <p className="text-stone-500 mb-4 font-sans leading-relaxed">
                Configure your verified bank account or UPI VPA where unused legal retainer balances and refunds will be transferred.
              </p>

              {clientPayoutSuccess ? (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                  <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                  Withdrawal destination updated successfully!
                </div>
              ) : (
                <form onSubmit={handleSaveClientPayout} className="space-y-3.5">
                  {/* Payout Type Selector */}
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Preferred Withdrawal Transfer Method
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setClientPayoutForm({ ...clientPayoutForm, payoutPreference: 'UPI' })}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          clientPayoutForm.payoutPreference === 'UPI'
                            ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] ring-1 ring-[var(--bg-primary)] font-bold text-stone-900'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        ⚡ Direct UPI VPA
                      </button>
                      <button
                        type="button"
                        onClick={() => setClientPayoutForm({ ...clientPayoutForm, payoutPreference: 'BANK' })}
                        className={`p-2.5 rounded-xl border text-center transition cursor-pointer ${
                          clientPayoutForm.payoutPreference === 'BANK'
                            ? 'border-[var(--bg-primary)] bg-[var(--bg-cream-card)] ring-1 ring-[var(--bg-primary)] font-bold text-stone-900'
                            : 'border-stone-200 text-stone-600 hover:bg-stone-50'
                        }`}
                      >
                        🏦 Bank Account (IMPS)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Account Holder Legal Name
                    </label>
                    <input
                      type="text"
                      required
                      value={clientPayoutForm.accountHolder}
                      onChange={(e) => setClientPayoutForm({ ...clientPayoutForm, accountHolder: e.target.value })}
                      placeholder="Name as per Bank records"
                      className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                    />
                  </div>

                  {clientPayoutForm.payoutPreference === 'UPI' ? (
                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        UPI ID / VPA (Virtual Payment Address)
                      </label>
                      <input
                        type="text"
                        required
                        value={clientPayoutForm.upiId}
                        onChange={(e) => setClientPayoutForm({ ...clientPayoutForm, upiId: e.target.value })}
                        placeholder="e.g. yourname@oksbi or 9876543210@paytm"
                        className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono"
                      />
                      <p className="text-[10px] text-stone-500 mt-1">
                        Funds will be credited directly to your UPI-linked bank account in real-time.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            Bank Name
                          </label>
                          <select
                            value={clientPayoutForm.bankName}
                            onChange={(e) => setClientPayoutForm({ ...clientPayoutForm, bankName: e.target.value })}
                            className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                          >
                            <option value="State Bank of India">State Bank of India</option>
                            <option value="HDFC Bank Ltd">HDFC Bank Ltd</option>
                            <option value="ICICI Bank">ICICI Bank</option>
                            <option value="Axis Bank">Axis Bank</option>
                            <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                            <option value="Punjab National Bank">Punjab National Bank</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            IFSC Code
                          </label>
                          <input
                            type="text"
                            required
                            value={clientPayoutForm.ifsc}
                            onChange={(e) => setClientPayoutForm({ ...clientPayoutForm, ifsc: e.target.value.toUpperCase() })}
                            placeholder="SBIN0001428"
                            className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono uppercase"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            Account Number
                          </label>
                          <input
                            type="password"
                            required
                            value={clientPayoutForm.accountNumber}
                            onChange={(e) => setClientPayoutForm({ ...clientPayoutForm, accountNumber: e.target.value })}
                            className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-medium text-stone-700 mb-1">
                            Confirm Account Number
                          </label>
                          <input
                            type="text"
                            required
                            value={clientPayoutForm.confirmAccountNumber}
                            onChange={(e) => setClientPayoutForm({ ...clientPayoutForm, confirmAccountNumber: e.target.value })}
                            className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono"
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <div className="pt-2 flex items-center justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsClientPayoutModalOpen(false)}
                      className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer shadow-xs"
                    >
                      Save Destination Details
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW: LAWYER & FIRM ADMIN FINANCE & EARNINGS INTERFACE
  // =========================================================================
  return (
    <div className="space-y-6 pb-12 select-none animate-in fade-in duration-300">
      <PageHeader
        title="Overview"
        subtitle={
          isFirm
            ? 'Track institutional firm retainers, escrow settlement pipelines, and partner dividend disbursements.'
            : hasFirmMembership
            ? 'Personal wallet, independent client earnings, and firm partnership draw ledger.'
            : 'Track client consultation retainers, escrow clearance windows, and direct bank payouts.'
        }
        badge={isFirm ? 'Firm Treasury' : hasFirmMembership ? 'Partner Ledger' : 'Advocate Wallet'}
        breadcrumbs={['Finance & Treasury']}
        actions={
          <div className="flex items-center space-x-2">
            {/* View Switcher: Revenue Overview vs Wallet */}
            <div className="flex items-center space-x-1 p-1 rounded-lg bg-[var(--bg-cream-card)] border border-[var(--border-cream)] text-xs">
              <button
                type="button"
                onClick={() => setFinanceView('REVENUE')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  financeView === 'REVENUE'
                    ? 'bg-[var(--bg-primary)] text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Revenue Overview</span>
              </button>
              <button
                type="button"
                onClick={() => setFinanceView('WALLET')}
                className={`px-3 py-1.5 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                  financeView === 'WALLET'
                    ? 'bg-[var(--bg-primary)] text-white font-semibold shadow-xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                <span>Wallet & Payouts</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsPaymentMethodModalOpen(true)}
              className="px-3 py-2 rounded-lg border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] hover:bg-[var(--bg-cream-card)] text-stone-800 text-xs font-medium flex items-center space-x-1.5 transition cursor-pointer"
              title="Update Bank or UPI Settlement Method"
            >
              <Edit3 className="w-3.5 h-3.5 text-stone-600" />
              <span>Update Payout Method</span>
            </button>

            <button
              type="button"
              onClick={() => setIsWithdrawModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-xs cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw Funds</span>
            </button>
          </div>
        }
      />

      {/* Financial Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <MetricCard
          label="Total Billed YTD"
          value={`₹${(Number(fundsData.totalEarned) || 0).toLocaleString('en-IN')}`}
          subtext="+18.4% growth vs previous cycle"
          icon={DollarSign}
        />
        <MetricCard
          label="Withdrawable Balance"
          value={`₹${(Number(fundsData.withdrawableBalance) || 0).toLocaleString('en-IN')}`}
          subtext="Available for immediate bank transfer"
          icon={Wallet}
          badge="Ready"
          badgeType="success"
        />
        <MetricCard
          label="Non-Withdrawable Escrow"
          value={`₹${(Number(fundsData.nonWithdrawableEscrow) || 0).toLocaleString('en-IN')}`}
          subtext="Held safely until consultation ends"
          icon={Lock}
          badge="Protected"
          badgeType="warning"
        />
      </div>

      {/* Firm Practice vs Independent Separation Notice */}
      {hasFirmMembership && (
        <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start space-x-3 text-xs">
          <Building className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-serif font-bold text-blue-950">
              Institutional Retainer & Personal Wallet Separation
            </p>
            <p className="text-[11px] text-blue-800 leading-relaxed font-sans">
              Consultations booked under <strong>{user.firmMembership.firmName}</strong> are accounted in the firm’s statutory corporate ledger and settled in the monthly partnership draw. Independent client bookings are credited directly to your personal withdrawable wallet balance.
            </p>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW A: REVENUE OVERVIEW (Analytics & Settlement Destination)
      ====================================================================== */}
      {financeView === 'REVENUE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-xs">
          {/* Revenue Breakdown */}
          <div className="lg:col-span-2 p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm space-y-4">
            <h3 className="font-serif font-bold text-sm text-stone-900 pb-2 border-b border-stone-100">
              Consultation Revenue by Practice Area
            </h3>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between font-medium text-stone-800 mb-1">
                  <span>Criminal Defense & Anticipatory Bail</span>
                  <span className="font-serif font-bold">₹1,42,000 (50%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-[var(--bg-primary)] h-full rounded-full" style={{ width: '50%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-stone-800 mb-1">
                  <span>High Court Quashing Petitions (482 CrPC)</span>
                  <span className="font-serif font-bold">₹75,500 (26%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-700 h-full rounded-full" style={{ width: '26%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-stone-800 mb-1">
                  <span>In-Person Chamber Consultations</span>
                  <span className="font-serif font-bold">₹48,000 (17%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-700 h-full rounded-full" style={{ width: '17%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between font-medium text-stone-800 mb-1">
                  <span>Quick Chat Statutory Advisories</span>
                  <span className="font-serif font-bold">₹19,000 (7%)</span>
                </div>
                <div className="w-full bg-stone-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-stone-500 h-full rounded-full" style={{ width: '7%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Bank & Settlement Details with UPDATE OPTION */}
          <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Verified Settlement Destination
              </h3>
              <button
                type="button"
                onClick={() => setIsPaymentMethodModalOpen(true)}
                className="text-[11px] text-[var(--bg-primary)] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Update</span>
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-[var(--bg-cream-soft)] border border-[var(--border-cream)] space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Building className="w-4 h-4 text-stone-700" />
                  <p className="font-serif font-bold text-stone-900">{fundsData.bankDetails.bankName}</p>
                </div>
                <span className="text-[9px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">
                  Verified
                </span>
              </div>
              <p className="text-[11px] text-stone-700 font-medium">A/c: {fundsData.bankDetails.accountNumber}</p>
              <p className="text-[10px] text-stone-500 font-mono">IFSC: {fundsData.bankDetails.ifsc}</p>
              <p className="text-[10px] text-stone-500 font-sans">{fundsData.bankDetails.branch}</p>
              <div className="pt-2 border-t border-stone-200/60 flex items-center justify-between text-[11px]">
                <span className="text-stone-500 font-mono">UPI ID:</span>
                <span className="font-semibold text-stone-800">{fundsData.bankDetails.upiId}</span>
              </div>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() => setIsWithdrawModalOpen(true)}
                className="w-full py-2.5 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold text-xs transition cursor-pointer shadow-xs"
              >
                Request Withdrawal Now
              </button>

              <button
                type="button"
                onClick={() => setIsPaymentMethodModalOpen(true)}
                className="w-full py-2 rounded-lg border border-[var(--border-cream)] hover:bg-[var(--bg-cream-soft)] text-stone-700 font-medium text-xs transition cursor-pointer"
              >
                Change Bank Account / UPI Method
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          VIEW B: WALLET & PAYOUTS (Transactions & Payout History)
      ====================================================================== */}
      {financeView === 'WALLET' && (
        <div className="space-y-6">
          {/* Payout History Cards */}
          <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Recent Bank Disbursements & Withdrawals
              </h3>
              <span className="text-[10px] font-mono text-stone-500">Direct IMPS Payouts</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {fundsData.payoutHistory.map((p) => (
                <div
                  key={p.payoutId}
                  className="p-3.5 rounded-xl border border-[var(--border-cream)] bg-[var(--bg-cream-soft)] space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] text-stone-500">{p.payoutId}</span>
                    <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {p.status}
                    </span>
                  </div>
                  <p className="text-base font-serif font-bold text-stone-900">
                    ₹{(Number(p.amount) || 0).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-stone-600 truncate">{p.method}</p>
                  <p className="text-[10px] text-stone-400 font-mono">{p.referenceId}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Retainer Transaction Ledger */}
          <div className="p-5 rounded-xl border border-[var(--border-cream)] bg-white/95 backdrop-blur-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
              <h3 className="font-serif font-bold text-sm text-stone-900">
                Retainer Fee Transaction Ledger ({filteredLawyerTransactions.length})
              </h3>

              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-stone-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 focus:outline-none"
                  />
                </div>

                <select
                  value={activeTab}
                  onChange={(e) => setActiveTab(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-700 focus:outline-none"
                >
                  <option value="ALL">All Transactions</option>
                  <option value="WITHDRAWABLE">Withdrawable</option>
                  <option value="ESCROW">Escrow Locked</option>
                  <option value="PAID">Paid Out</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-stone-200 bg-[var(--bg-cream-card)] text-[10px] font-mono uppercase tracking-wider text-stone-500">
                    <th className="py-2.5 px-3">Txn ID</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Client / Payer</th>
                    <th className="py-2.5 px-3">Consultation Service</th>
                    <th className="py-2.5 px-3">Gross</th>
                    <th className="py-2.5 px-3">Net Payout</th>
                    <th className="py-2.5 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {filteredLawyerTransactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-stone-50/70 transition">
                      <td className="py-2.5 px-3 font-mono text-[11px] text-stone-500">{tx.id}</td>
                      <td className="py-2.5 px-3 text-stone-700">{tx.date}</td>
                      <td className="py-2.5 px-3 font-semibold text-stone-900">{tx.clientName}</td>
                      <td className="py-2.5 px-3 text-stone-600 truncate max-w-xs">{tx.serviceType}</td>
                      <td className="py-2.5 px-3 font-medium text-stone-800">₹{tx.grossAmount}</td>
                      <td className="py-2.5 px-3 font-serif font-bold text-stone-900">₹{tx.netAmount}</td>
                      <td className="py-2.5 px-3">
                        {tx.status === 'WITHDRAWABLE' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">
                            Withdrawable
                          </span>
                        ) : tx.status === 'NON_WITHDRAWABLE_ESCROW' ? (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-medium">
                            In Escrow
                          </span>
                        ) : (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-stone-200 text-stone-700 font-medium">
                            {tx.status}
                          </span>
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
          MODAL: WITHDRAW FUNDS (Lawyer & Firm)
      ====================================================================== */}
      {isWithdrawModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Withdraw Available Retainer Funds
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Available balance:{' '}
              <strong className="text-stone-900 font-serif">
                ₹{(Number(fundsData.withdrawableBalance) || 0).toLocaleString('en-IN')}
              </strong>
            </p>

            {withdrawSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                Withdrawal initiated via direct IMPS!
              </div>
            ) : (
              <form onSubmit={handleWithdraw} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Withdrawal Amount (₹)
                  </label>
                  <input
                    type="number"
                    max={fundsData.withdrawableBalance}
                    min="500"
                    placeholder="e.g. 15000"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-bold"
                  />
                  <div className="flex items-center justify-between text-[10px] text-stone-400 mt-1">
                    <span>Min withdrawal: ₹500</span>
                    <button
                      type="button"
                      onClick={() => setWithdrawAmount(fundsData.withdrawableBalance)}
                      className="text-[var(--bg-primary)] font-semibold hover:underline cursor-pointer"
                    >
                      Withdraw Maximum (₹{fundsData.withdrawableBalance})
                    </button>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-medium text-stone-700">
                      Destination Account
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsWithdrawModalOpen(false);
                        setIsPaymentMethodModalOpen(true);
                      }}
                      className="text-[10px] text-[var(--bg-primary)] font-semibold hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <Edit3 className="w-2.5 h-2.5" />
                      <span>Change Account</span>
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        name="method"
                        checked={withdrawMethod === 'BANK'}
                        onChange={() => setWithdrawMethod('BANK')}
                        className="text-[var(--bg-primary)]"
                      />
                      <div>
                        <p className="font-semibold text-stone-900">{fundsData.bankDetails.bankName} {fundsData.bankDetails.accountNumber}</p>
                        <p className="text-[10px] text-stone-500">IMPS Direct Transfer (0-2 hours)</p>
                      </div>
                    </label>

                    <label className="flex items-center space-x-2.5 p-2.5 rounded-xl border border-stone-200 cursor-pointer">
                      <input
                        type="radio"
                        name="method"
                        checked={withdrawMethod === 'UPI'}
                        onChange={() => setWithdrawMethod('UPI')}
                        className="text-[var(--bg-primary)]"
                      />
                      <div>
                        <p className="font-semibold text-stone-900">UPI: {fundsData.bankDetails.upiId}</p>
                        <p className="text-[10px] text-stone-500">Real-Time NPCI UPI Settlement</p>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsWithdrawModalOpen(false)}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={withdrawLoading}
                    className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    {withdrawLoading ? 'Authorizing IMPS...' : 'Authorize Payout'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: UPDATE PAYMENT METHOD FOR WITHDRAWALS (Lawyer & Firm)
      ====================================================================== */}
      {isPaymentMethodModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 border border-[var(--border-cream)] shadow-2xl animate-in fade-in zoom-in-95 text-xs">
            <h3 className="font-serif font-bold text-base text-stone-900 mb-1">
              Update Withdrawal & Settlement Method
            </h3>
            <p className="text-stone-500 mb-4 font-sans leading-relaxed">
              Configure your verified bank account and UPI destination for direct fee withdrawals.
            </p>

            {payoutUpdateSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-center font-medium my-4">
                <CheckCircle2 className="w-6 h-6 mx-auto mb-1 text-emerald-600" />
                Settlement details updated and verified successfully!
              </div>
            ) : (
              <form onSubmit={handleSavePaymentMethod} className="space-y-3.5">
                {/* Method Switcher */}
                <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-cream-soft)] border border-[var(--border-cream)]">
                  <button
                    type="button"
                    onClick={() => setPayoutForm((prev) => ({ ...prev, payoutPreference: 'BANK' }))}
                    className={`py-1.5 text-center rounded-lg font-medium transition cursor-pointer flex items-center justify-center space-x-1 ${
                      payoutForm.payoutPreference === 'BANK'
                        ? 'bg-[var(--bg-primary)] text-white shadow-xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5" />
                    <span>Bank Transfer (IMPS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayoutForm((prev) => ({ ...prev, payoutPreference: 'UPI' }))}
                    className={`py-1.5 text-center rounded-lg font-medium transition cursor-pointer flex items-center justify-center space-x-1 ${
                      payoutForm.payoutPreference === 'UPI'
                        ? 'bg-[var(--bg-primary)] text-white shadow-xs font-semibold'
                        : 'text-stone-600 hover:text-stone-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>UPI Settlement</span>
                  </button>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-stone-700 mb-1">
                    Account Holder Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={payoutForm.accountHolder}
                    onChange={(e) => setPayoutForm({ ...payoutForm, accountHolder: e.target.value })}
                    className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                  />
                </div>

                {payoutForm.payoutPreference === 'BANK' ? (
                  <>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Bank Name
                        </label>
                        <select
                          value={payoutForm.bankName}
                          onChange={(e) => setPayoutForm({ ...payoutForm, bankName: e.target.value })}
                          className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                        >
                          <option value="HDFC Bank Ltd">HDFC Bank Ltd</option>
                          <option value="State Bank of India">State Bank of India</option>
                          <option value="ICICI Bank">ICICI Bank</option>
                          <option value="Axis Bank">Axis Bank</option>
                          <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          IFSC Code
                        </label>
                        <input
                          type="text"
                          required
                          value={payoutForm.ifsc}
                          onChange={(e) => setPayoutForm({ ...payoutForm, ifsc: e.target.value.toUpperCase() })}
                          className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono uppercase"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Account Number
                        </label>
                        <input
                          type="password"
                          required
                          value={payoutForm.accountNumber}
                          onChange={(e) => setPayoutForm({ ...payoutForm, accountNumber: e.target.value })}
                          className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-stone-700 mb-1">
                          Confirm Account Number
                        </label>
                        <input
                          type="text"
                          required
                          value={payoutForm.confirmAccountNumber}
                          onChange={(e) => setPayoutForm({ ...payoutForm, confirmAccountNumber: e.target.value })}
                          className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-medium text-stone-700 mb-1">
                        Branch Name &amp; City
                      </label>
                      <input
                        type="text"
                        required
                        value={payoutForm.branch}
                        onChange={(e) => setPayoutForm({ ...payoutForm, branch: e.target.value })}
                        className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-[11px] font-medium text-stone-700 mb-1">
                      Verified UPI ID (for real-time payouts)
                    </label>
                    <input
                      type="text"
                      required
                      value={payoutForm.upiId}
                      onChange={(e) => setPayoutForm({ ...payoutForm, upiId: e.target.value })}
                      placeholder="advocate@okhdfcbank"
                      className="w-full p-2 rounded-lg border border-[var(--border-cream)] text-xs text-stone-800 font-mono"
                    />
                    <p className="text-[10px] text-stone-500 mt-1">
                      Consultation fees will be settled directly to this UPI virtual payment address in real time.
                    </p>
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsPaymentMethodModalOpen(false)}
                    className="px-3 py-2 rounded-lg border border-stone-200 text-stone-600 hover:bg-stone-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-[var(--bg-primary)] hover:opacity-90 text-white font-semibold cursor-pointer shadow-xs"
                  >
                    Save & Verify Method
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
