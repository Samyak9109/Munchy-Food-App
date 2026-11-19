import { useState, memo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, Heart, Plus } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as api from '../../api/index';
import { useLocationStore } from '../../store/locationStore';
import { img, srcSet } from '../../lib/img';
import styles from './StorePage.module.css';

// Fix Leaflet icon in Vite
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PROFILES = [
  { id: 'driving-car', label: '🚗 Car' },
  { id: 'foot-walking', label: '🚶 Walk' },
  { id: 'cycling-regular', label: '🚴 Bike' },
];

export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: () => api.getStoreById(id).then((r) => r.data),
  });

  const { data: menuData } = useQuery({
    queryKey: ['store-menu', id],
    queryFn: () => api.getStoreMenu(id).then((r) => r.data),
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites().then((r) => r.data),
  });

  const isFavorite = (favoritesData?.favorites || [])
    .some((favorite) => favorite.store?._id === id);

  const favMut = useMutation({
    mutationFn: () => api.toggleFavorite(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const addToCart = useMutation({
    mutationFn: (foodId) => api.addToCart({ foodId, quantity: 1, storeId: id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const store = storeData?.store;
  const foods = menuData?.menu || [];
  const categories = ['All', ...new Set(foods.flatMap((f) => f.category || []))];
  const filtered = activeCategory === 'All' ? foods : foods.filter((f) => f.category?.includes(activeCategory));

  if (isLoading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero} style={{ backgroundImage: store?.image ? `url(${img(store.image, { w: 800, q: 75 })})` : undefined }}>
        <div className={styles.heroOverlay} />
        <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <button className={styles.favBtn} onClick={() => favMut.mutate()}>
          <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Store info */}
      <div className={styles.info}>
        <div className={styles.infoTop}>
          <h1 className={styles.storeName}>{store?.name}</h1>
          <span className={`${styles.statusBadge} ${store?.isOpen ? styles.open : styles.closed}`}>
            {store?.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <p className={styles.cuisine}>{store?.cuisine?.join(' · ')}</p>
        <div className={styles.meta}>
          <span><Star size={13} fill="currentColor" style={{ color: 'var(--yellow)' }} /> {store?.rating?.average?.toFixed(1) || '—'} ({store?.rating?.count || 0})</span>
          <span><MapPin size={13} /> {store?.address || 'Nearby'}</span>
        </div>
        {store?.description && <p className={styles.desc}>{store.description}</p>}
      </div>

      {/* Directions section */}
      <DirectionsSection store={store} storeId={id} />

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className={styles.tabs}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.tab} ${activeCategory === cat ? styles.tabActive : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Menu */}
      <div className={styles.menu}>
        {filtered.length === 0
          ? <p className={styles.dim}>No items available.</p>
          : filtered.map((food) => (
            <FoodItem key={food._id} food={food} onAdd={() => addToCart.mutate(food._id)} />
          ))
        }
      </div>
    </div>
  );
}

// ── Directions section ────────────────────────────────────────────────────────

function DirectionsSection({ store, storeId }) {
  const location = useLocationStore((s) => ({ lat: s.lat, lng: s.lng }));
  const [activeProfile, setActiveProfile] = useState('driving-car');
  const [showRoute, setShowRoute] = useState(false);

  const coords = store?.location?.coordinates;
  const hasStoreCoords = Array.isArray(coords) && coords.length === 2 && coords[0] !== 0;
  const hasUserLocation = !!(location.lat && location.lng);
  const enabled = hasUserLocation && hasStoreCoords;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['directions', storeId, location.lat, location.lng, activeProfile],
    queryFn: () =>
      api.getDirections(storeId, {
        userLat: location.lat,
        userLng: location.lng,
        profile: activeProfile,
      }).then((r) => r.data),
    enabled,
    retry: false,
  });

  if (!hasUserLocation) {
    return (
      <div className={styles.directions}>
        <p className={styles.noLocBanner}>
          <MapPin size={14} /> Set your location to see distance &amp; route
        </p>
      </div>
    );
  }

  if (!hasStoreCoords) return null;

  const directions = data?.directions;
  const distanceKm = directions?.distanceKm ?? (data?.route?.summary?.distance != null ? (data.route.summary.distance / 1000).toFixed(1) : null);
  const durationMin = directions?.durationMin ?? (data?.route?.summary?.duration != null ? Math.ceil(data.route.summary.duration / 60) : null);

  // GeoJSON coordinates from backend: [[lng, lat], ...]
  // Leaflet Polyline wants [[lat, lng], ...]
  const rawCoords = directions?.geometry?.coordinates || data?.route?.geometry?.coordinates || [];
  const polylinePoints = rawCoords.map(([lng, lat]) => [lat, lng]);
  const [storeLng, storeLat] = coords;

  return (
    <div className={styles.directions}>
      {/* Profile selector */}
      <div className={styles.dirProfiles}>
        {PROFILES.map((p) => (
          <button
            key={p.id}
            className={`${styles.profileBtn} ${activeProfile === p.id ? styles.profileBtnActive : ''}`}
            onClick={() => { setActiveProfile(p.id); setShowRoute(false); }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.dirRow}>
          <div className={styles.skeleton} style={{ width: 80, height: 20, borderRadius: 6 }} />
          <div className={styles.skeleton} style={{ width: 60, height: 20, borderRadius: 6, marginLeft: 8 }} />
        </div>
      )}

      {isError && (
        <p className={styles.noLocBanner}>
          ⚠️ Routing unavailable — check directions in Maps app
        </p>
      )}

      {!isLoading && !isError && distanceKm && (
        <div className={styles.dirRow}>
          <div>
            <p className={styles.dirStat}>{distanceKm} km</p>
            <p className={styles.dirLabel}>Distance</p>
          </div>
          {durationMin && (
            <div>
              <p className={styles.dirStat}>{durationMin} min</p>
              <p className={styles.dirLabel}>ETA</p>
            </div>
          )}
          <button
            className={styles.viewRouteBtn}
            onClick={() => setShowRoute((v) => !v)}
          >
            {showRoute ? 'Hide route' : 'View route'}
          </button>
        </div>
      )}

      {showRoute && polylinePoints.length > 0 && (
        <div className={styles.routeMapWrap}>
          <MapContainer
            bounds={polylinePoints}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
            attributionControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Polyline positions={polylinePoints} color="#FF5352" weight={4} />
            {/* User location marker */}
            <Marker position={[location.lat, location.lng]} />
            {/* Store marker */}
            <Marker position={[storeLat, storeLng]} />
          </MapContainer>
        </div>
      )}
    </div>
  );
}

// ── Food item card ────────────────────────────────────────────────────────────

const FoodItem = memo(function FoodItem({ food, onAdd }) {
  return (
    <div className={styles.foodCard}>
      <div className={styles.foodInfo}>
        <div className={styles.foodTop}>
          <span className={`${styles.vegBadge} ${food.isVeg ? styles.veg : styles.nonveg}`}>
            {food.isVeg ? '🟢' : '🔴'}
          </span>
          {!food.isAvailable && <span className={styles.unavail}>Unavailable</span>}
        </div>
        <h3 className={styles.foodName}>{food.name}</h3>
        {food.description && <p className={styles.foodDesc}>{food.description}</p>}
        <p className={styles.foodPrice}>₹{food.price}</p>
      </div>
      <div className={styles.foodRight}>
        {food.image && (
          <img
            src={img(food.image, { w: 180, h: 180, q: 75 })}
            srcSet={srcSet(food.image, { w: 180, h: 180, q: 75 })}
            alt={food.name}
            className={styles.foodImg}
            loading="lazy"
            decoding="async"
            width={90}
            height={90}
          />
        )}
        <button
          className={styles.addBtn}
          onClick={onAdd}
          disabled={!food.isAvailable}
        >
          <Plus size={18} />
        </button>
      </div>
    </div>
  );
});
