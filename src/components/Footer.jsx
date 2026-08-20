import React from 'react';
import { ShieldCheck, Zap, Award, Clock, Heart } from 'lucide-react';

export default function Footer({ onSelectCategory, onOpenRegisterWorker }) {
  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trust Badges Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pb-12 mb-12 border-b border-slate-800 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-aqua-950/80 border border-aqua-500/30 flex items-center justify-center text-aqua-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">100% ID Verified</h4>
              <p className="text-xs text-slate-400">Admin background checks</p> //
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-aqua-950/80 border border-aqua-500/30 flex items-center justify-center text-aqua-400">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Instant Booking</h4>
              <p className="text-xs text-slate-400">Real-time worker response</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-aqua-950/80 border border-aqua-500/30 flex items-center justify-center text-aqua-400">
              <Award className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Transparent Pricing</h4>
              <p className="text-xs text-slate-400">No hidden service commissions</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-aqua-950/80 border border-aqua-500/30 flex items-center justify-center text-aqua-400">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Hyperlocal GPS</h4>
              <p className="text-xs text-slate-400">Workers in your neighborhood</p>
            </div>
          </div>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10">
          
          {/* Brand Col */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-aqua-600 to-aqua-400 flex items-center justify-center text-slate-950 font-black shadow-aqua-sm">
                <span className="text-xl">⚡</span>
              </div>
              <span className="text-2xl font-extrabold text-white tracking-tight">
                Worker<span className="text-aqua-400">Connect</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed max-w-sm">
              Empowering local skilled trade workers while giving homeowners and businesses immediate access to reliable, certified, nearby assistance.
            </p>
            <div className="pt-2">
              <button
                onClick={onOpenRegisterWorker}
                className="px-5 py-2.5 rounded-full text-xs font-bold aqua-gradient-btn inline-flex items-center gap-2 shadow-lg"
              >
                <span>Join As A Skilled Professional</span>
                <span>→</span>
              </button>
            </div>
          </div>

          {/* Skill Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Popular Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {['Electrician', 'Plumber', 'Painter', 'Carpenter', 'AC Repair', 'Home Cleaner', 'Mechanic'].map((cat) => (
                <li key={cat}>
                  <button
                    onClick={() => onSelectCategory && onSelectCategory(cat)}
                    className="hover:text-aqua-400 transition"
                  >
                    {cat} Services
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* For Customers */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              For Customers
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><span className="hover:text-white cursor-pointer">How to Book</span></li>
              <li><span className="hover:text-white cursor-pointer">Live Worker Tracking</span></li>
              <li><span className="hover:text-white cursor-pointer">Verified Worker Standards</span></li>
              <li><span className="hover:text-white cursor-pointer">Pricing Guidelines</span></li>
              <li><span className="hover:text-white cursor-pointer">Customer Support</span></li>
            </ul>
          </div>

          {/* For Workers & Admin */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-4">
              Platform & Safety
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li><span className="hover:text-white cursor-pointer">Worker Verification Process</span></li>
              <li><span className="hover:text-white cursor-pointer">Admin Verification Desk</span></li>
              <li><span className="hover:text-white cursor-pointer">Zero Commission Model</span></li>
              <li><span className="hover:text-white cursor-pointer">Terms & Privacy Policy</span></li>
              <li><span className="hover:text-white cursor-pointer">Safety Guidelines</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 mt-12 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2025 WorkerConnect Inc. All rights reserved. Pure White & Aqua Edition.</p>
          <p className="flex items-center gap-1">
            Built with <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 inline" /> for skilled tradesmen & homeowners
          </p>
        </div>
      </div>
    </footer>
  );
}
