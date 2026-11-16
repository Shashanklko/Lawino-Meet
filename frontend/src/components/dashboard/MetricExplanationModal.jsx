import React, { useEffect } from 'react';
import {
  X,
  Shield,
  ShieldCheck,
  Lock,
  Wallet,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Building,
  Calendar,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Receipt,
  FileText,
} from 'lucide-react';

export const MetricExplanationModal = ({
  isOpen,
  onClose,
  metricType, // 'ESCROW' | 'WITHDRAWABLE' | 'TOTAL_BILLED' | 'CLIENT_WALLET' | 'CLIENT_ESCROW' | 'CLIENT_SPENT'
  amount,
  onAction, // e.g. open withdrawal modal, or view appointments
}) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const getContent = () => {
    switch (metricType) {
      case 'ESCROW':
        return {
          title: 'Non-Withdrawable Escrow',
          subtitle: 'Client Protection & Retainer Guarantee Vault',
          amount: amount || '₹18,500',
          badgeText: 'Protected by RBI-Compliant Escrow Rules',
          badgeColor: 'amber',
          icon: Lock,
          whatItMeans:
            'Escrow is a secure third-party financial vault mechanism. When a client books an appointment or legal consultation, their fee is pre-funded and held safely in this escrow account rather than paid immediately to your personal bank account.',
          whyNonWithdrawable: [
            {
              title: 'Client Attendance Assurance',
              desc: 'Protects the client if a session is cancelled or if counsel is unable to attend.',
            },
            {
              title: 'Advocate Honorarium Guarantee',
              desc: 'Assures the advocate that client funds are already secured in trust and cannot be revoked without cause.',
            },
            {
              title: 'Bar Council & RBI Compliance',
              desc: 'Complies with statutory professional conduct standards prohibiting upfront legal fee appropriation before service delivery.',
            },
          ],
          howItWorks: [
            {
              step: '1',
              title: 'Booking & Lock',
              desc: 'Client books consultation; fees are locked in Escrow.',
            },
            {
              step: '2',
              title: 'Session Conducted',
              desc: 'Advocate and client meet via encrypted video room or chamber.',
            },
            {
              step: '3',
              title: 'Mark Completed',
              desc: 'Counsel marks brief completed; client is notified for verification.',
            },
            {
              step: '4',
              title: 'Funds Released',
              desc: 'Escrow unlocks into Withdrawable Balance (immediate or after 24hr auto-clearing).',
            },
          ],
          mattersBreakdown: [
            {
              ref: 'APT-1001',
              client: 'Rohit Verma',
              service: '1-on-1 Online Video Call',
              time: 'Today, 03:15 PM',
              amount: '₹1,350',
              status: 'Session Scheduled Today',
            },
            {
              ref: 'APT-1004',
              client: 'Vikramaditya Infrastructure Corp',
              service: 'Commercial Arbitration & Writ Advisory',
              time: 'Pending Completion Verification',
              amount: '₹12,000',
              status: 'Awaiting Client Verification',
            },
            {
              ref: 'APT-1007',
              client: 'Dr. Shalini Mukherjee',
              service: 'Chamber Consultation (IP & Medico-Legal)',
              time: 'Tomorrow, 11:00 AM',
              amount: '₹5,150',
              status: 'Retainer Locked in Escrow',
            },
          ],
          primaryActionText: 'View Scheduled Consultations',
          primaryActionType: 'VIEW_APPOINTMENTS',
        };

      case 'WITHDRAWABLE':
        return {
          title: 'Withdrawable Balance',
          subtitle: 'Liquid, Cleared & Verified Counsel Earnings',
          amount: amount || '₹48,200',
          badgeText: 'Available for Immediate Bank / UPI Transfer',
          badgeColor: 'emerald',
          icon: Wallet,
          whatItMeans:
            'Withdrawable balance represents your cleared, settled earnings from verified legal consultations, written opinions, and firm partnership disbursements where the services have been completed and verified.',
          whyNonWithdrawable: [
            {
              title: 'Instant Bank Payouts',
              desc: 'Zero lock-in. You can withdraw any portion of this balance directly to your bank account anytime 24/7.',
            },
            {
              title: 'IMPS & UPI Direct Credit',
              desc: 'Funds are dispatched immediately via instant bank rail and typically reflect in your account within 15–30 minutes.',
            },
            {
              title: 'Zero Hidden Fees',
              desc: 'Net earnings already reflect platform processing. Full TDS statements are generated quarterly.',
            },
          ],
          howItWorks: [
            {
              step: '1',
              title: 'Completed Matters',
              desc: 'Sessions verified by client or 24h verification window passed.',
            },
            {
              step: '2',
              title: 'Instant Clearance',
              desc: 'Funds moved from Escrow directly into your Withdrawable Balance.',
            },
            {
              step: '3',
              title: 'Click Withdraw',
              desc: 'Specify amount and choose Bank (HDFC •••• 4892) or registered UPI ID.',
            },
            {
              step: '4',
              title: 'Instant Bank Credit',
              desc: 'Bank dispatch reference number (UTR) generated in transaction history.',
            },
          ],
          mattersBreakdown: [
            {
              ref: 'TXN-9019',
              client: 'Pooja Kashyap',
              service: 'Quick Chat Advisory (3-Day Active)',
              time: 'Cleared Today',
              amount: '₹450',
              status: 'Ready to Withdraw',
            },
            {
              ref: 'TXN-9015',
              client: 'Vikram Mehta',
              service: 'Chamber Consultation (High Court)',
              time: 'Cleared Yesterday',
              amount: '₹1,800',
              status: 'Ready to Withdraw',
            },
            {
              ref: 'TXN-9008',
              client: 'Corporate Retainer Draw',
              service: 'Lex Veritas Legal LLP Monthly Allocation',
              time: 'Settled 14 Nov',
              amount: '₹45,950',
              status: 'Ready to Withdraw',
            },
          ],
          primaryActionText: 'Withdraw Funds Now',
          primaryActionType: 'WITHDRAW',
        };

      case 'TOTAL_BILLED':
      default:
        return {
          title: 'Total Billed Year-To-Date (YTD)',
          subtitle: 'Gross Invoiced Legal Practice Turnover (FY 2026-27)',
          amount: amount || '₹2,84,500',
          badgeText: '+18.4% Growth vs Preceding Billing Cycle',
          badgeColor: 'blue',
          icon: DollarSign,
          whatItMeans:
            'Total Billed YTD represents the cumulative gross legal retainer fees invoiced across all consultations, virtual chambers, written opinions, and dispute representation since April 1st of the current fiscal year.',
          whyNonWithdrawable: [
            {
              title: 'Comprehensive Practice Revenue',
              desc: 'Includes all completed, in-progress, and settled client retainers across all benches and chambers.',
            },
            {
              title: 'Statutory GST & TDS Accounting',
              desc: 'Form 16A withholding summaries and GST-compliant tax invoices are reconciled against this gross total.',
            },
            {
              title: 'Practice Growth Analytics',
              desc: 'Tracks multi-city chamber growth trends across Supreme Court, High Court, and Corporate desks.',
            },
          ],
          howItWorks: [
            {
              step: '1',
              title: 'Retainer Invoiced',
              desc: 'Every accepted brief creates a formal GST-compliant ledger entry.',
            },
            {
              step: '2',
              title: 'Escrow Security',
              desc: 'Funds sit safely in escrow while matter is active.',
            },
            {
              step: '3',
              title: 'Settlement & Payout',
              desc: 'Completed matters are credited to withdrawable balance.',
            },
            {
              step: '4',
              title: 'Audit-Ready Ledger',
              desc: 'Download annual billing statements with certified digital signature.',
            },
          ],
          mattersBreakdown: [
            {
              ref: 'REV-HC-01',
              client: 'High Court & Appellate Litigation',
              service: 'Commercial Writs, FIR Quashing & Special Leave Petitions',
              time: 'FY 2026-27',
              amount: '₹1,42,000',
              status: '50% of Practice Volume',
            },
            {
              ref: 'REV-CORP-02',
              client: 'Corporate Retainers & M&A Due Diligence',
              service: 'Contract Structuring & Angel Syndicate Advisory',
              time: 'FY 2026-27',
              amount: '₹98,500',
              status: '35% of Practice Volume',
            },
            {
              ref: 'REV-VC-03',
              client: 'Virtual Court & 1-on-1 Advisory Chambers',
              service: 'Online Consultations & Second Legal Opinions',
              time: 'FY 2026-27',
              amount: '₹44,000',
              status: '15% of Practice Volume',
            },
          ],
          primaryActionText: 'Download Annual Statement (PDF)',
          primaryActionType: 'STATEMENT',
        };
    }
  };

  const content = getContent();
  const Icon = content.icon;

  const handlePrimaryClick = () => {
    onClose();
    if (onAction) {
      onAction(content.primaryActionType);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-[var(--border-cream)] overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Capsule */}
        <div className="p-4 sm:p-5 border-b border-stone-100 bg-[var(--bg-cream-soft)] flex items-start justify-between relative">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white border border-[var(--border-cream)] shadow-xs flex items-center justify-center text-[var(--bg-primary)] shrink-0">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-serif font-bold text-base sm:text-lg text-stone-900 tracking-tight">
                  {content.title}
                </h3>
              </div>
              <p className="text-xs text-stone-500 font-sans mt-0.5">
                {content.subtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-stone-700 hover:bg-stone-200/50 transition cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 text-xs text-stone-700">
          {/* Prominent Amount Spotlight */}
          <div className="p-4 sm:p-5 rounded-2xl border border-[var(--border-cream)] bg-gradient-to-br from-[var(--bg-cream-card)] to-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div>
              <span className="text-[11px] font-mono uppercase tracking-wider text-stone-500 font-semibold block">
                Current Card Amount
              </span>
              <div className="flex items-baseline space-x-2 mt-1">
                <span className="font-serif font-bold text-3xl sm:text-4xl text-[var(--text-primary)] tracking-tight">
                  {content.amount}
                </span>
                <span className="text-xs font-sans text-stone-500 font-medium">INR</span>
              </div>
            </div>

            <div className="sm:text-right">
              <span
                className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-medium border ${
                  content.badgeColor === 'amber'
                    ? 'bg-amber-50 text-amber-900 border-amber-200'
                    : content.badgeColor === 'emerald'
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-blue-50 text-blue-900 border-blue-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{content.badgeText}</span>
              </span>
              <p className="text-[10px] text-stone-400 mt-1 font-mono">
                Verified under RBI Escrow Trust & BCI Guidelines
              </p>
            </div>
          </div>

          {/* Core Explanation: What does this mean? */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <HelpCircle className="w-4 h-4 text-[var(--bg-primary)]" />
              <h4 className="font-serif font-bold text-sm text-stone-900">
                What does this amount mean?
              </h4>
            </div>
            <div className="p-3.5 rounded-xl bg-stone-50 border border-stone-200 leading-relaxed text-stone-700 font-sans">
              {content.whatItMeans}
            </div>
          </div>

          {/* Key Protection & Operational Rules */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {content.whyNonWithdrawable.map((item, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl border border-stone-200 bg-white space-y-1.5 shadow-2xs"
              >
                <div className="flex items-center space-x-1.5 text-stone-900 font-serif font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{item.title}</span>
                </div>
                <p className="text-[11px] text-stone-500 leading-normal font-sans">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          {/* How It Moves / Release Lifecycle */}
          <div className="p-4 rounded-xl border border-stone-200 bg-stone-50/70 space-y-3">
            <h5 className="font-serif font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-stone-600" />
              <span>Funds Lifecycle & Release Rules</span>
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-stone-700">
              {content.howItWorks.map((st) => (
                <div
                  key={st.step}
                  className="p-2.5 rounded-lg bg-white border border-stone-200/80 space-y-1 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="w-5 h-5 rounded-full bg-[var(--bg-primary)] text-white text-[10px] font-bold flex items-center justify-center font-mono">
                      {st.step}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400">Step {st.step}</span>
                  </div>
                  <h6 className="font-serif font-bold text-stone-900 text-[11px]">
                    {st.title}
                  </h6>
                  <p className="text-[10px] text-stone-500 leading-tight">
                    {st.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Breakdown Table */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <h5 className="font-serif font-bold text-xs text-stone-900 uppercase tracking-wider flex items-center space-x-1.5">
                <Receipt className="w-3.5 h-3.5 text-stone-600" />
                <span>Matters Contributing to this Amount</span>
              </h5>
              <span className="text-[10px] font-mono text-stone-400">
                {content.mattersBreakdown.length} Active Records
              </span>
            </div>

            <div className="border border-stone-200 rounded-xl overflow-hidden divide-y divide-stone-100 bg-white">
              {content.mattersBreakdown.map((row, idx) => (
                <div
                  key={idx}
                  className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-stone-50/60 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded">
                        {row.ref}
                      </span>
                      <span className="font-serif font-bold text-stone-900 text-xs">
                        {row.client}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-500">{row.service}</p>
                    <span className="text-[10px] text-stone-400 font-mono block">
                      {row.time} • {row.status}
                    </span>
                  </div>

                  <div className="sm:text-right shrink-0">
                    <span className="font-serif font-bold text-sm text-stone-900">
                      {row.amount}
                    </span>
                    <span className="text-[10px] block text-emerald-700 font-mono font-medium">
                      Net Settled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-stone-100 bg-stone-50/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2 text-[11px] text-stone-500">
            <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Fiduciary Escrow Account audited quarterly</span>
          </div>

          <div className="flex items-center space-x-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-stone-300 hover:bg-stone-100 text-stone-700 font-medium text-xs transition cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handlePrimaryClick}
              className="px-4 py-2 rounded-xl bg-[var(--bg-primary)] hover:opacity-90 text-white font-medium text-xs transition shadow-xs flex items-center space-x-1.5 cursor-pointer"
            >
              <span>{content.primaryActionText}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
