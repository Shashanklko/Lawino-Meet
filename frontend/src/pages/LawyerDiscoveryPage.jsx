import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Search,
  Filter,
  ShieldCheck,
  Star,
  MapPin,
  Clock,
  ArrowRight,
  MessageSquare,
  Video,
  Building,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown,
  X,
  Briefcase,
  LayoutGrid,
  List,
  Check,
  Sparkles,
} from 'lucide-react';
import { userApi } from '../api/userApi';
import { useChat } from '../context/ChatContext';

// Categories / Practice Areas
const CATEGORIES = [
  { id: 'ALL', label: 'All Practice Areas' },
  { id: 'CRIMINAL_DEFENSE', label: 'Criminal Defense & Bail' },
  { id: 'CORPORATE_LAW', label: 'Corporate & M&A' },
  { id: 'CIVIL_LITIGATION', label: 'Civil & Property Disputes' },
  { id: 'LABOUR_LAW', label: 'Employment & Labour Law' },
  { id: 'FAMILY_LAW', label: 'Family & Matrimonial' },
  { id: 'CYBER_LAW', label: 'Cyber Crime & IT Act' },
  { id: 'INTELLECTUAL_PROPERTY', label: 'Intellectual Property (IPR)' },
  { id: 'TAXATION_LAW', label: 'Taxation & Corporate Finance' },
];

// Price / Retainer Ranges (in INR)
const PRICE_RANGES = [
  { id: 'ALL', label: 'Any Fee' },
  { id: 'UNDER_1000', label: 'Under ₹1,000', min: 0, max: 1000 },
  { id: '1000_2500', label: '₹1,000 – ₹2,500', min: 1000, max: 2500 },
  { id: '2500_5000', label: '₹2,500 – ₹5,000', min: 2500, max: 5000 },
  { id: 'ABOVE_5000', label: '₹5,000+', min: 5000, max: Infinity },
];

// Major Indian Legal Hubs / Locations
const POPULAR_LOCATIONS = [
  'All Cities',
  'Delhi NCR',
  'Mumbai',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Jaipur',
  'Chandigarh',
  'Ahmedabad',
];

// Minimum Experience Options
const EXPERIENCE_OPTIONS = [
  { id: 0, label: 'Any Experience' },
  { id: 5, label: '5+ Years' },
  { id: 10, label: '10+ Years' },
  { id: 15, label: '15+ Years' },
];

const normalizeLawyer = (adv) => {
  const hourlyRate = Number(adv.hourlyRate) || (adv.services?.[0]?.consultationFee) || 1500;
  const experienceYears = Number(adv.experienceYears || adv.yearsOfExperience) || 10;
  const bio = adv.biography || adv.bio || 'Advocate practicing before High Courts and tribunals.';
  const specialization = adv.specialization || (adv.specializations?.[0]?.code) || 'CIVIL_LITIGATION';
  const barCouncilNumber = adv.barCouncilNumber || adv.qualification || 'Bar Council Enrolled';
  const publicId = adv.slug || adv.userPublicId || adv.publicId;

  return {
    ...adv,
    publicId,
    userPublicId: adv.userPublicId || adv.publicId,
    fullName: adv.fullName || adv.username,
    barCouncilNumber,
    specialization,
    hourlyRate,
    yearsOfExperience: experienceYears,
    city: adv.city || 'Delhi NCR',
    bio,
    availableOnline: adv.messagingEnabled !== false,
    availableOffline: true,
    rating: adv.rating || 4.9,
    consultationsCount: adv.consultationsCount || 120,
    badge: adv.associatedFirmName || 'Verified Advocate',
  };
};

