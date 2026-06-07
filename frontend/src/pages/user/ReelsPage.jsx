import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bot, ShoppingCart, MapPin } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './ReelsPage.module.css';

export default function ReelsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['reels'],
    queryFn: () => api.getReels().then(r => r.data),
  });

  const reels = data?.reels || [];

  if (isLoading) return <div className={styles.loading}><span>Loading reels...</span></div>;

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.feed}>
        {reels.length === 0
          ? <EmptyState />
          : reels.map((reel) => <ReelCard key={reel._id} reel={reel} />)
        }
      </div>
    </div>
  );
}

function ReelCard({ reel }) {
  const qc = useQueryClient();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(false);
  const [localLikes, setLocalLikes] = useState(reel.likes);
  const [showComments, setShowComments] = useState(false);

  const likeMut = useMutation({
    mutationFn: () => api.toggleLike(reel._id),
    onMutate: () => {
      setLiked(v => !v);
      setLocalLikes(v => liked ? v - 1 : v + 1);
    },
  });

  const addToCart = useMutation({
    mutationFn: () => api.addToCart({ foodId: reel.food._id, quantity: 1, storeId: reel.store._id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  // Intersection observer to auto-play/pause
  useEffect(() => {
    if (!videoRef.current) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) videoRef.current?.play().catch(() => {});
        else videoRef.current?.pause();
      },
      { threshold: 0.6 }
    );
    obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);

  const food = reel.food || {};
  const store = reel.store || {};

  return (
    <div className={styles.reel}>
      {/* Video / Image background */}
      {reel.video ? (
        <video
          ref={videoRef}
          className={styles.media}
          src={reel.video}
          loop
          muted
          playsInline
        />
      ) : (
        <div
          className={styles.media}
          style={{ background: `url(${food.image}) center/cover no-repeat` }}
        />
      )}

      {/* Gradient overlay */}
      <div className={styles.overlay} />

      {/* Right actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          onClick={() => likeMut.mutate()}
        >
          <Heart size={26} fill={liked ? 'currentColor' : 'none'} />
          <span>{formatCount(localLikes)}</span>
        </button>

        <button className={styles.actionBtn} onClick={() => setShowComments(true)}>
          <MessageCircle size={26} />
          <span>{formatCount(reel.commentsCount || 0)}</span>
        </button>

        <Link to="/chatbot" className={styles.actionBtn} style={{ color: 'var(--yellow)' }}>
          <Bot size={26} />
          <span>Mood</span>
        </Link>
      </div>

      {/* Bottom info */}
      <div className={styles.info}>
        <span className={styles.pickup}>
          <MapPin size={12} /> SELF-PICKUP ONLY
        </span>
        <p className={styles.storeName}>@{store.name || 'Kitchen'}</p>
        <h2 className={styles.foodName}>{food.name}</h2>
        <p className={styles.price}>₹{food.price}</p>
        {reel.caption && <p className={styles.caption}>{reel.caption}</p>}

        <button
          className={styles.addBtn}
          onClick={() => addToCart.mutate()}
          disabled={addToCart.isPending}
        >
          <ShoppingCart size={16} />
          QUICK ADD
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className={styles.empty}>
      <p>No reels yet.</p>
      <p>Check back soon 🍔</p>
    </div>
  );
}

function formatCount(n) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
