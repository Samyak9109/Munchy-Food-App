import { useState, useEffect, useRef, memo } from 'react';
import { Heart, MessageCircle, ShoppingCart, MapPin, Send, X } from 'lucide-react';
import { useInfiniteQuery, useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import { img } from '../../lib/img';
import useToastStore from '../../store/toastStore';
import styles from './ReelsPage.module.css';

export default function ReelsPage() {
  const [activeIndex, setActiveIndex] = useState(0);
  const feedRef = useRef(null);
  const viewedReelsRef = useRef(new Set());

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
  } = useInfiniteQuery({
    queryKey: ['reels'],
    queryFn: ({ pageParam = null }) =>
      api.getReels({ cursor: pageParam, limit: 5 }).then((r) => r.data),
    getNextPageParam: (lastPage) => lastPage?.nextCursor || undefined,
    initialPageParam: null,
  });

  const reels = data?.pages.flatMap((page) => page?.reels || []) || [];

  // Single shared IntersectionObserver tracking active reel and trigger prefetch
  useEffect(() => {
    const feed = feedRef.current;
    if (!feed) return;

    const cards = feed.querySelectorAll('[data-reel-index]');
    if (!cards.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
            const index = Number(entry.target.getAttribute('data-reel-index'));
            if (!isNaN(index)) {
              setActiveIndex(index);

              const reelId = entry.target.getAttribute('data-reel-id');
              if (reelId && !viewedReelsRef.current.has(reelId)) {
                viewedReelsRef.current.add(reelId);
                api.incrementViews(reelId).catch(() => {});
              }

              if (index >= reels.length - 2 && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }
          }
        }
      },
      {
        root: feed,
        threshold: 0.6,
      },
    );

    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
  }, [reels.length, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Pause on document hidden / tab switch
  useEffect(() => {
    const handleVisibility = () => {
      const activeVideo = document.querySelector(`.${styles.activeReel} video`);
      if (document.hidden) {
        activeVideo?.pause();
      } else {
        activeVideo?.play().catch(() => {});
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (isLoading) {
    return (
      <div className={styles.loading}>
        <span>Loading reels...</span>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header />
      <div className={styles.feed} ref={feedRef}>
        {reels.length === 0 ? (
          <EmptyState />
        ) : (
          reels.map((reel, index) => {
            const distance = Math.abs(index - activeIndex);
            const shouldMountVideo = distance <= 1;
            const isActive = index === activeIndex;

            return (
              <ReelCard
                key={reel._id}
                reel={reel}
                index={index}
                isActive={isActive}
                shouldMountVideo={shouldMountVideo}
              />
            );
          })
        )}
        {isFetchingNextPage && (
          <div className={styles.loadingSentinel}>
            <span>Loading more reels...</span>
          </div>
        )}
      </div>
    </div>
  );
}

const ReelCard = memo(function ReelCard({
  reel,
  index,
  isActive,
  shouldMountVideo,
}) {
  const qc = useQueryClient();
  const videoRef = useRef(null);
  const [liked, setLiked] = useState(Boolean(reel.likedByMe));
  const [localLikes, setLocalLikes] = useState(reel.likes || 0);
  const [showComments, setShowComments] = useState(false);
  const [comment, setComment] = useState('');
  const [cartMessage, setCartMessage] = useState('');

  const food = reel.food || {};
  const store = reel.store || {};
  const posterUrl = img(food.image || reel.video, { w: 480, h: 854, q: 75 });

  // Play/pause based on active state
  useEffect(() => {
    if (!videoRef.current) return;
    if (isActive) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isActive, shouldMountVideo]);

  const { data: commentsData, isLoading: commentsLoading } = useQuery({
    queryKey: ['reel-comments', reel._id],
    queryFn: () => api.getComments(reel._id).then((r) => r.data),
    enabled: showComments,
  });

  const likeMut = useMutation({
    mutationFn: () => api.toggleLike(reel._id),
    onMutate: () => {
      const prevLiked = liked;
      const prevLikes = localLikes;
      setLiked(!prevLiked);
      setLocalLikes((prev) => (prevLiked ? Math.max(0, prev - 1) : prev + 1));
      return { prevLiked, prevLikes };
    },
    onSuccess: (res) => {
      if (res?.data && typeof res.data.liked === 'boolean') {
        setLiked(res.data.liked);
        if (typeof res.data.likes === 'number') {
          setLocalLikes(res.data.likes);
        }
      }
    },
    onError: (err, _vars, context) => {
      if (context) {
        setLiked(context.prevLiked);
        setLocalLikes(context.prevLikes);
      }
      useToastStore.getState().error(
        err?.response?.data?.message || 'Could not update like. Please sign in as a customer.'
      );
    },
  });

  const addToCart = useMutation({
    mutationFn: () =>
      api.addToCart({
        foodId: food._id,
        quantity: 1,
        storeId: store._id,
      }),
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

  return (
    <div
      className={`${styles.reel} ${isActive ? styles.activeReel : ''}`}
      data-reel-index={index}
      data-reel-id={reel._id}
    >
      {/* Mount <video> ONLY for active index ±1. Others render lightweight poster <img> */}
      {shouldMountVideo && reel.video ? (
        <video
          ref={videoRef}
          className={styles.media}
          src={reel.video}
          poster={posterUrl}
          preload={isActive ? 'auto' : 'metadata'}
          loop
          muted
          playsInline
        />
      ) : (
        <img
          src={posterUrl}
          alt={food.name || 'Reel media'}
          className={styles.posterImage}
          loading="lazy"
          decoding="async"
        />
      )}

      {/* Scrim gradient overlay (no heavy backdrop-filter) */}
      <div className={styles.overlay} />

      {/* Right actions */}
      <div className={styles.actions}>
        <button
          className={`${styles.actionBtn} ${liked ? styles.liked : ''}`}
          onClick={() => likeMut.mutate()}
          aria-label="Like reel"
        >
          <Heart size={26} fill={liked ? 'currentColor' : 'none'} />
          <span>{formatCount(localLikes)}</span>
        </button>

        <button
          className={styles.actionBtn}
          onClick={() => setShowComments(true)}
          aria-label="Open comments"
        >
          <MessageCircle size={26} />
          <span>{formatCount(reel.commentsCount || 0)}</span>
        </button>
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

      {/* Comments sheet */}
      {showComments && (
        <div
          className={styles.commentsBackdrop}
          onClick={() => setShowComments(false)}
        >
          <section
            className={styles.commentsSheet}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.commentsHeader}>
              <h3>Comments</h3>
              <button
                onClick={() => setShowComments(false)}
                aria-label="Close comments"
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.commentsList}>
              {commentsLoading && (
                <p className={styles.commentDim}>Loading comments...</p>
              )}
              {!commentsLoading &&
                (commentsData?.comments || []).length === 0 && (
                  <p className={styles.commentDim}>Be the first to comment.</p>
                )}
              {(commentsData?.comments || []).map((item) => (
                <div key={item._id} className={styles.commentRow}>
                  <div className={styles.commentAvatar}>
                    {item.user?.avatar ? (
                      <img
                        src={img(item.user.avatar, { w: 64, h: 64, q: 75 })}
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width={32}
                        height={32}
                      />
                    ) : (
                      item.user?.name?.[0]?.toUpperCase() || '?'
                    )}
                  </div>
                  <div>
                    <p className={styles.commentName}>
                      {item.user?.name || 'User'}
                    </p>
                    <p className={styles.commentText}>{item.text}</p>
                  </div>
                </div>
              ))}
            </div>

            {addComment.error && (
              <p className={styles.commentError}>
                {addComment.error.response?.data?.message ||
                  'Could not add comment'}
              </p>
            )}
            <form
              className={styles.commentForm}
              onSubmit={(e) => {
                e.preventDefault();
                if (comment.trim()) addComment.mutate();
              }}
            >
              <input
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                maxLength={300}
              />
              <button
                disabled={!comment.trim() || addComment.isPending}
                aria-label="Post comment"
              >
                <Send size={18} />
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  );
});

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
