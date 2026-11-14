import React from 'react';
import { Link } from 'react-router-dom';
import { Scale, ShieldCheck, Heart, Users, Target, ArrowRight, Sparkles } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div className="bg-cream-50 min-h-screen py-16 text-maroon-950">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center space-y-4 max-w-3xl mx-auto">
          <span className="text-xs font-serif font-bold uppercase tracking-[0.25em] text-maroon-700">
            About LawinoMeet
          </span>
          <h1 className="text-3xl sm:text-5xl font-serif font-black tracking-tight text-maroon-950">
            Born from Personal Helplessness. Built for National Justice.
          </h1>
          <p className="text-sm sm:text-base text-stone-600 font-sans leading-relaxed">
            We are bridging the gap between citizens facing critical legal matters and India's top legal professional experts.
          </p>
        </div>

        {/* Founding Belief Card */}
        <div className="rounded-3xl bg-maroon-950 text-cream-100 p-8 sm:p-12 border border-luxury-gold/40 shadow-2xl relative overflow-hidden space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-luxury-gold text-maroon-950 flex items-center justify-center font-bold">
              <Scale className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-cream-50">Our Guiding Principle</h2>
              <p className="text-xs text-luxury-gold font-serif">The Genesis of LawinoMeet</p>
            </div>
          </div>

          <blockquote className="text-base sm:text-xl font-serif italic text-cream-100 leading-relaxed border-l-4 border-luxury-gold pl-4 sm:pl-6">
            "Imagine moving to a new city for your first job. Within your first week, one night, you suddenly find yourself involved in a police case. You're frightened, confused, and don't know who to trust. No one should feel helpless just because they are new to a place and don't know where to find legal help."
          </blockquote>

          <p className="text-xs sm:text-sm text-cream-300 font-sans font-light leading-relaxed">
            As tech engineers and legal facilitators, we made it our mission to ensure that every individual — whether a young professional, student, or business owner — can connect directly with verified advocates within minutes.
          </p>
        </div>

        {/* Values Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-8 rounded-3xl border border-cream-300 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-maroon-900 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-luxury-gold" />
            </div>
            <h3 className="font-serif font-bold text-lg text-maroon-950">100% Bar Verified</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Every practitioner's enrollment number is verified with the State Bar Council before their chamber or video calendar is listed.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-cream-300 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-maroon-900 flex items-center justify-center">
              <Target className="w-6 h-6 text-luxury-gold" />
            </div>
            <h3 className="font-serif font-bold text-lg text-maroon-950">Dual Mode Access</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Seamlessly switch between emergency end-to-end encrypted WebRTC video rooms or confidential in-person advocate chamber hearings.
            </p>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-cream-300 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-cream-100 text-maroon-900 flex items-center justify-center">
              <Heart className="w-6 h-6 text-luxury-gold" />
            </div>
            <h3 className="font-serif font-bold text-lg text-maroon-950">Zero Exploitation</h3>
            <p className="text-xs text-stone-600 leading-relaxed font-sans">
              Upfront retainer transparency, atomic holding, and complete ethical compliance with Bar Council of India norms.
            </p>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center pt-8">
          <Link
            to="/lawyers"
            className="inline-flex items-center space-x-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 font-serif font-bold text-xs uppercase tracking-wider shadow-lg transition"
          >
            <span>Discover Verified Advocates</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};
