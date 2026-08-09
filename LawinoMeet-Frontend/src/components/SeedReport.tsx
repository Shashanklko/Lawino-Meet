import React, { useState } from 'react';
import {
  Database, CheckCircle, XCircle, ChevronDown, ChevronUp,
  User, Scale, Calendar, CreditCard, DollarSign, Clock, X,
  AlertCircle
} from 'lucide-react';

export interface SeedResultEntry {
  step: string;
  icon: string;
  method: string;
  url: string;
  requestBody?: any;
  requestParams?: any;
  responseStatus: number;
  responseData?: any;
  durationMs?: number;
  passed: boolean;
  errorMsg?: string;
}

interface SeedReportProps {
  results: SeedResultEntry[];
  onClose: () => void;
}

const STEP_ICONS: Record<string, React.ReactNode> = {
  'Register Client':                  <User size={14} className="text-cyan" />,
  'Register Lawyer':                  <Scale size={14} className="text-indigo" />,
  'Login & Get JWT':                  <CheckCircle size={14} className="text-emerald" />,
  'Consultation 1 — Request':         <Calendar size={14} className="text-amber" />,
  'Consultation 1 — Approve ($150)':  <CheckCircle size={14} className="text-emerald" />,
  'Payment Checkout':                 <CreditCard size={14} className="text-purple" />,
  'Payout Request ($100)':            <DollarSign size={14} className="text-cyan" />,
  'Consultation 2 — PENDING Request': <AlertCircle size={14} className="text-amber" />,
};

const StatusBadge: React.FC<{ code: number }> = ({ code }) => (
  <span className={`report-status-badge ${code >= 200 && code < 300 ? 'ok' : 'err'}`}>
    {code}
  </span>
);

const ExpandableJSON: React.FC<{ label: string; data: any }> = ({ label, data }) => {
  const [open, setOpen] = useState(false);
  if (!data) return null;
  return (
    <div className="report-json-block">
      <button className="report-json-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
        {label}
      </button>
      {open && (
        <pre className="report-json-pre">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
};

export const SeedReport: React.FC<SeedReportProps> = ({ results, onClose }) => {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return (
    <div className="report-overlay">
      <div className="report-panel glass-panel">
        {/* Header */}
        <div className="report-header">
          <div className="report-title-group">
            <Database size={20} className="text-emerald" />
            <div>
              <h2 className="report-title">Seed Database — Results</h2>
              <p className="report-subtitle">All data seeded into the backend database</p>
            </div>
          </div>
          <div className="report-summary-badges">
            <span className="summary-badge passed">{passed} Seeded</span>
            {failed > 0 && <span className="summary-badge failed">{failed} Failed</span>}
          </div>
          <button className="btn-icon-muted" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Step results */}
        <div className="report-list">
          {results.map((r, i) => (
            <div key={i} className={`report-row ${r.passed ? 'row-pass' : 'row-fail'}`}>
              <div className="report-row-left">
                <span className="report-step-icon">
                  {STEP_ICONS[r.step] || <Database size={14} />}
                </span>
                <div className="report-row-info">
                  <span className="report-step-name">{r.step}</span>
                  <span className="report-row-url">
                    <span className={`report-method method-${r.method.toLowerCase()}`}>{r.method}</span>
                    <code>{r.url}</code>
                  </span>
                </div>
              </div>
              <div className="report-row-right">
                <StatusBadge code={r.responseStatus} />
                {r.durationMs && (
                  <span className="report-duration"><Clock size={10} /> {r.durationMs}ms</span>
                )}
                {r.passed
                  ? <CheckCircle size={16} className="text-emerald" />
                  : <XCircle size={16} className="text-ruby" />
                }
              </div>
              <div className="report-row-details">
                <ExpandableJSON label="Request Body" data={r.requestBody} />
                <ExpandableJSON label="Response Data" data={r.responseData} />
                {r.errorMsg && <p className="report-error-msg">⚠ {r.errorMsg}</p>}
              </div>
            </div>
          ))}
        </div>

        {/* PENDING consultation callout */}
        <div className="report-callout pending-callout">
          <AlertCircle size={15} className="text-amber" />
          <span>
            <strong>Consultation 2 is PENDING</strong> — it's waiting in the lawyer's inbox for manual approval.
            Use the <em>Approve Consultation</em> shortcut to test the approval flow.
          </span>
        </div>
      </div>
    </div>
  );
};
