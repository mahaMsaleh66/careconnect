import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { PAKISTAN_CITIES, SINDH_CENTER, toMapPercent } from '../utils/pakistanCities';
import { useGoogleMaps } from '../utils/loadGoogleMaps';

function toNum(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export default function LocationMapPicker({ lat, lng, onChange }) {
  const mapsState = useGoogleMaps();
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markerObj = useRef(null);
  const onChangeRef = useRef(onChange);
  const [gpsError, setGpsError] = useState('');
  const [gpsBusy, setGpsBusy] = useState(false);
  onChangeRef.current = onChange;

  const currentLat = toNum(lat);
  const currentLng = toNum(lng);
  const hasPin = currentLat !== null && currentLng !== null;
  const useLiveMap = mapsState.hasKey && mapsState.ready && mapsState.maps;

  const emit = (nextLat, nextLng, label) => {
    if (typeof onChangeRef.current !== 'function') return;
    onChangeRef.current({ lat: nextLat, lng: nextLng, label: label || '' });
  };

  const useGps = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported in this browser');
      return;
    }
    setGpsBusy(true);
    setGpsError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        emit(pos.coords.latitude, pos.coords.longitude, '');
        setGpsBusy(false);
      },
      () => {
        setGpsError('Could not read GPS. Allow location access and try again.');
        setGpsBusy(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => {
    if (!useLiveMap || !mapRef.current) return;
    const gmaps = mapsState.maps;
    const center = hasPin
      ? { lat: currentLat, lng: currentLng }
      : { lat: SINDH_CENTER.lat, lng: SINDH_CENTER.lng };

    if (!mapObj.current) {
      mapObj.current = new gmaps.Map(mapRef.current, {
        center: center,
        zoom: hasPin ? 11 : SINDH_CENTER.zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapObj.current.addListener('click', (event) => {
        const nextLat = event.latLng.lat();
        const nextLng = event.latLng.lng();
        const geocoder = new gmaps.Geocoder();
        geocoder.geocode({ location: { lat: nextLat, lng: nextLng } }, (results, status) => {
          const label =
            status === 'OK' && results && results[0] ? results[0].formatted_address : '';
          emit(nextLat, nextLng, label);
        });
      });
    }

    mapObj.current.setCenter(center);
    if (hasPin) {
      if (!markerObj.current) {
        markerObj.current = new gmaps.Marker({
          map: mapObj.current,
          position: center,
        });
      } else {
        markerObj.current.setPosition(center);
      }
    }
  }, [useLiveMap, currentLat, currentLng, mapsState.maps]);

  const pinStyle = hasPin ? toMapPercent(currentLat, currentLng) : null;

  return (
    <div className="map-picker">
      <div className="map-picker-head">
        <strong><MapPin size={16} /> Pin a location</strong>
        <button type="button" className="btn small" onClick={useGps} disabled={gpsBusy}>
          <Navigation size={14} /> {gpsBusy ? 'Locating…' : 'Use My GPS Location'}
        </button>
      </div>

      {mapsState.hasKey && !mapsState.ready && !mapsState.error && (
        <div className="map-canvas map-loading">Loading Google Map…</div>
      )}
      {useLiveMap ? (
        <div className="map-canvas" ref={mapRef} />
      ) : (!mapsState.hasKey || mapsState.error) && (
        <div className="map-fallback">
          <div className="map-board">
            <span className="map-board-label">Pakistan · Sindh</span>
            {hasPin && (
              <span className="map-dot crisis High" style={pinStyle} title="Selected pin" />
            )}
          </div>
          <div className="map-coords">
            <label>
              Latitude
              <input
                type="number"
                step="0.0000001"
                value={currentLat === null ? '' : currentLat}
                onChange={(e) => emit(e.target.value === '' ? null : Number(e.target.value), currentLng, '')}
                placeholder="26.7329"
              />
            </label>
            <label>
              Longitude
              <input
                type="number"
                step="0.0000001"
                value={currentLng === null ? '' : currentLng}
                onChange={(e) => emit(currentLat, e.target.value === '' ? null : Number(e.target.value), '')}
                placeholder="67.7791"
              />
            </label>
          </div>
          {!mapsState.hasKey && (
            <p className="map-note">
              Google Maps is optional. Add <code>VITE_GOOGLE_MAPS_KEY</code> in <code>client/.env</code> and
              restart Vite for an interactive map. Until then, pick a city or enter coordinates.
            </p>
          )}
          {mapsState.error && <p className="map-note error">{mapsState.error}</p>}
        </div>
      )}

      <div className="map-cities">
        {PAKISTAN_CITIES.map((city) => (
          <button
            type="button"
            key={city.name}
            className={
              'map-city' +
              (hasPin && Math.abs(currentLat - city.lat) < 0.05 && Math.abs(currentLng - city.lng) < 0.05
                ? ' on'
                : '')
            }
            onClick={() => emit(city.lat, city.lng, city.name)}
          >
            {city.name}
          </button>
        ))}
      </div>

      {hasPin && (
        <p className="map-selected">
          Selected: {currentLat.toFixed(5)}, {currentLng.toFixed(5)}
        </p>
      )}
      {gpsError && <p className="map-note error">{gpsError}</p>}
    </div>
  );
}
