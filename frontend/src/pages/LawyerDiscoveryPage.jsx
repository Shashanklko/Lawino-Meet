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

  const [lawyers, setLawyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpec, setSelectedSpec] = useState(initialSpecialization);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [maxFee, setMaxFee] = useState('');

  const { openChatWithUser } = useChat();

  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedSpec && selectedSpec !== 'ALL') params.specialization = selectedSpec;
      if (searchQuery.trim()) params.query = searchQuery.trim();
      if (maxFee) params.maxFee = maxFee;

      const res = await userApi.searchLawyers(params);
      if (res.success && res.data) {
        setLawyers(res.data.content || res.data || []);
      }
    } catch (err) {
      console.warn('Failed to search lawyers:', err);
      // Fallback mock representation if database is empty initially
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Discover Verified Advocates
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Find Supreme Court & High Court advocates specializing in your specific legal requirement.
          </p>
        </div>

        {/* Quick Filter Bar */}
        <form onSubmit={handleFilterSubmit} className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, bar council..."
              className="w-full bg-slate-800 text-white text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
          >
            Search
          </button>
        </form>
      </div>

      {/* Specialization Pills */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => setSelectedSpec(spec)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${
              selectedSpec === spec
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-400'
            }`}
          >
            {spec.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Lawyers Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs text-slate-500">Searching advocates...</p>
        </div>
      ) : lawyers.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <Scale className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No Advocates Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query or selecting a different specialization filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lawyers.map((lawyer) => (
            <div
              key={lawyer.publicId}
              className="bg-white rounded-2xl border border-slate-200 hover:border-blue-500 hover:shadow-xl transition p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-slate-900 to-blue-900 text-white font-extrabold flex items-center justify-center text-base shadow-sm">
                      {lawyer.fullName?.[0]?.toUpperCase() || 'A'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h3 className="font-bold text-sm text-slate-900">{lawyer.fullName}</h3>
                        <ShieldCheck className="w-4 h-4 text-emerald-500" title="Verified Advocate" />
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Bar No: <span className="text-slate-600 font-mono">{lawyer.barCouncilNumber}</span>
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-base font-extrabold text-blue-600">
                      ₹{lawyer.hourlyRate || '1,500'}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ hour</span>
                  </div>
                </div>

                {/* Bio snippet */}
                <p className="text-xs text-slate-500 mt-3 line-clamp-2 leading-relaxed">
                  {lawyer.bio || 'Experienced advocate offering legal advisory and representation in court.'}
                </p>

                {/* Tags */}
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[10px] font-semibold">
                    {lawyer.yearsOfExperience || '5'}+ Yrs Exp
                  </span>
                  {lawyer.city && (
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-medium flex items-center space-x-1">
                      <MapPin className="w-2.5 h-2.5" />
                      <span>{lawyer.city}</span>
                    </span>
                  )}
                  {lawyer.firmName && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-medium">
                      {lawyer.firmName}
                    </span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  onClick={() => openChatWithUser(lawyer.userPublicId, lawyer.fullName)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs transition"
                  title="Chat with Advocate"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
                <Link
                  to={`/lawyers/${lawyer.publicId}`}
                  className="flex-1 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold text-center shadow-sm transition flex items-center justify-center space-x-1"
                >
                  <span>Book Consultation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
