import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  Scale,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  Video,
  Building,
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { useChat } from '../context/ChatContext';

const specializations = [
  'ALL',
  'CORPORATE_LAW',
  'CRIMINAL_DEFENSE',
  'FAMILY_LAW',
  'INTELLECTUAL_PROPERTY',
  'CYBER_LAW',
  'CIVIL_LITIGATION',
  'LABOUR_LAW',
  'TAXATION_LAW',
];

export const LawyerDiscoveryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSpecialization = searchParams.get('specialization') || 'ALL';
  const initialQuery = searchParams.get('query') || '';
  const initialMode = searchParams.get('mode') || 'ALL';

  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState(initialSpecialization);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [consultationMode, setConsultationMode] = useState(initialMode);

  const { openChatWithUser } = useChat();

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSpec && selectedSpec !== 'ALL') params.specialization = selectedSpec;
      if (searchQuery.trim()) params.query = searchQuery.trim();

      const res = await userApi.searchLawyers(params);
      if (res.success && res.data) {
        setLawyers(res.data.content || res.data || []);
      }
    } catch (err) {
      console.warn('Failed to search lawyers:', err);
      setLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, [selectedSpec]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    fetchLawyers();
  };

  return (
    <div className="bg-cream-50 min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        {/* Top Banner */}
        <div className="bg-gradient-to-r from-maroon-950 via-maroon-900 to-maroon-950 text-cream-100 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-2xl border border-luxury-gold/40">
          <div className="space-y-2">
            <span className="text-[10px] font-serif uppercase tracking-[0.2em] text-luxury-gold font-bold">
              Directory of Luminaries
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-black tracking-tight text-cream-50">
              Discover Legal Professional Experts
            </h1>
            <p className="text-xs text-cream-300 font-light">
              Filter verified advocates available for online encrypted video counsel and in-person chamber hearings.
            </p>
          </div>

          {/* Quick Filter Bar */}
          <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-72">
              <Search className="w-4 h-4 text-luxury-gold absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search advocate name, city..."
                className="w-full bg-black/40 text-cream-100 text-xs pl-9 pr-3 py-3 rounded-2xl border border-luxury-gold/30 focus:outline-none focus:border-luxury-gold"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-3 bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 text-xs font-serif font-bold uppercase tracking-wider rounded-2xl shadow-md transition shrink-0"
            >
              Search
            </button>
          </form>
        </div>

        {/* Mode Selector & Specialization Pills */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-xs font-serif">
            <span className="text-stone-500 font-bold uppercase tracking-wider text-[11px] mr-2">Mode:</span>
            <button
              onClick={() => setConsultationMode('ALL')}
              className={`px-3 py-1.5 rounded-xl border transition ${
                consultationMode === 'ALL'
                  ? 'bg-maroon-900 text-cream-100 border-maroon-900 font-bold shadow-sm'
                  : 'bg-white text-stone-600 border-cream-300'
              }`}
            >
              All Formats
            </button>
            <button
              onClick={() => setConsultationMode('ONLINE')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1 transition ${
                consultationMode === 'ONLINE'
                  ? 'bg-maroon-900 text-cream-100 border-maroon-900 font-bold shadow-sm'
                  : 'bg-white text-stone-600 border-cream-300'
              }`}
            >
              <Video className="w-3.5 h-3.5 text-luxury-gold" />
              <span>Online Video</span>
            </button>
            <button
              onClick={() => setConsultationMode('OFFLINE')}
              className={`px-3 py-1.5 rounded-xl border flex items-center space-x-1 transition ${
                consultationMode === 'OFFLINE'
                  ? 'bg-maroon-900 text-cream-100 border-maroon-900 font-bold shadow-sm'
                  : 'bg-white text-stone-600 border-cream-300'
              }`}
            >
              <Building className="w-3.5 h-3.5 text-luxury-gold" />
              <span>Chamber In-Person</span>
            </button>
          </div>

          <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
            {specializations.map((spec) => (
              <button
                key={spec}
                onClick={() => setSelectedSpec(spec)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-serif font-medium whitespace-nowrap transition border ${
                  selectedSpec === spec
                    ? 'bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light text-maroon-950 font-bold border-transparent shadow-sm'
                    : 'bg-white text-stone-600 border-cream-300 hover:border-luxury-gold'
                }`}
              >
                {spec.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Lawyers Grid */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-4 border-luxury-gold border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-serif text-maroon-800">Searching advocate register...</p>
          </div>
        ) : lawyers.length === 0 ? (
          <div className="bg-white rounded-3xl border border-cream-300 p-16 text-center space-y-3 shadow-sm">
            <Scale className="w-12 h-12 text-stone-300 mx-auto" />
            <h3 className="text-lg font-serif font-bold text-maroon-950">No Advocates Found</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Try adjusting your query or selecting another practice area.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lawyers.map((lawyer) => (
              <div
                key={lawyer.publicId}
                className="bg-white rounded-3xl border border-cream-300 hover:border-luxury-gold hover:shadow-xl transition p-6 flex flex-col justify-between space-y-4"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3.5">
                      <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-maroon-950 to-maroon-800 text-luxury-gold font-serif font-bold flex items-center justify-center text-xl shadow-md border border-luxury-gold/30">
                        {lawyer.fullName?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <h3 className="font-serif font-bold text-base text-maroon-950">{lawyer.fullName}</h3>
                          <ShieldCheck className="w-4 h-4 text-emerald-600" title="Bar Council Verified" />
                        </div>
                        <p className="text-[11px] text-stone-400 font-mono">
                          Bar: <span className="text-stone-700 font-semibold">{lawyer.barCouncilNumber}</span>
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-lg font-serif font-bold text-maroon-900">
                        ₹{lawyer.hourlyRate || '1,500'}
                      </span>
                      <span className="text-[9px] text-stone-400 block font-sans">/ retainer</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-stone-600 mt-3.5 line-clamp-2 leading-relaxed">
                    {lawyer.bio || 'Practicing advocate handling legal advisory, trial litigation, bail proceedings, and corporate contracts.'}
                  </p>

                  {/* Badges */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-lg bg-cream-200 text-maroon-900 text-[10px] font-serif font-semibold">
                      {lawyer.yearsOfExperience || '5'}+ Yrs Practice
                    </span>
                    {lawyer.city && (
                      <span className="px-2.5 py-0.5 rounded-lg bg-stone-100 text-stone-700 text-[10px] flex items-center space-x-1">
                        <MapPin className="w-2.5 h-2.5" />
                        <span>{lawyer.city}</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[9px] font-semibold flex items-center space-x-1">
                      <Video className="w-2.5 h-2.5" />
                      <span>Video & Chamber</span>
                    </span>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-3.5 border-t border-cream-200 flex items-center gap-2">
                  <button
                    onClick={() => openChatWithUser(lawyer.userPublicId, lawyer.fullName)}
                    className="p-2.5 rounded-xl border border-cream-300 hover:bg-cream-100 text-maroon-900 transition"
                    title="Direct Message"
                  >
                    <MessageSquare className="w-4 h-4 text-luxury-gold" />
                  </button>
                  <Link
                    to={`/lawyers/${lawyer.publicId}`}
                    className="flex-1 py-2.5 px-3 rounded-xl bg-gradient-to-r from-luxury-gold-dark via-luxury-gold to-luxury-gold-light hover:brightness-110 text-maroon-950 text-xs font-serif font-bold uppercase tracking-wider text-center shadow-md transition flex items-center justify-center space-x-1"
                  >
                    <span>Consult Advocate</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
