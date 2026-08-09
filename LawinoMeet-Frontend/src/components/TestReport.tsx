import React, { useState } from 'react';
import {
  FlaskConical, CheckCircle, XCircle, ChevronDown, ChevronUp,
  Clock, X, BarChart3
} from 'lucide-react';

export interface TestCaseResult {
  name: string;
  method: string;
  url: string;
  requestBody?: any;
  requestParams?: any;
  responseStatus: number;
  responseData?: any;
  passed: boolean;
  failReason?: string;
  durationMs?: number;
}

interface TestReportProps {
  results: TestCaseResult[];
  onClose: () => void;
}

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

export const TestReport: React.FC<TestReportProps> = ({ results, onClose }) => {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;
  const total = results.length;
  const avgMs = results.reduce((s, r) => s + (r.durationMs || 0), 0) / (total || 1);

  return (
    <div className="report-overlay">
      <div className="report-panel glass-panel">
        {/* Header */}
        <div className="report-header">
          <div className="report-title-group">
            <FlaskConical size={20} className="text-indigo" />
            <div>
              <h2 className="report-title">Test All Suite — Report</h2>
              <p className="report-subtitle">Full API lifecycle verification results</p>
            </div>
          </div>
          <div className="report-summary-badges">
            <span className="summary-badge passed">✓ {passed} Passed</span>
            {failed > 0 && <span className="summary-badge failed">✗ {failed} Failed</span>}
            <span className="summary-badge neutral">{total} Total</span>
          </div>
          <button className="btn-icon-muted" onClick={onClose}><X size={18} /></button>
        </div>

        {/* Stats bar */}
        <div className="report-stats-bar">
          <div className="stat-item">
            <BarChart3 size={13} className="text-cyan" />
            <span>Pass rate: <strong>{total ? Math.round((passed / total) * 100) : 0}%</strong></span>
          </div>
          <div className="stat-item">
            <Clock size={13} className="text-amber" />
            <span>Avg latency: <strong>{Math.round(avgMs)}ms</strong></span>
          </div>
          <div className="stat-item">
            <CheckCircle size={13} className="text-emerald" />
            <span>{passed} / {total} tests passing</span>
          </div>
        </div>

        {/* Pass/fail progress bar */}
        <div className="report-progress-track">
          <div
            className="report-progress-fill"
            style={{ width: `${total ? (passed / total) * 100 : 0}%` }}
          />
        </div>

        {/* Test case list */}
        <div className="report-list">
          {results.map((r, i) => (
            <div key={i} className={`report-row ${r.passed ? 'row-pass' : 'row-fail'}`}>
              <div className="report-row-left">
                <span className="report-case-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="report-row-info">
                  <span className="report-step-name">{r.name}</span>
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
                {r.failReason && (
                  <p className="report-error-msg">✗ {r.failReason}</p>
                )}
                <ExpandableJSON label="Request Sent" data={r.requestBody || r.requestParams} />
                <ExpandableJSON label="Response Received" data={r.responseData} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
