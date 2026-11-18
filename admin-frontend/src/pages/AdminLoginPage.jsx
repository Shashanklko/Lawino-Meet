import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import { DOMAIN_CONFIG } from '../utils/domainConfig';

export const AdminLoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAdminAuth();
  const navigate = useNavigate();

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
      <div className="w-full max-w-md bg-[#1C1816] rounded-3xl border border-stone-800 p-6 sm:p-8 shadow-2xl relative z-10 space-y-6">
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

        {/* Credentials Authentication Form */}
        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Admin Identifier
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="admin@lawinomeet.com or platform_admin"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-mono text-stone-400 uppercase tracking-wider mb-1">
                Security Passcode
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter administrator password"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-stone-900 border border-stone-800 text-xs text-stone-200 placeholder:text-stone-600 focus:outline-none focus:border-amber-500 font-mono transition"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#941B2B] to-[#5a101b] hover:from-[#aa1f32] hover:to-[#6c131f] text-white text-xs font-serif font-bold uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 mt-2"
            >
              <span>{loading ? 'Validating Session...' : 'Authorize Admin Session'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-2 text-center">
            <span className="text-[10px] text-stone-600 font-mono">
              LawinoMeet Legal Cloud Infrastructure · Strictly Restricted
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
