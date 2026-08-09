import React, { useState } from 'react';
import type { EndpointDefinition } from '../types/api';
import {
  Zap, Sparkles, UserPlus, LogIn, Calendar, CreditCard,
  DollarSign, ShieldAlert, RefreshCw, Database,
  FlaskConical, ChevronDown, ChevronUp, Check, Clock
} from 'lucide-react';

interface PresetsBannerProps {
  endpoints: EndpointDefinition[];
  onSelectPreset: (endpointId: string, customParams?: Record<string, any>, customBody?: any) => void;
  onRunSeedDatabase?: () => void;
  onRunTestSuite?: () => void;
  isSeeding?: boolean;
  isTesting?: boolean;
  seedSteps?: SeedStep[];
}

export interface SeedStep {
  label: string;
  status: 'idle' | 'running' | 'done' | 'error';
}

const WORKFLOW_STEPS = [
  { id: 'auth-register-client', icon: <UserPlus size={13} />, label: '1. Register Client', cls: 'btn-glow-cyan' },
  { id: 'auth-login',           icon: <LogIn size={13} />,     label: '2. Login & JWT',     cls: 'btn-glow-amber' },
  { id: 'consultation-request', icon: <Calendar size={13} />,  label: '3. Request Consult', cls: 'btn-glow-indigo' },
  { id: 'consultation-approve', icon: <Zap size={13} />,       label: '4. Approve ($150)',  cls: 'btn-glow-purple',
    params: { id: 1, customFee: 150.00 } },
  { id: 'payment-checkout',     icon: <CreditCard size={13} />,label: '5. Checkout',         cls: 'btn-glow-emerald',
    params: { consultationId: 1 } },
  { id: 'payout-request',       icon: <DollarSign size={13} />,label: '6. Payout',          cls: 'btn-glow-cyan',
    params: { lawyerId: 2, amount: 100.00 } },
  { id: 'dashboard-admin',      icon: <ShieldAlert size={13} />, label: '7. Admin Dash',    cls: 'btn-glow-ruby' },
];

const STATUS_ICON = {
  idle:    <span className="step-dot idle" />,
  running: <RefreshCw size={11} className="animate-spin text-cyan" />,
  done:    <Check size={11} className="text-emerald" />,
  error:   <span className="step-dot error" />,
};

export const PresetsBanner: React.FC<PresetsBannerProps> = ({
  onSelectPreset,
  onRunSeedDatabase,
  onRunTestSuite,
  isSeeding = false,
  isTesting = false,
  seedSteps = [],
}) => {
  const [showSeedSteps, setShowSeedSteps] = useState(false);

  return (
    <div className="presets-banner glass-panel">
      {/* ── Top row: title + two action buttons ───────────────────── */}
      <div className="presets-top-row">
        <div className="presets-header">
          <Sparkles size={15} className="text-amber" />
          <span className="presets-title">Quick Test Scenarios &amp; Workflows</span>
        </div>

        <div className="presets-action-group">
          {/* 🌱 Seed Database */}
          <button
            className={`preset-action-btn seed-btn ${isSeeding ? 'is-running' : ''}`}
            onClick={onRunSeedDatabase}
            disabled={isSeeding || isTesting}
            title="Seed the database with realistic sample data including a PENDING consultation"
          >
            {isSeeding
              ? <><RefreshCw size={14} className="animate-spin" /> Seeding…</>
              : <><Database size={14} /> 🌱 Seed Database</>
            }
            <button
              className="expand-steps-btn"
              onClick={(e) => { e.stopPropagation(); setShowSeedSteps((v) => !v); }}
              title="Show/hide seed steps"
              disabled={false}
            >
              {showSeedSteps ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          </button>

          {/* 🧪 Test All Suite */}
          <button
            className={`preset-action-btn test-btn ${isTesting ? 'is-running' : ''}`}
            onClick={onRunTestSuite}
            disabled={isSeeding || isTesting}
            title="Run the full automated API test workflow"
          >
            {isTesting
              ? <><RefreshCw size={14} className="animate-spin" /> Testing…</>
              : <><FlaskConical size={14} /> 🧪 Test All Suite</>
            }
          </button>
        </div>
      </div>

      {/* ── Seed step progress (collapsible) ──────────────────────── */}
      {showSeedSteps && (
        <div className="seed-steps-row">
          {seedSteps.length > 0
            ? seedSteps.map((s, i) => (
                <span key={i} className={`seed-step-pill status-${s.status}`}>
                  {STATUS_ICON[s.status]}
                  {s.label}
                </span>
              ))
            : (
                <span className="seed-steps-hint">
                  <Clock size={12} /> Steps will appear here when seeding runs
                </span>
              )
          }
        </div>
      )}

      {/* ── Workflow shortcut pills ────────────────────────────────── */}
      <div className="presets-pills">
        {WORKFLOW_STEPS.map((step) => (
          <button
            key={step.id}
            className={`preset-pill ${step.cls}`}
            onClick={() => onSelectPreset(step.id, step.params)}
            title={`Jump to ${step.label} endpoint`}
          >
            {step.icon} {step.label}
          </button>
        ))}
      </div>
    </div>
  );
};
