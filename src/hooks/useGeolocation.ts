'use client';

import { useCallback, useState } from 'react';

interface Coords { lat: number; lng: number }

export function useGeolocation() {
  const [coords, setCoords] = useState<Coords | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [watching, setWatching] = useState(false);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
        setError(null);
        setLoading(false);
      },
      () => {
        setError('Unable to retrieve your location. Please enable location access.');
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  }, []);

  const toggleLiveTracking = useCallback((enabled: boolean) => {
    setWatching(enabled);
    if (!enabled || !navigator.geolocation) return;
    navigator.geolocation.watchPosition(
      (position) => setCoords({ lat: position.coords.latitude, lng: position.coords.longitude }),
      () => {},
      { enableHighAccuracy: true }
    );
  }, []);

  return { coords, error, loading, watching, requestLocation, toggleLiveTracking };
}
