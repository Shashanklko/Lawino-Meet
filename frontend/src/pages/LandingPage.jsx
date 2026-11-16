import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Video,
  FileText,
  Home,
  Briefcase,
  AlertCircle,
  Globe,
  Award,
  Calendar,
  HeartHandshake,
  ChevronDown,
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export const LandingPage = () => {
  const { t } = useLanguage();

  const scrollToStory = () => {
    const el = document.getElementById('story');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="bg-[#FAF6EE] text-[#2E2A29] min-h-screen selection:bg-[#831826]/15 selection:text-[#831826]">
      {/* =========================================================================
          HERO SECTION: A story, before a service
          ========================================================================= */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Hero Column */}
          <div className="lg:col-span-7 space-y-6 lg:pr-8">
            <span className="text-xs tracking-[0.25em] font-sans font-medium uppercase text-[#8C847E] block">
              {t('landing.heroEyebrow', 'A STORY, BEFORE A SERVICE')}
            </span>

            <h1 className="text-5xl sm:text-6xl lg:text-[4.5rem] font-serif font-normal text-[#2E2A29] leading-[1.08] tracking-tight">
              {t('landing.heroTitlePre', 'Moving into ')}
              <span className="italic text-[#831826] font-normal font-serif">
                {t('landing.heroTitleHighlight', 'the Unknown')}
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-[#66605B] font-sans font-light leading-relaxed max-w-xl">
              {t(
                'landing.heroDesc',
                "Imagine moving to a completely new city for your first job. You barely know the streets, have no relatives nearby, and don't know anyone who can guide you."
              )}
            </p>

            <div className="pt-6">
              <button
                onClick={scrollToStory}
                className="group inline-flex items-center space-x-2.5 text-xs font-sans tracking-[0.2em] font-medium text-[#7D756F] hover:text-[#831826] transition cursor-pointer"
              >
                <span>{t('landing.followFootsteps', 'FOLLOW THE FOOTSTEPS')}</span>
                <ChevronDown className="w-4 h-4 text-[#831826] group-hover:translate-y-1 transition-transform duration-300" />
              </button>
            </div>
          </div>

          {/* Right Hero Column: Illustration with subtle background ring, dot grid & gold dot */}
          <div className="lg:col-span-5 flex justify-center items-center relative py-6">
            {/* Subtle Atmospheric Dot Grid Pattern filling the right background with soft radial fade */}
            <div
              className="absolute -inset-10 sm:-inset-20 pointer-events-none -z-10 [mask-image:radial-gradient(ellipse_at_center,black_45%,transparent_75%)]"
              style={{
                backgroundImage: 'radial-gradient(#831826 1.3px, transparent 1.3px)',
                backgroundSize: '22px 22px',
                opacity: 0.22,
              }}
              aria-hidden="true"
            />

            {/* Architectural Accent Dot Matrix Cluster - Top Right */}
            <div
              className="absolute -top-3 -right-3 sm:-right-8 grid grid-cols-6 gap-2.5 opacity-30 pointer-events-none -z-0"
              aria-hidden="true"
            >
              {Array.from({ length: 36 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#831826]" />
              ))}
            </div>

            {/* Architectural Accent Dot Matrix Cluster - Bottom Left */}
            <div
              className="absolute -bottom-6 -left-4 sm:-left-8 grid grid-cols-5 gap-2.5 opacity-25 pointer-events-none -z-0"
              aria-hidden="true"
            >
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#C5A880]" />
              ))}
            </div>

            {/* Elegant faint outlined circle and gold dot */}
            <div className="absolute w-[22rem] h-[22rem] sm:w-[26rem] sm:h-[26rem] rounded-full border border-[#DFD3C3] pointer-events-none -z-0">
              <div className="absolute top-10 right-8 w-3 h-3 rounded-full bg-[#E5A952] shadow-sm" />
            </div>

            {/* Boy with Backpack Illustration: Blends naturally into canvas without card or border */}
            <img
              src="/Story/incident-1.png"
              alt="Young professional arriving in a new city"
              className="relative z-10 w-full max-w-[340px] sm:max-w-[400px] object-contain mix-blend-multiply select-none"
            />
          </div>
        </div>
      </section>

      {/* =========================================================================
          THE STORY (Handwritten Format)
          ========================================================================= */}
      <div id="story" className="relative max-w-5xl mx-auto px-6 sm:px-10 py-6">
        {/* -----------------------------------------------------------------------
            STORY BEAT 01: The Police Case Incident
            ----------------------------------------------------------------------- */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-16">
          {/* Left Text */}
          <div className="md:col-span-6 space-y-5">
            <span className="text-7xl sm:text-8xl font-handwriting text-[#831826] font-bold block leading-none">
              01
            </span>
            <blockquote className="border-l-2 border-[#831826]/30 pl-6 py-1">
              <p className="text-2xl sm:text-3xl font-handwriting text-[#3A3532] leading-relaxed">
                {t(
                  'landing.story01Quote',
                  "“Within your first week, one night, you suddenly find yourself involved in a police case. You're confused, frightened, and don't know what to do next. You need a lawyer, but you don't know where to find one or whom to trust.”"
                )}
              </p>
            </blockquote>
          </div>

          {/* Right Illustration: Boy speaking with police officers (no border!) */}
          <div className="md:col-span-6 flex flex-col items-center">
            <img
              src="/Story/Incident-2.png"
              alt="Police encounter late at night"
              className="w-full max-w-[380px] object-contain mix-blend-multiply select-none"
            />
            <p className="text-xl font-handwriting text-[#736B65] text-center mt-3">
              {t('landing.story01Caption', 'Within the first week, one night...')}
            </p>
          </div>
        </section>

        {/* Centered Narrative Bridge */}
        <div className="text-center my-20">
          <p className="text-3xl sm:text-4xl font-handwriting text-[#4A4440]">
            {t('landing.story01Bridge', 'So you sit down, phone in hand, and wonder...')}
          </p>
        </div>

        {/* -----------------------------------------------------------------------
            STORY BEAT 02: Whom do I even call?
            ----------------------------------------------------------------------- */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center my-16">
          {/* Left Illustrations: Boy on bench thinking + on the phone (no borders!) */}
          <div className="md:col-span-6 space-y-10 flex flex-col items-center">
            <div className="w-full max-w-[380px] flex flex-col items-center">
              <img
                src="/Story/Whom-to-call.png"
                alt="Parents? A friend? A lawyer?"
                className="w-full object-contain mix-blend-multiply select-none"
              />
              <p className="text-xl font-handwriting text-[#736B65] text-center mt-3">
                {t('landing.story02Caption1', 'Parents? A friend? A lawyer?')}
              </p>
            </div>

            <div className="w-full max-w-[320px] flex flex-col items-center">
              <img
                src="/Story/no-one-to-call.png"
                alt="And no one to call"
                className="w-full object-contain mix-blend-multiply select-none"
              />
              <p className="text-xl font-handwriting text-[#736B65] text-center mt-3">
                {t('landing.story02Caption2', '...and no one to call.')}
              </p>
            </div>
          </div>

          {/* Right Text */}
          <div className="md:col-span-6 space-y-6 md:pl-4">
            <span className="text-7xl sm:text-8xl font-handwriting text-[#831826] font-bold block leading-none">
              02
            </span>
            <h2 className="text-4xl sm:text-5xl font-handwriting text-[#2E2A29]">
              {t('landing.story02Title', 'Whom do I even call?')}
            </h2>

            <div className="space-y-4 text-2xl sm:text-3xl font-handwriting text-[#4A4440] leading-relaxed">
              <p>
                {t(
                  'landing.story02Line1',
                  "My parents — but they're hundreds of kilometres away, and it's the middle of the night."
                )}
              </p>
              <p>{t('landing.story02Line2', "A friend — but I've barely made any here yet.")}</p>
              <p>
                {t(
                  'landing.story02Line3',
                  "A lawyer — but I don't know a single one in this city, or whom I can trust."
                )}
              </p>
            </div>
          </div>
        </section>

        {/* Centered Narrative Bridge */}
        <div className="text-center my-20">
          <p className="text-3xl sm:text-4xl font-handwriting text-[#4A4440]">
            {t('landing.story02Bridge', 'But this was never just a story someone imagined...')}
          </p>
        </div>

        {/* -----------------------------------------------------------------------
            STORY BEAT 03: The Tech Engineer's Vision & Sketch
            ----------------------------------------------------------------------- */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-16">
          {/* Left Text */}
          <div className="md:col-span-6 space-y-6">
            <span className="text-7xl sm:text-8xl font-handwriting text-[#831826] font-bold block leading-none">
              03
            </span>
            <p className="text-2xl sm:text-3xl font-handwriting text-[#4A4440] leading-relaxed">
              {t(
                'landing.story03Desc',
                "This isn't just a situation someone might imagine. I experienced it myself. As a tech engineer, in that difficult moment, I kept thinking:"
              )}
            </p>
            <blockquote className="border-l-2 border-[#831826]/40 pl-6 py-2">
              <p className="text-2xl sm:text-3xl font-handwriting text-[#2E2A29] leading-relaxed">
                {t(
                  'landing.story03Quote',
                  '“What if someone in this situation could find the right legal professional with just a few clicks — without depending on local contacts or struggling to find help?”'
                )}
              </p>
            </blockquote>
          </div>

          {/* Right Illustration: Engineer sketching LawinoMeet (no border!) */}
          <div className="md:col-span-6 flex flex-col items-center">
            <img
              src="/Story/foundation.png"
              alt="The first sketch of LawinoMeet"
              className="w-full max-w-[420px] object-contain mix-blend-multiply select-none"
            />
            <p className="text-xl font-handwriting text-[#736B65] text-center mt-3">
              {t('landing.story03Caption', 'The first sketch of LawinoMeet')}
            </p>
          </div>
        </section>

        {/* Centered Narrative Bridge */}
        <div className="text-center my-20">
          <p className="text-3xl sm:text-4xl font-handwriting text-[#4A4440]">
            {t('landing.story03Bridge', 'And slowly, that question became something real.')}
          </p>
        </div>

        {/* -----------------------------------------------------------------------
            STORY BEAT 04: The Bridge Between People & The Law
            ----------------------------------------------------------------------- */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center my-16">
          {/* Left Visual: Dawn Bridge (soft rounded, no white card border!) */}
          <div className="md:col-span-6 flex flex-col items-center">
            <img
              src="/dawn-bridge.jpg"
              alt="A bridge between people and the law"
              className="w-full max-w-[440px] rounded-2xl shadow-sm object-cover select-none"
            />
            <p className="text-xl font-handwriting text-[#736B65] text-center mt-3">
              {t('landing.story04Caption', 'A bridge between people and the law')}
            </p>
          </div>

          {/* Right Text */}
          <div className="md:col-span-6 space-y-6 md:pl-4">
            <span className="text-7xl sm:text-8xl font-handwriting text-[#831826] font-bold block leading-none">
              04
            </span>
            <p className="text-2xl sm:text-3xl font-handwriting text-[#3A3532] leading-relaxed">
              {t(
                'landing.story04Desc',
                'That thought became the driving inspiration behind LawinoMeet. We set out to engineer an unbreakable bridge between citizens and verified legal professional experts across India.'
              )}
            </p>
          </div>
        </section>

        {/* -----------------------------------------------------------------------
            CORE CREED: Deep Maroon Card
            ----------------------------------------------------------------------- */}
        <div className="my-16 relative">
          <div className="bg-[#480E17] text-white rounded-3xl p-10 sm:p-14 max-w-3xl mx-auto text-center shadow-2xl relative overflow-hidden">
            {/* Subtle inner gold accent border */}
            <div className="absolute inset-0 rounded-3xl border border-[#E5A952]/20 pointer-events-none" />

            <span className="text-xs tracking-[0.25em] font-sans font-semibold uppercase text-[#E5A952] block mb-6">
              {t('landing.creedEyebrow', 'OUR UNWAVERING CORE CREED')}
            </span>

            <blockquote className="text-2xl sm:text-3xl font-serif text-cream-50 leading-relaxed font-normal">
              {t(
                'landing.creedQuotePre',
                "“No one should feel helpless just because they are new to a place and don't know where to find "
              )}
              <span className="italic text-[#E5A952] font-serif">
                {t('landing.creedQuoteHighlight', 'legal help.”')}
              </span>
            </blockquote>
          </div>
        </div>
      </div>

      {/* =========================================================================
          SERVICES SECTION: Where the footsteps lead
          ========================================================================= */}
      <section id="services" className="pt-8 pb-24 px-6 sm:px-10 lg:px-16 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <span className="text-xs tracking-[0.25em] font-sans font-semibold uppercase text-[#E5A952] block">
            {t('landing.servicesEyebrow', 'WHERE THE FOOTSTEPS LEAD')}
          </span>

          <h2 className="text-4xl sm:text-5xl font-serif text-[#2E2A29] leading-[1.15]">
            {t('landing.servicesHeadingPre', 'Help that reaches you, ')}
            <span className="italic text-[#831826] font-serif font-normal block sm:inline">
              {t('landing.servicesHeadingHighlight', 'wherever you land')}
            </span>
          </h2>

          <p className="text-base sm:text-lg text-[#66605B] font-sans font-light leading-relaxed">
            {t(
              'landing.servicesDesc',
              'Whatever brought you here — a frightening night or a simple question — LawinoMeet carries you to the right legal professional.'
            )}
          </p>
        </div>

        {/* 6-Grid Services Box (Enclosed Master Card with Interactive Navigation) */}
        <div className="max-w-5xl mx-auto border border-[#E4DBD0] rounded-3xl bg-[#FAF5EC]/70 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E4DBD0]">
            {/* Card 1: Emergency & Police Matters */}
            <Link
              to="/lawyers?category=CRIMINAL_DEFENSE"
              className="p-8 sm:p-10 space-y-4 hover:bg-white/70 transition-all duration-300 block group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full border border-[#831826]/30 group-hover:border-[#831826] group-hover:bg-[#831826]/5 flex items-center justify-center text-[#831826] transition">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#2E2A29] group-hover:text-[#831826] transition">
                {t('landing.srv1Title', 'Emergency & Police Matters')}
              </h3>
              <p className="text-sm sm:text-base text-[#66605B] leading-relaxed font-sans font-light">
                {t(
                  'landing.srv1Desc',
                  'Detained, summoned or caught in an FIR? Reach a criminal lawyer quickly — even late at night.'
                )}
              </p>
              <span className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-[#831826] pt-1">
                <span>{t('landing.srv1Link', 'Find Criminal Advocates')}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </Link>

            {/* Card 2: Online Consultation (Warm Highlighted Background) */}
            <Link
              to="/lawyers?mode=ONLINE"
              className="p-8 sm:p-10 space-y-4 bg-[#F2ECE1] hover:bg-[#ede4d5] transition-all duration-300 block group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full bg-[#831826] group-hover:scale-105 flex items-center justify-center text-white shadow-sm transition">
                <Video className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#2E2A29] group-hover:text-[#831826] transition">
                {t('landing.srv2Title', 'Online Consultation')}
              </h3>
              <p className="text-sm sm:text-base text-[#66605B] leading-relaxed font-sans font-light">
                {t(
                  'landing.srv2Desc',
                  'Talk to a lawyer over chat, call or video in minutes, from wherever you are.'
                )}
              </p>
              <span className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-[#831826] pt-1">
                <span>{t('landing.srv2Link', 'Start Video Consultation')}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </Link>

            {/* Card 3: Verified Lawyers Across India */}
            <Link
              to="/lawyers?category=ALL"
              className="p-8 sm:p-10 space-y-4 hover:bg-white/70 transition-all duration-300 block group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full border border-[#831826]/30 group-hover:border-[#831826] group-hover:bg-[#831826]/5 flex items-center justify-center text-[#831826] transition">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#2E2A29] group-hover:text-[#831826] transition">
                {t('landing.srv3Title', 'Verified Lawyers Across India')}
              </h3>
              <p className="text-sm sm:text-base text-[#66605B] leading-relaxed font-sans font-light">
                {t(
                  'landing.srv3Desc',
                  'Every professional is verified, so you never have to guess whom to trust in a new city.'
                )}
              </p>
              <span className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-[#831826] pt-1">
                <span>{t('landing.srv3Link', 'Browse All Verified Advocates')}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </Link>
          </div>

          {/* Divider between top row and bottom row */}
          <div className="border-t border-[#E4DBD0] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E4DBD0]">
            {/* Card 4: Document Review & Drafting */}
            <Link
              to="/lawyers?category=CORPORATE_LAW"
              className="p-8 sm:p-10 space-y-4 hover:bg-white/70 transition-all duration-300 block group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full border border-[#831826]/30 group-hover:border-[#831826] group-hover:bg-[#831826]/5 flex items-center justify-center text-[#831826] transition">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#2E2A29] group-hover:text-[#831826] transition">
                {t('landing.srv4Title', 'Document Review & Drafting')}
              </h3>
              <p className="text-sm sm:text-base text-[#66605B] leading-relaxed font-sans font-light">
                {t(
                  'landing.srv4Desc',
                  'Offer letters, rent agreements, legal notices — reviewed or drafted before you sign.'
                )}
              </p>
              <span className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-[#831826] pt-1">
                <span>{t('landing.srv4Link', 'Review Legal Documents')}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </Link>

            {/* Card 5: Tenancy & Property */}
            <Link
              to="/lawyers?category=CIVIL_LITIGATION"
              className="p-8 sm:p-10 space-y-4 hover:bg-white/70 transition-all duration-300 block group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full border border-[#831826]/30 group-hover:border-[#831826] group-hover:bg-[#831826]/5 flex items-center justify-center text-[#831826] transition">
                <Home className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#2E2A29] group-hover:text-[#831826] transition">
                {t('landing.srv5Title', 'Tenancy & Property')}
              </h3>
              <p className="text-sm sm:text-base text-[#66605B] leading-relaxed font-sans font-light">
                {t(
                  'landing.srv5Desc',
                  'Deposit disputes, unfair eviction or landlord trouble, handled by people who know local law.'
                )}
              </p>
              <span className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-[#831826] pt-1">
                <span>{t('landing.srv5Link', 'Resolve Property Issues')}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </Link>

            {/* Card 6: Workplace & Employment */}
            <Link
              to="/lawyers?category=LABOUR_LAW"
              className="p-8 sm:p-10 space-y-4 hover:bg-white/70 transition-all duration-300 block group cursor-pointer"
            >
              <div className="w-12 h-12 rounded-full border border-[#831826]/30 group-hover:border-[#831826] group-hover:bg-[#831826]/5 flex items-center justify-center text-[#831826] transition">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl text-[#2E2A29] group-hover:text-[#831826] transition">
                {t('landing.srv6Title', 'Workplace & Employment')}
              </h3>
              <p className="text-sm sm:text-base text-[#66605B] leading-relaxed font-sans font-light">
                {t(
                  'landing.srv6Desc',
                  'Unpaid salary, wrongful termination or harassment at work — know your rights and act.'
                )}
              </p>
              <span className="inline-flex items-center space-x-1.5 text-xs font-serif font-bold text-[#831826] pt-1">
                <span>{t('landing.srv6Link', 'Consult Employment Counsel')}</span>
                <span className="group-hover:translate-x-1 transition-transform duration-200">→</span>
              </span>
            </Link>
          </div>
        </div>

        {/* =========================================================================
            THREE STEPS: From confusion to clarity, in three steps
            ========================================================================= */}
        <div className="mt-28 max-w-4xl mx-auto space-y-12">
          <h3 className="text-3xl sm:text-4xl font-serif text-center text-[#2E2A29]">
            {t('landing.stepsHeadingPre', 'From confusion to clarity, in ')}
            <span className="italic text-[#831826] font-serif">
              {t('landing.stepsHeadingHighlight', 'three steps')}
            </span>
          </h3>

          <div className="relative pt-6">
            {/* Horizontal Timeline Connector Line */}
            <div className="hidden md:block absolute top-12 left-16 right-16 h-[1px] bg-[#DCD1C2] -z-0" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-6 relative z-10 text-center">
              {/* Step I */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full border border-[#DCD1C2] bg-[#FAF6EE] flex items-center justify-center font-serif text-sm font-semibold text-[#831826] shadow-sm">
                  I
                </div>
                <h4 className="font-serif text-lg text-[#2E2A29] font-medium pt-1">
                  {t('landing.step1Title', 'Tell us what happened')}
                </h4>
                <p className="text-sm text-[#66605B] max-w-xs font-sans font-light leading-relaxed">
                  {t('landing.step1Desc', 'Share your situation in a few simple words.')}
                </p>
              </div>

              {/* Step II */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full border border-[#DCD1C2] bg-[#FAF6EE] flex items-center justify-center font-serif text-sm font-semibold text-[#831826] shadow-sm">
                  II
                </div>
                <h4 className="font-serif text-lg text-[#2E2A29] font-medium pt-1">
                  {t('landing.step2Title', 'Meet the right lawyer')}
                </h4>
                <p className="text-sm text-[#66605B] max-w-xs font-sans font-light leading-relaxed">
                  {t('landing.step2Desc', 'We match you with a verified expert for your case and city.')}
                </p>
              </div>

              {/* Step III */}
              <div className="flex flex-col items-center space-y-3">
                <div className="w-12 h-12 rounded-full border border-[#DCD1C2] bg-[#FAF6EE] flex items-center justify-center font-serif text-sm font-semibold text-[#831826] shadow-sm">
                  III
                </div>
                <h4 className="font-serif text-lg text-[#2E2A29] font-medium pt-1">
                  {t('landing.step3Title', 'Get clarity, fast')}
                </h4>
                <p className="text-sm text-[#66605B] max-w-xs font-sans font-light leading-relaxed">
                  {t('landing.step3Desc', 'Consult in minutes and know exactly what to do next.')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOR LAWYERS: Every bridge needs strong pillars
          ========================================================================= */}
      <section id="for-lawyers" className="bg-[#480E17] text-white py-24 px-6 sm:px-10 lg:px-16">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Column */}
          <div className="lg:col-span-7 space-y-8">
            <div className="space-y-4">
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-serif text-cream-50 leading-[1.12]">
                {t('landing.lawyersHeadingPre', 'Every bridge needs ')}
                <span className="italic text-[#E5A952] font-serif block">
                  {t('landing.lawyersHeadingHighlight', 'strong pillars.')}
                </span>
              </h2>
              <p className="text-base sm:text-lg text-cream-200 font-sans font-light max-w-xl leading-relaxed">
                {t(
                  'landing.lawyersDesc',
                  'Somewhere tonight, someone is new, alone and afraid. Join LawinoMeet and be the lawyer they find in a few clicks — not after days of searching.'
                )}
              </p>
            </div>

            {/* 4 Pillars (2x2 Grid) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 pt-4">
              {/* Feature 1 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full border border-[#E5A952]/40 flex items-center justify-center text-[#E5A952]">
                  <Globe className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg text-cream-50">
                  {t('landing.pillar1Title', 'Reach beyond your city')}
                </h3>
                <p className="text-sm text-cream-200/80 font-sans font-light leading-relaxed">
                  {t('landing.pillar1Desc', 'Connect with people across India who need your expertise.')}
                </p>
              </div>

              {/* Feature 2 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full border border-[#E5A952]/40 flex items-center justify-center text-[#E5A952]">
                  <Award className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg text-cream-50">
                  {t('landing.pillar2Title', 'A verified profile')}
                </h3>
                <p className="text-sm text-cream-200/80 font-sans font-light leading-relaxed">
                  {t('landing.pillar2Desc', 'Your credentials, presented with the trust they deserve.')}
                </p>
              </div>

              {/* Feature 3 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full border border-[#E5A952]/40 flex items-center justify-center text-[#E5A952]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg text-cream-50">
                  {t('landing.pillar3Title', 'Consult on your terms')}
                </h3>
                <p className="text-sm text-cream-200/80 font-sans font-light leading-relaxed">
                  {t(
                    'landing.pillar3Desc',
                    'Choose your hours and the way you meet clients (video or chamber).'
                  )}
                </p>
              </div>

              {/* Feature 4 */}
              <div className="space-y-2">
                <div className="w-8 h-8 rounded-full border border-[#E5A952]/40 flex items-center justify-center text-[#E5A952]">
                  <HeartHandshake className="w-4 h-4" />
                </div>
                <h3 className="font-serif text-lg text-cream-50">
                  {t('landing.pillar4Title', "Be someone's first calm voice")}
                </h3>
                <p className="text-sm text-cream-200/80 font-sans font-light leading-relaxed">
                  {t('landing.pillar4Desc', 'Help people at the moment they need it most.')}
                </p>
              </div>
            </div>

            {/* CTA Button */}
            <div className="pt-4">
              <Link
                to="/register?role=LAWYER"
                className="inline-flex items-center space-x-2 bg-[#E5A952] hover:bg-[#d8993f] text-[#2C080E] font-medium text-sm sm:text-base px-8 py-3.5 rounded-full transition shadow-lg"
              >
                <span>{t('landing.joinLawyerBtn', 'Join as a lawyer →')}</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Quote Card */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="w-full max-w-md rounded-3xl border border-white/15 bg-white/[0.04] p-8 sm:p-10 space-y-6 shadow-2xl relative backdrop-blur-sm">
              <span className="text-4xl font-serif text-[#E5A952] block leading-none">“</span>
              <p className="text-xl sm:text-2xl font-serif text-cream-50 leading-relaxed font-normal">
                {t(
                  'landing.promiseQuote',
                  '“Every case begins with someone who is scared. Be the first calm voice they hear.”'
                )}
              </p>
              <div className="border-t border-white/10 pt-4">
                <span className="text-xs tracking-[0.25em] font-sans font-semibold uppercase text-[#E5A952] block">
                  {t('landing.promiseEyebrow', 'THE LAWINOMEET PROMISE')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FINAL HERO BANNER: New to the city. Never alone with the law.
          Using dawn-bridge.jpg with rich deep maroon gradient overlay
          ========================================================================= */}
      <section
        className="relative py-32 sm:py-40 px-6 sm:px-10 lg:px-16 overflow-hidden bg-cover bg-center text-white"
        style={{
          backgroundImage: `linear-gradient(rgba(72, 14, 23, 0.88), rgba(48, 8, 14, 0.92)), url('/dawn-bridge.jpg')`,
        }}
      >
        <div className="max-w-4xl mx-auto text-center space-y-8 relative z-10">
          <span className="text-xs tracking-[0.25em] font-sans font-semibold uppercase text-[#E5A952] block">
            {t('landing.finalEyebrow', 'EVERY STEP LEADS HERE')}
          </span>

          <h2 className="text-4xl sm:text-6xl font-serif text-cream-50 leading-[1.12]">
            {t('landing.finalHeadingPre', 'New to the city. ')}
            <span className="italic text-[#E5A952] font-serif block">
              {t('landing.finalHeadingHighlight', 'Never alone with the law.')}
            </span>
          </h2>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/lawyers"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-[#E5A952] hover:bg-[#d8993f] text-[#2C080E] font-medium text-sm sm:text-base px-8 py-3.5 rounded-full transition shadow-lg"
            >
              <span>{t('landing.findLawyerNow', 'Find a lawyer now →')}</span>
            </Link>
            <Link
              to="/register?role=LAWYER"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 border border-white/40 hover:border-white text-white font-medium text-sm sm:text-base px-8 py-3.5 rounded-full transition hover:bg-white/10"
            >
              <span>{t('landing.imALawyer', "I'm a lawyer")}</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