export const LawyerDiscoveryPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read URL query params
  const paramCategory = searchParams.get('category') || searchParams.get('specialization') || 'ALL';
  const paramMode = searchParams.get('mode') || 'ALL';
  const paramCity = searchParams.get('city') || searchParams.get('location') || 'All Cities';
  const paramRange = searchParams.get('range') || 'ALL';
  const paramQuery = searchParams.get('query') || '';

  // Filter States
  const [selectedCategory, setSelectedCategory] = useState(paramCategory);
  const [selectedRange, setSelectedRange] = useState(paramRange);
  const [selectedCity, setSelectedCity] = useState(paramCity);
  const [consultationMode, setConsultationMode] = useState(paramMode);
  const [minExp, setMinExp] = useState(0);
  const [searchQuery, setSearchQuery] = useState(paramQuery);

  // View & Sort States
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
  const [sortBy, setSortBy] = useState('recommended'); // 'recommended' | 'fee_asc' | 'fee_desc' | 'exp_desc' | 'rating_desc'

  const [rawApiLawyers, setRawApiLawyers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { openChatWithUser } = useChat();

  // Sync state if URL query params change
  useEffect(() => {
    if (paramCategory) setSelectedCategory(paramCategory);
    if (paramMode) setConsultationMode(paramMode);
    if (paramCity) setSelectedCity(paramCity);
    if (paramRange) setSelectedRange(paramRange);
    if (paramQuery) setSearchQuery(paramQuery);
  }, [paramCategory, paramMode, paramCity, paramRange, paramQuery]);

  // Fetch from live backend search API if reachable
  const fetchLawyers = async () => {
    setLoading(true);
    try {
      const params = {};
      if (selectedCategory && selectedCategory !== 'ALL') params.specialization = selectedCategory;
      if (selectedCity && selectedCity !== 'All Cities') params.city = selectedCity;
      if (searchQuery.trim()) params.query = searchQuery.trim();

      const res = await userApi.searchLawyers(params);
      if (res && res.success && res.data) {
        const list = res.data.content || (Array.isArray(res.data) ? res.data : []);
        setRawApiLawyers(list);
      } else {
        setRawApiLawyers([]);
      }
    } catch {
      setRawApiLawyers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLawyers();
  }, [selectedCategory, selectedCity]);

  // Direct live API data from database
  const allAdvocates = useMemo(() => {
    return (rawApiLawyers || []).map(normalizeLawyer);
  }, [rawApiLawyers]);

  // Filter & Sort Pipeline
  const filteredAndSortedLawyers = useMemo(() => {
    let list = allAdvocates.filter((adv) => {
      // 1. Category Filter
      if (selectedCategory !== 'ALL' && adv.specialization !== selectedCategory) {
        return false;
      }

      // 2. Location / City Filter
      if (selectedCity !== 'All Cities') {
        const advCity = (adv.city || '').toLowerCase();
        const targetCity = selectedCity.toLowerCase();
        if (!advCity.includes(targetCity) && !targetCity.includes(advCity)) {
          return false;
        }
      }

      // 3. Price Range Filter
      const rate = Number(adv.hourlyRate) || 0;
      if (selectedRange === 'UNDER_1000' && rate >= 1000) return false;
      if (selectedRange === '1000_2500' && (rate < 1000 || rate > 2500)) return false;
      if (selectedRange === '2500_5000' && (rate < 2500 || rate > 5000)) return false;
      if (selectedRange === 'ABOVE_5000' && rate < 5000) return false;

      // 4. Consultation Mode Filter
      if (consultationMode === 'ONLINE' && !adv.availableOnline && adv.consultationMode === 'OFFLINE') {
        return false;
      }
      if (consultationMode === 'OFFLINE' && !adv.availableOffline && adv.consultationMode === 'ONLINE') {
        return false;
      }

      // 5. Min Experience
      if (minExp > 0 && (Number(adv.yearsOfExperience) || 0) < minExp) {
        return false;
      }

      // 6. Keyword Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = (adv.fullName || '').toLowerCase().includes(q);
        const cityMatch = (adv.city || '').toLowerCase().includes(q);
        const bioMatch = (adv.bio || '').toLowerCase().includes(q);
        const barMatch = (adv.barCouncilNumber || '').toLowerCase().includes(q);
        const specMatch = (adv.specialization || '').toLowerCase().includes(q);
        if (!nameMatch && !cityMatch && !bioMatch && !barMatch && !specMatch) {
          return false;
        }
      }

      return true;
    });

    // Sort order
    if (sortBy === 'fee_asc') {
      list = [...list].sort((a, b) => (Number(a.hourlyRate) || 0) - (Number(b.hourlyRate) || 0));
    } else if (sortBy === 'fee_desc') {
      list = [...list].sort((a, b) => (Number(b.hourlyRate) || 0) - (Number(a.hourlyRate) || 0));
    } else if (sortBy === 'exp_desc') {
      list = [...list].sort((a, b) => (Number(b.yearsOfExperience) || 0) - (Number(a.yearsOfExperience) || 0));
    } else if (sortBy === 'rating_desc') {
      list = [...list].sort((a, b) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    }

    return list;
  }, [allAdvocates, selectedCategory, selectedCity, selectedRange, consultationMode, minExp, searchQuery, sortBy]);

  // Clear all filters
  const handleResetFilters = () => {
    setSelectedCategory('ALL');
    setSelectedRange('ALL');
    setSelectedCity('All Cities');
    setConsultationMode('ALL');
    setMinExp(0);
    setSearchQuery('');
    setSortBy('recommended');
    setSearchParams({});
  };

  const hasActiveFilters =
    selectedCategory !== 'ALL' ||
    selectedRange !== 'ALL' ||
    selectedCity !== 'All Cities' ||
    consultationMode !== 'ALL' ||
    minExp > 0 ||
    searchQuery.trim() !== '';

  return (
    <div className="text-[#2E2A29] selection:bg-[#831826]/15 selection:text-[#831826] space-y-6">
      {/* =========================================================================
          TOP SEARCH BAR & CONTROLS CARD
          ========================================================================= */}
      <div className="border border-[#E8E2D8] bg-white rounded-2xl shadow-xs p-4 sm:p-5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            {/* Search Input with Shortcut Icon */}
            <div className="relative flex-1 max-w-2xl">
              <Search className="w-4 h-4 text-[#8C847E] absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by advocate name, legal specialty, court, or city..."
                className="w-full bg-[#FAF7F2] text-sm text-[#2E2A29] pl-10 pr-10 py-2.5 rounded-xl border border-[#E8E2D8] placeholder:text-[#8C847E] focus:outline-none focus:border-[#831826] focus:bg-white transition"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-3 text-[#8C847E] hover:text-[#2E2A29]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Quick Controls: View Toggle, Sort By, Mobile Filter Trigger */}
            <div className="flex items-center space-x-3 shrink-0 justify-between md:justify-end">
              {/* Mobile Filter Toggle */}
              <button
                type="button"
                onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
                className="md:hidden inline-flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-[#E8E2D8] text-xs font-medium text-[#524B47] hover:bg-[#FAF7F2]"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-[#831826]" />
                )}
              </button>

              {/* Sort By Dropdown */}
              <div className="flex items-center space-x-1.5 text-xs text-[#524B47]">
                <span className="hidden sm:inline font-medium text-[#8C847E]">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-2.5 py-1.5 text-xs font-medium text-[#2E2A29] focus:outline-none focus:border-[#831826] cursor-pointer"
                >
                  <option value="recommended">Recommended</option>
                  <option value="fee_asc">Fee: Low to High</option>
                  <option value="fee_desc">Fee: High to Low</option>
                  <option value="exp_desc">Experience: High to Low</option>
                  <option value="rating_desc">Highest Rated</option>
                </select>
              </div>

              {/* View Switcher (Grid / List) */}
              <div className="hidden sm:flex items-center border border-[#E8E2D8] rounded-xl p-0.5 bg-[#FAF7F2]">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'grid'
                      ? 'bg-white text-[#831826] shadow-xs'
                      : 'text-[#8C847E] hover:text-[#2E2A29]'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-lg transition ${
                    viewMode === 'list'
                      ? 'bg-white text-[#831826] shadow-xs'
                      : 'text-[#8C847E] hover:text-[#2E2A29]'
                  }`}
                  title="List View"
                >
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Active Filter Chips Bar */}
          {hasActiveFilters && (
            <div className="pt-3 mt-3 border-t border-[#E8E2D8] flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#8C847E] text-[11px] font-medium uppercase tracking-wider">
                Applied Filters:
              </span>

              {selectedCategory !== 'ALL' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#831826]/10 text-[#831826] text-xs font-medium">
                  <span>{CATEGORIES.find((c) => c.id === selectedCategory)?.label}</span>
                  <button onClick={() => setSelectedCategory('ALL')}>
                    <X className="w-3 h-3 hover:text-rose-700" />
                  </button>
                </span>
              )}

              {selectedCity !== 'All Cities' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#831826]/10 text-[#831826] text-xs font-medium">
                  <span>{selectedCity}</span>
                  <button onClick={() => setSelectedCity('All Cities')}>
                    <X className="w-3 h-3 hover:text-rose-700" />
                  </button>
                </span>
              )}

              {selectedRange !== 'ALL' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#831826]/10 text-[#831826] text-xs font-medium">
                  <span>{PRICE_RANGES.find((r) => r.id === selectedRange)?.label}</span>
                  <button onClick={() => setSelectedRange('ALL')}>
                    <X className="w-3 h-3 hover:text-rose-700" />
                  </button>
                </span>
              )}

              {consultationMode !== 'ALL' && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#831826]/10 text-[#831826] text-xs font-medium">
                  <span>{consultationMode === 'ONLINE' ? 'Video Counsel' : 'Chamber In-Person'}</span>
                  <button onClick={() => setConsultationMode('ALL')}>
                    <X className="w-3 h-3 hover:text-rose-700" />
                  </button>
                </span>
              )}

              {minExp > 0 && (
                <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-[#831826]/10 text-[#831826] text-xs font-medium">
                  <span>{minExp}+ Yrs Experience</span>
                  <button onClick={() => setMinExp(0)}>
                    <X className="w-3 h-3 hover:text-rose-700" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={handleResetFilters}
                className="text-xs text-[#831826] hover:underline font-semibold ml-1 flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset All</span>
              </button>
            </div>
          )}
        </div>

      {/* =========================================================================
          MAIN 2-COLUMN SAAS LAYOUT (Filter Sidebar + Results Stream)
          ========================================================================= */}
      <div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* =====================================================================
              LEFT SIDEBAR: Engineered Filters Panel (Desktop Sidebar / Mobile Sheet)
              ===================================================================== */}
          <aside
            className={`md:col-span-4 lg:col-span-3 space-y-6 bg-white border border-[#E8E2D8] rounded-2xl p-5 shadow-xs ${
              mobileFilterOpen ? 'block' : 'hidden md:block'
            }`}
          >
            {/* Sidebar Title & Reset */}
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D8]">
              <div className="flex items-center space-x-2">
                <SlidersHorizontal className="w-4 h-4 text-[#831826]" />
                <h2 className="text-sm font-serif font-bold text-[#2E2A29]">Filter Directory</h2>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="text-xs text-[#831826] hover:underline font-medium"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* 1. Category / Practice Area */}
            <div className="space-y-2">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#8C847E] block">
                Practice Area
              </label>
              <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                {CATEGORIES.map((cat) => {
                  const isSelected = selectedCategory === cat.id;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                        isSelected
                          ? 'bg-[#831826] text-white font-medium shadow-xs'
                          : 'text-[#524B47] hover:bg-[#FAF7F2] hover:text-[#2E2A29]'
                      }`}
                    >
                      <span className="truncate">{cat.label}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Consultation Format (Segmented Control) */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#8C847E] block">
                Consultation Format
              </label>
              <div className="grid grid-cols-3 gap-1 bg-[#FAF7F2] p-1 rounded-xl border border-[#E8E2D8]">
                <button
                  type="button"
                  onClick={() => setConsultationMode('ALL')}
                  className={`py-1.5 text-[11px] font-sans font-medium rounded-lg transition ${
                    consultationMode === 'ALL'
                      ? 'bg-white text-[#831826] shadow-xs'
                      : 'text-[#716B64] hover:text-[#2E2A29]'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationMode('ONLINE')}
                  className={`py-1.5 text-[11px] font-sans font-medium rounded-lg flex items-center justify-center space-x-1 transition ${
                    consultationMode === 'ONLINE'
                      ? 'bg-white text-[#831826] shadow-xs'
                      : 'text-[#716B64] hover:text-[#2E2A29]'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConsultationMode('OFFLINE')}
                  className={`py-1.5 text-[11px] font-sans font-medium rounded-lg flex items-center justify-center space-x-1 transition ${
                    consultationMode === 'OFFLINE'
                      ? 'bg-white text-[#831826] shadow-xs'
                      : 'text-[#716B64] hover:text-[#2E2A29]'
                  }`}
                >
                  <Building className="w-3 h-3" />
                  <span>Chamber</span>
                </button>
              </div>
            </div>

            {/* 3. Fee Range Filter */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#8C847E] block">
                Retainer Budget
              </label>
              <div className="space-y-1">
                {PRICE_RANGES.map((rng) => {
                  const isSelected = selectedRange === rng.id;
                  return (
                    <label
                      key={rng.id}
                      className={`flex items-center space-x-2.5 px-3 py-1.5 rounded-lg text-xs cursor-pointer transition ${
                        isSelected
                          ? 'bg-[#831826]/10 text-[#831826] font-medium'
                          : 'text-[#524B47] hover:bg-[#FAF7F2]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="price_range"
                        checked={isSelected}
                        onChange={() => setSelectedRange(rng.id)}
                        className="text-[#831826] focus:ring-[#831826] accent-[#831826]"
                      />
                      <span>{rng.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* 4. Location / Jurisdiction */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#8C847E] block">
                Jurisdiction / City
              </label>
              <div className="relative">
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full appearance-none bg-[#FAF7F2] border border-[#E8E2D8] rounded-xl px-3 py-2 text-xs text-[#2E2A29] font-medium focus:outline-none focus:border-[#831826] cursor-pointer"
                >
                  {POPULAR_LOCATIONS.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-[#8C847E] absolute right-3 top-3 pointer-events-none" />
              </div>
            </div>

            {/* 5. Experience Filter */}
            <div className="space-y-2 pt-2 border-t border-[#E8E2D8]">
              <label className="text-[11px] font-sans font-bold uppercase tracking-wider text-[#8C847E] block">
                Experience Level
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {EXPERIENCE_OPTIONS.map((exp) => (
                  <button
                    key={exp.id}
                    type="button"
                    onClick={() => setMinExp(exp.id)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                      minExp === exp.id
                        ? 'bg-[#831826] text-white border-[#831826]'
                        : 'bg-[#FAF7F2] text-[#524B47] border-[#E8E2D8] hover:border-[#831826]'
                    }`}
                  >
                    {exp.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Trust Assurance Badge */}
            <div className="pt-3 border-t border-[#E8E2D8] text-[11px] text-[#716B64] flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>100% State Bar Council Verified Advocates</span>
            </div>
          </aside>

          {/* =====================================================================
              RIGHT STREAM: Results Header & Advocates Cards / Rows
              ===================================================================== */}
          <main className="md:col-span-8 lg:col-span-9 space-y-4">
            {/* Results Counter Header */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <h2 className="text-base font-serif font-bold text-[#2E2A29]">
                  Verified Advocates
                </h2>
                <p className="text-xs text-[#716B64]">
                  Showing <strong className="text-[#2E2A29]">{filteredAndSortedLawyers.length}</strong> available legal professional experts
                </p>
              </div>

              <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full font-medium flex items-center space-x-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                <span>Direct Video &amp; Chamber Ready</span>
              </div>
            </div>

            {/* Subtle live sync status */}
            {loading && (
              <div className="flex items-center space-x-2 text-xs text-[#831826] bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-100">
                <div className="w-3.5 h-3.5 border-2 border-[#831826] border-t-transparent rounded-full animate-spin shrink-0" />
                <span>Checking live advocate registry...</span>
              </div>
            )}

            {filteredAndSortedLawyers.length === 0 ? (
              /* Clean SaaS Empty State */
              <div className="bg-white rounded-2xl border border-[#E8E2D8] p-16 text-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8E2D8] flex items-center justify-center mx-auto text-[#8C847E]">
                  <Search className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-serif font-bold text-[#2E2A29]">
                    No advocates match your criteria
                  </h3>
                  <p className="text-xs text-[#716B64] max-w-sm mx-auto">
                    Try clearing some filters, expanding your budget range, or searching a different jurisdiction.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleResetFilters}
                    className="px-5 py-2 rounded-xl bg-[#831826] text-white text-xs font-medium hover:bg-[#6c131f] transition"
                  >
                    Reset all filters
                  </button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* =================================================================
                 GRID VIEW (Sleek SaaS Cards)
                 ================================================================= */
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredAndSortedLawyers.map((adv) => (
                  <div
                    key={adv.publicId}
                    className="bg-white rounded-2xl border border-[#E8E2D8] hover:border-[#831826]/70 hover:shadow-md transition-all duration-200 p-5 flex flex-col justify-between space-y-4 group"
                  >
                    <div className="space-y-3">
                      {/* Top Row: Avatar, Name, Verification, Rate */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-11 h-11 rounded-xl bg-[#480E17] text-[#E5A952] font-serif font-bold flex items-center justify-center text-base shadow-xs shrink-0">
                            {adv.fullName?.[0]?.toUpperCase() || 'A'}
                          </div>
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h3 className="text-sm font-serif font-bold text-[#2E2A29] group-hover:text-[#831826] transition">
                                {adv.fullName}
                              </h3>
                              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" title="State Bar Verified" />
                            </div>
                            <span className="text-[11px] text-[#8C847E] font-mono block">
                              Bar ID: <strong className="text-[#524B47] font-semibold">{adv.barCouncilNumber}</strong>
                            </span>
                          </div>
                        </div>

                        {/* Rate */}
                        <div className="text-right shrink-0">
                          <span className="text-base font-serif font-bold text-[#831826]">
                            ₹{adv.hourlyRate}
                          </span>
                          <span className="text-[10px] text-[#8C847E] block font-sans">/ retainer</span>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-[#524B47] line-clamp-2 leading-relaxed">
                        {adv.bio}
                      </p>

                      {/* Metadata Pills: Category, City, Exp, Rating */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="px-2 py-0.5 rounded-md bg-[#831826]/10 text-[#831826] text-[10px] font-medium">
                          {(adv.specialization || 'GENERAL').replace(/_/g, ' ')}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#524B47] text-[10px] font-medium border border-[#E8E2D8]">
                          {adv.yearsOfExperience} Yrs Exp
                        </span>
                        {adv.city && (
                          <span className="px-2 py-0.5 rounded-md bg-[#FAF7F2] text-[#524B47] text-[10px] font-medium border border-[#E8E2D8] flex items-center space-x-1">
                            <MapPin className="w-2.5 h-2.5 text-[#831826]" />
                            <span>{adv.city}</span>
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-medium flex items-center space-x-1 ml-auto">
                          <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                          <span>{adv.rating || '4.9'}</span>
                        </span>
                      </div>
                    </div>

                    {/* Bottom Actions Bar */}
                    <div className="pt-3 border-t border-[#E8E2D8] flex items-center justify-between gap-2">
                      <div className="flex items-center space-x-2 text-[11px] text-[#716B64]">
                        {adv.availableOnline && (
                          <span className="inline-flex items-center space-x-1 text-emerald-700">
                            <Video className="w-3 h-3" />
                            <span>Video</span>
                          </span>
                        )}
                        {adv.availableOffline && (
                          <span className="inline-flex items-center space-x-1 text-stone-600">
                            <Building className="w-3 h-3" />
                            <span>Chamber</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => openChatWithUser(adv.userPublicId, adv.fullName)}
                          className="p-2 rounded-xl border border-[#E8E2D8] hover:bg-[#FAF7F2] hover:text-[#831826] text-[#524B47] transition"
                          title="Message Advocate"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#831826]" />
                        </button>
                        <Link
                          to={`/lawyers/${adv.publicId}`}
                          className="px-3.5 py-2 rounded-xl bg-[#831826] hover:bg-[#6c131f] text-white text-xs font-serif font-medium shadow-xs hover:shadow transition flex items-center space-x-1"
                        >
                          <span>Consult</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* =================================================================
                 LIST VIEW (High-Density Engineered Rows like Linear / GitHub)
                 ================================================================= */
              <div className="bg-white rounded-2xl border border-[#E8E2D8] divide-y divide-[#E8E2D8] overflow-hidden shadow-xs">
                {filteredAndSortedLawyers.map((adv) => (
                  <div
                    key={adv.publicId}
                    className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-[#FAF7F2] transition group"
                  >
                    <div className="flex items-start space-x-3.5 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-[#480E17] text-[#E5A952] font-serif font-bold flex items-center justify-center text-sm shrink-0">
                        {adv.fullName?.[0]?.toUpperCase() || 'A'}
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="text-sm font-serif font-bold text-[#2E2A29] group-hover:text-[#831826] transition truncate">
                            {adv.fullName}
                          </h3>
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span className="px-2 py-0.5 rounded-md bg-[#831826]/10 text-[#831826] text-[10px] font-medium shrink-0">
                            {(adv.specialization || 'GENERAL').replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-[#524B47] line-clamp-1 font-sans">
                          {adv.bio}
                        </p>
                        <div className="flex items-center space-x-3 text-[11px] text-[#716B64]">
                          <span>{adv.yearsOfExperience} Yrs Exp</span>
                          <span>•</span>
                          <span>{adv.city}</span>
                          <span>•</span>
                          <span className="font-mono text-[#8C847E]">Bar: {adv.barCouncilNumber}</span>
                          <span>•</span>
                          <span className="flex items-center space-x-0.5 text-amber-700">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                            <span>{adv.rating || '4.9'}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Right Action & Rate in List View */}
                    <div className="flex items-center space-x-4 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-base font-serif font-bold text-[#831826]">
                          ₹{adv.hourlyRate}
                        </span>
                        <span className="text-[10px] text-[#8C847E] block">/ retainer</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => openChatWithUser(adv.userPublicId, adv.fullName)}
                        className="p-2 rounded-xl border border-[#E8E2D8] hover:bg-white text-[#524B47] transition"
                        title="Direct Message"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-[#831826]" />
                      </button>
                      <Link
                        to={`/lawyers/${adv.publicId}`}
                        className="px-4 py-2 rounded-xl bg-[#831826] hover:bg-[#6c131f] text-white text-xs font-serif font-medium shadow-xs transition"
                      >
                        Consult
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
};
