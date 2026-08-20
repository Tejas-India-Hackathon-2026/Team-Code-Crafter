import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  SlidersHorizontal,
  Map,
  Grid,
  Star,
  ShieldCheck,
  Zap,
  Award,
  Users,
  CheckCircle2,
  Clock,
  Compass,
  ArrowRight,
  TrendingUp,
  Filter
} from 'lucide-react';
import WorkerCard from '../components/WorkerCard';
import { SKILL_CATEGORIES } from '../components/AuthModals';
import { useLocation } from '../context/LocationContext';

export default function HomePage({
  onViewProfile,
  onBookNow,
  onOpenRegisterWorker,
  onOpenMapView,
  searchQuery,
  setSearchQuery,
}) {
  const { currentLocation, coords, pinCode, detectGPSLocation, isDetectingGPS, maxDistance, setMaxDistance } = useLocation();

  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('rating'); // 'rating', 'distance', 'price_asc', 'price_desc', 'experience'
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'map'

  // Fetch workers based on filters & coordinates
  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory && selectedCategory !== 'All') {
        params.append('skill', selectedCategory);
      }
      if (searchQuery && searchQuery.trim() !== '') {
        params.append('query', searchQuery.trim());
      }
      if (coords?.lat && coords?.lng) {
        params.append('lat', coords.lat);
        params.append('lng', coords.lng);
      }
      if (sortBy) {
        params.append('sortBy', sortBy);
      }
      if (maxDistance) {
        params.append('maxDistance', maxDistance);
      }

      const res = await fetch(`/api/workers?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setWorkers(data.workers || []);
      }
    } catch (err) {
      console.error('Failed to fetch workers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkers();
  }, [selectedCategory, searchQuery, coords, sortBy, maxDistance]);

  return (
    <div className="bg-white min-h-screen">
      
      {/* 1. HERO SECTION */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-50/80 via-white to-white border-b border-slate-100">
        
        {/* Subtle decorative background circles */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-aqua-100/40 rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-100/30 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          
          {/* Top Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-aqua-50 border border-aqua-200 text-aqua-900 text-xs font-bold shadow-xs mb-6">
            <span className="flex h-2 w-2 rounded-full bg-aqua-500 animate-ping" />
            <span>Hyperlocal Skilled Worker Network</span>
            <span className="text-slate-300">•</span>
            <span className="text-slate-600 font-medium">Over 500+ Verified Pros</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-[1.15]">
            Book Trusted Skilled Workers <br className="hidden sm:inline" />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-aqua-600 to-teal-600">
              Right In Your Neighborhood
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Need an Electrician, Plumber, Painter, Carpenter, or AC Technician? Connect with verified, nearby professionals with upfront pricing and instant booking.
          </p>

          {/* Large Hero Search & Location Bar */}
          <div className="mt-10 max-w-3xl mx-auto bg-white p-3 rounded-3xl border border-slate-200 shadow-aqua-md">
            <div className="flex flex-col md:flex-row items-center gap-2">
              
              {/* Location input / GPS Button */}
              <div className="flex-1 w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <MapPin className="h-4 w-4 text-aqua-600 flex-shrink-0" />
                <span className="font-bold text-slate-800 truncate">{currentLocation}</span>
                <button
                  type="button"
                  onClick={detectGPSLocation}
                  disabled={isDetectingGPS}
                  className="ml-auto text-[11px] font-bold text-aqua-700 hover:text-aqua-800 flex items-center gap-1 flex-shrink-0"
                >
                  <Compass className={`h-3 w-3 ${isDetectingGPS ? 'animate-spin' : ''}`} />
                  {isDetectingGPS ? 'Locating...' : 'GPS'}
                </button>
              </div>

              {/* Keyword / Skill Search */}
              <div className="flex-1 w-full flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
                <Search className="h-4 w-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery || ''}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="What service do you need? (e.g. Electrician)"
                  className="w-full bg-transparent text-slate-900 placeholder:text-slate-400 focus:outline-none text-xs"
                />
              </div>

              {/* Search Button */}
              <button
                onClick={fetchWorkers}
                className="w-full md:w-auto px-8 py-3 rounded-2xl text-xs font-extrabold aqua-gradient-btn shadow-sm flex items-center justify-center gap-2 flex-shrink-0"
              >
                <span>Find Workers</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Quick Category Chips */}
          <div className="mt-8 flex items-center justify-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('All')}
              className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <span>🔥</span>
              <span>All Services</span>
            </button>
            {SKILL_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                  selectedCategory === cat.id
                    ? 'bg-aqua-500 text-slate-950 shadow-aqua-sm'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. WORKERS LISTING SECTION */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" id="workers-section">
        
        {/* Section Header & Filters Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <span>Nearby Skilled Professionals</span>
              <span className="px-2.5 py-0.5 rounded-full bg-aqua-100 text-aqua-900 text-xs font-bold">
                {workers.length} Available
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Verified workers near <strong className="text-slate-800">{currentLocation}</strong>
            </p>
          </div>

          {/* Filter & Sorting Controls */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Sort Dropdown */}
            <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-slate-400 font-semibold">Sort By:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value="rating">Top Rated ⭐</option>
                <option value="distance">Nearest Distance 📍</option>
                <option value="price_asc">Price: Low to High ₹</option>
                <option value="price_desc">Price: High to Low ₹</option>
                <option value="experience">Most Experienced 🏆</option>
              </select>
            </div>

            {/* Max Distance Slider Pill */}
            <div className="hidden lg:flex items-center gap-2 text-xs bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
              <span className="text-slate-400 font-semibold">Radius:</span>
              <select
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-800 focus:outline-none cursor-pointer"
              >
                <option value={10}>Within 10 km</option>
                <option value={25}>Within 25 km</option>
                <option value={50}>Within 50 km</option>
              </select>
            </div>

            {/* Interactive Map Button */}
            <button
              onClick={() => onOpenMapView(workers)}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white flex items-center gap-1.5 transition shadow-sm"
            >
              <Map className="h-3.5 w-3.5 text-aqua-400" />
              <span>Map View</span>
            </button>
          </div>
        </div>

        {/* Worker Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-72 rounded-2xl shimmer-card border border-slate-200 p-5 space-y-4" />
            ))}
          </div>
        ) : workers.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-3xl border border-slate-200 mt-8 p-8">
            <span className="text-4xl block mb-3">🔍</span>
            <h3 className="text-lg font-bold text-slate-800">No Workers Found</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              No verified workers match your current location or filter criteria. Try expanding your search radius or clearing filters.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('All');
                setSearchQuery('');
              }}
              className="mt-4 px-5 py-2 rounded-xl aqua-gradient-btn text-xs font-bold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pt-8">
            {workers.map((worker) => (
              <WorkerCard
                key={worker.id}
                worker={worker}
                onViewProfile={onViewProfile}
                onBookNow={onBookNow}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. HOW IT WORKS SECTION */}
      <section className="py-20 bg-slate-50/70 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-xs font-extrabold uppercase tracking-widest text-aqua-700 block mb-2">
              Simple & Reliable
            </span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              How WorkerConnect Works
            </h2>
            <p className="text-slate-500 text-sm mt-3">
              Fast, transparent booking for customers and high-earning opportunities for skilled professionals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Step 1 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft hover:shadow-soft-hover transition-all text-center relative group">
              <div className="h-16 w-16 rounded-2xl bg-aqua-100 text-aqua-800 flex items-center justify-center text-2xl mx-auto font-black mb-6 group-hover:scale-110 transition-transform">
                📍
              </div>
              <span className="text-xs font-extrabold text-aqua-700 tracking-wider uppercase block mb-1">Step 1</span>
              <h3 className="text-lg font-bold text-slate-900">Locate Skilled Pros</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Use your GPS or search by city/PIN code to see verified electricians, plumbers, and technicians near you with distance meters.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft hover:shadow-soft-hover transition-all text-center relative group">
              <div className="h-16 w-16 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-2xl mx-auto font-black mb-6 group-hover:scale-110 transition-transform">
                ⚡
              </div>
              <span className="text-xs font-extrabold text-emerald-700 tracking-wider uppercase block mb-1">Step 2</span>
              <h3 className="text-lg font-bold text-slate-900">Book in 1 Click</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Select your preferred date, time slot, and describe the work. The worker receives an instant notification to accept.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-soft hover:shadow-soft-hover transition-all text-center relative group">
              <div className="h-16 w-16 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl mx-auto font-black mb-6 group-hover:scale-110 transition-transform">
                ⭐
              </div>
              <span className="text-xs font-extrabold text-amber-700 tracking-wider uppercase block mb-1">Step 3</span>
              <h3 className="text-lg font-bold text-slate-900">Service & Rate</h3>
              <p className="text-xs text-slate-500 leading-relaxed mt-2">
                Get quality doorstep assistance at upfront rates. Mark the job completed and leave a star rating to help your neighborhood.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. WORKER CALL TO ACTION BANNER */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-8 sm:p-12 text-white border border-slate-800 relative overflow-hidden shadow-2xl">
          
          <div className="absolute right-0 top-0 w-96 h-96 bg-aqua-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <span className="px-3.5 py-1 rounded-full bg-aqua-950 text-aqua-400 border border-aqua-800 text-xs font-bold uppercase tracking-wider">
                For Electricians, Plumbers, Mechanics & Technicians
              </span>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Are You A Skilled Worker? <br />
                <span className="text-aqua-400">Get Direct Customer Bookings Daily.</span>
              </h2>
              <p className="text-sm text-slate-300 max-w-xl leading-relaxed">
                Join WorkerConnect today. Complete the registration form with your skill details and ID proof. Once approved by our Admin desk, start receiving service requests directly from local customers!
              </p>
            </div>

            <div className="lg:col-span-4 flex flex-col sm:flex-row lg:flex-col gap-3 justify-end">
              <button
                onClick={onOpenRegisterWorker}
                className="px-8 py-3.5 rounded-2xl text-xs font-bold aqua-gradient-btn shadow-aqua-md flex items-center justify-center gap-2"
              >
                <span>Register As Skilled Worker</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
