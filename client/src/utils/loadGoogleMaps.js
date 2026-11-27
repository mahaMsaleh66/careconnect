import { useEffect, useState } from 'react';

const KEY = (import.meta.env.VITE_GOOGLE_MAPS_KEY || '').trim();
const SCRIPT_ID = 'google-maps-js';

let loadPromise = null;

export function hasGoogleMapsKey() {
  return Boolean(KEY);
}

export function loadGoogleMaps() {
  if (!hasGoogleMapsKey()) {
    return Promise.reject(new Error('VITE_GOOGLE_MAPS_KEY is not set'));
  }
  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const finish = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps did not initialise'));
      }
    };

    const existing = document.getElementById(SCRIPT_ID);
    if (existing) {
      if (window.google && window.google.maps) {
        finish();
        return;
      }
      existing.addEventListener('load', finish, { once: true });
      existing.addEventListener('error', () => reject(new Error('Google Maps script failed to load')), { once: true });
      return;
    }

    window.__ccMapsReady = finish;
    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.defer = true;
    script.src =
      'https://maps.googleapis.com/maps/api/js?key=' +
      encodeURIComponent(KEY) +
      '&callback=__ccMapsReady';
    script.onerror = () => {
      loadPromise = null;
      reject(new Error('Google Maps script failed to load'));
    };
    document.head.appendChild(script);
  });

  return loadPromise;
}

export function useGoogleMaps() {
  const [state, setState] = useState({
    hasKey: hasGoogleMapsKey(),
    ready: Boolean(window.google && window.google.maps),
    maps: window.google && window.google.maps ? window.google.maps : null,
    error: null,
  });

  useEffect(() => {
    if (!hasGoogleMapsKey()) return;
    let alive = true;
    loadGoogleMaps()
      .then((maps) => {
        if (alive) setState({ hasKey: true, ready: true, maps: maps, error: null });
      })
      .catch((err) => {
        if (alive) {
          setState({
            hasKey: true,
            ready: false,
            maps: null,
            error: err.message || 'Google Maps failed to load',
          });
        }
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}
