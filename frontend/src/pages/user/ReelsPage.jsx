import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

export default function ReelsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { cart, setCart } = useCartStore();

  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [likedReels, setLikedReels] = useState(new Set());
  const [addingToCart, setAddingToCart] = useState(null);
  const [toast, setToast] = useState(null);
  const containerRef = useRef(null);
  const videoRefs = useRef({});

  useEffect(() => {
    fetchReels();
  }, []);

  const fetchReels = async () => {
    try {
      const res = await api.get("/food");
      // combine food items + reels into one feed
      const feedItems = res.data.foodItems || [];
      setReels(feedItems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleLike = async (reelId) => {
    try {
      await api.post(`/reel/${reelId}/like`);
      setLikedReels((prev) => {
        const next = new Set(prev);
        next.has(reelId) ? next.delete(reelId) : next.add(reelId);
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (food) => {
    setAddingToCart(food._id);
    try {
      const res = await api.post("/cart/add", {
        foodId: food._id,
        quantity: 1,
      });
      setCart(res.data.cart);
      showToast(`${food.name} added to cart!`);
    } catch (err) {
      const msg = err.response?.data?.message || "Error adding to cart";
      if (msg.includes("different stores")) {
        showToast("Clear cart to order from a new restaurant", "error");
      } else {
        showToast(msg, "error");
      }
    } finally {
      setAddingToCart(null);
    }
  };

  // pause/play videos on scroll
  const handleScroll = () => {
    if (!containerRef.current) return;
    const scrollTop = containerRef.current.scrollTop;
    const height = containerRef.current.clientHeight;
    const index = Math.round(scrollTop / height);
    setCurrentIndex(index);

    // pause all, play current
    Object.entries(videoRefs.current).forEach(([i, ref]) => {
      if (!ref) return;
      if (parseInt(i) === index) {
        ref.play?.().catch(() => {});
      } else {
        ref.pause?.();
      }
    });

    // increment view count
    if (reels[index]?._id) {
      api.patch(`/reel/${reels[index]._id}/view`).catch(() => {});
    }
  };

  const cartItemCount =
    cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
            movie
          </span>
          <p className="text-on-surface-variant text-body-md">
            Loading feed...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <span
          className="material-symbols-outlined text-on-surface pointer-events-auto cursor-pointer hover:text-primary transition-colors"
          style={{ fontVariationSettings: "'FILL' 0" }}
        >
          location_on
        </span>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary tracking-tight">
          Munchy
        </h1>
        <button
          onClick={() => navigate("/profile")}
          className="pointer-events-auto"
        >
          <span className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">
            account_circle
          </span>
        </button>
      </header>

      {/* Reel Feed */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full w-full snap-y snap-mandatory overflow-y-scroll"
        style={{ scrollbarWidth: "none" }}
      >
        {reels.length === 0 ? (
          <div className="h-dvh flex items-center justify-center">
            <p className="text-on-surface-variant text-body-md">No reels yet</p>
          </div>
        ) : (
          reels.map((food, index) => (
            <article
              key={food._id}
              className="relative h-dvh w-full snap-start shrink-0 flex flex-col justify-end"
            >
              {/* Video or Image background */}
              {food.video ? (
                <video
                  ref={(el) => (videoRefs.current[index] = el)}
                  src={food.video}
                  className="absolute inset-0 w-full h-full object-cover"
                  loop
                  muted
                  playsInline
                  autoPlay={index === 0}
                />
              ) : (
                <img
                  src={food.image}
                  alt={food.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}

              {/* Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

              {/* Content */}
              <div className="relative z-10 px-4 pb-24 flex justify-between items-end w-full">
                {/* Left — Info */}
                <div className="flex flex-col gap-stack-sm max-w-[75%]">
                  {/* Pickup tag */}
                  <div className="inline-flex items-center gap-1 bg-secondary-container text-on-secondary-container px-3 py-1.5 rounded-full w-max neon-glow-yellow">
                    <span
                      className="material-symbols-outlined text-[14px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      location_on
                    </span>
                    <span className="text-label-bold font-inter uppercase">
                      Self-Pickup only
                    </span>
                  </div>

                  {/* Store name */}
                  <span className="text-body-md text-on-surface/80 font-inter">
                    @{food.store?.name || food.foodPartner?.name || "Kitchen"}
                  </span>

                  {/* Food name */}
                  <h2 className="font-montserrat text-headline-lg-mobile text-white drop-shadow-md">
                    {food.name}
                  </h2>

                  {/* Price */}
                  <span className="font-montserrat text-price-display text-secondary-container mt-1">
                    ₹{food.price}
                  </span>

                  {/* Description */}
                  <p className="text-body-md text-on-surface-variant line-clamp-2 mt-1">
                    {food.description}
                  </p>

                  {/* Add to cart */}
                  <button
                    onClick={() => handleAddToCart(food)}
                    disabled={addingToCart === food._id}
                    className="mt-stack-sm bg-primary text-on-primary font-inter font-bold text-label-bold rounded-full px-6 py-3 w-max flex items-center gap-2 neon-glow-red active:scale-95 transition-all disabled:opacity-70"
                  >
                    <span
                      className="material-symbols-outlined text-[18px]"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      add_shopping_cart
                    </span>
                    {addingToCart === food._id ? "Adding..." : "QUICK ADD"}
                  </button>
                </div>

                {/* Right — Actions */}
                <div className="flex flex-col gap-stack-lg items-center pb-8">
                  {/* Like */}
                  <button
                    onClick={() => handleLike(food._id)}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-surface/40 backdrop-blur-md border border-glass-border flex items-center justify-center group-active:scale-90 transition-transform">
                      <span
                        className={`material-symbols-outlined transition-colors ${
                          likedReels.has(food._id)
                            ? "text-primary"
                            : "text-white"
                        }`}
                        style={{
                          fontVariationSettings: likedReels.has(food._id)
                            ? "'FILL' 1"
                            : "'FILL' 0",
                        }}
                      >
                        favorite
                      </span>
                    </div>
                    <span className="text-[10px] text-white font-bold font-inter">
                      {(food.ratings?.count || 0) +
                        (likedReels.has(food._id) ? 1 : 0)}
                    </span>
                  </button>

                  {/* Comment */}
                  <button className="group flex flex-col items-center gap-1">
                    <div className="w-12 h-12 rounded-full bg-surface/40 backdrop-blur-md border border-glass-border flex items-center justify-center group-active:scale-90 transition-transform">
                      <span
                        className="material-symbols-outlined text-white group-hover:text-tertiary transition-colors"
                        style={{ fontVariationSettings: "'FILL' 0" }}
                      >
                        chat_bubble
                      </span>
                    </div>
                    <span className="text-[10px] text-white font-bold font-inter">
                      {food.comments || 0}
                    </span>
                  </button>

                  {/* AI Chatbot */}
                  <button
                    onClick={() => navigate("/chat")}
                    className="group flex flex-col items-center gap-1"
                  >
                    <div className="w-12 h-12 rounded-full bg-secondary-container/20 backdrop-blur-md border border-secondary-container/50 flex items-center justify-center neon-glow-yellow group-active:scale-90 transition-transform">
                      <span
                        className="material-symbols-outlined text-secondary-container"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        smart_toy
                      </span>
                    </div>
                    <span className="text-[10px] text-secondary-container font-bold font-inter">
                      Mood
                    </span>
                  </button>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-label-bold font-inter flex items-center gap-2 transition-all ${
            toast.type === "error"
              ? "bg-status-error/90 text-white"
              : "bg-status-success/90 text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[16px]">
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          {toast.message}
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-glass-border">
        {[
          { icon: "movie", label: "Feed", path: "/", active: true },
          {
            icon: "explore",
            label: "Explore",
            path: "/explore",
            active: false,
          },
          { icon: "smart_toy", label: "AI", path: "/chat", active: false },
          {
            icon: "shopping_cart",
            label: "Cart",
            path: "/cart",
            active: false,
            badge: cartItemCount,
          },
          {
            icon: "receipt_long",
            label: "Orders",
            path: "/orders",
            active: false,
          },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 relative transition-all active:scale-90 ${
              item.active
                ? "text-primary"
                : "text-on-surface-variant hover:text-primary"
            }`}
          >
            {item.active ? (
              <div className="bg-primary-container/20 rounded-full p-2">
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {item.icon}
                </span>
              </div>
            ) : (
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 0" }}
              >
                {item.icon}
              </span>
            )}
            {item.badge > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </nav>
    </div>
  );
}
