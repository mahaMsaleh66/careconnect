import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPinned } from 'lucide-react';
import { PAKISTAN_CENTER, hasCoords, toMapPercent } from '../utils/pakistanCities';
import { useGoogleMaps } from '../utils/loadGoogleMaps';

const COLORS = {
  High: '#dc2626',
  Medium: '#d97706',
  Low: '#16a34a',
  Emergency: '#b91c1c',
  Warning: '#d97706',
  Advisory: '#0284c7',
  request: '#0d9488',
  volunteer: '#2563eb',
  flood: '#0369a1',
};

function escapeHtml(value) {
  return String(value || '').replace(/[&<>"']/g, (ch) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[ch]));
}

function pinColor(marker) {
  if (marker.kind === 'request') return COLORS[marker.severity] || COLORS.request;
  if (marker.kind === 'volunteer') return COLORS.volunteer;
  if (marker.kind === 'flood') return COLORS[marker.severity] || COLORS.flood;
  return COLORS[marker.severity] || COLORS.Medium;
}

export default function ReliefMapView({ markers = [], title = 'Crisis & request map', toolbar, center }) {
  const mapsState = useGoogleMaps();
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const overlays = useRef([]);
  const [active, setActive] = useState(null);

  const plotted = useMemo(
    () => (markers || []).filter((m) => hasCoords(m)),
    [markers]
  );

  const useLiveMap = mapsState.hasKey && mapsState.ready && mapsState.maps;

  useEffect(() => {
    if (!useLiveMap || !mapRef.current) return;
    const gmaps = mapsState.maps;
    if (!mapObj.current) {
      mapObj.current = new gmaps.Map(mapRef.current, {
        center: { lat: (center || PAKISTAN_CENTER).lat, lng: (center || PAKISTAN_CENTER).lng },
        zoom: (center || PAKISTAN_CENTER).zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });
    }

    overlays.current.forEach((item) => {
      item.marker.setMap(null);
      if (item.info) item.info.close();
    });
    overlays.current = [];

    const bounds = new gmaps.LatLngBounds();
    plotted.forEach((m) => {
      const position = { lat: Number(m.lat), lng: Number(m.lng) };
      bounds.extend(position);
      const marker = new gmaps.Marker({
        map: mapObj.current,
        position: position,
        title: m.title,
        icon: {
          path: gmaps.SymbolPath.CIRCLE,
          scale: m.kind === 'crisis' ? 9 : 7,
          fillColor: pinColor(m),
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
        },
      });
      const info = new gmaps.InfoWindow({
        content:
          '<div class="map-info">' +
          '<strong>' + escapeHtml(m.title) + '</strong>' +
          (m.subtitle ? '<div>' + escapeHtml(m.subtitle) + '</div>' : '') +
          '<div class="map-info-kind">' + escapeHtml(m.kind || 'pin') +
          (m.severity ? ' · ' + escapeHtml(m.severity) : '') +
          '</div></div>',
      });
      marker.addListener('click', () => info.open({ map: mapObj.current, anchor: marker }));
      overlays.current.push({ marker, info });
    });

    if (plotted.length === 1) {
      mapObj.current.setCenter({ lat: Number(plotted[0].lat), lng: Number(plotted[0].lng) });
      mapObj.current.setZoom(10);
    } else if (plotted.length > 1) {
      mapObj.current.fitBounds(bounds, 48);
    }
  }, [useLiveMap, plotted, mapsState.maps]);

  return (
    <div className="card map-view">
      <div className="map-view-head">
        <h3><MapPinned size={18} /> {title}</h3>
        <div className="map-legend">
          <span><i className="High"></i> High / Emergency</span>
          <span><i className="Medium"></i> Medium / Warning</span>
          <span><i className="Low"></i> Low</span>
          <span><i className="Advisory"></i> Advisory</span>
          <span><i className="request"></i> Help request</span>
        </div>
      </div>
      {toolbar ? <div className="map-toolbar">{toolbar}</div> : null}

      {useLiveMap ? (
        <div className="map-canvas tall" ref={mapRef} />
      ) : (
        <div className="map-board tall">
          <span className="map-board-label">Pakistan overview · pins without a Google key</span>
          {plotted.map((m) => {
            const pos = toMapPercent(m.lat, m.lng);
            return (
              <button
                type="button"
                key={m.kind + '-' + m.id}
                className={'map-dot ' + (m.kind || 'crisis') + ' ' + (m.severity || '')}
                style={pos}
                title={m.title}
                onClick={() => setActive(m)}
              />
            );
          })}
        </div>
      )}

      {active && (
        <div className="map-fallback-info">
          <strong>{active.title}</strong>
          {active.subtitle && <p>{active.subtitle}</p>}
          <small>{active.kind}{active.severity ? ' · ' + active.severity : ''}</small>
        </div>
      )}

      {plotted.length === 0 && (
        <p className="map-note">No mapped pins yet. Save a location on the form below, or type a known city.</p>
      )}
      {!mapsState.hasKey && (
        <p className="map-note">
          Interactive Google Map appears when <code>VITE_GOOGLE_MAPS_KEY</code> is set. Pins still plot on this board.
        </p>
      )}
    </div>
  );
}
