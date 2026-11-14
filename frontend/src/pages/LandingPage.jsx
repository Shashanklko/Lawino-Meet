import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Video,
  Building,
  Calendar,
  Lock,
  ArrowRight,
  Search,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
  MapPin,
  CreditCard,
  FileCheck,
  Compass,
  Gavel,
  ChevronRight,
} from 'lucide-react';

const practiceAreas = [
  { name: 'Corporate & M&A', code: 'CORPORATE_LAW', cases: '1,420+ Consultations', desc: 'Mergers, shareholder agreements, regulatory compliance & boardroom advisory.' },
  { name: 'Criminal Defense & Bail', code: 'CRIMINAL_DEFENSE', cases: '2,890+ Consultations', desc: 'Anticipatory bail, trial defense, CBI/ED summons, High Court litigation.' },
  { name: 'Family & Matrimonial', code: 'FAMILY_LAW', cases: '3,100+ Consultations', desc: 'Divorce settlements, child custody, alimony & high-net-worth estate partition.' },
  { name: 'Intellectual Property', code: 'INTELLECTUAL_PROPERTY', cases: '980+ Consultations', desc: 'Patents, trademark infringement, copyright protection & technology licensing.' },
  { name: 'Cyber & White Collar', code: 'CYBER_LAW', cases: '1,150+ Consultations', desc: 'Financial cyber fraud, IT Act investigations, privacy and data disputes.' },
  { name: 'Real Estate & Land', code: 'CIVIL_LITIGATION', cases: '2,340+ Consultations', desc: 'Title search, builder dispute, RERA trials & commercial property arbitration.' },
];

