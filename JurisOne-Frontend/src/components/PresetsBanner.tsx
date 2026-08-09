import React from 'react';
import type { EndpointDefinition } from '../types/api';
import { Zap, Sparkles, UserPlus, LogIn, Calendar, CreditCard, DollarSign, ShieldAlert } from 'lucide-react';

interface PresetsBannerProps {
  endpoints: EndpointDefinition[];
  onSelectPreset: (endpointId: string, customParams?: Record<string, any>, customBody?: any) => void;
}

export const PresetsBanner: React.FC<PresetsBannerProps> = ({ onSelectPreset }) => {
  return (
    <div className="presets-banner glass-panel">
      <div className="presets-header">
        <Sparkles size={16} className="text-amber" />
        <span className="presets-title">Quick Test Scenarios & Workflows</span>
      </div>

      <div className="presets-pills">
        <button
          className="preset-pill btn-glow-cyan"
          onClick={() => onSelectPreset('auth-register-client')}
          title="Pre-fill Register Request"
        >
          <UserPlus size={14} /> 1. Register Client
        </button>

        <button
          className="preset-pill btn-glow-amber"
          onClick={() => onSelectPreset('auth-login')}
          title="Pre-fill Login Request to obtain JWT Token"
        >
          <LogIn size={14} /> 2. Login & Save JWT Token
        </button>

        <button
          className="preset-pill btn-glow-indigo"
          onClick={() => onSelectPreset('consultation-request')}
          title="Submit consultation request"
        >
          <Calendar size={14} /> 3. Request Consultation
        </button>

        <button
          className="preset-pill btn-glow-purple"
          onClick={() => onSelectPreset('consultation-approve', { id: 1, customFee: 150.00 })}
          title="Lawyer approves consultation with custom fee"
        >
          <Zap size={14} /> 4. Approve Consultation ($150)
        </button>

        <button
          className="preset-pill btn-glow-emerald"
          onClick={() => onSelectPreset('payment-checkout', { consultationId: 1 })}
          title="Process consultation payment"
        >
          <CreditCard size={14} /> 5. Process Payment Checkout
        </button>

        <button
          className="preset-pill btn-glow-cyan"
          onClick={() => onSelectPreset('payout-request', { lawyerId: 2, amount: 100.00, bankDetails: 'IBAN: US9912345' })}
          title="Lawyer requests earnings payout"
        >
          <DollarSign size={14} /> 6. Request Lawyer Payout
        </button>

        <button
          className="preset-pill btn-glow-ruby"
          onClick={() => onSelectPreset('dashboard-admin')}
          title="View Admin metrics"
        >
          <ShieldAlert size={14} /> 7. Admin Dashboard Metrics
        </button>
      </div>
    </div>
  );
};
