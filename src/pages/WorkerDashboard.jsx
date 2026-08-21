import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  XCircle,
  Clock,
  Star,
  DollarSign,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  User,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function WorkerDashboard({ onNavigate, onOpenChat }) {
  const { user, token, refreshUser } = useAuth();
  const { addToast } = useNotification();

  const [stats, setStats] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'accepted', 'completed', 'all'
  const [isTogglingAvailability, setIsTogglingAvailability] = useState(false);
  const [rejectingBooking, setRejectingBooking] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, bookingsRes, inquiriesRes] = await Promise.all([
        fetch('/api/workers/dashboard/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bookings/worker', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/bookings/inquiries/worker', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statsData = await statsRes.json();
      const bookingsData = await bookingsRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (bookingsData.success) setBookings(bookingsData.bookings || []);
      const inquiriesData = await inquiriesRes.json();
      if (inquiriesData.success) setInquiries(inquiriesData.inquiries || []);
    } catch (err) {
      console.error('Failed to load worker dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const handleToggleAvailability = async () => {
    setIsTogglingAvailability(true);
    try {
      const res = await fetch('/api/workers/availability', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isAvailable: !stats?.isAvailable }),
      });
      const data = await res.json();
      if (data.success) {
        setStats((prev) => ({ ...prev, isAvailable: data.isAvailable }));
        addToast({
          title: 'Availability Status Updated',
          message: data.message,
          type: 'info',
        });
      }
    } catch (err) {
      console.error('Error toggling availability:', err);
    } finally {
      setIsTogglingAvailability(false);
    }
  };

  const handleAcceptBooking = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/accept`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 50, spread: 40 });
        addToast({
          title: '✅ Booking Accepted!',
          message: 'Customer has been notified via email & in-app alert.',
          type: 'success',
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error accepting booking:', err);
    }
  };

  const handleRejectBooking = async (e) => {
    e.preventDefault();
    if (!rejectingBooking) return;
    try {
      const res = await fetch(`/api/bookings/${rejectingBooking.id}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: 'Booking Request Rejected',
          message: 'Customer has been notified via email.',
          type: 'info',
        });
        setRejectingBooking(null);
        setRejectReason('');
        fetchData();
      }
    } catch (err) {
      console.error('Error rejecting booking:', err);
    }
  };

  const handleCompleteBooking = async (bookingId) => {
    if (!confirm('Mark this service job as completed? This will update your earnings and invite the customer to rate your work.')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/complete`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        confetti({ particleCount: 80, spread: 60 });
        addToast({
          title: '🎉 Job Completed!',
          message: 'Customer has received an email to rate your service.',
          type: 'success',
        });
        fetchData();
      }
    } catch (err) {
      console.error('Error completing booking:', err);
    }
  };

  const isPending = stats?.status === 'pending_verification' || user?.status === 'pending_verification';
  const pendingRequests = bookings.filter((b) => b.status === 'pending');
  const acceptedJobs = bookings.filter((b) => b.status === 'accepted');
  const completedJobs = bookings.filter((b) => b.status === 'completed');

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'pending') return b.status === 'pending';
    if (activeTab === 'accepted') return b.status === 'accepted';
    if (activeTab === 'completed') return b.status === 'completed';
    return true;
  });

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Pending Verification Notice Banner */}
        {isPending && (
          <div className="p-6 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-md mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-xl flex-shrink-0">
                ⏳
              </div>
              <div>
                <h3 className="text-base font-extrabold text-amber-950">
                  Account Status: Pending Admin Verification
                </h3>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed max-w-2xl">
                  Your skilled worker registration is under review by our Admin desk. Your profile is currently hidden from customer searches. Once verified, you will be able to receive live customer booking requests.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-amber-200 text-amber-900 text-xs font-bold whitespace-nowrap">
                Verification in Progress
              </span>
            </div>
          </div>
        )}

        {/* Worker Header Card */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400'}
              alt={user?.fullName}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-aqua-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-black">{user?.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-aqua-500/20 text-aqua-400 border border-aqua-400/40 text-[10px] font-bold uppercase">
                  {user?.skill || 'Skilled Pro'}
                </span>
                {!isPending && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-400/40 text-[10px] font-bold flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Verified
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user?.location} • Base Price: ₹{user?.servicePrice} {user?.priceUnit}
              </p>
            </div>
          </div>

          {/* Controls: Online/Offline switch & Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleAvailability}
              disabled={isTogglingAvailability || isPending}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
                stats?.isAvailable
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 hover:bg-emerald-500/30'
                  : 'bg-slate-700 text-slate-300 border border-slate-600 hover:bg-slate-600'
              }`}
            >
              <span className={`h-2.5 w-2.5 rounded-full ${stats?.isAvailable ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'}`} />
              <span>{stats?.isAvailable ? 'Available for Jobs' : 'Marked as Busy'}</span>
            </button>

            <button
              onClick={fetchData}
              className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Refresh Dashboard"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 mb-8">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{stats?.totalBookings || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Pending Requests</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{stats?.pendingCount || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-aqua-50/70 border border-aqua-200">
            <span className="text-[11px] font-bold text-aqua-900 uppercase tracking-wider block">Accepted Jobs</span>
            <span className="text-2xl font-black text-aqua-950 mt-1 block">{stats?.acceptedCount || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">Completed</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">{stats?.completedCount || 0}</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
            <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">Worker Rating</span>
            <div className="flex items-center gap-1 mt-1">
              <Star className="h-5 w-5 text-amber-500 fill-amber-400" />
              <span className="text-2xl font-black text-slate-900">{stats?.rating?.toFixed(1) || '5.0'}</span>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Est. Earnings</span>
            <span className="text-2xl font-black text-aqua-400 mt-1 block">₹{stats?.earnings || 0}</span>
          </div>
        </div>

        {inquiries.length > 0 && (
          <div className="mb-8 rounded-3xl border border-aqua-200 bg-aqua-50/40 p-5 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Customer Messages</h2>
                <p className="mt-1 text-xs text-slate-500">Reply to customers before they book your service.</p>
              </div>
              <MessageSquare className="h-5 w-5 text-aqua-700" />
            </div>
            <div className="space-y-2">
              {inquiries.map((inquiry) => (
                <div key={inquiry.id} className="flex items-center justify-between gap-3 rounded-2xl border border-aqua-100 bg-white p-3">
                  <div className="min-w-0">
                    <p className="truncate text-xs font-bold text-slate-900">{inquiry.customerName}</p>
                    <p className="truncate text-[11px] text-slate-500">{inquiry.workType}</p>
                  </div>
                  <button
                    onClick={() => onOpenChat(inquiry)}
                    className="flex items-center gap-1.5 rounded-xl bg-aqua-500 px-3 py-2 text-xs font-bold text-slate-950 transition hover:bg-aqua-400"
                  >
                    <MessageSquare className="h-3.5 w-3.5" />
                    Chat
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Main Bookings Panel */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          
          {/* Tabs */}
          <div className="p-6 border-b border-slate-200 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setActiveTab('pending')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'pending'
                    ? 'bg-amber-500 text-slate-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>🔔 Pending Requests ({pendingRequests.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('accepted')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'accepted'
                    ? 'bg-aqua-500 text-slate-950 shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>⚡ Active / Accepted Jobs ({acceptedJobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('completed')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'completed'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                <span>✓ Completed ({completedJobs.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('all')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                  activeTab === 'all'
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                }`}
              >
                All Bookings ({bookings.length})
              </button>
            </div>
          </div>

          {/* Bookings Content */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading booking requests...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                <Briefcase className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">No bookings in this tab</p>
                <p className="mt-1">When customers send booking requests, they will appear here in real-time.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      b.status === 'pending'
                        ? 'bg-amber-50/40 border-amber-300 shadow-sm'
                        : b.status === 'accepted'
                        ? 'bg-aqua-50/30 border-aqua-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      
                      {/* Customer & Job Details */}
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-extrabold text-slate-900">
                            Customer: {b.customerName}
                          </span>
                          <span className="text-xs font-bold text-slate-600 bg-white px-2 py-0.5 rounded-lg border border-slate-200">
                            📞 {b.customerMobile}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">#{b.id}</span>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-slate-200/80 space-y-1">
                          <p className="text-xs font-extrabold text-slate-900">
                            Work: {b.workType}
                          </p>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
                            <span className="flex items-center gap-1 font-semibold">
                              <Calendar className="h-3.5 w-3.5 text-aqua-600" />
                              Scheduled: {b.preferredDate} ({b.preferredTime})
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-slate-400" />
                              {b.serviceAddress}
                            </span>
                          </div>
                          {b.description && (
                            <p className="text-xs text-slate-500 pt-1 italic">
                              "{b.description}"
                            </p>
                          )}
                        </div>

                        {/* Customer Review if completed */}
                        {b.review && (
                          <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 text-xs">
                            <div className="flex items-center gap-1 font-bold text-amber-900">
                              <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                              Customer Review ({b.review.rating} / 5 Stars):
                            </div>
                            <p className="text-slate-700 mt-0.5 italic">"{b.review.comment}"</p>
                          </div>
                        )}
                      </div>

                      {/* Action buttons on the right */}
                      <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end justify-between gap-3 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-200">
                        <span className="text-base font-black text-slate-900">
                          Estimated: ₹{b.estimatedPrice}
                        </span>

                        {b.status === 'pending' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenChat(b)}
                              className="px-4 py-2 rounded-xl border border-aqua-200 bg-aqua-50 hover:bg-aqua-100 text-aqua-900 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Chat
                            </button>
                            <button
                              onClick={() => setRejectingBooking(b)}
                              className="px-4 py-2 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-bold transition"
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAcceptBooking(b.id)}
                              className="px-5 py-2 rounded-xl aqua-gradient-btn text-xs font-bold shadow-md"
                            >
                              Accept Request
                            </button>
                          </div>
                        )}

                        {b.status === 'accepted' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenChat(b)}
                              className="px-4 py-2 rounded-xl border border-aqua-200 bg-aqua-50 hover:bg-aqua-100 text-aqua-900 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Chat
                            </button>
                            <button
                              onClick={() => handleCompleteBooking(b.id)}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition"
                            >
                              Mark Job as Completed
                            </button>
                          </div>
                        )}

                        {b.status === 'completed' && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => onOpenChat(b)}
                              className="px-4 py-2 rounded-xl border border-aqua-200 bg-aqua-50 hover:bg-aqua-100 text-aqua-900 text-xs font-bold transition flex items-center gap-1.5"
                            >
                              <MessageSquare className="h-3.5 w-3.5" />
                              Chat
                            </button>
                            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5" /> Service Delivered
                            </span>
                          </div>
                        )}

                        {b.status === 'rejected' && (
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                            Request Rejected
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Reason Modal */}
      {rejectingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-base font-extrabold text-slate-900">
              Reject Booking Request
            </h3>
            <p className="text-xs text-slate-500">
              Provide a brief reason to notify {rejectingBooking.customerName} via email:
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g., Slot already occupied / Out of service area today..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex gap-2 justify-end pt-2">
              <button
                type="button"
                onClick={() => setRejectingBooking(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRejectBooking}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection & Notify Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
