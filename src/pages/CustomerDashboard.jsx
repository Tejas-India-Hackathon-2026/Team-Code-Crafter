import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Star,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Phone,
  RefreshCw,
  Search,
  MessageSquare,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function CustomerDashboard({ onOpenReviewModal, onRebookWorker }) {
  const { user, token } = useAuth();
  const { addToast } = useNotification();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'pending', 'accepted', 'completed', 'rejected'
  const [searchQuery, setSearchQuery] = useState('');

  const fetchBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/bookings/customer', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setBookings(data.bookings || []);
      }
    } catch (err) {
      console.error('Failed to fetch customer bookings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const handleCancelBooking = async (bookingId) => {
    if (!confirm('Are you sure you want to cancel this booking request?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: 'Booking Cancelled',
          message: 'Your booking request has been cancelled.',
          type: 'info',
        });
        fetchBookings();
      }
    } catch (err) {
      console.error('Error cancelling booking:', err);
    }
  };

  const filteredBookings = bookings.filter((b) => {
    if (activeTab !== 'all' && b.status !== activeTab) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      return (
        b.workerName.toLowerCase().includes(q) ||
        b.workerSkill.toLowerCase().includes(q) ||
        b.workType.toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;
  const acceptedCount = bookings.filter((b) => b.status === 'accepted').length;
  const completedCount = bookings.filter((b) => b.status === 'completed').length;

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header banner */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={user?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user?.fullName || 'Customer')}`}
              alt={user?.fullName}
              className="h-16 w-16 rounded-2xl object-cover border-2 border-aqua-400 shadow-md"
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">{user?.fullName}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-aqua-500/20 text-aqua-400 border border-aqua-400/40 text-[10px] font-bold uppercase">
                  Customer
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {user?.email} • {user?.mobile || '+91 Contact'}
              </p>
            </div>
          </div>

          <button
            onClick={fetchBookings}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white transition flex items-center gap-1.5"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Bookings</span>
          </button>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Total Bookings</span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">{bookings.length}</span>
          </div>

          <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">Pending Requests</span>
            <span className="text-2xl font-black text-amber-900 mt-1 block">{pendingCount}</span>
          </div>

          <div className="p-5 rounded-2xl bg-aqua-50/60 border border-aqua-200">
            <span className="text-xs font-bold text-aqua-800 uppercase tracking-wider block">Accepted & Active</span>
            <span className="text-2xl font-black text-aqua-950 mt-1 block">{acceptedCount}</span>
          </div>

          <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">Completed Jobs</span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">{completedCount}</span>
          </div>
        </div>

        {/* Bookings Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          
          {/* Tabs and Search Bar */}
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
              {[
                { id: 'all', label: `All (${bookings.length})` },
                { id: 'pending', label: `Pending (${pendingCount})` },
                { id: 'accepted', label: `Accepted (${acceptedCount})` },
                { id: 'completed', label: `Completed (${completedCount})` },
                { id: 'rejected', label: 'Rejected' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search within bookings */}
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search worker, skill, ID..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12 text-xs text-slate-400">Loading your bookings...</div>
            ) : filteredBookings.length === 0 ? (
              <div className="text-center py-16 text-slate-500 text-xs">
                <Calendar className="h-10 w-10 mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-sm text-slate-700">No bookings in this tab</p>
                <p className="mt-1">Find nearby skilled workers on the home page and book a service.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((b) => (
                  <div
                    key={b.id}
                    className="p-5 rounded-2xl border border-slate-200 bg-white hover:border-aqua-300 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    {/* Worker Info & Work Details */}
                    <div className="flex items-start gap-4 flex-1">
                      <img
                        src={b.workerAvatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400'}
                        alt={b.workerName}
                        className="h-14 w-14 rounded-2xl object-cover border border-slate-200 flex-shrink-0"
                      />
                      <div className="space-y-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-extrabold text-slate-900">{b.workerName}</h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-aqua-50 text-aqua-900 border border-aqua-200 text-[10px] font-bold">
                            {b.workerSkill}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">#{b.id}</span>
                        </div>

                        <p className="text-xs font-bold text-slate-700">{b.workType}</p>

                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {b.preferredDate} ({b.preferredTime})
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="max-w-[200px] truncate">{b.serviceAddress}</span>
                          </span>
                        </div>

                        {b.description && (
                          <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 max-w-xl">
                            "{b.description}"
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Badge & Actions */}
                    <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end justify-between gap-3 border-t md:border-t-0 pt-3 md:pt-0 border-slate-100">
                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold flex items-center gap-1">
                            <Clock className="h-3 w-3 animate-spin" /> Pending Worker Response
                          </span>
                        )}
                        {b.status === 'accepted' && (
                          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Booking Accepted
                          </span>
                        )}
                        {b.status === 'completed' && (
                          <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Completed
                          </span>
                        )}
                        {b.status === 'rejected' && (
                          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 border border-rose-200 text-xs font-bold flex items-center gap-1">
                            <XCircle className="h-3 w-3" /> Rejected
                          </span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold">
                            Cancelled
                          </span>
                        )}

                        <span className="text-sm font-black text-slate-900">
                          ₹{b.estimatedPrice}
                        </span>
                      </div>

                      {/* Action buttons based on state */}
                      <div className="flex items-center gap-2">
                        {b.status === 'pending' && (
                          <button
                            onClick={() => handleCancelBooking(b.id)}
                            className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition"
                          >
                            Cancel Request
                          </button>
                        )}

                        {b.status === 'completed' && !b.review && (
                          <button
                            onClick={() => onOpenReviewModal(b)}
                            className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition flex items-center gap-1 shadow-sm"
                          >
                            <Star className="h-3.5 w-3.5 fill-slate-950" />
                            <span>Rate Worker</span>
                          </button>
                        )}

                        {b.status === 'completed' && b.review && (
                          <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold flex items-center gap-1">
                            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                            Rated {b.review.rating} / 5
                          </span>
                        )}

                        <button
                          onClick={() => onRebookWorker(b.workerId)}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition"
                        >
                          Book Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
