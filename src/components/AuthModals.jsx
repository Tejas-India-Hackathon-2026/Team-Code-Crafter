import React, { useEffect, useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  Phone,
  Briefcase,
  MapPin,
  DollarSign,
  FileText,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Clock,
  Compass
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';

export const SKILL_CATEGORIES = [
  { id: 'Electrician', label: 'Electrician', icon: '⚡' },
  { id: 'Plumber', label: 'Plumber', icon: '🔧' },
  { id: 'Painter', label: 'Painter', icon: '🎨' },
  { id: 'Carpenter', label: 'Carpenter', icon: '🪚' }, // 
  { id: 'AC Repair', label: 'AC Repair', icon: '❄️' },
  { id: 'Home Cleaner', label: 'Home Cleaner', icon: '🧹' },
  { id: 'Mechanic', label: 'Mechanic', icon: '🚗' },
  { id: 'Others', label: 'Others (Appliance Repair, etc.)', icon: '🛠️' },
];

/* 1. Universal Login Modal */
export function LoginModal({ isOpen, onClose, onOpenRegisterCustomer, onOpenRegisterWorker, onOpenForgotPassword }) {
  const { login, quickDemoLogin } = useAuth();
  const { addToast } = useNotification();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleTab, setRoleTab] = useState('customer'); // 'customer' | 'worker' | 'admin'
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      addToast({
        title: '👋 Welcome back!',
        message: `Signed in successfully as ${data.user.fullName} (${data.user.role}).`,
        type: 'success',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemo = async (roleKey) => {
    setError('');
    setIsSubmitting(true);
    try {
      const data = await quickDemoLogin(roleKey);
      addToast({
        title: '⚡ Demo Role Activated',
        message: `Signed in as ${data.user.fullName} [${data.user.role.toUpperCase()}]`,
        type: 'success',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Demo login failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-aqua-600 to-aqua-400 p-6 text-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Welcome to WorkerConnect</h2>
            <p className="text-xs font-semibold text-slate-900">Sign in to manage your bookings and services</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* 1-Click Demo Login Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 block mb-2">
            ⚡ Quick 1-Click Demo Logins:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemo('customer')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-aqua-400 text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1.5 justify-center transition"
            >
              <span>👤</span> Customer Priya
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('worker')}
              className="px-2.5 py-2 rounded-xl bg-white border border-slate-200 hover:border-aqua-400 text-[11px] font-bold text-slate-800 shadow-xs flex items-center gap-1.5 justify-center transition"
            >
              <span>⚡</span> Worker Rahul
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('admin')}
              className="px-2.5 py-2 rounded-xl bg-purple-50 border border-purple-200 hover:border-purple-400 text-[11px] font-bold text-purple-900 shadow-xs flex items-center gap-1.5 justify-center transition"
            >
              <span>🛡️</span> Admin Center
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemo('worker_pending')}
              className="px-2.5 py-2 rounded-xl bg-amber-50 border border-amber-200 hover:border-amber-400 text-[11px] font-bold text-amber-900 shadow-xs flex items-center gap-1.5 justify-center transition"
            >
              <span>⏳</span> Pending Worker
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
              <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-700">Password</label>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenForgotPassword();
                }}
                className="text-[11px] font-bold text-aqua-700 hover:text-aqua-800"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
              <Lock className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-xs font-bold aqua-gradient-btn shadow-md disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>

          <div className="text-center pt-2 text-xs text-slate-500 space-y-1">
            <p>
              New customer?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterCustomer();
                }}
                className="font-bold text-aqua-700 hover:underline"
              >
                Create customer account
              </button>
            </p>
            <p>
              Are you a skilled worker?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenRegisterWorker();
                }}
                className="font-bold text-aqua-700 hover:underline"
              >
                Register as a Worker
              </button>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

