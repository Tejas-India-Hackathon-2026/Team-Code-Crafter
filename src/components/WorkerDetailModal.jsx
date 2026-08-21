import React, { useState, useEffect } from 'react';
import {
  X,
  Star,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Award,
  MessageSquare,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function WorkerDetailModal({ worker, onClose, onBookNow, onOpenChat, onOpenLogin }) {
  const { token, isAuthenticated, role } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  const handleStartChat = async () => {
    if (!isAuthenticated || role !== 'customer') {
      onOpenLogin();
      return;
    }
    setStartingChat(true);
    try {
      const res = await fetch('/api/bookings/inquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ workerId: worker.id }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Unable to start chat');
      onClose();
      onOpenChat(data.inquiry);
    } catch (err) {
      console.error('Failed to start worker chat:', err);
    } finally {
      setStartingChat(false);
    }
  };

  useEffect(() => {
    if (!worker) return;
    async function fetchReviews() {
      try {
        const res = await fetch(`/api/workers/${worker.id}`);
        const data = await res.json();
        if (data.success) {
          setReviews(data.reviews || []);
        }
      } catch (err) {
        console.error('Failed to load reviews:', err);
      } finally {
        setLoadingReviews(false);
      }
    }
    fetchReviews();
  }, [worker]);

  if (!worker) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-slide-up">
        
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-aqua-600 to-aqua-400 p-6 text-slate-950">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 h-9 w-9 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
            <img
              src={
                worker.avatar ||
                `https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80`
              }
              alt={worker.fullName}
              className="h-24 w-24 rounded-2xl object-cover border-4 border-white shadow-md"
            />
            <div className="text-center sm:text-left flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h2 className="text-2xl font-extrabold">{worker.fullName}</h2>
                <ShieldCheck className="h-6 w-6 text-slate-950 fill-white" />
              </div>
              <p className="text-sm font-bold text-slate-900 mt-0.5">
                {worker.skill} {worker.subSkill ? `• ${worker.subSkill}` : ''}
              </p>
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-2 text-xs font-semibold text-slate-900">
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {worker.location}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Award className="h-3.5 w-3.5" />
                  {worker.experience} Years Experience
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[65vh] overflow-y-auto">
          
          {/* Key Metrics Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-center">
            <div>
              <span className="block text-xs text-slate-400 font-medium">Rating</span>
              <div className="flex items-center justify-center gap-1 mt-0.5 font-bold text-slate-900">
                <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                <span>{worker.rating ? worker.rating.toFixed(1) : '5.0'} / 5.0</span>
              </div>
            </div>
            <div className="border-x border-slate-200">
              <span className="block text-xs text-slate-400 font-medium">Service Charge</span>
              <span className="block font-bold text-slate-900 mt-0.5 text-base text-aqua-950">
                ₹{worker.servicePrice} <span className="text-[10px] text-slate-400 font-normal">{worker.priceUnit}</span>
              </span>
            </div>
            <div>
              <span className="block text-xs text-slate-400 font-medium">Status</span>
              <span className={`inline-flex items-center gap-1 font-bold text-xs mt-1 ${
                worker.isAvailable !== false ? 'text-emerald-700' : 'text-slate-500'
              }`}>
                <span className={`h-2 w-2 rounded-full ${worker.isAvailable !== false ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                {worker.isAvailable !== false ? 'Available Now' : 'Busy'}
              </span>
            </div>
          </div>

          {/* About Section */}
          <div>
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">
              About & Expertise
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
              {worker.description || 'Verified skilled professional providing dependable, high quality residential and commercial maintenance.'}
            </p>
          </div>

          {/* Verification Badges */}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
              Government ID Verified
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-aqua-50 text-aqua-900 border border-aqua-200 text-xs font-semibold">
              <ShieldCheck className="h-3.5 w-3.5 text-aqua-600" />
              Skills Tested & Approved
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
              <Phone className="h-3.5 w-3.5 text-blue-600" />
              Contact Verified: {worker.mobile}
            </span>
          </div>

          {/* Reviews List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-aqua-600" />
                Customer Reviews ({reviews.length})
              </h3>
            </div>

            {loadingReviews ? (
              <div className="text-center py-6 text-xs text-slate-400">Loading reviews...</div>
            ) : reviews.length === 0 ? (
              <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                No written reviews yet. Be the first customer to book and rate {worker.fullName}!
              </div>
            ) : (
              <div className="space-y-3">
                {reviews.map((rev) => (
                  <div
                    key={rev.id}
                    className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">{rev.customerName}</span>
                      <div className="flex items-center gap-0.5">
                        {[...Array(rev.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
                    <span className="text-[10px] text-slate-400 block">
                      {rev.date ? new Date(rev.date).toLocaleDateString() : 'Verified Service'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer CTA */}
        <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 block">Standard Rate</span>
            <span className="text-lg font-black text-slate-900">
              ₹{worker.servicePrice} <span className="text-xs font-normal text-slate-500">/ visit</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartChat}
              disabled={startingChat}
              className="px-4 py-2.5 rounded-xl border border-aqua-200 bg-aqua-50 hover:bg-aqua-100 text-aqua-900 text-xs font-bold transition flex items-center gap-1.5 disabled:opacity-50"
            >
              {startingChat ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MessageSquare className="h-3.5 w-3.5" />}
              Chat Before Booking
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookNow(worker);
              }}
              className="px-6 py-2.5 rounded-xl text-xs font-bold aqua-gradient-btn flex items-center gap-1.5 shadow-md"
            >
              <span>Book Appointment Now</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
