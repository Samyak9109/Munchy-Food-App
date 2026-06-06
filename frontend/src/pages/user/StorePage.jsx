import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import api from "../../api/axios";

export default function StorePage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { setCart } = useCartStore();

  const [store, setStore] = useState(null);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("all");
  const [addingToCart, setAddingToCart] = useState(null);
  const [toast, setToast] = useState(null);

  const fetchStore = useCallback(async () => {
    try {
      const res = await api.get(`/store/${id}/menu`);
      setStore(res.data.store);
      setMenu(res.data.menu || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchStore();
  }, [fetchStore]);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const handleAddToCart = async (food) => {
    setAddingToCart(food._id);
    try {
      const res = await api.post("/cart/add", {
        foodId: food._id,
        quantity: 1,
      });
      setCart(res.data.cart);
      showToast(`${food.name} added!`);
    } catch (err) {
      const msg = err.response?.data?.message || "Error adding to cart";
      showToast(
        msg.includes("different stores")
          ? "Clear cart to order from here"
          : msg,
        "error",
      );
    } finally {
      setAddingToCart(null);
    }
  };

  // get unique categories from menu
  const categories = ["all", ...new Set(menu.flatMap((f) => f.category || []))];

  const filteredMenu =
    activeCategory === "all"
      ? menu
      : menu.filter((f) => f.category?.includes(activeCategory));

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
          storefront
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-28">
      {/* Hero */}
      <div className="relative w-full h-52">
        {store?.image ? (
          <img
            src={store.image}
            alt={store.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-surface-variant flex items-center justify-center">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">
              storefront
            </span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-10 h-10 rounded-full bg-surface/60 backdrop-blur-md flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-on-surface">
            arrow_back
          </span>
        </button>
      </div>

      <main className="px-4 max-w-2xl mx-auto space-y-4 -mt-6 relative z-10">
        {/* Store Info Card */}
        <div className="bg-surface-slate rounded-xl p-4 border border-glass-border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="font-montserrat text-title-md text-on-surface">
                {store?.name}
              </h1>
              <p className="text-body-md text-on-surface-variant mt-1 line-clamp-2">
                {store?.description}
              </p>
            </div>
            <div
              className={`px-3 py-1 rounded-full text-label-bold font-inter border ${
                store?.isOpen
                  ? "text-status-success bg-status-success/10 border-status-success/30"
                  : "text-status-error bg-status-error/10 border-status-error/30"
              }`}
            >
              {store?.isOpen ? "Open" : "Closed"}
            </div>
          </div>

          <div className="flex items-center gap-4 mt-3">
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className="material-symbols-outlined text-secondary-container text-sm"
                  style={{
                    fontVariationSettings:
                      star <= Math.round(store?.rating?.average || 0)
                        ? "'FILL' 1"
                        : "'FILL' 0",
                  }}
                >
                  star
                </span>
              ))}
              <span className="text-label-bold text-on-surface-variant font-inter ml-1">
                {store?.rating?.average?.toFixed(1) || "New"} (
                {store?.rating?.count || 0})
              </span>
            </div>
            <div className="flex items-center gap-1 text-on-surface-variant text-label-bold font-inter">
              <span className="material-symbols-outlined text-[16px]">
                schedule
              </span>
              {store?.timing?.open} – {store?.timing?.close}
            </div>
          </div>

          {store?.cuisine?.length > 0 && (
            <div className="flex gap-2 flex-wrap mt-3">
              {store.cuisine.map((c) => (
                <span
                  key={c}
                  className="bg-surface-container border border-glass-border text-on-surface-variant text-label-bold font-inter px-2 py-1 rounded-full capitalize"
                >
                  {c}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-2 rounded-full text-label-bold font-inter capitalize transition-all ${
                activeCategory === cat
                  ? "bg-primary-container text-on-primary-container neon-glow-red"
                  : "bg-surface-container border border-glass-border text-on-surface-variant hover:text-primary"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Menu */}
        <div className="space-y-3 pb-4">
          {filteredMenu.length === 0 ? (
            <div className="text-center py-8 text-on-surface-variant text-body-md">
              No items in this category
            </div>
          ) : (
            filteredMenu.map((food) => (
              <div
                key={food._id}
                className={`bg-surface-slate rounded-xl p-3 flex gap-3 border border-glass-border transition-opacity ${
                  !food.isAvailable ? "opacity-50" : ""
                }`}
              >
                {/* Image */}
                <div className="w-20 h-20 rounded-lg overflow-hidden shrink-0 relative">
                  {food.image ? (
                    <img
                      src={food.image}
                      alt={food.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                      <span className="material-symbols-outlined text-on-surface-variant">
                        restaurant
                      </span>
                    </div>
                  )}
                  {food.video && (
                    <div className="absolute bottom-1 left-1 w-5 h-5 rounded-full bg-surface/60 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[12px] text-tertiary">
                        play_arrow
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <p className="font-inter text-body-lg text-on-surface font-bold">
                      {food.name}
                    </p>
                    <p className="text-body-md text-on-surface-variant line-clamp-2 mt-0.5">
                      {food.description}
                    </p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-montserrat text-price-display text-primary">
                      ₹{food.price}
                    </span>
                    {food.isAvailable ? (
                      <button
                        onClick={() => handleAddToCart(food)}
                        disabled={addingToCart === food._id}
                        className="w-8 h-8 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-70"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {addingToCart === food._id
                            ? "hourglass_empty"
                            : "add"}
                        </span>
                      </button>
                    ) : (
                      <span className="text-label-bold text-status-error font-inter">
                        Unavailable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-label-bold font-inter flex items-center gap-2 ${
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
          { icon: "movie", path: "/", active: false },
          { icon: "explore", path: "/explore", active: true },
          { icon: "smart_toy", path: "/chat", active: false },
          { icon: "shopping_cart", path: "/cart", active: false },
          { icon: "receipt_long", path: "/orders", active: false },
        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-1 p-2 transition-all active:scale-90 ${
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
          </button>
        ))}
      </nav>
    </div>
  );
}
