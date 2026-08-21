import React, { useState } from 'react';
import { AlertCircle, FileText, Send, Upload, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const MAX_FILE_SIZE = 2 * 1024 * 1024;
const ACCEPTED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export default function SupportComplaintModal({ isOpen, onClose, onOpenLogin }) {
  const { token, isAuthenticated } = useAuth();
  const { addToast } = useNotification();
  const [bookingId, setBookingId] = useState('');
  const [description, setDescription] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setError('Only PDF, JPG, PNG, or WEBP files are accepted.');
      event.target.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setError('Attachment must be 2MB or smaller.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({ name: file.name, type: file.type, data: reader.result });
      setError('');
    };
    reader.onerror = () => setError('Could not read the attachment.');
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      onClose();
      onOpenLogin();
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/support/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId, description, attachment }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Complaint submission failed.');

      addToast({ title: 'Complaint submitted', message: 'Support team will review your report.', type: 'success' });
      setBookingId('');
      setDescription('');
      setAttachment(null);
      onClose();
    } catch (err) {
      setError(err.message || 'Complaint submission failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center justify-between bg-slate-900 px-6 py-5 text-white">
          <div>
            <h2 className="text-lg font-black">Customer Support</h2>
            <p className="mt-1 text-xs text-slate-400">Report a problem or raise a complaint</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close support form">
            <X className="h-5 w-5" />
          </button>
        </div>

        {!isAuthenticated ? (
          <div className="space-y-4 p-6 text-center">
            <AlertCircle className="mx-auto h-10 w-10 text-amber-500" />
            <p className="text-sm font-bold text-slate-800">Please sign in to report a booking problem.</p>
            <button onClick={() => { onClose(); onOpenLogin(); }} className="w-full rounded-xl bg-aqua-500 py-3 text-xs font-bold text-slate-950 transition hover:bg-aqua-400">
              Sign In to Continue
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 p-6">
            {error && <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800"><AlertCircle className="h-4 w-4 flex-shrink-0" />{error}</div>}

            <div>
              <label htmlFor="complaint-booking-id" className="mb-1 block text-xs font-bold text-slate-700">Booking ID *</label>
              <input id="complaint-booking-id" required value={bookingId} onChange={(event) => setBookingId(event.target.value)} placeholder="e.g. bk_101" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-aqua-500" />
            </div>

            <div>
              <label htmlFor="complaint-description" className="mb-1 block text-xs font-bold text-slate-700">Describe the problem *</label>
              <textarea id="complaint-description" required minLength={10} maxLength={5000} rows={5} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Tell us what happened, when it happened, and how we can help..." className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-aqua-500" />
            </div>

            <div>
              <label htmlFor="complaint-attachment" className="mb-1 flex items-center gap-1 text-xs font-bold text-slate-700"><Upload className="h-3.5 w-3.5" /> Add file <span className="font-normal text-slate-400">(optional, max 2MB)</span></label>
              <input id="complaint-attachment" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={handleFileChange} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-2 py-2 text-[11px] text-slate-700 file:mr-2 file:rounded-lg file:border-0 file:bg-aqua-100 file:px-2 file:py-1 file:text-[11px] file:font-bold file:text-aqua-900" />
              {attachment && <p className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-700"><FileText className="h-3 w-3" />{attachment.name}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="flex w-full items-center justify-center gap-2 rounded-xl bg-aqua-500 py-3.5 text-xs font-bold text-slate-950 shadow-md transition hover:bg-aqua-400 disabled:opacity-50">
              <Send className="h-3.5 w-3.5" />
              {isSubmitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
