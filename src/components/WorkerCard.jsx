import React from 'react';
import { Star, MapPin, Briefcase, CheckCircle2, ShieldCheck, ArrowRight, Clock } from 'lucide-react';

export default function WorkerCard({ worker, onViewProfile, onBookNow }) {
  const isAvailable = worker.isAvailable !== false;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-soft hover:shadow-soft-hover transition-all duration-300 flex flex-col justify-between group relative hover:-translate-y-1">
      
      {/* Top Header: Avatar, Status, Skill */}
      <div>
        <div className="flex items-start gap-4">
          <div className="relative">
            <img
              src={
                worker.avatar ||
                `https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80`
              }
              alt={worker.fullName}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-slate-100 group-hover:border-aqua-400 transition shadow-sm"
            />
            {/* Online / Offline status dot */}
            <span
              title={isAvailable ? 'Available for work' : 'Currently busy'}
              className={`absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-white flex items-center justify-center ${
                isAvailable ? 'bg-emerald-500' : 'bg-slate-400'
              }`}
            >
              <span className={`h-2 w-2 rounded-full ${isAvailable ? 'bg-white animate-pulse' : 'bg-slate-200'}`} />
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-base font-bold text-slate-900 truncate group-hover:text-aqua-800 transition">
                {worker.fullName}
              </h3>
              <ShieldCheck className="h-4 w-4 text-aqua-600 flex-shrink-0" title="Verified Professional" />
            </div>

            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-aqua-50 text-aqua-900 border border-aqua-200">
                {worker.skill}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {worker.experience} yrs exp
              </span>
            </div>
          </div>
        </div>

        {/* Location & Calculated Distance */}
        <div className="mt-3.5 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1 truncate max-w-[180px]">
            <MapPin className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{worker.location}</span>
          </div>
          {worker.distanceKm !== undefined && worker.distanceKm !== null ? (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]">
              📍 {worker.distanceKm} km away
            </span>
          ) : (
            <span className="text-[11px] text-slate-400 font-medium">Nearby</span>
          )}
        </div>

        {/* Short Bio */}
        <p className="mt-3 text-xs text-slate-500 line-clamp-2 leading-relaxed">
          {worker.description || 'Skilled & certified professional offering reliable service.'}
        </p>
      </div>

      {/* Footer: Rating, Price, Action Buttons */}
      <div className="mt-4 pt-3.5 border-t border-slate-100">
        <div className="flex items-center justify-between mb-3.5">
          {/* Rating */}
          <div className="flex items-center gap-1.5">
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 font-bold text-xs">
              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
              <span>{worker.rating ? worker.rating.toFixed(1) : '5.0'}</span>
            </div>
            <span className="text-[11px] text-slate-400">
              ({worker.reviewCount || 0} reviews)
            </span>
          </div>

          {/* Pricing */}
          <div className="text-right">
            <span className="text-sm font-extrabold text-slate-900">
              ₹{worker.servicePrice}
            </span>
            <span className="text-[10px] text-slate-400 block -mt-0.5">
              {worker.priceUnit || 'basic charge'}
            </span>
          </div>
        </div>

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onViewProfile(worker)}
            className="w-full py-2 px-3 rounded-xl border border-slate-200 hover:border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center justify-center gap-1"
          >
            View Profile
          </button>
          <button
            onClick={() => onBookNow(worker)}
            disabled={!isAvailable}
            className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 ${
              isAvailable
                ? 'aqua-gradient-btn shadow-sm'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
            }`}
          >
            {isAvailable ? (
              <>
                <span>Book Now</span>
                <ArrowRight className="h-3 w-3" />
              </>
            ) : (
              <span>Unavailable</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
