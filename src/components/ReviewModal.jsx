import React, { useState } from 'react';
import { X, Star, MessageSquare, CheckCircle2, ShieldCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function ReviewModal({ booking, onClose, onSuccess }) {
  const { token } = useAuth();
  const { addToast } = useNotification();

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!booking) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/bookings/${booking.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          rating,
          comment,
        }),
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || 'Failed to submit review');
      }

      confetti({
        particleCount: 70,
        spread: 50,
      });

      addToast({
        title: '⭐ Review Submitted!',
        message: `Thank you for rating ${booking.workerName}. Your review helps the community!`,
        type: 'success',
      });

      if (onSuccess) onSuccess(data);
      onClose();
    } catch (err) {
      setError(err.message || 'Error submitting review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-amber-400 p-5 text-slate-950 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-extrabold text-slate-950">Rate & Review</h2>
            <p className="text-xs font-semibold text-slate-900">
              Service by {booking.workerName} ({booking.workerSkill})
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-black/10 hover:bg-black/20 flex items-center justify-center text-slate-950 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
              {error}
            </div>
          )}

          {/* Star selector */}
          <div className="text-center space-y-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              How was your service experience?
            </label>
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 focus:outline-none transition-transform hover:scale-125"
                >
                  <Star
                    className={`h-8 w-8 ${
                      (hoverRating || rating) >= star
                        ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <span className="text-xs font-bold text-slate-700 block">
              {rating === 5 && '🌟 Outstanding & Highly Recommended'}
              {rating === 4 && '👍 Very Good & Professional'}
              {rating === 3 && '👌 Satisfactory Service'}
              {rating === 2 && '👎 Needs Improvement'}
              {rating === 1 && '⚠️ Poor Experience'}
            </span>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Write a Review (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Was the worker punctual? Did they solve the issue neatly? Share your experience..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
          </div>

          {/* Submit */}
          <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
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
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 shadow-md transition disabled:opacity-50"
            >
              {isSubmitting ? 'Posting Review...' : 'Submit Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
