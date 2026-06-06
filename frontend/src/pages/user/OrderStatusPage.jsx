import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

const STATUS_STEPS = ["placed", "confirmed", "ready", "pickedup"];

const STATUS_CONFIG = {
  placed: {
    label: "Order Placed",
    desc: "Waiting for restaurant to confirm",
    icon: "receipt_long",
    color: "text-secondary-fixed",
    border: "border-secondary-fixed",
    glow: "shadow-[0_0_20px_rgba(255,225,109,0.2)]",
  },
  confirmed: {
    label: "Order Confirmed",
    desc: "Restaurant is preparing your food",
    icon: "restaurant",
    color: "text-tertiary",
    border: "border-tertiary",
    glow: "shadow-[0_0_20px_rgba(96,218,196,0.2)]",
  },
  ready: {
    label: "Ready for Pickup",
    desc: "Your food is ready! Head to the restaurant",
    icon: "timer",
    color: "text-secondary-fixed",
    border: "border-secondary-fixed",
    glow: "shadow-[0_0_20px_rgba(255,225,109,0.3)]",
  },
  pickedup: {
    label: "Picked Up",
    desc: "Enjoy your meal! 🎉",
    icon: "check_circle",
    color: "text-status-success",
    border: "border-status-success",
    glow: "shadow-[0_0_20px_rgba(0,200,83,0.2)]",
  },
  cancelled: {
    label: "Cancelled",
    desc: "This order has been cancelled",
    icon: "cancel",
    color: "text-status-error",
    border: "border-status-error",
    glow: "shadow-[0_0_20px_rgba(255,61,0,0.2)]",
  },
};

