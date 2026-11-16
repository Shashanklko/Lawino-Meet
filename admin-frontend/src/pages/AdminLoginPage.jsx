import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Building,
  Scale,
  LifeBuoy,
  DollarSign,
  Activity,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { DOMAIN_CONFIG } from '../utils/domainConfig';
import { ADMIN_SUB_ROLES } from '../utils/adminPermissions';

export const AdminLoginPage = () => {
  const [identifier, setIdentifier] = useState('admin@lawinomeet.com');
  const [password, setPassword] = useState('••••••••');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, loginAsDemoSubRole } = useAdminAuth();
  const navigate = useNavigate();

  const handleDemoSubRoleSelect = (subRoleKey) => {
    loginAsDemoSubRole(subRoleKey);
    navigate('/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login({ identifier: identifier.trim(), password });
      navigate('/');
    } catch (err) {
      setError(err.message || 'Administrative verification failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#161210] text-stone-200 flex items-center justify-center p-4 sm:p-6 select-none relative overflow-hidden font-sans">
      {/* Ambient background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#941B2B]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Public Site link */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-8 z-50">
        <a
          href={DOMAIN_CONFIG.CLIENT_PORTAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-300 text-xs transition"
          title="Visit Public Website"
        >
          <span>Public Website</span>
          <ExternalLink className="w-3.5 h-3.5 text-stone-400" />
        </a>
      </div>

      {/* Main Admin Authentication Card */}
      <div className="w-full max-w-lg bg-[#1C1816] rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center mb-1">
            <img
              src="/logo.jpg"
              alt="LawinoMeet"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-[#E5A952]/60 shadow-lg"
            />
          </div>
          <div>
            <h1 className="font-serif font-bold text-2xl text-stone-100 tracking-tight">
              LawinoMeet
            </h1>
            <p className="text-[10px] font-mono tracking-widest text-amber-400 uppercase font-semibold mt-0.5">
              PLATFORM ADMINISTRATION PORTAL
            </p>
          </div>
        </div>

        {/* 1-Click Administrative Role Selection */}
        <div className="p-3.5 rounded-2xl bg-stone-900/70 border border-stone-800/80 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5 text-xs font-serif font-bold text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>1-Click Role-Based Clearance</span>
            </div>
            <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
              Instant Access
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => handleDemoSubRoleSelect('SUPER_ADMIN')}
              className="p-2.5 rounded-xl border border-stone-800 bg-[#201C1A] hover:border-amber-500/50 hover:bg-[#251E1C] text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <ShieldCheck className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition" />
                <span className="text-[9px] font-mono text-purple-400 font-bold">Supreme</span>
              </div>
              <div className="text-xs font-bold text-stone-100">Super Admin</div>
              <div className="text-[9px] text-stone-400 truncate">Full Platform Authority</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSubRoleSelect('FINANCE_ADMIN')}
              className="p-2.5 rounded-xl border border-stone-800 bg-[#201C1A] hover:border-emerald-500/50 hover:bg-[#251E1C] text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition" />
                <span className="text-[9px] font-mono text-emerald-400 font-bold">10% Fee</span>
              </div>
              <div className="text-xs font-bold text-stone-100">Finance Director</div>
              <div className="text-[9px] text-stone-400 truncate">Payouts &amp; Treasury</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSubRoleSelect('VERIFICATION_ADMIN')}
              className="p-2.5 rounded-xl border border-stone-800 bg-[#201C1A] hover:border-blue-500/50 hover:bg-[#251E1C] text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <Scale className="w-3.5 h-3.5 text-blue-400 group-hover:scale-110 transition" />
                <span className="text-[9px] font-mono text-blue-400 font-bold">Bar Council</span>
              </div>
              <div className="text-xs font-bold text-stone-100">Verification Officer</div>
              <div className="text-[9px] text-stone-400 truncate">Advocate &amp; Firm Audits</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSubRoleSelect('SUPPORT_ADMIN')}
              className="p-2.5 rounded-xl border border-stone-800 bg-[#201C1A] hover:border-rose-500/50 hover:bg-[#251E1C] text-left transition group cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <LifeBuoy className="w-3.5 h-3.5 text-rose-400 group-hover:scale-110 transition" />
                <span className="text-[9px] font-mono text-rose-400 font-bold">Disputes</span>
              </div>
              <div className="text-xs font-bold text-stone-100">Support Lead</div>
              <div className="text-[9px] text-stone-400 truncate">Client &amp; Lawyer Tickets</div>
            </button>

            <button
              type="button"
              onClick={() => handleDemoSubRoleSelect('OPERATIONS_ADMIN')}
              className="p-2.5 rounded-xl border border-stone-800 bg-[#201C1A] hover:border-stone-500/50 hover:bg-[#251E1C] text-left transition group cursor-pointer col-span-2 sm:col-span-1"
            >
              <div className="flex items-center justify-between mb-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400 group-hover:scale-110 transition" />
                <span className="text-[9px] font-mono text-cyan-400 font-bold">Hearings</span>
              </div>
              <div className="text-xs font-bold text-stone-100">Ops Coordinator</div>
              <div className="text-[9px] text-stone-400 truncate">Escalations &amp; Telemetry</div>
            </button>
          </div>
        </div>

        {/* Credentials Authentication Form */}
        <div className="space-y-3">
          <div className="relative flex items-center justify-center my-1">
            <div className="border-t border-stone-800 w-full" />
            <span className="bg-[#1C1816] px-3 text-[10px] font-mono uppercase tracking-wider text-stone-500 absolute">
              or sign in with admin certificate
            </span>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Admin Identifier
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@lawinomeet.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Security Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#941B2B] to-[#5a101b] hover:from-[#aa1f32] hover:to-[#6c131f] text-white text-xs font-serif font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              <span>{loading ? 'Validating Session...' : 'Authorize Admin Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
