import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Star, MapPin, SlidersHorizontal } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './KitchensPage.module.css';

export default function KitchensPage() {
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['stores'],
    queryFn: () => api.getStores().then(r => r.data),
  });

  const stores = (data?.stores || []).filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

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
          <button className={styles.filterBtn}><SlidersHorizontal size={18} /></button>
        </div>

        <div className={styles.listHeader}>
          <h2>Nearby Kitchens</h2>
          <span>{stores.length} PLACES</span>
        </div>

        {isLoading
          ? <p className={styles.dim}>Loading...</p>
          : stores.length === 0
            ? <p className={styles.dim}>No kitchens found.</p>
            : stores.map(store => <StoreCard key={store._id} store={store} />)
        }
      </div>
    </div>
  );
}

function StoreCard({ store }) {
  return (
    <Link to={`/store/${store._id}`} className={styles.card}>
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
          <span className={styles.rating}>
            <Star size={12} fill="currentColor" /> {store.rating?.average?.toFixed(1) || '—'}
          </span>
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
    </Link>
  );
}
