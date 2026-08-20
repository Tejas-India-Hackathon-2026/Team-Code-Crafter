import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { X, Star, MapPin, ArrowRight, ShieldCheck } from 'lucide-react';

// Fix for default Leaflet marker icons in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Custom customer pin
const customerIcon = L.divIcon({
  className: 'custom-customer-pin',
  html: `<div style="background-color: #00D4D4; width: 34px; height: 34px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid #ffffff; box-shadow: 0 4px 14px rgba(0,212,212,0.6); font-size: 16px;">📍</div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 34],//
});

// Custom worker pin generator
function createWorkerIcon(skill) {
  let emoji = '⚡';
  if (skill === 'Plumber') emoji = '🔧';
  else if (skill === 'Painter') emoji = '🎨';
  else if (skill === 'Carpenter') emoji = '🪚';
  else if (skill === 'AC Repair') emoji = '❄️';
  else if (skill === 'Home Cleaner') emoji = '🧹';
  else if (skill === 'Mechanic') emoji = '🚗';

  return L.divIcon({
    className: 'custom-worker-pin',
    html: `<div style="background-color: #0f172a; color: #ffffff; width: 36px; height: 36px; border-radius: 12px; display: flex; align-items: center; justify-content: center; border: 2px solid #00D4D4; box-shadow: 0 4px 14px rgba(0,0,0,0.25); font-size: 16px;">${emoji}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] && center[1]) {
      map.setView(center, 13);
    }
  }, [center, map]);
  return null;
}

export default function MapViewModal({ workers, userCoords, userLocationName, onClose, onSelectWorker, onBookNow }) {
  const defaultCenter = [userCoords?.lat || 12.9784, userCoords?.lng || 77.6408];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-5xl h-[85vh] bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        
        {/* Header */}
        <div className="p-4 sm:px-6 bg-white border-b border-slate-200 flex items-center justify-between z-20">
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-aqua-600" />
              <span>Interactive Nearby Worker Map</span>
            </h3>
            <p className="text-xs text-slate-500">
              Showing {workers.length} verified skilled workers around <strong className="text-slate-800">{userLocationName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Leaflet Map Body */}
        <div className="flex-1 relative w-full h-full">
          <MapContainer
            center={defaultCenter}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            <RecenterMap center={defaultCenter} />

            {/* Customer Marker & Proximity Circle */}
            <Marker position={defaultCenter} icon={customerIcon}>
              <Popup>
                <div className="p-2 text-xs font-bold text-slate-900">
                  📍 Your Location: {userLocationName}
                </div>
              </Popup>
            </Marker>
            <Circle
              center={defaultCenter}
              radius={4000}
              pathOptions={{ fillColor: '#00D4D4', fillOpacity: 0.1, color: '#00D4D4', weight: 1.5 }}
            />

            {/* Worker Markers */}
            {workers.map((w) => {
              if (!w.lat || !w.lng) return null;
              return (
                <Marker
                  key={w.id}
                  position={[w.lat, w.lng]}
                  icon={createWorkerIcon(w.skill)}
                >
                  <Popup>
                    <div className="p-3 w-56 space-y-2">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={w.avatar}
                          alt={w.fullName}
                          className="h-10 w-10 rounded-xl object-cover border border-aqua-400"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-slate-900 truncate">
                            {w.fullName}
                          </h4>
                          <span className="text-[10px] font-bold text-aqua-800 bg-aqua-50 px-2 py-0.5 rounded-full border border-aqua-200">
                            {w.skill}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                        <div className="flex items-center gap-1 font-bold text-amber-800">
                          <Star className="h-3 w-3 text-amber-500 fill-amber-400" />
                          <span>{w.rating?.toFixed(1) || '5.0'}</span>
                        </div>
                        <span className="font-extrabold text-slate-900">
                          ₹{w.servicePrice} <span className="text-[9px] text-slate-400 font-normal">/ visit</span>
                        </span>
                      </div>

                      {w.distanceKm !== undefined && w.distanceKm !== null && (
                        <div className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded text-center">
                          📍 {w.distanceKm} km from your spot
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <button
                          onClick={() => onSelectWorker(w)}
                          className="py-1 px-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-[10px] font-bold text-slate-700 text-center"
                        >
                          View Details
                        </button>
                        <button
                          onClick={() => onBookNow(w)}
                          className="py-1 px-2 rounded-lg aqua-gradient-btn text-[10px] font-bold text-center"
                        >
                          Book Now
                        </button>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              );
            })}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}
