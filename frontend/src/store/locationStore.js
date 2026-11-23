import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Persisted user location, used by the map pages and the Header chip.
// source tells the UI whether the value came from the browser GPS,
// a manual address search, or was never set.
export const useLocationStore = create(
  persist(
    (set) => ({
      lat: null,
      lng: null,
      label: null,
      source: null, // 'gps' | 'search' | null

      setLocation: (lat, lng, label, source = 'search') =>
        set({ lat, lng, label, source }),

      clearLocation: () =>
        set({ lat: null, lng: null, label: null, source: null }),
    }),
    {
      name: 'munchy-location',
      partialize: (s) => ({ lat: s.lat, lng: s.lng, label: s.label, source: s.source }),
    },
  ),
);

// Returns a promise that resolves with {lat, lng} or rejects with a message.
// Used by the Header chip so the UI can show a real error instead of an alert.
export function getUserLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }

    const timer = setTimeout(() => {
      reject(new Error('Location request timed out. Try again or search manually.'));
    }, 10000);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        clearTimeout(timer);
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      (error) => {
        clearTimeout(timer);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            reject(new Error('Location permission denied. Search for an address instead.'));
            break;
          case error.POSITION_UNAVAILABLE:
            reject(new Error('Location unavailable. Try again or search manually.'));
            break;
          case error.TIMEOUT:
            reject(new Error('Location request timed out. Try again or search manually.'));
            break;
          default:
            reject(new Error('Could not get your location.'));
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  });
}