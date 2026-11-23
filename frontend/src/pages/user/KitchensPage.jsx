import { useState, useRef, Suspense, lazy, memo } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, SlidersHorizontal, Heart } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import { useLocationStore } from '../../store/locationStore';
import { img, srcSet } from '../../lib/img';
import { EmptyState } from '../../components/ui';
import styles from './KitchensPage.module.css';

// Lazy-load KitchensMap so leaflet stays out of the initial bundle
const KitchensMap = lazy(() => import('../../components/map/KitchensMap'));

export default function KitchensPage() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ openOnly: false, topRated: false, favoritesOnly: false });
  const [view, setView] = useState('list'); // 'list' | 'map'
  const [selectedId, setSelectedId] = useState(null);
  const cardRefs = useRef({});
  const qc = useQueryClient();

  const location = useLocationStore((s) => ({ lat: s.lat, lng: s.lng }));
  const hasLocation = !!(location.lat && location.lng);

  // If we have user location, fetch nearby stores (they include distanceMeters)
  const { data: nearbyData } = useQuery({
    queryKey: ['nearby-stores', location.lat, location.lng],
    queryFn: () =>
      api.getNearbyStores({ lat: location.lat, lng: location.lng, radius: 10 }).then((r) => r.data),
    enabled: hasLocation,
  });

  // Fallback: all stores (no distanceMeters)
  const { data: allData, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getStores().then((r) => r.data),
    enabled: !hasLocation,
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites().then((r) => r.data),
  });

  const favoriteIds = new Set(
    (favoritesData?.favorites || []).map((favorite) => favorite.store?._id).filter(Boolean)
  );

  const favoriteMut = useMutation({
    mutationFn: (storeId) => api.toggleFavorite(storeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  // Use nearby data when available, otherwise fall back to all stores
  const rawStores = hasLocation
    ? (nearbyData?.stores || [])
    : (allData?.stores || []);

  const stores = rawStores.filter((store) => {
    const matchesSearch =
      store.name.toLowerCase().includes(search.toLowerCase()) ||
      store.cuisine?.some((item) => item.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filters.openOnly && !store.isOpen) return false;
    if (filters.topRated && (store.rating?.average || 0) < 4) return false;
    if (filters.favoritesOnly && !favoriteIds.has(store._id)) return false;
    return true;
  });

  // When a marker is clicked in the map: select and scroll the card into view
  function handleMapSelect(id) {
    setSelectedId(id);
    if (cardRefs.current[id]) {
      cardRefs.current[id].scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }

  // When a card is clicked in the list: select and switch to map view
  function handleCardSelect(id) {
    setSelectedId(id);
    setView('map');
  }

  const loadingStores = hasLocation ? !nearbyData : isLoading;

  return (
    <div className={styles.page}>
      <Header />

      {/* Search + filter + view toggle row */}
      <div className={styles.list}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search for nearby cravings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`${styles.filterBtn} ${showFilters ? styles.filterBtnActive : ''}`}
            onClick={() => setShowFilters((v) => !v)}
            aria-expanded={showFilters}
            aria-label="Filter kitchens"
          >
            <SlidersHorizontal size={18} />
          </button>
          {/* List / Map toggle */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.toggleBtn} ${view === 'list' ? styles.toggleBtnActive : ''}`}
              onClick={() => setView('list')}
            >
              List
            </button>
            <button
              className={`${styles.toggleBtn} ${view === 'map' ? styles.toggleBtnActive : ''}`}
              onClick={() => setView('map')}
            >
              Map
            </button>
          </div>
        </div>

        {showFilters && (
          <div className={styles.filters}>
            {[
              ['openOnly', 'Open now'],
              ['topRated', 'Rated 4+'],
              ['favoritesOnly', 'Favourites'],
            ].map(([key, label]) => (
              <button
                key={key}
                className={filters[key] ? styles.filterChipActive : styles.filterChip}
                onClick={() => setFilters((current) => ({ ...current, [key]: !current[key] }))}
              >
                {label}
              </button>
            ))}
            <button
              className={styles.clearFilters}
              onClick={() => setFilters({ openOnly: false, topRated: false, favoritesOnly: false })}
            >
              Clear
            </button>
          </div>
        )}
      </div>

      {/* Map view */}
      {view === 'map' && (
        <div className={styles.mapView}>
          <Suspense fallback={<div className={styles.mapFallback}>Loading map…</div>}>
            <KitchensMap
              stores={stores}
              selectedId={selectedId}
              onSelect={handleMapSelect}
            />
          </Suspense>
        </div>
      )}

      {/* List view */}
      {view === 'list' && (
        <div className={styles.list}>
          <div className={styles.listHeader}>
            <h2>Nearby Kitchens</h2>
            <span>{stores.length} PLACES</span>
          </div>

          {loadingStores
            ? <p className={styles.dim}>Loading...</p>
            : stores.length === 0
              ? <EmptyState title="No kitchens found" hint="Try adjusting your filters or location search." />
              : stores.map((store) => (
                <StoreCard
                  key={store._id}
                  store={store}
                  isFavorite={favoriteIds.has(store._id)}
                  onToggleFavorite={() => favoriteMut.mutate(store._id)}
                  selected={selectedId === store._id}
                  cardRef={(el) => { cardRefs.current[store._id] = el; }}
                  onSelect={() => handleCardSelect(store._id)}
                />
              ))
          }
        </div>
      )}
    </div>
  );
}

const StoreCard = memo(function StoreCard({ store, isFavorite, onToggleFavorite, selected, cardRef, onSelect }) {
  const navigate = useNavigate();

  return (
    <article
      ref={cardRef}
      className={`${styles.card} ${selected ? styles.cardSelected : ''}`}
      onClick={() => navigate(`/store/${store._id}`)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') navigate(`/store/${store._id}`);
      }}
      role="link"
      tabIndex={0}
    >
      <div className={styles.thumb}>
        {store.image
          ? (
            <img
              src={img(store.image, { w: 160, h: 160, q: 75 })}
              srcSet={srcSet(store.image, { w: 160, h: 160, q: 75 })}
              alt={store.name}
              loading="lazy"
              decoding="async"
              width={80}
              height={80}
            />
          )
          : <div className={styles.thumbPlaceholder}>🍽️</div>
        }
        <div className={styles.playBadge}>▶</div>
      </div>
      <div className={styles.cardInfo}>
        <div className={styles.cardTop}>
          <h3>{store.name}</h3>
          <div className={styles.cardActions}>
            <span className={styles.rating}>
              <Star size={12} fill="currentColor" /> {store.rating?.average?.toFixed(1) || '—'}
            </span>
            <button
              className={`${styles.favoriteBtn} ${isFavorite ? styles.favoriteBtnActive : ''}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleFavorite();
              }}
              aria-label={isFavorite ? 'Remove from favourites' : 'Add to favourites'}
            >
              <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <p className={styles.cuisine}>{store.cuisine?.join(', ') || store.description}</p>
        <div className={styles.cardBottom}>
          <span className={styles.distance}>
            <MapPin size={12} />
            {store.distanceMeters != null
              ? store.distanceMeters >= 1000
                ? ` ${(store.distanceMeters / 1000).toFixed(1)} km`
                : ` ${Math.round(store.distanceMeters)} m`
              : store.distance
                ? ` ${store.distance} km`
                : ' —'}
          </span>
          {/* Map pin button */}
          <button
            className={styles.mapPinBtn}
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
            aria-label="Show on map"
            title="Show on map"
          >
            <MapPin size={13} />
          </button>
          <span className={`${styles.pickupBadge} ${store.isOpen ? styles.open : styles.closed}`}>
            🛍️ {store.isOpen ? 'Pickup' : 'Closed'}
          </span>
        </div>
      </div>
    </article>
  );
});
