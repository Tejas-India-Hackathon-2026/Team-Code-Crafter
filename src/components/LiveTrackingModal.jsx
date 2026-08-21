import React, { useEffect, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { AlertCircle, LocateFixed, MapPin, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

export default function LiveTrackingModal({ isOpen, onClose, onOpenLogin }) {
  const { token, isAuthenticated } = useAuth();
  const { socket, addToast } = useNotification();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBookings = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const response = await fetch('/api/bookings/customer', { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Could not load bookings.');
      const active = (data.bookings || []).filter((booking) => booking.status === 'accepted');
      setBookings(active);
      setSelectedBooking((current) => current || active[0] || null);
      setError(active.length ? '' : 'Live tracking is available after a worker accepts your booking.');
    } catch (err) {
      setError(err.message || 'Could not load bookings.');
    } finally {
      setLoading(false);
    }
  };

  const loadLocation = async (bookingId) => {
    if (!bookingId || !token) return;
    try {
      const response = await fetch(`/api/bookings/${bookingId}/location`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!data.success) throw new Error(data.message || 'Location unavailable.');
      setLocation(data.location);
      setError('');
    } catch (err) {
      setError(err.message || 'Worker location unavailable.');
    }
  };

  useEffect(() => {
    if (!isOpen || !isAuthenticated) return;
    loadBookings();
  }, [isOpen, isAuthenticated, token]);

  useEffect(() => {
    if (!selectedBooking) return;
    loadLocation(selectedBooking.id);
  }, [selectedBooking?.id, token]);

  useEffect(() => {
    if (!socket || !selectedBooking) return undefined;
    const handleLocation = (payload) => {
      if (payload.bookingId === selectedBooking.id) setLocation(payload.location);
    };
    socket.on('worker_location_updated', handleLocation);
    return () => socket.off('worker_location_updated', handleLocation);
  }, [socket, selectedBooking?.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
      <div className="flex h-[min(720px,92vh)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <header className="flex items-center justify-between bg-slate-900 px-5 py-4 text-white">
          <div>
            <h2 className="text-base font-black">Live Worker Tracking</h2>
            <p className="mt-1 text-[11px] text-slate-400">See your accepted worker's latest shared location</p>
          </div>
          <button onClick={onClose} className="rounded-xl p-2 text-slate-300 transition hover:bg-white/10 hover:text-white" aria-label="Close tracking"><X className="h-5 w-5" /></button>
        </header>

        {!isAuthenticated ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
            <AlertCircle className="h-10 w-10 text-amber-500" />
            <p className="text-sm font-bold text-slate-800">Please sign in to track your worker.</p>
            <button onClick={() => { onClose(); onOpenLogin(); }} className="rounded-xl bg-aqua-500 px-6 py-3 text-xs font-bold text-slate-950">Sign In to Continue</button>
          </div>
        ) : loading ? (
          <div className="flex flex-1 items-center justify-center text-xs text-slate-500"><RefreshCw className="mr-2 h-4 w-4 animate-spin" />Loading accepted bookings...</div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            <aside className="w-full border-b border-slate-200 p-4 md:w-72 md:border-b-0 md:border-r">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-black uppercase tracking-wider text-slate-500">Accepted Bookings</span><button onClick={loadBookings} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Refresh"><RefreshCw className="h-3.5 w-3.5" /></button></div>
              <div className="space-y-2">
                {bookings.map((booking) => (
                  <button key={booking.id} onClick={() => setSelectedBooking(booking)} className={`w-full rounded-xl border p-3 text-left transition ${selectedBooking?.id === booking.id ? 'border-aqua-400 bg-aqua-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                    <span className="block text-xs font-bold text-slate-900">{booking.workerName}</span>
                    <span className="mt-1 block text-[10px] text-slate-500">{booking.workerSkill} · #{booking.id}</span>
                  </button>
                ))}
              </div>
              {!bookings.length && <p className="text-xs leading-relaxed text-slate-500">{error}</p>}
            </aside>
            <main className="relative min-h-0 flex-1 p-4">
              {selectedBooking && location?.lat && location?.lng ? (
                <>
                  <div className="mb-3 flex items-center justify-between gap-3"><div><p className="text-sm font-black text-slate-900">{selectedBooking.workerName}</p><p className="text-[11px] text-slate-500">Last shared location: {location.updatedAt ? new Date(location.updatedAt).toLocaleString() : 'Available'}</p></div><span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live</span></div>
                  <div className="h-[calc(100%-52px)] min-h-[360px] overflow-hidden rounded-2xl border border-slate-200"><MapContainer center={[location.lat, location.lng]} zoom={14} scrollWheelZoom className="h-full w-full"><TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" /><Marker position={[location.lat, location.lng]}><Popup><div className="text-xs font-bold">{selectedBooking.workerName}<br />Worker location</div></Popup></Marker></MapContainer></div>
                </>
              ) : (
                <div className="flex h-full flex-col items-center justify-center text-center text-slate-500"><MapPin className="mb-3 h-10 w-10 text-slate-300" /><p className="text-sm font-bold text-slate-700">{error || 'Select an accepted booking to track.'}</p></div>
              )}
            </main>
          </div>
        )}
      </div>
    </div>
  );
}