export default function OrderStatusPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/order/${id}`);
      setOrder(res.data.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
    // poll every 30 seconds for status updates
    const interval = setInterval(fetchOrder, 30000);
    return () => clearInterval(interval);
  }, [fetchOrder]);

  const handleGetDirections = async () => {
    if (!order?.store) return;
    navigator.geolocation?.getCurrentPosition(async (pos) => {
      try {
        const res = await api.get(
          `/map/directions/${order.store._id}?userLat=${pos.coords.latitude}&userLng=${pos.coords.longitude}`,
        );
        const { distance, duration } = res.data.directions;
        alert(`Distance: ${distance}km\nEstimated: ${duration} minutes`);
      } catch (err) {
        console.error(err);
      }
    });
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
          receipt_long
        </span>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center gap-4">
        <span className="material-symbols-outlined text-4xl text-on-surface-variant">
          error
        </span>
        <p className="text-on-surface-variant text-body-md">Order not found</p>
        <button
          onClick={() => navigate("/orders")}
          className="text-primary text-body-md hover:opacity-80"
        >
          View all orders
        </button>
      </div>
    );
  }

  const config = STATUS_CONFIG[order.status] || STATUS_CONFIG.placed;
  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const otp = order.otp; // raw OTP not exposed — shown via email

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-28">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-slate shadow-sm">
        <button onClick={() => navigate("/orders")}>
          <span className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">
            arrow_back
          </span>
        </button>
        <h2 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
          Order #{order._id.slice(-4).toUpperCase()}
        </h2>
        <div className="w-6" />
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
        {/* Map Hero */}
        <div className="relative w-full h-[200px] bg-surface-variant rounded-xl overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              map
            </span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

          {/* Status badge */}
          <div className="absolute bottom-4 left-4 right-4 flex justify-center">
            <div
              className={`flex items-center gap-2 bg-surface-container/80 backdrop-blur-xl border ${config.border}/40 rounded-full px-5 py-2.5 ${config.glow}`}
            >
              <span
                className={`material-symbols-outlined ${config.color} animate-pulse`}
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                {config.icon}
              </span>
              <h2
                className={`font-montserrat text-[18px] font-bold ${config.color} uppercase tracking-wide`}
              >
                {config.label}
              </h2>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        {order.status !== "cancelled" && (
          <div className="glass-panel rounded-xl p-4">
            <div className="flex items-center justify-between">
              {STATUS_STEPS.map((step, i) => {
                const done = i <= currentStepIndex;
                const current = i === currentStepIndex;
                return (
                  <div key={step} className="flex items-center flex-1">
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                          done
                            ? "bg-secondary-container text-on-secondary neon-glow-yellow"
                            : "bg-surface-container border border-glass-border text-on-surface-variant"
                        } ${current ? "scale-110" : ""}`}
                      >
                        <span
                          className="material-symbols-outlined text-[16px]"
                          style={{
                            fontVariationSettings: done
                              ? "'FILL' 1"
                              : "'FILL' 0",
                          }}
                        >
                          {STATUS_CONFIG[step]?.icon}
                        </span>
                      </div>
                      <span
                        className={`text-[9px] font-inter font-bold text-center capitalize ${
                          done
                            ? "text-secondary-container"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div
                        className={`flex-1 h-0.5 mx-1 mb-4 transition-all ${
                          i < currentStepIndex
                            ? "bg-secondary-container"
                            : "bg-surface-container"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Status Banner */}
        <div
          className={`glass-panel rounded-xl p-4 flex items-center justify-between border-l-4 ${config.border}`}
        >
          <div>
            <h3 className={`font-montserrat text-title-md ${config.color}`}>
              {config.label}
            </h3>
            <p className="text-body-md text-on-surface-variant mt-1">
              {config.desc}
            </p>
          </div>
          <div className={`bg-surface-container p-3 rounded-full`}>
            <span
              className={`material-symbols-outlined ${config.color} text-3xl`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              {config.icon}
            </span>
          </div>
        </div>

        {/* OTP Display — only when ready */}
        {order.status === "ready" && (
          <div className="glass-panel rounded-xl p-6 text-center border border-primary/20 relative overflow-hidden">
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <h3 className="font-montserrat text-title-md text-on-surface">
                Show this at the counter
              </h3>
              <p className="text-body-md text-on-surface-variant">
                Your pickup OTP was sent to your email
              </p>
              <div className="flex gap-2 w-full justify-center">
                {["•", "•", "•", "–", "•", "•", "•"].map((char, i) =>
                  char === "–" ? (
                    <div
                      key={i}
                      className="w-4 flex items-center justify-center"
                    />
                  ) : (
                    <div
                      key={i}
                      className="w-12 h-16 bg-surface-container flex items-center justify-center rounded-lg border border-glass-border border-b-[3px] border-b-secondary-fixed shadow-inner"
                    >
                      <span className="text-[32px] leading-none text-on-surface font-bold font-montserrat">
                        {char}
                      </span>
                    </div>
                  ),
                )}
              </div>
              <p className="text-label-bold text-on-surface-variant font-inter">
                Check your email for the 6-digit code
              </p>
            </div>
          </div>
        )}

        {/* Store Info */}
        {order.store && (
          <div
            className="flex items-center gap-4 bg-surface-container/50 rounded-xl p-4 border border-glass-border cursor-pointer hover:bg-surface-container transition-colors"
            onClick={() => navigate(`/store/${order.store._id}`)}
          >
            <div className="w-12 h-12 rounded-full bg-surface-container-highest flex items-center justify-center text-primary">
              <span
                className="material-symbols-outlined"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                storefront
              </span>
            </div>
            <div className="flex-1">
              <h4 className="font-montserrat text-[16px] text-on-surface">
                {order.store.name}
              </h4>
              <p className="text-body-md text-on-surface-variant line-clamp-1 mt-0.5">
                {order.store.address}
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleGetDirections();
              }}
              className="w-10 h-10 rounded-full bg-secondary-container text-on-secondary flex items-center justify-center active:scale-90 transition-transform neon-glow-yellow"
            >
              <span className="material-symbols-outlined text-[20px]">
                directions
              </span>
            </button>
          </div>
        )}

        {/* Order Items */}
        <div className="bg-surface-container rounded-xl p-4 space-y-3">
          <h3 className="text-label-bold text-on-surface-variant uppercase font-inter tracking-wider">
            Order Summary
          </h3>
          {order.items?.map((item, i) => (
            <div
              key={i}
              className="flex gap-4 bg-surface-container-low rounded-xl p-3 border border-glass-border"
            >
              <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 relative">
                {item.food?.image ? (
                  <img
                    src={item.food.image}
                    alt={item.food.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-bright flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      restaurant
                    </span>
                  </div>
                )}
                <div className="absolute bottom-1 right-1 bg-surface-slate/80 rounded px-1.5 py-0.5 text-[10px] font-bold text-on-surface font-inter">
                  x{item.quantity}
                </div>
              </div>
              <div className="flex flex-col justify-center">
                <h4 className="font-montserrat text-[16px] text-on-surface">
                  {item.food?.name}
                </h4>
                <p className="font-montserrat text-price-display text-primary mt-1">
                  ₹{item.price * item.quantity}
                </p>
              </div>
            </div>
          ))}

          {/* Total */}
          <div className="flex justify-between items-center pt-3 border-t border-glass-border">
            <p className="text-body-lg text-on-surface-variant font-inter">
              Total
            </p>
            <p className="font-montserrat text-price-display text-primary font-bold">
              ₹{order.totalPrice}
            </p>
          </div>

          {/* Note */}
          {order.note && (
            <div className="bg-surface-container-low rounded-lg p-3 border border-glass-border">
              <p className="text-label-bold text-on-surface-variant font-inter mb-1">
                NOTE
              </p>
              <p className="text-body-md text-on-surface">{order.note}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          {order.status === "placed" && (
            <button
              onClick={async () => {
                if (!confirm("Cancel this order?")) return;
                try {
                  await api.patch(`/order/${id}/cancel`);
                  fetchOrder();
                } catch (err) {
                  console.error(err);
                }
              }}
              className="flex-1 py-3 rounded-xl border border-status-error text-status-error text-label-bold font-inter hover:bg-status-error/10 transition-colors active:scale-[0.98]"
            >
              Cancel Order
            </button>
          )}
          {order.status === "pickedup" && (
            <button
              onClick={() => navigate(`/review/${order._id}`)}
              className="flex-1 py-3 rounded-xl bg-secondary-container text-on-secondary font-montserrat font-bold text-label-bold neon-glow-yellow active:scale-[0.98] transition-all"
            >
              Leave a Review ⭐
            </button>
          )}
          <button
            onClick={() => navigate("/")}
            className="flex-1 py-3 rounded-xl bg-surface-container border border-glass-border text-on-surface text-label-bold font-inter hover:bg-surface-container-high transition-colors active:scale-[0.98]"
          >
            Back to Feed
          </button>
        </div>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-glass-border">
        {[
          { icon: "movie", path: "/", active: false },
          { icon: "explore", path: "/explore", active: false },
          { icon: "smart_toy", path: "/chat", active: false },
          { icon: "shopping_cart", path: "/cart", active: false },
          { icon: "receipt_long", path: "/orders", active: true },
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
