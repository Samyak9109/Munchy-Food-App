import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

const STATUS_COLORS = {
  placed: {
    text: "text-secondary-fixed",
    bg: "bg-secondary-fixed/10",
    border: "border-secondary-fixed/30",
  },
  confirmed: {
    text: "text-tertiary",
    bg: "bg-tertiary/10",
    border: "border-tertiary/30",
  },
  ready: {
    text: "text-status-success",
    bg: "bg-status-success/10",
    border: "border-status-success/30",
  },
  pickedup: {
    text: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/30",
  },
  cancelled: {
    text: "text-status-error",
    bg: "bg-status-error/10",
    border: "border-status-error/30",
  },
};

export default function OrdersListPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get("/order");
      setOrders(res.data.orders || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-28">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gradient-to-b from-black/50 to-transparent">
        <div className="w-6" />
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
          My Orders
        </h1>
        <div className="w-6" />
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-3">
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant text-body-md">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant">
              receipt_long
            </span>
            <h2 className="font-montserrat text-title-md text-on-surface">
              No orders yet
            </h2>
            <p className="text-body-md text-on-surface-variant text-center">
              Your order history will appear here
            </p>
            <button
              onClick={() => navigate("/")}
              className="bg-primary-container text-on-primary-container font-montserrat font-bold px-8 py-3 rounded-full neon-glow-red active:scale-[0.98] transition-all"
            >
              Start Ordering
            </button>
          </div>
        ) : (
          orders.map((order) => {
            const s = STATUS_COLORS[order.status] || STATUS_COLORS.placed;
            return (
              <div
                key={order._id}
                onClick={() => navigate(`/orders/${order._id}`)}
                className="bg-surface-slate rounded-xl p-4 border border-glass-border flex flex-col gap-3 cursor-pointer active:scale-[0.98] transition-all hover:border-primary/30"
              >
                {/* Header */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-label-bold text-on-surface-variant font-inter">
                      ORDER #{order._id.slice(-4).toUpperCase()}
                    </p>
                    <h3 className="font-montserrat text-title-md text-on-surface mt-0.5">
                      {order.store?.name}
                    </h3>
                  </div>
                  <div
                    className={`px-3 py-1.5 rounded-full border text-label-bold font-inter capitalize ${s.text} ${s.bg} ${s.border}`}
                  >
                    {order.status}
                  </div>
                </div>

                {/* Items preview */}
                <p className="text-body-md text-on-surface-variant line-clamp-1 font-inter">
                  {order.items
                    ?.map((i) => `${i.food?.name} x${i.quantity}`)
                    .join(", ")}
                </p>

                {/* Footer */}
                <div className="flex justify-between items-center pt-2 border-t border-glass-border">
                  <span className="text-body-md text-on-surface-variant font-inter">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-montserrat text-price-display text-primary">
                    ₹{order.totalPrice}
                  </span>
                </div>
              </div>
            );
          })
        )}
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
