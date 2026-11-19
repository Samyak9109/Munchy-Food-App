import { useMemo, useState, useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useLocationStore } from '../../store/locationStore';
import StoreMarker from './StoreMarker';
import styles from './KitchensMap.module.css';

// Focuses map on selected store or center
function MapFocus({ center, selectedStore }) {
  const map = useMap();
  useEffect(() => {
    if (selectedStore?.location?.coordinates) {
      const [lng, lat] = selectedStore.location.coordinates;
      if (lat && lng) {
        map.setView([lat, lng], 15, { animate: true });
        return;
      }
    }
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, selectedStore, map]);
  return null;
}

// The map half of the Kitchens page. Renders real OSM tiles and one marker
// per store. Clicking a marker opens a mini card and scrolls the matching
// list row into view, so the list and map stay in sync.
export default function KitchensMap({ stores, selectedId, onSelect }) {
  const location = useLocationStore((s) => ({ lat: s.lat, lng: s.lng }));
  const [sortMode, setSortMode] = useState('distance');

  const center = useMemo(() => {
    if (location.lat && location.lng) return [location.lat, location.lng];
    if (stores.length) {
      const first = stores[0];
      const [lng, lat] = first.location?.coordinates || [];
      if (lat && lng) return [lat, lng];
    }
    return [22.7196, 75.8577]; // Indore fallback
  }, [location, stores]);

  const selectedStore = useMemo(() => {
    return stores.find((s) => s._id === selectedId);
  }, [stores, selectedId]);

  const visibleStores = useMemo(() => {
    const list = [...stores];
    if (sortMode === 'distance') {
      list.sort((a, b) => (a.distanceMeters ?? Infinity) - (b.distanceMeters ?? Infinity));
    } else if (sortMode === 'rating') {
      list.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    }
    return list;
  }, [stores, sortMode]);

  function formatDistance(meters) {
    if (meters == null) return null;
    return meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${Math.round(meters)} m`;
  }

  return (
    <div className={styles.mapWrap}>
      <div className={styles.mapToolbar}>
        <span className={styles.count}>{visibleStores.length} places</span>
        <div className={styles.sort}>
          <button
            className={`${styles.sortBtn} ${sortMode === 'distance' ? styles.active : ''}`}
            onClick={() => setSortMode('distance')}
          >
            Distance
          </button>
          <button
            className={`${styles.sortBtn} ${sortMode === 'rating' ? styles.active : ''}`}
            onClick={() => setSortMode('rating')}
          >
            Rating
          </button>
        </div>
      </div>

      <div className={styles.map}>
        <MapContainer
          center={center}
          zoom={13}
          zoomControl={false}
          style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
          attributionControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
          />
          <MapFocus center={center} selectedStore={selectedStore} />
          {visibleStores.map((store) => (
            <StoreMarker
              key={store._id}
              store={store}
              selected={store._id === selectedId}
              onClick={() => onSelect(store._id)}
            >
              <div className={styles.miniCard}>
                <p className={styles.miniName}>{store.name}</p>
                <p className={styles.miniMeta}>
                  {store.cuisine?.join(', ')}
                  {formatDistance(store.distanceMeters) ? ` · ${formatDistance(store.distanceMeters)}` : ''}
                </p>
                <span className={`${styles.miniBadge} ${store.isOpen ? styles.open : styles.closed}`}>
                  {store.isOpen ? 'Open' : 'Closed'}
                </span>
              </div>
            </StoreMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}