import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Scale,
  Sparkles,
  ArrowLeft,
  Briefcase,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get('role') === 'LAWYER' ? 'LAWYER' : 'CLIENT';

  // Multi-step Registration: Step 1 (Name, Email, Password) -> Step 2 (Username Handle)
  const [step, setStep] = useState(1);

  // Form Fields
  const [role, setRole] = useState(initialRole);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('');
  const [suggestions, setSuggestions] = useState([]);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  // Helper to auto-generate clean username suggestions from Name, Email, and Role
  const generateUsernameSuggestions = (nameInput, emailInput, userRole) => {
    const clean = (str) => (str || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const parts = (nameInput || '').trim().split(/\s+/).map(clean).filter(Boolean);
    const emailPrefix = clean((emailInput || '').split('@')[0] || '');

    const first = parts[0] || emailPrefix || 'user';
    const last = parts.length > 1 ? parts[parts.length - 1] : '';
    const randNum = () => Math.floor(100 + Math.random() * 900);
    const shortRand = () => Math.floor(10 + Math.random() * 90);

    const pool = [];
    if (userRole === 'LAWYER') {
      pool.push(`adv_${first}`);
      if (last) pool.push(`adv_${first}_${last}`);
      pool.push(`${first}_legal`);
      pool.push(`${first}_counsel`);
      if (last) pool.push(`${first}_${last}`);
      pool.push(`adv_${first}_${shortRand()}`);
      pool.push(`${first}_${randNum()}`);
    } else {
      if (last) pool.push(`${first}_${last}`);
      pool.push(`${first}_${randNum()}`);
      if (emailPrefix && emailPrefix !== first) pool.push(`${emailPrefix}_${shortRand()}`);
      pool.push(`${first}_${shortRand()}`);
      pool.push(`${first}_client`);
      if (last) pool.push(`${last}_${first}`);
    }

    // Deduplicate & sanitize (min length 3, max length 20)
    const unique = Array.from(
      new Set(
        pool
          .map((c) => c.replace(/[^a-z0-9_]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 20))
          .filter((c) => c.length >= 3)
      )
    );

    return unique.slice(0, 4);
  };

  // Step 1 Validation -> Move to Step 2
  const handleProceedToStep2 = (e) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please provide your full legal name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please provide a valid email address.');
      return;
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }

    const generated = generateUsernameSuggestions(fullName, email, role);
    setSuggestions(generated);

    // Auto-generate suggested username if not yet manually set
    if (!username.trim() && generated.length > 0) {
      setUsername(generated[0]);
    }

    setStep(2);
  };

  // Re-roll or trigger Auto-suggest
  const handleAutoSuggest = () => {
    const fresh = generateUsernameSuggestions(fullName, email, role);
    setSuggestions(fresh);
    const nextPick = fresh.find((s) => s !== username) || fresh[0];
    if (nextPick) {
      setUsername(nextPick);
    }
  };

  // Step 2 Final Submission
  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (!cleanUsername || cleanUsername.length < 3) {
      setError('Username must be at least 3 characters long and alphanumeric.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        username: cleanUsername,
        email: email.trim().toLowerCase(),
        password,
        role,
      };

      const user = await register(payload);
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
          'Registration failed. Username or email may already be registered.'
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
      <div className="fixed top-4 right-4 sm:top-5 sm:right-6 z-50 flex items-center space-x-2">
        <Link
          to="/"
          className="w-10 h-10 rounded-full bg-white/95 hover:bg-white border border-[#E8E2D8] shadow-sm flex items-center justify-center text-stone-700 hover:text-[#831826] hover:scale-105 transition-all group cursor-pointer"
          title="Back to Home"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* =========================================================================
          LEFT PANEL: Enterprise Brand, Security & Workflow (MNC Split Screen)
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
              SEAMLESS ONBOARDING
            </span>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif text-cream-50 leading-tight">
              Join India's verified legal sanctuary.
            </h1>
            <p className="text-xs sm:text-sm text-cream-200/80 font-sans font-light leading-relaxed max-w-sm">
              Create your account in seconds. Additional credentials, chamber details, and preferences can be completed anytime in Profile Settings.
            </p>
          </div>
        </div>

        {/* Step Progression Indicators */}
        <div className="relative z-10 my-4 space-y-2.5">
          <div className="flex items-center space-x-2.5 text-xs">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 1 ? 'bg-[#E5A952] text-[#2C080E]' : 'bg-emerald-500 text-white'
              }`}
            >
              {step > 1 ? '✓' : '1'}
            </div>
            <span className={step === 1 ? 'text-white font-medium' : 'text-cream-300'}>
              Account Credentials (Name, Email, Password)
            </span>
          </div>

          <div className="flex items-center space-x-2.5 text-xs">
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[11px] ${
                step === 2
                  ? 'bg-[#E5A952] text-[#2C080E]'
                  : 'bg-white/10 text-cream-300 border border-white/20'
              }`}
            >
              2
            </div>
            <span className={step === 2 ? 'text-white font-medium' : 'text-cream-400'}>
              Unique LawinoMeet Handle Setup
            </span>
          </div>

          <div className="flex items-center space-x-2.5 text-xs text-cream-400">
            <div className="w-6 h-6 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[11px]">
              3
            </div>
            <span>Profile Details &amp; Bar Council Credentials</span>
          </div>
        </div>

        {/* Bottom Trust & Compliance */}
        <div className="relative z-10 pt-4 border-t border-white/10 space-y-2">
          <div className="flex items-center space-x-4 text-xs text-cream-200">
            <span className="flex items-center space-x-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Bar Council Verified</span>
            </span>
            <span className="flex items-center space-x-1">
              <Lock className="w-3.5 h-3.5 text-[#E5A952]" />
              <span>256-Bit SSL Encrypted</span>
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px] text-cream-400 font-sans">
            <span>&copy; {new Date().getFullYear()} LawinoMeet Technologies</span>
            <span>Zero Data Selling</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          RIGHT PANEL: Compact 1-Frame Registration Card (No Vertical Scrolling)
          ========================================================================= */}
      <div className="flex-1 h-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-y-auto">
        <div className="w-full max-w-md bg-white p-6 sm:p-7 rounded-2xl border border-[#E8E2D8] shadow-sm space-y-4">
          {/* Header */}
          <div className="space-y-0.5">
            <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#2E2A29]">
              {step === 1 ? 'Create your account' : 'Choose your username'}
            </h2>
            <p className="text-xs text-[#716B64] font-sans font-light">
              {step === 1
                ? 'Get started in under 30 seconds. Complete your profile anytime later.'
                : 'Confirm your personal handle. You can update details in profile settings.'}
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* =====================================================================
              STEP 1: Name, Email, Password & Role Selector
              ===================================================================== */}
          {step === 1 ? (
            <form onSubmit={handleProceedToStep2} className="space-y-3.5">
              {/* Role Selector Tabs */}
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                  Registering as:
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-[#FAF8F5] p-1 rounded-xl border border-[#E8E2D8]">
                  <button
                    type="button"
                    onClick={() => setRole('CLIENT')}
                    className={`py-1.5 px-3 text-xs font-sans font-medium rounded-lg transition flex items-center justify-center space-x-1.5 cursor-pointer ${
                      role === 'CLIENT'
                        ? 'bg-[#831826] text-white shadow-xs'
                        : 'text-[#66605B] hover:text-[#2E2A29]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Client (Seek Advice)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('LAWYER')}
                    className={`py-1.5 px-3 text-xs font-sans font-medium rounded-lg flex items-center justify-center space-x-1.5 transition cursor-pointer ${
                      role === 'LAWYER'
                        ? 'bg-[#831826] text-white shadow-xs'
                        : 'text-[#66605B] hover:text-[#2E2A29]'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>Advocate / Counsel</span>
                  </button>
                </div>
              </div>

              {/* 1. Full Legal Name */}
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={role === 'LAWYER' ? 'e.g. Adv. Rohit Verma' : 'e.g. Rohit Verma'}
                  className="w-full text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg px-3 py-2 text-[#2E2A29] placeholder:text-[#8C847E] focus:outline-none focus:border-[#831826] focus:bg-white transition"
                />
              </div>

              {/* 2. Email Address */}
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg px-3 py-2 text-[#2E2A29] placeholder:text-[#8C847E] focus:outline-none focus:border-[#831826] focus:bg-white transition"
                />
              </div>

              {/* 3. Password */}
              <div className="space-y-1">
                <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create strong password (min 8 chars)"
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

              {/* Continue Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-lg bg-[#831826] hover:bg-[#6c131f] text-white text-xs font-serif font-medium uppercase tracking-wider transition shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>Continue to Handle Setup</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          ) : (
            /* =====================================================================
                STEP 2: Username Confirmation & Deferring Details
                ===================================================================== */
            <form onSubmit={handleFinalSubmit} className="space-y-3.5">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center space-x-1 text-xs text-[#8C847E] hover:text-[#831826] transition font-medium cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to basic details</span>
              </button>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-sans font-medium uppercase tracking-wider text-[#524B47]">
                    LawinoMeet Handle *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSuggest}
                    className="inline-flex items-center space-x-1 text-[11px] text-[#831826] hover:text-[#5c0e18] font-medium transition cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-[#E5A952]" />
                    <span>Auto-suggest</span>
                  </button>
                </div>

                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-semibold text-[#831826]">@</span>
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                    placeholder="username"
                    className="w-full text-xs bg-[#FAF8F5] border border-[#E8E2D8] rounded-lg pl-7 pr-20 py-2 text-[#2E2A29] focus:outline-none focus:border-[#831826] focus:bg-white transition font-mono"
                  />
                  <button
                    type="button"
                    onClick={handleAutoSuggest}
                    className="absolute right-1.5 px-2 py-1 rounded bg-white hover:bg-[#831826]/10 text-[#831826] border border-[#E8E2D8] text-[10px] font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Sparkles className="w-2.5 h-2.5 text-[#E5A952]" />
                    <span>Suggest</span>
                  </button>
                </div>

                {/* Suggestions Pills */}
                {suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-0.5">
                    {suggestions.map((sug) => {
                      const isSelected = username === sug;
                      return (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setUsername(sug)}
                          className={`px-2 py-0.5 rounded text-[11px] font-mono transition border cursor-pointer ${
                            isSelected
                              ? 'bg-[#831826] text-white border-[#831826]'
                              : 'bg-[#FAF8F5] text-[#524B47] border-[#E8E2D8] hover:border-[#831826]'
                          }`}
                        >
                          @{sug}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Notice */}
              <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#E8E2D8] space-y-1 text-xs">
                <div className="flex items-center space-x-1.5 font-serif font-bold text-[#2E2A29]">
                  <Sparkles className="w-3.5 h-3.5 text-[#E5A952]" />
                  <span>Profile Settings Activation</span>
                </div>
                <p className="text-[11px] text-[#66605B] leading-relaxed">
                  {role === 'LAWYER'
                    ? 'State Bar Council number, court enrollments, chamber address, and consultation fees can be filled anytime in Profile Settings.'
                    : 'Personal details and preferences can be completed anytime in Profile Settings.'}
                </p>
              </div>

              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-lg bg-[#831826] hover:bg-[#6c131f] text-white text-xs font-serif font-medium uppercase tracking-wider transition shadow-sm disabled:opacity-50 flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <span>{loading ? 'Creating Account...' : 'Complete Registration & Enter'}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}

          {/* Footer Navigation */}
          <div className="pt-2 border-t border-[#E8E2D8] text-center">
            <p className="text-xs text-[#716B64]">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-[#831826] hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
