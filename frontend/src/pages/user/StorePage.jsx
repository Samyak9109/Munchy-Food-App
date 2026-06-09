import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Star, MapPin, Heart, Plus } from 'lucide-react';
import * as api from '../../api/index';
import styles from './StorePage.module.css';

export default function StorePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('All');

  const { data: storeData, isLoading } = useQuery({
    queryKey: ['store', id],
    queryFn: () => api.getStoreById(id).then(r => r.data),
  });

  const { data: menuData } = useQuery({
    queryKey: ['store-menu', id],
    queryFn: () => api.getStoreMenu(id).then(r => r.data),
  });

  const { data: favoritesData } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.getFavorites().then(r => r.data),
  });

  const isFavorite = (favoritesData?.favorites || [])
    .some(favorite => favorite.store?._id === id);

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
  const categories = ['All', ...new Set(foods.flatMap(f => f.category || []))];
  const filtered = activeCategory === 'All' ? foods : foods.filter(f => f.category?.includes(activeCategory));

  if (isLoading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero} style={{ backgroundImage: store?.image ? `url(${store.image})` : undefined }}>
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

      {/* Category tabs */}
      {categories.length > 1 && (
        <div className={styles.tabs}>
          {categories.map(cat => (
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
          : filtered.map(food => (
            <FoodItem key={food._id} food={food} onAdd={() => addToCart.mutate(food._id)} />
          ))
        }
      </div>
    </div>
  );
}

function FoodItem({ food, onAdd }) {
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
        {food.image && <img src={food.image} alt={food.name} className={styles.foodImg} />}
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
}
