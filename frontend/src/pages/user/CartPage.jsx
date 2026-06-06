import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import api from "../../api/axios";

export default function CartPage() {
  const navigate = useNavigate();
  const { cart, setCart, clearCart } = useCartStore();

  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const fetchCart = useCallback(async () => {
    try {
      const res = await api.get("/cart");
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [setCart]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const handleUpdateQty = async (foodId, quantity) => {
    if (quantity < 1) {
      handleRemoveItem(foodId);
      return;
    }
    try {
      const res = await api.put("/cart/update", { foodId, quantity });
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveItem = async (foodId) => {
    try {
      const res = await api.delete(`/cart/remove/${foodId}`);
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearCart = async () => {
    if (!confirm("Clear entire cart?")) return;
    try {
      await api.delete("/cart/clear");
      clearCart();
    } catch (err) {
      console.error(err);
    }
  };

  const handlePlaceOrder = async () => {
    setPlacing(true);
    setError("");
    try {
      const res = await api.post("/order/place", { note });
      navigate(`/orders/${res.data.order._id}`);
    } catch (err) {
      setError(err.response?.data?.message || "Error placing order");
    } finally {
      setPlacing(false);
    }
  };

  const isEmpty = !cart || cart.items?.length === 0;

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-36">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-slate border-b border-glass-border">
        <button onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">
            arrow_back
          </span>
        </button>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
          Your Cart
        </h1>
        {!isEmpty && (
          <button onClick={handleClearCart}>
            <span className="material-symbols-outlined text-status-error text-sm">
              delete_sweep
            </span>
          </button>
        )}
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant text-body-md">
            Loading cart...
          </div>
        ) : isEmpty ? (
          // Empty state
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">
              shopping_cart
            </span>
            <h2 className="font-montserrat text-title-md text-on-surface">
              Your cart is empty
            </h2>
            <p className="text-body-md text-on-surface-variant text-center">
              Scroll through the feed and add something delicious
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary-container text-on-primary-container font-montserrat font-bold px-8 py-3 rounded-full neon-glow-red active:scale-[0.98] transition-all"
            >
              Browse Reels
            </button>
          </div>
        ) : (
          <>
            {/* Store info */}
            <div className="flex items-center gap-3 bg-surface-slate rounded-xl p-3 border border-glass-border">
              <span
                className="material-symbols-outlined text-primary"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                storefront
              </span>
              <div>
                <p className="text-label-bold text-on-surface-variant font-inter uppercase">
                  Ordering from
                </p>
                <p className="font-montserrat text-title-md text-on-surface">
                  {cart.store?.name}
                </p>
              </div>
            </div>

            {/* Items */}
            <div className="space-y-3">
              {cart.items?.map((item) => (
                <div
                  key={item.food._id}
                  className="bg-surface-slate rounded-xl p-3 flex items-center gap-3 border border-glass-border"
                >
                  {/* Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0">
                    {item.food?.image ? (
                      <img
                        src={item.food.image}
                        alt={item.food.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          restaurant
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <p className="font-inter text-body-lg text-on-surface">
                      {item.food?.name}
                    </p>
                    <p className="font-montserrat text-price-display text-primary mt-0.5">
                      ₹{item.price * item.quantity}
                    </p>
                  </div>

                  {/* Qty controls */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        handleUpdateQty(item.food._id, item.quantity - 1)
                      }
                      className="w-8 h-8 rounded-full bg-surface-container border border-glass-border flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {item.quantity === 1 ? "delete" : "remove"}
                      </span>
                    </button>
                    <span className="font-montserrat text-title-md text-on-surface w-6 text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        handleUpdateQty(item.food._id, item.quantity + 1)
                      }
                      className="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center hover:opacity-90 transition-opacity active:scale-90"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        add
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Note */}
            <div className="space-y-2">
              <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                Add a note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. No onions, extra spicy..."
                rows={2}
                className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-md text-on-surface focus:border-primary outline-none transition-all resize-none placeholder:text-on-surface-variant/50"
              />
            </div>

            {error && <p className="text-status-error text-body-md">{error}</p>}
          </>
        )}
      </main>

      {/* Checkout Bar */}
      {!isEmpty && !loading && (
        <div className="fixed bottom-0 w-full z-50 bg-surface-slate/90 backdrop-blur-xl border-t border-glass-border p-4 pb-8">
          <div className="flex justify-between items-center mb-3">
            <span className="text-body-md text-on-surface-variant font-inter">
              {cart.items?.reduce((s, i) => s + i.quantity, 0)} items
            </span>
            <span className="font-montserrat text-title-md text-on-surface">
              Total: <span className="text-primary">₹{cart.totalPrice}</span>
            </span>
          </div>
          <button
            onClick={handlePlaceOrder}
            disabled={placing}
            className="w-full bg-primary-container text-on-primary-container font-montserrat font-bold text-title-md py-4 rounded-xl neon-glow-red disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shopping_bag
            </span>
            {placing ? "Placing Order..." : "Place Order"}
          </button>
        </div>
      )}
    </div>
  );
}
