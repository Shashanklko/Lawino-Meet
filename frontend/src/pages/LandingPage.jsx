import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Scale,
  ShieldCheck,
  Video,
  Calendar,
  Lock,
  ArrowRight,
  Search,
  CheckCircle2,
  Users,
  Award,
  Sparkles,
} from 'lucide-react';

const practiceAreas = [
  { name: 'Corporate & Commercial', code: 'CORPORATE_LAW', desc: 'Mergers, contracts, compliance & corporate advisory' },
  { name: 'Criminal Defense & Bail', code: 'CRIMINAL_DEFENSE', desc: 'Bail applications, trial representation & litigation' },
  { name: 'Family & Matrimonial', code: 'FAMILY_LAW', desc: 'Divorce, custody, maintenance & family settlements' },
  { name: 'Intellectual Property', code: 'INTELLECTUAL_PROPERTY', desc: 'Trademarks, copyright, patent filing & protection' },
  { name: 'Cyber Crime & IT Law', code: 'CYBER_LAW', desc: 'Data privacy, cyber fraud & IT Act proceedings' },
  { name: 'Civil & Property Dispute', code: 'CIVIL_LITIGATION', desc: 'Real estate, land title verification & partition suits' },
];

export const LandingPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/lawyers?query=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/lawyers');
    }
  };

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:20px_20px] opacity-10"></div>
        <div className="relative max-w-5xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>India's Most Trusted Legal Consultation Platform</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight leading-tight">
            Consult Top Verified Advocates via{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">
              Encrypted Video Call
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-base sm:text-lg text-slate-300 font-normal leading-relaxed">
            Directly discover Supreme Court and High Court advocates, book instant slots, and consult in complete
            confidentiality from your home or office.
          </p>

          {/* Quick Search Form */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3 p-2 bg-slate-800/80 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur">
            <div className="flex-1 flex items-center px-4 bg-slate-900/80 rounded-xl border border-slate-700/60">
              <Search className="w-5 h-5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by practice area, city, or lawyer name..."
                className="w-full bg-transparent px-3 py-3 text-sm text-white placeholder-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-lg shadow-blue-500/20 flex items-center justify-center space-x-2"
            >
              <span>Find Advocates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Trust Highlights */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex items-center justify-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>100% Bar Verified</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Lock className="w-4 h-4 text-blue-400" />
              <span>Encrypted WebRTC</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Instant Slot Booking</span>
            </div>
            <div className="flex items-center justify-center space-x-2">
              <Award className="w-4 h-4 text-purple-400" />
              <span>Top Law Firms</span>
            </div>
          </div>
        </div>
      </section>

      {/* Practice Areas Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
            Specialized Legal Expertise
          </h2>
          <p className="text-sm text-slate-500 mt-2">
            Select a practice area to discover experienced advocates dedicated to your legal matters.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {practiceAreas.map((area) => (
            <Link
              key={area.code}
              to={`/lawyers?specialization=${area.code}`}
              className="group p-6 rounded-2xl bg-white border border-slate-200 hover:border-blue-500 hover:shadow-xl transition flex flex-col justify-between"
            >
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4 group-hover:bg-blue-600 group-hover:text-white transition">
                  <Scale className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-900 group-hover:text-blue-600 transition">
                  {area.name}
                </h3>
                <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                  {area.desc}
                </p>
              </div>
              <div className="mt-4 flex items-center space-x-1.5 text-xs font-semibold text-blue-600">
                <span>View Advocates</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition" />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-slate-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
              How Lawino Meet Works
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Consulting a legal expert has never been this streamlined and confidential.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center mx-auto text-lg">
                1
              </div>
              <h3 className="font-bold text-slate-900">Discover & Review</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Filter verified advocates by specialization, court jurisdiction, experience, and fee.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center mx-auto text-lg">
                2
              </div>
              <h3 className="font-bold text-slate-900">Instant Slot Booking</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Pick a convenient time slot from the advocate's live calendar. Slots are held atomically without double booking.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 font-extrabold flex items-center justify-center mx-auto text-lg">
                3
              </div>
              <h3 className="font-bold text-slate-900">Secure Video Conference</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Join the consultation room with 1-click. Share case files, discuss legal strategies, and resolve matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action for Advocates & Firms */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="rounded-3xl bg-gradient-to-r from-slate-900 to-blue-950 p-8 sm:p-12 text-white flex flex-col md:flex-row items-center justify-between shadow-2xl">
          <div className="space-y-4 max-w-xl text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-extrabold">
              Are you an Advocate or Law Firm?
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Expand your legal practice digitally. Manage consultation slots, onboard junior advocates,
              and meet clients across India through automated scheduling and secure WebRTC rooms.
            </p>
          </div>
          <div className="mt-6 md:mt-0 flex flex-col sm:flex-row gap-3">
            <Link
              to="/register?role=LAWYER"
              className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm transition shadow-lg text-center"
            >
              Join as Advocate
            </Link>
            <Link
              to="/register?role=FIRM_ADMIN"
              className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition border border-slate-700 text-center"
            >
              Register Law Firm
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