export const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [consultationMode, setConsultationMode] = useState('ALL');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    const queryParam = searchQuery.trim() ? `query=${encodeURIComponent(searchQuery.trim())}` : '';
    const modeParam = consultationMode !== 'ALL' ? `mode=${consultationMode}` : '';
    const params = [queryParam, modeParam].filter(Boolean).join('&');
    navigate(`/lawyers${params ? `?${params}` : ''}`);
  };

  return (
    <div className="bg-cream-50 text-maroon-950 overflow-hidden relative">
      {/* =========================================================================
          HERO CHAPTER: The Ocean of Justice & The Sanctuary
          ========================================================================= */}
      <section className="relative min-h-[90vh] bg-gradient-to-b from-maroon-950 via-maroon-900 to-maroon-950 text-cream-100 pt-16 pb-32 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
        {/* Subtle Ambient Waves & Glow Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -left-40 w-96 h-96 bg-luxury-gold/10 rounded-full blur-3xl animate-float-slow" />
          <div className="absolute top-1/2 -right-40 w-[30rem] h-[30rem] bg-maroon-700/20 rounded-full blur-3xl animate-float-delayed" />
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[radial-gradient(#c5a880_1px,transparent_1px)] [background-size:32px_32px] opacity-15" />
        </div>

        <div className="relative max-w-5xl mx-auto text-center space-y-8 z-10">
          {/* Presidential Top Badge */}
          <div className="inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full bg-luxury-gold/15 border border-luxury-gold/40 text-luxury-gold-light text-xs font-serif tracking-widest uppercase shadow-md">
            <Sparkles className="w-3.5 h-3.5 text-luxury-gold" />
            <span>Where Legal Eminence Meets Absolute Trust</span>
          </div>

          {/* Majestic Hero Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-serif font-black tracking-tight leading-[1.15] text-cream-50">
            Navigating Critical Legal Waters with{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-luxury-gold-light via-luxury-gold to-luxury-gold-dark italic">
              Supreme Advocates.
            </span>
          </h1>

          <p className="max-w-3xl mx-auto text-base sm:text-lg text-cream-200 font-sans font-light leading-relaxed">
            When disputes arise, clarity is your strongest shield. Connect instantly with verified High Court & Supreme Court advocates
            via <strong className="font-semibold text-luxury-gold">Encrypted HD Video</strong> or reserve a private audience in their <strong className="font-semibold text-luxury-gold">Chambers</strong>.
          </p>

          {/* Interactive Mode Filter + Search Bar */}
          <div className="max-w-3xl mx-auto space-y-3">
            {/* Mode Switcher Tabs */}
            <div className="flex justify-center space-x-3 text-xs font-serif tracking-wider uppercase">
              <button
                type="button"
                onClick={() => setConsultationMode('ALL')}
                className={`px-4 py-2 rounded-xl border transition ${
                  consultationMode === 'ALL'
                    ? 'bg-luxury-gold text-maroon-950 font-bold border-luxury-gold shadow-md'
                    : 'bg-black/30 text-cream-200 border-luxury-gold/30 hover:bg-black/50'
                }`}
              >
                All Consultations
              </button>
              <button
                type="button"
                onClick={() => setConsultationMode('ONLINE')}
                className={`px-4 py-2 rounded-xl border flex items-center space-x-1.5 transition ${
                  consultationMode === 'ONLINE'
                    ? 'bg-luxury-gold text-maroon-950 font-bold border-luxury-gold shadow-md'
                    : 'bg-black/30 text-cream-200 border-luxury-gold/30 hover:bg-black/50'
                }`}
              >
                <Video className="w-3.5 h-3.5" />
                <span>Online Video</span>
              </button>
              <button
                type="button"
                onClick={() => setConsultationMode('OFFLINE')}
                className={`px-4 py-2 rounded-xl border flex items-center space-x-1.5 transition ${
                  consultationMode === 'OFFLINE'
                    ? 'bg-luxury-gold text-maroon-950 font-bold border-luxury-gold shadow-md'
                    : 'bg-black/30 text-cream-200 border-luxury-gold/30 hover:bg-black/50'
                }`}
              >
                <Building className="w-3.5 h-3.5" />
                <span>Chamber In-Person</span>
              </button>
            </div>

            {/* Smart Search Capsule */}
            <form
              onSubmit={handleSearch}
              className="flex flex-col sm:flex-row gap-2.5 p-2.5 rounded-2xl bg-maroon-950/80 border border-luxury-gold/40 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex-1 flex items-center px-4 py-3 bg-black/40 rounded-xl border border-luxury-gold/20">
                <Search className="w-5 h-5 text-luxury-gold shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by advocate name, legal issue, High Court, or practice area..."
                  className="w-full bg-transparent px-3 text-xs sm:text-sm text-cream-100 placeholder-cream-400/60 focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="px-7 py-3 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-black text-xs uppercase tracking-wider transition shadow-lg flex items-center justify-center space-x-2 shrink-0"
              >
                <span>Find Advocates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>

          {/* Pillars of Integrity */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto pt-8 border-t border-luxury-gold/20 text-xs font-serif text-cream-300">
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-luxury-gold" />
              <span>100% Bar Verified</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Lock className="w-4 h-4 text-luxury-gold" />
              <span>Encrypted Video Rooms</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Building className="w-4 h-4 text-luxury-gold" />
              <span>High Court Chambers</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Award className="w-4 h-4 text-luxury-gold" />
              <span>Transparent Fee Index</span>
            </div>
          </div>
        </div>

        {/* =========================================================================
            OCEAN WAVE TRANSITION 1 (Maroon to Cream)
            ========================================================================= */}
        <div className="wave-container absolute bottom-0 left-0 w-full overflow-hidden leading-none">
          <svg
            className="wave-svg relative block w-full h-16 sm:h-24"
            viewBox="0 0 1200 120"
            preserveAspectRatio="none"
          >
            <path
              d="M0,0 C150,90 350,-40 500,50 C650,140 900,10 1200,60 L1200,120 L0,120 Z"
              fill="#FFFEFA"
            ></path>
          </svg>
        </div>
      </section>

      {/* =========================================================================
          ACT II: The Dual Consultation Paradigm (Online vs. Chamber Workflow)
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-serif font-bold tracking-[0.2em] text-maroon-700 uppercase">
            Two Formats • One Standard of Excellence
          </span>
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-maroon-950">
            Choose Your Counsel Format
          </h2>
          <p className="text-sm text-stone-600 font-sans leading-relaxed">
            Whether you need urgent video counsel from anywhere in the world, or prefer an in-person conference
            at an advocate's official chamber, Lawino Meet guarantees complete privacy and streamlined workflow.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Format 1: Virtual Consultation */}
          <div className="p-8 rounded-3xl bg-white border border-cream-300 shadow-xl hover:shadow-2xl transition space-y-6 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-maroon-900 text-luxury-gold flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <Video className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Instant Access
                </span>
                <span className="text-xs text-stone-400">Zero Travel Required</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-maroon-900">
                Online Encrypted Video Consultation
              </h3>
              <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                Connect directly via peer-to-peer WebRTC video. Screen share case petitions, examine legal contracts in real-time,
                and maintain full attorney-client privilege over encrypted SRTP protocols.
              </p>
            </div>

            {/* Workflow steps */}
            <div className="p-4 rounded-2xl bg-cream-100 border border-cream-300 space-y-3 text-xs">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-maroon-800 text-cream-100 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <span className="text-maroon-950 font-medium">Pick open slot from advocate's live calendar</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-maroon-800 text-cream-100 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <span className="text-maroon-950 font-medium">Pay securely & receive encrypted room link</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-maroon-800 text-cream-100 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <span className="text-maroon-950 font-medium">1-click join video room on scheduled time</span>
              </div>
            </div>

            <Link
              to="/lawyers?mode=ONLINE"
              className="inline-flex items-center space-x-2 text-xs font-serif font-bold text-maroon-800 hover:text-maroon-950 transition uppercase tracking-wider"
            >
              <span>Explore Online Advocates</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Format 2: Chamber Offline In-Person Consultation */}
          <div className="p-8 rounded-3xl bg-maroon-950 text-cream-100 border border-luxury-gold/40 shadow-xl hover:shadow-2xl transition space-y-6 relative overflow-hidden group">
            <div className="w-14 h-14 rounded-2xl bg-luxury-gold text-maroon-950 flex items-center justify-center shadow-lg group-hover:scale-105 transition">
              <Building className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-0.5 rounded-full bg-luxury-gold/20 text-luxury-gold-light border border-luxury-gold/40 text-[10px] font-bold uppercase tracking-wider">
                  Chamber Privilege
                </span>
                <span className="text-xs text-cream-400">High Court / Chamber Meet</span>
              </div>
              <h3 className="text-2xl font-serif font-bold text-cream-50">
                Chamber In-Person Consultation
              </h3>
              <p className="text-xs sm:text-sm text-cream-300 leading-relaxed">
                Meet the advocate in person at their official chamber. To protect client confidentiality and advocate's court schedule,
                chamber details and payment gateway unlock <strong>only after the advocate reviews and accepts</strong> your matter.
              </p>
            </div>

            {/* Workflow steps */}
            <div className="p-4 rounded-2xl bg-black/40 border border-luxury-gold/30 space-y-3 text-xs text-cream-200">
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-luxury-gold text-maroon-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <span>Client requests Chamber Consultation with case notes</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-luxury-gold text-maroon-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <span>Advocate reviews request & confirms court readiness</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-6 h-6 rounded-full bg-luxury-gold text-maroon-950 font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <span className="text-luxury-gold font-semibold">
                  Chamber address & payment details unlock for client!
                </span>
              </div>
            </div>

            <Link
              to="/lawyers?mode=OFFLINE"
              className="inline-flex items-center space-x-2 text-xs font-serif font-bold text-luxury-gold hover:text-luxury-gold-light transition uppercase tracking-wider"
            >
              <span>Request Chamber Meeting</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT III: Practice Areas (The Domains of Law)
          ========================================================================= */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-cream-100 border-t border-cream-300 relative">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <span className="text-xs font-serif font-bold tracking-[0.2em] text-maroon-700 uppercase">
                Specialized Jurisprudence
              </span>
              <h2 className="text-3xl sm:text-4xl font-serif font-black text-maroon-950 mt-1">
                Eminent Practice Areas
              </h2>
            </div>
            <Link
              to="/lawyers"
              className="text-xs font-serif font-bold uppercase tracking-wider text-maroon-800 hover:text-maroon-950 flex items-center space-x-1"
            >
              <span>Browse All Advocates</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {practiceAreas.map((area) => (
              <Link
                key={area.code}
                to={`/lawyers?specialization=${area.code}`}
                className="group p-6 rounded-3xl bg-white border border-cream-300 hover:border-luxury-gold hover:shadow-xl transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="w-12 h-12 rounded-2xl bg-cream-200 text-maroon-800 flex items-center justify-center group-hover:bg-maroon-900 group-hover:text-luxury-gold transition shadow-sm">
                    <Scale className="w-6 h-6" />
                  </div>
                  <h3 className="font-serif font-bold text-lg text-maroon-950 mt-4 group-hover:text-maroon-700 transition">
                    {area.name}
                  </h3>
                  <p className="text-xs text-stone-600 mt-2 leading-relaxed">
                    {area.desc}
                  </p>
                </div>

                <div className="pt-3 border-t border-cream-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-luxury-gold-dark">{area.cases}</span>
                  <span className="text-maroon-800 font-serif font-bold flex items-center space-x-1 group-hover:translate-x-1 transition">
                    <span>View Advocates</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* =========================================================================
          ACT IV: The Wave Storytelling Carousel / Legal Confidence Banner
          ========================================================================= */}
      <section className="py-24 bg-gradient-to-br from-maroon-950 via-maroon-900 to-maroon-950 text-cream-100 relative overflow-hidden">
        {/* Layered fluid wave background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <path d="M0,50 Q25,20 50,50 T100,50 L100,100 L0,100 Z" fill="#C5A880" />
          </svg>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-12">
          <div className="space-y-4 max-w-2xl mx-auto">
            <span className="text-xs font-serif tracking-[0.25em] text-luxury-gold uppercase font-bold">
              Uncompromising Standards
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-black leading-tight text-cream-50">
              Your Legal Sanctuary in Every Crisis
            </h2>
            <p className="text-xs sm:text-sm text-cream-300 font-light leading-relaxed">
              Every advocate on Lawino Meet is independently verified with their respective State Bar Council.
              Zero solicitation, zero hidden retainers, 100% focused on legal merit.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
            <div className="p-6 rounded-2xl bg-white/5 border border-luxury-gold/30 backdrop-blur space-y-3">
              <Compass className="w-8 h-8 text-luxury-gold" />
              <h4 className="font-serif font-bold text-cream-100 text-base">Direct Consultation</h4>
              <p className="text-xs text-cream-300 leading-relaxed">
                No middleman brokers or unverified paralegals. Speak directly to senior advocates with court practice.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-luxury-gold/30 backdrop-blur space-y-3">
              <FileCheck className="w-8 h-8 text-luxury-gold" />
              <h4 className="font-serif font-bold text-cream-100 text-base">Confidential Chambers</h4>
              <p className="text-xs text-cream-300 leading-relaxed">
                High Court & Supreme Court chambers accessible only on approved appointment schedules.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-luxury-gold/30 backdrop-blur space-y-3">
              <CreditCard className="w-8 h-8 text-luxury-gold" />
              <h4 className="font-serif font-bold text-cream-100 text-base">Atomic Retainer Holding</h4>
              <p className="text-xs text-cream-300 leading-relaxed">
                Payments are held transparently and unlocked only when the consultation takes place as scheduled.
              </p>
            </div>
          </div>

          <div className="pt-6">
            <Link
              to="/register"
              className="inline-flex items-center space-x-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-black text-xs uppercase tracking-widest shadow-2xl transition transform hover:scale-105"
            >
              <span>Schedule a Consultation</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
