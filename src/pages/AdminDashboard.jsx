import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Briefcase,
  Calendar,
  DollarSign,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Mail,
  AlertCircle,
  FileText,
  Lock,
  ExternalLink,
  RotateCcw
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function AdminDashboard({ onOpenEmailLogs }) {
  const { user, token } = useAuth();
  const { addToast } = useNotification();

  const [stats, setStats] = useState(null);
  const [pendingWorkers, setPendingWorkers] = useState([]);
  const [allWorkers, setAllWorkers] = useState([]);
  const [allBookings, setAllBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('verifications'); // 'verifications', 'workers', 'bookings', 'emails'
  
  // Filters & Search
  const [workerSearch, setWorkerSearch] = useState('');
  const [workerStatusFilter, setWorkerStatusFilter] = useState('all');
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all');

  // Reject Modal
  const [rejectingWorker, setRejectingWorker] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchAdminData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [statsRes, pendingRes, workersRes, bookingsRes] = await Promise.all([
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/workers/pending', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/workers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/bookings', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const statsData = await statsRes.json();
      const pendingData = await pendingRes.json();
      const workersData = await workersRes.json();
      const bookingsData = await bookingsRes.json();

      if (statsData.success) setStats(statsData.stats);
      if (pendingData.success) setPendingWorkers(pendingData.workers || []);
      if (workersData.success) setAllWorkers(workersData.workers || []);
      if (bookingsData.success) setAllBookings(bookingsData.bookings || []);
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [token]);

  const handleVerifyWorker = async (workerId, action, reason = '') => {
    try {
      const res = await fetch(`/api/admin/workers/${workerId}/verify`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, reason }),
      });

      const data = await res.json();
      if (data.success) {
        if (action === 'approve') {
          confetti({ particleCount: 60, spread: 50 });
        }
        addToast({
          title: action === 'approve' ? '🚀 Worker Approved!' : 'Worker Application Rejected',
          message: data.message,
          type: action === 'approve' ? 'success' : 'info',
        });
        setRejectingWorker(null);
        setRejectReason('');
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error verifying worker:', err);
    }
  };

  const handleToggleWorkerStatus = async (workerId, currentStatus) => {
    const newStatus = currentStatus === 'suspended' ? 'approved' : 'suspended';
    try {
      const res = await fetch(`/api/admin/workers/${workerId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: 'Worker Status Updated',
          message: data.message,
          type: 'info',
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleDeleteWorker = async (workerId, workerName) => {
    if (!confirm(`Are you sure you want to permanently remove fake/fraudulent account: ${workerName}?`)) return;
    try {
      const res = await fetch(`/api/admin/workers/${workerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: 'Account Removed',
          message: data.message,
          type: 'danger',
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error deleting worker:', err);
    }
  };

  const handleResetDemo = async () => {
    if (!confirm('Reset all demo workers, bookings, and customer seed state?')) return;
    try {
      const res = await fetch('/api/admin/reset-demo', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: 'Demo State Reset',
          message: 'All seed data restored.',
          type: 'success',
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error('Error resetting demo:', err);
    }
  };

  // Filtered workers
  const filteredWorkers = allWorkers.filter((w) => {
    if (workerStatusFilter !== 'all' && w.status !== workerStatusFilter) return false;
    if (workerSearch.trim() !== '') {
      const q = workerSearch.toLowerCase();
      return (
        w.fullName.toLowerCase().includes(q) ||
        w.email.toLowerCase().includes(q) ||
        w.skill.toLowerCase().includes(q) ||
        w.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Filtered bookings
  const filteredBookings = allBookings.filter((b) => {
    if (bookingStatusFilter !== 'all' && b.status !== bookingStatusFilter) return false;
    return true;
  });

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-purple-900/80 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-lg">
              🛡️
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black">Admin Oversight Center</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-500/30 text-purple-300 border border-purple-400/40 text-[10px] font-bold uppercase">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Fixed Account: {user?.email} • Manage worker verification requests, bookings & platform security
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={onOpenEmailLogs}
              className="px-4 py-2 rounded-xl bg-purple-800/60 hover:bg-purple-800 border border-purple-600 text-xs font-bold text-white transition flex items-center gap-1.5"
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Email Logs</span>
            </button>

            <button
              onClick={handleResetDemo}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-slate-300 transition flex items-center gap-1.5"
              title="Reset initial seed state"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset Demo Seeds</span>
            </button>

            <button
              onClick={fetchAdminData}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
              title="Refresh Data"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          <div className="p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm">
            <span className="text-[11px] font-bold text-amber-900 uppercase tracking-wider block">
              Pending Verifications
            </span>
            <span className="text-2xl font-black text-amber-950 mt-1 block">
              {stats?.pendingVerifications || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Workers
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.totalWorkers || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">
              Active Workers
            </span>
            <span className="text-2xl font-black text-emerald-900 mt-1 block">
              {stats?.activeWorkers || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Customers
            </span>
            <span className="text-2xl font-black text-slate-900 mt-1 block">
              {stats?.totalCustomers || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-aqua-50 border border-aqua-200">
            <span className="text-[11px] font-bold text-aqua-900 uppercase tracking-wider block">
              Total Bookings
            </span>
            <span className="text-2xl font-black text-aqua-950 mt-1 block">
              {stats?.totalBookings || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-900 text-white border border-slate-800">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Platform Volume
            </span>
            <span className="text-2xl font-black text-aqua-400 mt-1 block">
              ₹{stats?.totalRevenueVolume || 0}
            </span>
          </div>
        </div>

        {/* Main Tabs Navigation */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          
          <div className="p-5 border-b border-slate-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <button
              onClick={() => setActiveTab('verifications')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                activeTab === 'verifications'
                  ? 'bg-amber-500 text-slate-950 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>⏳ Verification Requests ({pendingWorkers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('workers')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                activeTab === 'workers'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>👥 Worker Directory ({allWorkers.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('bookings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold transition flex items-center gap-2 ${
                activeTab === 'bookings'
                  ? 'bg-aqua-500 text-slate-950 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
              }`}
            >
              <span>📋 All Bookings ({allBookings.length})</span>
            </button>
          </div>

          <div className="p-6">
            
            {/* 1. WORKER VERIFICATION PANEL */}
            {activeTab === 'verifications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900">
                      Pending Worker Application Queue
                    </h3>
                    <p className="text-xs text-slate-500">
                      Review submitted documents, skills, and pricing before granting public marketplace access.
                    </p>
                  </div>
                </div>

                {pendingWorkers.length === 0 ? (
                  <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-200">
                    <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto mb-2" />
                    <h4 className="text-sm font-bold text-slate-800">Verification Desk Clear</h4>
                    <p className="text-xs text-slate-500 mt-1">All registered workers have been processed.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingWorkers.map((w) => (
                      <div
                        key={w.id}
                        className="p-5 rounded-2xl bg-amber-50/40 border border-amber-300 space-y-4"
                      >
                        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                          
                          {/* Worker Details */}
                          <div className="flex items-start gap-4">
                            <img
                              src={w.avatar}
                              alt={w.fullName}
                              className="h-16 w-16 rounded-2xl object-cover border-2 border-amber-300"
                            />
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-extrabold text-slate-900">{w.fullName}</h4>
                                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[10px] font-bold">
                                  Pending Verification
                                </span>
                              </div>
                              <p className="text-xs font-bold text-slate-700">
                                {w.skill} • {w.experience} Years Experience • Base Price: ₹{w.servicePrice}
                              </p>
                              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                <span>📧 {w.email}</span>
                                <span>•</span>
                                <span>📞 {w.mobile}</span>
                                <span>•</span>
                                <span>📍 {w.location}</span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => setRejectingWorker(w)}
                              className="px-4 py-2 rounded-xl bg-white border border-rose-300 text-rose-700 hover:bg-rose-50 text-xs font-bold transition flex items-center gap-1"
                            >
                              <XCircle className="h-3.5 w-3.5" />
                              <span>Reject</span>
                            </button>
                            <button
                              onClick={() => handleVerifyWorker(w.id, 'approve')}
                              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition flex items-center gap-1"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              <span>Approve & Publish</span>
                            </button>
                          </div>
                        </div>

                        {/* Document & Bio preview row */}
                        <div className="p-3.5 bg-white rounded-xl border border-amber-200/80 text-xs space-y-2">
                          <div className="flex items-center justify-between text-slate-500">
                            <span><strong>Government ID Proof:</strong> {w.idProofNumber || 'ID-VERIFIED-789'}</span>
                            <span className="text-[10px] text-slate-400">Registered: {new Date(w.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-slate-600 italic">
                            "{w.description}"
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. WORKER MANAGEMENT DIRECTORY */}
            {activeTab === 'workers' && (
              <div className="space-y-4">
                
                {/* Search & Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative flex-1 w-full max-w-sm">
                    <input
                      type="text"
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      placeholder="Search by worker name, skill, email..."
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                    />
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold">Status:</span>
                    <select
                      value={workerStatusFilter}
                      onChange={(e) => setWorkerStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 font-bold text-slate-800"
                    >
                      <option value="all">All Workers</option>
                      <option value="approved">Approved & Active</option>
                      <option value="pending_verification">Pending Verification</option>
                      <option value="suspended">Suspended</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {/* Workers Table */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">Worker</th>
                        <th className="p-3.5">Skill & Exp</th>
                        <th className="p-3.5">Location</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Rating / Jobs</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredWorkers.map((w) => (
                        <tr key={w.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={w.avatar}
                                alt={w.fullName}
                                className="h-9 w-9 rounded-xl object-cover border border-slate-200"
                              />
                              <div>
                                <span className="font-bold text-slate-900 block">{w.fullName}</span>
                                <span className="text-[10px] text-slate-400">{w.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="p-3.5">
                            <span className="font-semibold text-slate-800 block">{w.skill}</span>
                            <span className="text-[10px] text-slate-400">{w.experience} yrs exp</span>
                          </td>
                          <td className="p-3.5 max-w-[140px] truncate">{w.location}</td>
                          <td className="p-3.5 font-bold text-slate-900">₹{w.servicePrice}</td>
                          <td className="p-3.5">
                            <span className="font-bold text-amber-800">⭐ {w.rating?.toFixed(1) || '5.0'}</span>
                            <span className="text-[10px] text-slate-400 block">{w.completedJobs || 0} jobs</span>
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                w.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : w.status === 'pending_verification'
                                  ? 'bg-amber-100 text-amber-800'
                                  : w.status === 'suspended'
                                  ? 'bg-rose-100 text-rose-800'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {w.status}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {w.status === 'approved' && (
                                <button
                                  onClick={() => handleToggleWorkerStatus(w.id, 'approved')}
                                  className="px-2.5 py-1 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50 font-semibold"
                                  title="Suspend worker"
                                >
                                  Suspend
                                </button>
                              )}
                              {w.status === 'suspended' && (
                                <button
                                  onClick={() => handleToggleWorkerStatus(w.id, 'suspended')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 font-semibold"
                                  title="Reactivate worker"
                                >
                                  Activate
                                </button>
                              )}
                              {w.status === 'pending_verification' && (
                                <button
                                  onClick={() => handleVerifyWorker(w.id, 'approve')}
                                  className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold"
                                >
                                  Approve
                                </button>
                              )}
                              <button
                                onClick={() => handleDeleteWorker(w.id, w.fullName)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Remove fake account"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. BOOKINGS MANAGEMENT */}
            {activeTab === 'bookings' && (
              <div className="space-y-4">
                
                {/* Filter */}
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Platform Booking Transactions ({filteredBookings.length})
                  </h3>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-slate-400 font-bold">Status:</span>
                    <select
                      value={bookingStatusFilter}
                      onChange={(e) => setBookingStatusFilter(e.target.value)}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-bold text-slate-800"
                    >
                      <option value="all">All Bookings</option>
                      <option value="pending">Pending</option>
                      <option value="accepted">Accepted</option>
                      <option value="completed">Completed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs text-slate-700">
                    <thead className="bg-slate-50 text-[11px] uppercase font-bold text-slate-400 border-b border-slate-200">
                      <tr>
                        <th className="p-3.5">ID</th>
                        <th className="p-3.5">Customer</th>
                        <th className="p-3.5">Worker</th>
                        <th className="p-3.5">Service Details</th>
                        <th className="p-3.5">Scheduled Date</th>
                        <th className="p-3.5">Price</th>
                        <th className="p-3.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBookings.map((b) => (
                        <tr key={b.id} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-mono text-[10px] text-slate-400 font-bold">
                            #{b.id}
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{b.customerName}</span>
                            <span className="text-[10px] text-slate-400">{b.customerMobile}</span>
                          </td>
                          <td className="p-3.5">
                            <span className="font-bold text-slate-900 block">{b.workerName}</span>
                            <span className="text-[10px] text-aqua-800 font-semibold">{b.workerSkill}</span>
                          </td>
                          <td className="p-3.5 max-w-[180px]">
                            <span className="font-semibold text-slate-800 block truncate">{b.workType}</span>
                            <span className="text-[10px] text-slate-400 block truncate">{b.serviceAddress}</span>
                          </td>
                          <td className="p-3.5 whitespace-nowrap">
                            <span className="font-medium text-slate-800 block">{b.preferredDate}</span>
                            <span className="text-[10px] text-slate-400">{b.preferredTime}</span>
                          </td>
                          <td className="p-3.5 font-extrabold text-slate-900">
                            ₹{b.estimatedPrice}
                          </td>
                          <td className="p-3.5">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                b.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'accepted'
                                  ? 'bg-aqua-100 text-aqua-800'
                                  : b.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Reject Worker Reason Modal */}
      {rejectingWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 space-y-4 animate-slide-up">
            <h3 className="text-base font-extrabold text-slate-900">
              Reject Worker Application: {rejectingWorker.fullName}
            </h3>
            <p className="text-xs text-slate-500">
              Enter reason for rejection (sent directly to worker via email):
            </p>
            <textarea
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Uploaded government ID document could not be validated..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingWorker(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleVerifyWorker(rejectingWorker.id, 'reject', rejectReason)}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Confirm Rejection & Email Worker
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
