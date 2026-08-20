import React, { createContext, useContext, useState, useEffect } from 'react';

const LocationContext = createContext();

export const POPULAR_LOCATIONS = [
  { name: 'Indiranagar, Bengaluru', lat: 12.9784, lng: 77.6408, pin: '560038' },
  { name: 'Koramangala, Bengaluru', lat: 12.9352, lng: 77.6245, pin: '560034' },
  { name: 'HSR Layout, Bengaluru', lat: 12.9121, lng: 77.6446, pin: '560102' },
  { name: 'Whitefield, Bengaluru', lat: 12.9698, lng: 77.7499, pin: '560066' },
  { name: 'Domlur, Bengaluru', lat: 12.9609, lng: 77.6387, pin: '560071' },
  { name: 'Bandra West, Mumbai', lat: 19.0596, lng: 72.8295, pin: '400050' },
  { name: 'Connaught Place, New Delhi', lat: 28.6304, lng: 77.2177, pin: '110001' },
  { name: 'Hitec City, Hyderabad', lat: 17.4474, lng: 78.3762, pin: '500081' },
];

export function LocationProvider({ children }) {
  const [currentLocation, setCurrentLocation] = useState('Indiranagar, Bengaluru');
  const [coords, setCoords] = useState({ lat: 12.9784, lng: 77.6408 });
  const [pinCode, setPinCode] = useState('560038');
  const [isDetectingGPS, setIsDetectingGPS] = useState(false);
  const [gpsError, setGpsError] = useState(null);
  const [maxDistance, setMaxDistance] = useState(25); // in km

  // Detect current location via browser Geolocation API
  const detectGPSLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return Promise.reject(new Error('Geolocation is not supported by your browser.'));
    }

    setIsDetectingGPS(true);
    setGpsError(null);

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          const nextCoords = { lat: latitude, lng: longitude };
          setCoords(nextCoords);
          setCurrentLocation(`Current GPS Location (${latitude.toFixed(3)}, ${longitude.toFixed(3)})`);
          setIsDetectingGPS(false);
          resolve(nextCoords);
        },
        (error) => {
          console.warn('Geolocation error:', error.message);
          setGpsError('Location access blocked. Please allow GPS access to register your service area.');
          setIsDetectingGPS(false);
          reject(error);
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  };

  const setPresetLocation = (loc) => {
    setCurrentLocation(loc.name);
    setCoords({ lat: loc.lat, lng: loc.lng });
    if (loc.pin) setPinCode(loc.pin);
  };

  const setManualLocation = (name, lat, lng, pin = '') => {
    setCurrentLocation(name);
    if (lat && lng) {
      setCoords({ lat: Number(lat), lng: Number(lng) });
    }
    if (pin) setPinCode(pin);
  };

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        coords,
        pinCode,
        isDetectingGPS,
        gpsError,
        maxDistance,
        setMaxDistance,
        detectGPSLocation,
        setPresetLocation,
        setManualLocation,
        popularLocations: POPULAR_LOCATIONS,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useLocation must be used within a LocationProvider');
  return context;
}
