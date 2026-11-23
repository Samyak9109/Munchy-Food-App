import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useMutation } from '@tanstack/react-query';
import * as api from '../../api/index';
import styles from './LocationPicker.module.css';

// Fix Leaflet icon (same as StoreMarker)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to update map view when position changes
function RecenterMap({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 15);
    }
  }, [center, map]);
  return null;
}

// Inner component that handles map clicks
function ClickHandler({ onMapClick }) {
  useMapEvents({ click: (e) => onMapClick(e.latlng) });
  return null;
}

// Draggable marker
function DraggableMarker({ position, onDrag }) {
  const markerRef = useRef(null);
  const handlers = {
    dragend() {
      if (markerRef.current) {
        const ll = markerRef.current.getLatLng();
        onDrag({ lat: ll.lat, lng: ll.lng });
      }
    },
  };
  return (
    <Marker
      position={position}
      draggable
      ref={markerRef}
      eventHandlers={handlers}
    />
  );
}

export default function LocationPicker({ initialLat, initialLng, onPick }) {
  const defaultCenter = [22.7196, 75.8577]; // Indore
  const hasInitial = initialLat && initialLng;
  const [position, setPosition] = useState(
    hasInitial ? [initialLat, initialLng] : null
  );
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');

  const geocodeMut = useMutation({
    mutationFn: (q) => api.geocode(q).then((r) => r.data.results || []),
    onSuccess: (results) => {
      if (results.length === 0) { setError('No places found'); return; }
      const { lat, lng, label } = results[0];
      setPosition([lat, lng]);
      onPick({ lat, lng, label });
      setQuery('');
      setError('');
    },
    onError: () => setError('Geocoding failed'),
  });

  function handleMapClick({ lat, lng }) {
    setPosition([lat, lng]);
    onPick({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }

  function handleDrag({ lat, lng }) {
    setPosition([lat, lng]);
    onPick({ lat, lng, label: `${lat.toFixed(5)}, ${lng.toFixed(5)}` });
  }

  const mapCenter = position || defaultCenter;

  return (
    <div className={styles.wrap}>
      <div className={styles.search}>
        <input
          className={styles.input}
          placeholder="Search address to place pin…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && query.trim().length >= 2) {
              geocodeMut.mutate(query.trim());
            }
          }}
        />
        <button
          className={styles.searchBtn}
          onClick={() => query.trim().length >= 2 && geocodeMut.mutate(query.trim())}
          disabled={geocodeMut.isPending}
        >
          {geocodeMut.isPending ? '…' : '🔍'}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <p className={styles.hint}>Tap the map or drag the pin to set location.</p>
      <div className={styles.map}>
        <MapContainer
          center={mapCenter}
          zoom={position ? 15 : 12}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OpenStreetMap" />
          <RecenterMap center={position} />
          <ClickHandler onMapClick={handleMapClick} />
          {position && <DraggableMarker position={position} onDrag={handleDrag} />}
        </MapContainer>
      </div>
    </div>
  );
}
