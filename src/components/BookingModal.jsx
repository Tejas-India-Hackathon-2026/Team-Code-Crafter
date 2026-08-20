import React, { useState } from 'react';
import { X, Calendar, Clock, MapPin, Phone, User, FileText, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function BookingModal({ worker, onClose, onSuccess, onOpenLogin }) {
  const { user, isAuthenticated, role, token } = useAuth();
  const { addToast } = useNotification();

  const [formData, setFormData] = useState({
    customerName: user?.fullName || '',
    customerMobile: user?.mobile || '',
    workType: '',// e.g., Short circuit troubleshooting, Tap replacement, AC jet clean...
    serviceAddress: '',
    location: worker?.location || 'Bengaluru',
    preferredDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // tomorrow
    preferredTime: '10:00 AM - 01:00 PM (Morning)',
    description: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successBooking, setSuccessBooking] = useState(null);

  if (!worker) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isAuthenticated) {
      setError('Please log in or register as a customer to complete this booking.');
      return;
    }

    if (role !== 'customer' && role !== 'admin') {
      setError('You are currently signed in with a Worker account. Please switch to a Customer account to book services.');
      return;
    }

    if (!formData.workType.trim()) {
      setError('Please specify the work or repair type required.');
      return;
    }

    if (!formData.serviceAddress.trim()) {
      setError('Please enter your full service address.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          workerId: worker.id,
          workType: formData.workType,
          serviceAddress: formData.serviceAddress,
          location: formData.location,
          preferredDate: formData.preferredDate,
          preferredTime: formData.preferredTime,
          description: formData.description,
          customerName: formData.customerName,
          customerMobile: formData.customerMobile,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to submit booking request');
      }

      // Trigger celebratory confetti
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });

      setSuccessBooking(data.booking);
      addToast({
        title: '🎉 Booking Request Dispatched!',
        message: `Your request for ${worker.skill} was sent to ${worker.fullName}. Worker will review and accept shortly.`,
        type: 'success',
      });

      if (onSuccess) onSuccess(data.booking);
    } catch (err) {
      setError(err.message || 'Something went wrong while booking.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-aqua-600 to-aqua-400 p-5 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={worker.avatar}
              alt={worker.fullName}
              className="h-12 w-12 rounded-xl object-cover border-2 border-white shadow-sm"
            />
            <div>
              <h2 className="text-lg font-extrabold text-slate-950">
                Book {worker.fullName}
              </h2>
              <p className="text-xs font-bold text-slate-900">
                {worker.skill} • ₹{worker.servicePrice} {worker.priceUnit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Success Confirmation State */}
        {successBooking ? (
          <div className="p-8 text-center space-y-5 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Booking Request Sent!</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                Your request has been dispatched to <strong>{worker.fullName}</strong>. Status is set to <span className="text-amber-700 font-bold">Pending</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2 max-w-md mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-400">Booking ID:</span>
                <span className="font-mono font-bold text-slate-800">#{successBooking.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Scheduled Date:</span>
                <span className="font-bold text-slate-800">{successBooking.preferredDate} ({successBooking.preferredTime})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Service Address:</span>
                <span className="font-bold text-slate-800 truncate max-w-[200px]">{successBooking.serviceAddress}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estimated Price:</span>
                <span className="font-bold text-aqua-900">₹{successBooking.estimatedPrice}</span>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl aqua-gradient-btn text-xs font-bold shadow-md"
              >
                Done / View Dashboard
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLogin();
                    }}
                    className="px-2.5 py-1 bg-rose-600 text-white rounded-lg font-bold text-[11px]"
                  >
                    Log In
                  </button>
                )}
              </div>
            )}

            {/* Customer Details Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Your Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="e.g. Priya Sharma"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                  <User className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Mobile Number *
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    value={formData.customerMobile}
                    onChange={(e) => setFormData({ ...formData, customerMobile: e.target.value })}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                  <Phone className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Work Type */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Work / Service Type *
              </label>
              <input
                type="text"
                required
                value={formData.workType}
                onChange={(e) => setFormData({ ...formData, workType: e.target.value })}
                placeholder="e.g., Short circuit troubleshooting, Tap replacement, AC jet clean..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>

            {/* Service Address */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Service Address & Landmark *
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.serviceAddress}
                  onChange={(e) => setFormData({ ...formData, serviceAddress: e.target.value })}
                  placeholder="Flat / House No., Street, Landmark, Area"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
                <MapPin className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
              </div>
            </div>

            {/* Date & Time Preferred */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Date *
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                    value={formData.preferredDate}
                    onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                  <Calendar className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Preferred Time Slot
                </label>
                <div className="relative">
                  <select
                    value={formData.preferredTime}
                    onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })}
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  >
                    <option value="09:00 AM - 12:00 PM (Morning)">09:00 AM - 12:00 PM (Morning)</option>
                    <option value="12:00 PM - 03:00 PM (Afternoon)">12:00 PM - 03:00 PM (Afternoon)</option>
                    <option value="03:00 PM - 06:00 PM (Evening)">03:00 PM - 06:00 PM (Evening)</option>
                    <option value="06:00 PM - 09:00 PM (Late Evening)">06:00 PM - 09:00 PM (Late Evening)</option>
                  </select>
                  <Clock className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                </div>
              </div>
            </div>

            {/* Description of Work */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Description of the Issue / Work (Optional)
              </label>
              <textarea
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Explain the problem in brief so the worker arrives prepared with right tools and spares..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-400 block">Inspection / Base Fee:</span>
                <span className="text-base font-extrabold text-slate-900">
                  ₹{worker.servicePrice} <span className="text-xs font-normal text-slate-500">{worker.priceUnit}</span>
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold aqua-gradient-btn shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Sending Request...' : 'Confirm & Request Booking'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
