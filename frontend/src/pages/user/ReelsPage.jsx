import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Bot, ShoppingCart, MapPin, Send, X } from 'lucide-react';
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
  const [comment, setComment] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['reel-comments', reel._id],
    queryFn: () => api.getComments(reel._id).then(r => r.data),
    enabled: showComments,
  });

  const likeMut = useMutation({
    mutationFn: () => api.toggleLike(reel._id),
    onMutate: () => {
      setLiked(v => !v);
      setLocalLikes(v => liked ? v - 1 : v + 1);
    },
  });

  const addToCart = useMutation({
    mutationFn: () => api.addToCart({ foodId: reel.food._id, quantity: 1, storeId: reel.store._id }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
      setCartMessage('Added to cart');
      window.setTimeout(() => setCartMessage(''), 1800);
    },
    onError: (error) => {
      setCartMessage(error.response?.data?.message || 'Could not add item');
    },
  });

  const addComment = useMutation({
    mutationFn: () => api.addComment(reel._id, { text: comment.trim() }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['reel-comments', reel._id] });
      qc.invalidateQueries({ queryKey: ['reels'] });
    },
  });

  // Intersection observer to auto-play/pause + increment views
  useEffect(() => {
    if (!videoRef.current) return;
    let viewTracked = false;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          videoRef.current?.play().catch(() => {});
          // Count each view once per mount
          if (!viewTracked) {
            viewTracked = true;
            api.incrementViews(reel._id).catch(() => {});
          }
        } else {
          videoRef.current?.pause();
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, [reel._id]);

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
          disabled={addToCart.isPending || !food._id || !store._id}
        >
          <ShoppingCart size={16} />
          {addToCart.isPending ? 'ADDING...' : 'QUICK ADD'}
        </button>
        {cartMessage && <p className={styles.actionMessage}>{cartMessage}</p>}
      </div>

      {showComments && (
        <div className={styles.commentsBackdrop} onClick={() => setShowComments(false)}>
          <section className={styles.commentsSheet} onClick={event => event.stopPropagation()}>
            <div className={styles.commentsHeader}>
              <h3>Comments</h3>
              <button onClick={() => setShowComments(false)} aria-label="Close comments">
                <X size={20} />
              </button>
            </div>

            <div className={styles.commentsList}>
              {commentsLoading && <p className={styles.commentDim}>Loading comments...</p>}
              {!commentsLoading && (commentsData?.comments || []).length === 0 && (
                <p className={styles.commentDim}>Be the first to comment.</p>
              )}
              {(commentsData?.comments || []).map(item => (
                <div key={item._id} className={styles.commentRow}>
                  <div className={styles.commentAvatar}>
                    {item.user?.avatar
                      ? <img src={item.user.avatar} alt="" />
                      : item.user?.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className={styles.commentName}>{item.user?.name || 'User'}</p>
                    <p className={styles.commentText}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {addComment.error && (
              <p className={styles.commentError}>
                {addComment.error.response?.data?.message || 'Could not add comment'}
              </p>
            )}
            <form
              className={styles.commentForm}
              onSubmit={event => {
                event.preventDefault();
                if (comment.trim()) addComment.mutate();
              }}
            >
              <input
                value={comment}
                onChange={event => setComment(event.target.value)}
                placeholder="Add a comment..."
                maxLength={300}
              />
              <button disabled={!comment.trim() || addComment.isPending} aria-label="Post comment">
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      )}
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