/* 2. Customer Sign Up Modal */
export function RegisterCustomerModal({ isOpen, onClose, onOpenLogin }) {
  const { registerCustomer } = useAuth();
  const { addToast } = useNotification();
  const { currentLocation, detectGPSLocation } = useLocation();

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    location: currentLocation || 'Bengaluru',
    lat: null,
    lng: null,
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocatingCustomer, setIsLocatingCustomer] = useState(false);
  const [customerGpsError, setCustomerGpsError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.lat || !formData.lng) {
      setError('Please use GPS to select your location before creating an account.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerCustomer(formData);
      confetti({ particleCount: 70, spread: 50 });
      addToast({
        title: '🎉 Welcome to WorkerConnect!',
        message: `Account created for ${data.user.fullName}. You can now book verified nearby pros.`,
        type: 'success',
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseCustomerGPS = async () => {
    setCustomerGpsError('');
    setIsLocatingCustomer(true);
    try {
      const nextCoords = await detectGPSLocation();
      setFormData((current) => ({
        ...current,
        location: `Current GPS Location (${nextCoords.lat.toFixed(3)}, ${nextCoords.lng.toFixed(3)})`,
        lat: nextCoords.lat,
        lng: nextCoords.lng,
      }));
    } catch (err) {
      setCustomerGpsError('GPS permission is required to show workers near you.');
    } finally {
      setIsLocatingCustomer(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="bg-gradient-to-r from-aqua-600 to-aqua-400 p-6 text-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Customer Sign Up</h2>
            <p className="text-xs font-semibold text-slate-900">Find and book verified workers in your area</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
            <div className="relative">
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                placeholder="e.g. Priya Sharma"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
              <User className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
            <div className="relative">
              <input
                type="tel"
                required
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                placeholder="+91 98765 43210"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
              <Phone className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
            <div className="relative">
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="priya@example.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
              <Mail className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Min 6 chars"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Repeat password"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="mb-1 flex items-center justify-between gap-2">
              <label className="block text-xs font-bold text-slate-700">Your Location *</label>
              <button
                type="button"
                onClick={handleUseCustomerGPS}
                disabled={isLocatingCustomer}
                className="flex items-center gap-1 text-[11px] font-bold text-aqua-700 hover:text-aqua-900 disabled:opacity-50"
              >
                <Compass className={`h-3.5 w-3.5 ${isLocatingCustomer ? 'animate-spin' : ''}`} />
                {isLocatingCustomer ? 'Locating...' : 'Use GPS'}
              </button>
            </div>
            <input
              type="text"
              required
              readOnly
              value={formData.location}
              placeholder="Use GPS to select your location"
              className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
            />
            <p className="mt-1 text-[10px] text-slate-400">Your location helps us find nearby verified workers.</p>
            {customerGpsError && <p className="mt-1 text-[10px] font-semibold text-rose-600">{customerGpsError}</p>}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl text-xs font-bold aqua-gradient-btn shadow-md disabled:opacity-50 mt-2"
          >
            {isSubmitting ? 'Creating Customer Account...' : 'Sign Up as Customer'}
          </button>

          <div className="text-center pt-2 text-xs text-slate-500">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenLogin();
              }}
              className="font-bold text-aqua-700 hover:underline"
            >
              Sign In
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* 3. Worker Sign Up Modal */
export function RegisterWorkerModal({ isOpen, onClose, onOpenLogin }) {
  const { registerWorker } = useAuth();
  const { addToast } = useNotification();
  const { currentLocation, coords, detectGPSLocation } = useLocation();

  const [formData, setFormData] = useState({
    fullName: '',
    mobile: '',
    email: '',
    password: '',
    confirmPassword: '',
    skill: 'Electrician',
    subSkill: '',
    experience: '5',
    location: currentLocation || 'Indiranagar, Bengaluru',
    lat: null,
    lng: null,
    servicePrice: '350',
    priceUnit: 'per visit / inspection',
    description: '',
    idProofNumber: 'ID-GOV-' + Math.floor(10000 + Math.random() * 90000),
    avatar: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=400&auto=format&fit=crop&q=80',
  });

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredSuccess, setRegisteredSuccess] = useState(null);
  const [isLocatingWorker, setIsLocatingWorker] = useState(false);
  const [workerGpsError, setWorkerGpsError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setFormData((current) => ({
      ...current,
      location: currentLocation || current.location,
      lat: null,
      lng: null,
    }));
    setWorkerGpsError('');
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (!formData.lat || !formData.lng) {
      setError('Please use GPS to select your service location before registering.');
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await registerWorker(formData);
      setRegisteredSuccess(data);
      addToast({
        title: '📋 Application Submitted!',
        message: 'Your worker registration is pending Admin verification.',
        type: 'warning',
      });
    } catch (err) {
      setError(err.message || 'Worker registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUseWorkerGPS = async () => {
    setWorkerGpsError('');
    setIsLocatingWorker(true);
    try {
      const nextCoords = await detectGPSLocation();
      setFormData((current) => ({
        ...current,
        location: `Current GPS Location (${nextCoords.lat.toFixed(3)}, ${nextCoords.lng.toFixed(3)})`,
        lat: nextCoords.lat,
        lng: nextCoords.lng,
      }));
    } catch (err) {
      setWorkerGpsError('GPS permission is required so customers can find you in your service area.');
    } finally {
      setIsLocatingWorker(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden my-8 animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-aqua-600 to-aqua-400 p-6 text-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Join as a Skilled Worker</h2>
            <p className="text-xs font-semibold text-slate-900">Grow your local trade business with direct customer bookings</p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {registeredSuccess ? (
          /* Pending Verification Announcement */
          <div className="p-8 text-center space-y-5 animate-fade-in">
            <div className="h-16 w-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto shadow-md">
              <Clock className="h-10 w-10" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900">Application Submitted!</h3>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold mt-2">
                <Clock className="h-3.5 w-3.5" />
                Status: Pending Admin Verification
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs space-y-2.5 max-w-lg mx-auto">
              <p className="text-slate-700 leading-relaxed">
                Thank you for applying, <strong>{registeredSuccess.user?.fullName}</strong>!
              </p>
              <div className="space-y-1.5 text-slate-600">
                <p>• Your profile will remain hidden from customer searches until reviewed.</p>
                <p>• A verification request has been automatically routed to the <strong>Admin Desk</strong>.</p>
                <p>• You will receive an automated email notification once approved.</p>
              </div>
            </div>

            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl aqua-gradient-btn text-xs font-bold shadow-md"
              >
                Go to Worker Dashboard
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
            
            {/* Warning banner about verification */}
            <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
              <Clock className="h-4 w-4 flex-shrink-0 text-amber-600 mt-0.5" />
              <div>
                <strong className="block">Admin Verification Required:</strong>
                After registration, your account will remain in <strong>Pending Verification</strong> status until an admin verifies your details.
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
                {error}
              </div>
            )}

            {/* Row 1: Name & Mobile */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="e.g. Ramesh Kumar"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98111 22334"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 2: Email */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="ramesh.electrician@example.com"
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>

            {/* Row 3: Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Password *</label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Min 6 characters"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Repeat password"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 4: Skill Category & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Skill Category *</label>
                <select
                  value={formData.skill}
                  onChange={(e) => setFormData({ ...formData, skill: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none font-medium"
                >
                  {SKILL_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.icon} {cat.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Experience (Years) *</label>
                <input
                  type="number"
                  min="1"
                  max="40"
                  required
                  value={formData.experience}
                  onChange={(e) => setFormData({ ...formData, experience: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Row 5: Location & Service Price */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <label className="block text-xs font-bold text-slate-700">Current Service Location *</label>
                  <button
                    type="button"
                    onClick={handleUseWorkerGPS}
                    disabled={isLocatingWorker}
                    className="flex items-center gap-1 text-[11px] font-bold text-aqua-700 hover:text-aqua-900 disabled:opacity-50"
                  >
                    <Compass className={`h-3.5 w-3.5 ${isLocatingWorker ? 'animate-spin' : ''}`} />
                    {isLocatingWorker ? 'Locating...' : 'Use GPS'}
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={formData.location}
                  readOnly
                  placeholder="e.g. Indiranagar, Bengaluru"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-100 border border-slate-200 text-xs text-slate-700 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
                <p className="mt-1 text-[10px] text-slate-400">Your exact GPS coordinates are used for nearby customer searches.</p>
                {workerGpsError && <p className="mt-1 text-[10px] font-semibold text-rose-600">{workerGpsError}</p>}
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Service Price (₹) *</label>
                <input
                  type="number"
                  required
                  value={formData.servicePrice}
                  onChange={(e) => setFormData({ ...formData, servicePrice: e.target.value })}
                  placeholder="e.g. 350"
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Description / About Yourself */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Description / About Yourself *</label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Highlight your trade skills, specialization, tools you carry, response times..."
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>

            {/* Profile Photo Avatar Option */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Profile Avatar URL</label>
              <input
                type="url"
                value={formData.avatar}
                onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 rounded-xl text-xs font-bold aqua-gradient-btn shadow-md disabled:opacity-50 mt-2"
            >
              {isSubmitting ? 'Submitting Registration...' : 'Submit Worker Application (Pending Verification)'}
            </button>

            <div className="text-center pt-2 text-xs text-slate-500">
              Already verified?{' '}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenLogin();
                }}
                className="font-bold text-aqua-700 hover:underline"
              >
                Sign In to Worker Dashboard
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

/* 4. Forgot Password Modal */
export function ForgotPasswordModal({ isOpen, onClose, onOpenLogin }) {
  const { forgotPassword, resetPassword } = useAuth();
  const { addToast } = useNotification();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [serverCode, setServerCode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleRequestCode = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await forgotPassword(email);
      if (data.success) {
        setServerCode(data.resetCode || 'WC-88421');
        setResetCode(data.resetCode || '');
        setStep(2);
        addToast({
          title: '✉️ Reset Code Sent',
          message: data.message,
          type: 'info',
        });
      } else {
        setError(data.message || 'No account with this email');
      }
    } catch (err) {
      setError(err.message || 'Failed to request reset');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const data = await resetPassword({ email, resetCode, newPassword });
      if (data.success) {
        addToast({
          title: '🔒 Password Updated!',
          message: 'Your new password is now active. Please sign in.',
          type: 'success',
        });
        onClose();
        onOpenLogin();
      } else {
        setError(data.message || 'Failed to reset password');
      }
    } catch (err) {
      setError(err.message || 'Error updating password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="bg-gradient-to-r from-aqua-600 to-aqua-400 p-6 text-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-950">Reset Password</h2>
            <p className="text-xs font-semibold text-slate-900">
              {step === 1 ? 'Enter your registered email' : 'Set a new secure password'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. rahul.electrician@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-xs font-bold aqua-gradient-btn shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Sending Instructions...' : 'Send Reset Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 rounded-xl bg-aqua-50 border border-aqua-200 text-aqua-950 text-xs">
                Reset code dispatched for <strong>{email}</strong>. (Auto-filled: <code className="font-bold">{serverCode}</code>)
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Verification Code</label>
                <input
                  type="text"
                  required
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 font-mono font-bold"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-aqua-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl text-xs font-bold aqua-gradient-btn shadow-md disabled:opacity-50"
              >
                {isSubmitting ? 'Updating Password...' : 'Save New Password & Log In'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* 5. Demo Role Switcher Modal */
export function DemoRoleSwitcherModal({ isOpen, onClose }) {
  const { quickDemoLogin } = useAuth();
  const { addToast } = useNotification();

  if (!isOpen) return null;

  const handleSelect = async (roleKey, title) => {
    try {
      const data = await quickDemoLogin(roleKey);
      addToast({
        title: '⚡ Switched User Session',
        message: `Now acting as ${data.user.fullName} (${title})`,
        type: 'success',
      });
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="p-5 bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            <h2 className="text-base font-extrabold">Instant Demo Role Switcher</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-500">
            Select any persona to instantly test the platform from that user's perspective with full live interactive workflows:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Customer */}
            <button
              onClick={() => handleSelect('customer', 'Customer')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-aqua-400 hover:bg-aqua-50/40 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">👤</span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-aqua-800">
                    Customer: Priya Sharma
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Search, filter, interactive map & book workers
                  </p>
                </div>
              </div>
            </button>

            {/* Approved Worker */}
            <button
              onClick={() => handleSelect('worker', 'Approved Worker')}
              className="p-4 rounded-2xl border border-slate-200 hover:border-aqua-400 hover:bg-aqua-50/40 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <h4 className="text-xs font-extrabold text-slate-900 group-hover:text-aqua-800">
                    Worker: Rahul Sharma
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Master Electrician (Approved & Active)
                  </p>
                </div>
              </div>
            </button>

            {/* Pending Worker */}
            <button
              onClick={() => handleSelect('worker_pending', 'Pending Worker')}
              className="p-4 rounded-2xl border border-amber-200 bg-amber-50/30 hover:border-amber-400 hover:bg-amber-50 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">⏳</span>
                <div>
                  <h4 className="text-xs font-extrabold text-amber-900">
                    Worker: Vikram Singh
                  </h4>
                  <p className="text-[10px] text-amber-700 mt-0.5">
                    Painter (Pending Admin Verification)
                  </p>
                </div>
              </div>
            </button>

            {/* Admin */}
            <button
              onClick={() => handleSelect('admin', 'Administrator')}
              className="p-4 rounded-2xl border border-purple-200 bg-purple-50/30 hover:border-purple-400 hover:bg-purple-50 text-left transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">🛡️</span>
                <div>
                  <h4 className="text-xs font-extrabold text-purple-900">
                    System Administrator
                  </h4>
                  <p className="text-[10px] text-purple-700 mt-0.5">
                    Verify workers, monitor bookings & logs
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}