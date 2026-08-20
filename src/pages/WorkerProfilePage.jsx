import React, { useState, useEffect } from 'react';
import {
  User,
  MapPin,
  Star,
  ShieldCheck,
  Award,
  Phone,
  DollarSign,
  Edit3,
  CheckCircle2,
  Clock,
  Save,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function WorkerProfilePage() {
  const { user, token, refreshUser } = useAuth();
  const { addToast } = useNotification();

  const [worker, setWorker] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    location: '',
    servicePrice: '',
    priceUnit: '',
    description: '',
  });

  const fetchProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/workers/${user.id}`);
      const data = await res.json();
      if (data.success) {
        setWorker(data.worker);
        setReviews(data.reviews || []);
        setFormData({
          fullName: data.worker.fullName || '',
          mobile: data.worker.mobile || '',
          location: data.worker.location || '',
          servicePrice: data.worker.servicePrice || '',
          priceUnit: data.worker.priceUnit || 'per visit',
          description: data.worker.description || '',
        });
      }
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/workers/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (data.success) {
        addToast({
          title: 'Profile Updated',
          message: 'Your public worker profile has been updated.',
          type: 'success',
        });
        setWorker(data.worker);
        setIsEditing(false);
        refreshUser();
      }
    } catch (err) {
      console.error('Failed to update profile:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center text-xs text-slate-400">
        Loading worker profile...
      </div>
    );
  }

  const current = worker || user;

  return (
    <div className="bg-white min-h-screen py-10">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Profile Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-soft overflow-hidden">
          
          {/* Top Banner */}
          <div className="bg-gradient-to-r from-aqua-600 to-aqua-400 p-8 text-slate-950 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
              <img
                src={current?.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400'}
                alt={current?.fullName}
                className="h-28 w-28 rounded-3xl object-cover border-4 border-white shadow-lg"
              />
              <div className="text-center sm:text-left space-y-1">
                <div className="flex items-center justify-center sm:justify-start gap-2">
                  <h1 className="text-2xl font-black">{current?.fullName}</h1>
                  <ShieldCheck className="h-6 w-6 text-slate-950 fill-white" />
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {current?.skill} • {current?.experience} Years Experience
                </p>
                <p className="text-xs font-semibold text-slate-900 flex items-center justify-center sm:justify-start gap-1">
                  <MapPin className="h-3.5 w-3.5" />
                  {current?.location}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 rounded-xl bg-slate-950 text-white text-xs font-bold hover:bg-slate-900 transition flex items-center gap-1.5 shadow-md"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>{isEditing ? 'Cancel Edit' : 'Edit Profile'}</span>
            </button>
          </div>

          {/* Body Content */}
          <div className="p-8 space-y-8">
            
            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div>
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Rating</span>
                <div className="flex items-center justify-center gap-1 mt-1 font-black text-slate-900 text-lg">
                  <Star className="h-4 w-4 text-amber-500 fill-amber-400" />
                  <span>{current?.rating ? current.rating.toFixed(1) : '5.0'} / 5.0</span>
                </div>
              </div>
              <div className="border-x border-slate-200">
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Service Charge</span>
                <span className="block font-black text-slate-900 text-lg mt-1 text-aqua-950">
                  ₹{current?.servicePrice} <span className="text-xs font-normal text-slate-500">{current?.priceUnit}</span>
                </span>
              </div>
              <div>
                <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider">Jobs Delivered</span>
                <span className="block font-black text-slate-900 text-lg mt-1">
                  {current?.completedJobs || 0}
                </span>
              </div>
            </div>

            {isEditing ? (
              /* Edit Form */
              <form onSubmit={handleSaveProfile} className="space-y-4 p-6 rounded-2xl bg-slate-50 border border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  Update Public Information
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Contact Mobile</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Service Location</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Service Price (₹)</label>
                    <input
                      type="number"
                      value={formData.servicePrice}
                      onChange={(e) => setFormData({ ...formData, servicePrice: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">About Yourself & Specialties</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 rounded-xl aqua-gradient-btn text-xs font-bold shadow-md flex items-center gap-1"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Public Details Display */
              <div className="space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    About & Trade Bio
                  </h3>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-5 rounded-2xl border border-slate-100">
                    {current?.description || 'Experienced skilled tradesman providing high quality electrical and home maintenance services.'}
                  </p>
                </div>

                {/* Verification Status Banner */}
                <div className="flex flex-wrap gap-2">
                  <span className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                    Government ID Document Verified
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-800 border border-blue-200 text-xs font-bold flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-blue-600" />
                    Phone: {current?.mobile}
                  </span>
                  <span className="px-3.5 py-1.5 rounded-xl bg-aqua-50 text-aqua-900 border border-aqua-200 text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-aqua-600" />
                    Category: {current?.skill}
                  </span>
                </div>

                {/* Reviews */}
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-aqua-600" />
                    Recent Customer Reviews ({reviews.length})
                  </h3>

                  {reviews.length === 0 ? (
                    <div className="p-4 rounded-2xl bg-slate-50 text-center text-xs text-slate-500">
                      No written reviews recorded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reviews.map((rev) => (
                        <div
                          key={rev.id}
                          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">{rev.customerName}</span>
                            <div className="flex items-center gap-0.5">
                              {[...Array(rev.rating || 5)].map((_, i) => (
                                <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                          <p className="text-xs text-slate-600 italic">"{rev.comment}"</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
