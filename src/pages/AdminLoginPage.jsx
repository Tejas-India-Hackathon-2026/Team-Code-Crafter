import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Lock, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function AdminLoginPage({ onNavigate }) {
  const { adminLogin } = useAuth();
  const { addToast } = useNotification();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const data = await adminLogin(password);
      addToast({
        title: 'Admin access granted',
        message: `Signed in as ${data.user.fullName}.`,
        type: 'success',
      });
      setPassword('');
      onNavigate('admin');
    } catch (err) {
      setError(err.message || 'Admin login failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[calc(100vh-150px)] bg-slate-950 px-4 py-16 flex items-center justify-center">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="mb-6 inline-flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to WorkerConnect
        </button>

        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-700 px-6 py-8 text-white">
            <div className="h-12 w-12 rounded-2xl bg-white/15 flex items-center justify-center mb-5">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-black">Admin Login</h1>
            <p className="mt-1 text-sm text-purple-100">Secure access to the administration dashboard</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <div>
              <label htmlFor="admin-password" className="block text-xs font-bold text-slate-700 mb-2">
                Admin Password
              </label>
              <div className="relative">
                <input
                  id="admin-password"
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter admin password"
                  className="w-full pl-10 pr-3 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:ring-2 focus:ring-purple-500 focus:outline-none"
                />
                <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-sm font-bold shadow-lg disabled:opacity-50 transition"
            >
              {isSubmitting ? 'Signing in...' : 'Login as Admin'}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
