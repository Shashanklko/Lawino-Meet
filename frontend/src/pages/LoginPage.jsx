import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Video,
  Scale,
  User,
  Briefcase,
  Building,
  Sparkles,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login({ identifier: identifier.trim(), password });
      if (user.role === 'LAWYER') {
        navigate('/lawyer');
      } else if (user.role === 'FIRM_ADMIN') {
        navigate('/firm');
      } else {
        navigate('/client');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Invalid credentials. Please verify your email/username and password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen max-h-screen w-screen overflow-hidden bg-[#FAF7F2] text-[#2E2A29] flex flex-col lg:flex-row relative select-none">
      {/* =========================================================================
          TOP-RIGHT CONTROLS: Circular Back Button on Right Side
          ========================================================================= */}
      <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 flex items-center space-x-2.5">
        {/* Circular Back Button on Right Side */}
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-[#E8E2D8] shadow-sm flex items-center justify-center text-stone-700 hover:text-[#831826] hover:scale-105 transition-all group cursor-pointer"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* =========================================================================
          LEFT PANEL: Enterprise Brand & Trust (MNC Split Screen)
          ========================================================================= */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/2 bg-[#3A0B12] text-white p-8 lg:p-12 flex-col justify-between relative overflow-hidden h-full">
        {/* Ambient background glow & subtle watermark */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-[#831826] blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-[#E5A952] blur-3xl" />
        </div>

        {/* Top Brand Header */}
        <div className="relative z-10 space-y-4">
          <Link to="/" className="inline-flex items-center space-x-3 group">
            <img
              src="/logo.jpg"
              alt="LawinoMeet"
              className="w-9 h-9 rounded-full object-cover ring-2 ring-[#E5A952]/40 shadow-md group-hover:scale-105 transition"
            />
            <span className="font-serif font-bold text-xl tracking-tight text-cream-50">
              LawinoMeet
            </span>
          </Link>

          <div className="space-y-2 pt-2">
            <span className="text-[10px] font-sans font-semibold tracking-[0.25em] text-[#E5A952] uppercase block">
              ENTERPRISE LEGAL CRM
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-50 leading-tight">
              Clarity, trust, and verified justice.
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/80 font-sans font-light leading-relaxed max-w-sm">
              Securely sign in to conduct privileged consultations, access encrypted WebRTC video rooms, and manage client retainers.
            </p>
          </div>
        </div>

        {/* Middle: Security & Compliance Badges */}
        <div className="relative z-10 my-4 space-y-2.5">
          <div className="p-3.5 rounded-xl bg-white/[0.06] border border-white/10 backdrop-blur-sm space-y-2">
            <div className="flex items-center space-x-2 text-xs font-medium text-cream-100">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Bar Council Verified Advocates</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-cream-100">
              <Lock className="w-3.5 h-3.5 text-[#E5A952] shrink-0" />
              <span>256-Bit SSL Encrypted Video &amp; Client Privilege</span>
            </div>
            <div className="flex items-center space-x-2 text-xs font-medium text-cream-100">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Non-Withdrawable Retainer Escrow Protection</span>
            </div>
          </div>
        </div>

        {/* Bottom Quote & Copyright */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-2">
          <p className="text-[11px] text-cream-300 font-serif italic">
            “No one should feel helpless just because they don't know where to find verified legal counsel.”
          </p>
          <div className="flex items-center justify-between text-[10px] text-cream-400 font-sans">
            <span>&copy; {new Date().getFullYear()} LawinoMeet</span>
            <span className="flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>Sanctuary Active</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Compact 1-Frame SaaS Form (Zero Vertical Scrolling)
          ========================================================================= */}
      <div className="flex-1 h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-sm space-y-4">
          {/* Header */}
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2E2A29]">
              Sign in to account
            </h2>
            <p className="text-xs text-[#716B64] font-sans font-light">
              Enter your credentials to enter your workspace.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <div className="space-y-3.5">
            <form onSubmit={handleSubmit} className="space-y-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="name@example.com or advocate username"
                    className="w-full text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg px-3 py-2 text-[#2E2A29] placeholder:text-[#8C847E] focus:outline-none focus:border-[#831826] focus:bg-white transition"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                      Password
                    </label>
                    <a
                      href="mailto:support@lawinomeet.com?subject=Password%20Reset"
                      className="text-[11px] text-[#831826] hover:underline"
                    >
                      Forgot?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter password"
                      className="w-full text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg px-3 py-2 pr-9 text-[#2E2A29] placeholder:text-[#8C847E] focus:outline-none focus:border-[#831826] focus:bg-white transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-2.5 top-2 text-[#8C847E] hover:text-[#2E2A29] transition cursor-pointer"
                      title={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#831826] hover:bg-[#6c131f] text-white text-xs font-serif font-medium uppercase tracking-wider transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>

          {/* Footer Navigation */}
          <div className="pt-2 border-t border-[#E8E2D8] text-center">
            <p className="text-xs text-[#716B64]">
              Don't have an account yet?{' '}
              <Link to="/register" className="font-semibold text-[#831826] hover:underline">
                Create Account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
