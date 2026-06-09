import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Search, Star, MapPin, SlidersHorizontal, Heart } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './KitchensPage.module.css';

export default function KitchensPage() {
  const [search, setSearch] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ openOnly: false, topRated: false, favoritesOnly: false });
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getStores().then(r => r.data),
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites().then(r => r.data),
  });

  const favoriteIds = new Set(
    (favoritesData?.favorites || []).map(favorite => favorite.store?._id).filter(Boolean)
  );

  const favoriteMut = useMutation({
    mutationFn: storeId => api.toggleFavorite(storeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorites'] }),
  });

  const stores = (data?.stores || []).filter(store => {
    const matchesSearch = store.name.toLowerCase().includes(search.toLowerCase())
      || store.cuisine?.some(item => item.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (filters.openOnly && !store.isOpen) return false;
    if (filters.topRated && (store.rating?.average || 0) < 4) return false;
    if (filters.favoritesOnly && !favoriteIds.has(store._id)) return false;
    return true;
  });

  return (
    <div className={styles.page}>
      <Header />

      {/* Dark map placeholder */}
      <div className={styles.mapArea}>
        <div className={styles.mapGrid} />
        <div className={styles.mapPins}>
          {stores.slice(0, 3).map((s, i) => (
            <div
              key={s._id}
              className={`${styles.pin} ${i === 2 ? styles.pinYellow : ''}`}
              style={{ left: `${20 + i * 30}%`, top: `${30 + (i % 2) * 20}%` }}
            >
              {s.name}
            </div>
          ))}
        </div>
        <div className={styles.mapHandle} />
      </div>

      {/* List */}
      <div className={styles.list}>
        <div className={styles.searchRow}>
          <div className={styles.searchWrap}>
            <Search size={16} className={styles.searchIcon} />
            <input
              className={styles.searchInput}
              placeholder="Search for nearby cravings..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button
            className={`${styles.filterBtn} ${showFilters ? styles.filterBtnActive : ''}`}
            onClick={() => setShowFilters(value => !value)}
            aria-expanded={showFilters}
            aria-label="Filter kitchens"
          >
            <SlidersHorizontal size={18} />
          </button>
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
                onClick={() => setFilters(current => ({ ...current, [key]: !current[key] }))}
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

        <div className={styles.listHeader}>
          <h2>Nearby Kitchens</h2>
          <span>{stores.length} PLACES</span>
        </div>

        {isLoading
          ? <p className={styles.dim}>Loading...</p>
          : stores.length === 0
            ? <p className={styles.dim}>No kitchens found.</p>
            : stores.map(store => (
              <StoreCard
                key={store._id}
                store={store}
                isFavorite={favoriteIds.has(store._id)}
                onToggleFavorite={() => favoriteMut.mutate(store._id)}
              />
            ))
        }
      </div>
    </div>
  );
}

function StoreCard({ store, isFavorite, onToggleFavorite }) {
  const navigate = useNavigate();

  return (
    <article
      className={styles.card}
      onClick={() => navigate(`/store/${store._id}`)}
      onKeyDown={event => {
        if (event.key === 'Enter' || event.key === ' ') navigate(`/store/${store._id}`);
      }}
      role="link"
      tabIndex={0}
    >
      <div className={styles.thumb}>
        {store.image
          ? <img src={store.image} alt={store.name} />
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
              onClick={event => {
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
            <MapPin size={12} /> {store.distance ? `${store.distance} km` : '—'}
          </span>
          <span className={`${styles.pickupBadge} ${store.isOpen ? styles.open : styles.closed}`}>
            🛍️ {store.isOpen ? 'Pickup' : 'Closed'}
          </span>
        </div>
      </div>
    </article>
  );
}
