import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();

  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [storeId, setStoreId] = useState(null);
  const [store, setStore] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [hasStore, setHasStore] = useState(true);

  const fetchDashboard = useCallback(async () => {
    try {
      const storeRes = await api.get("/store");
      const myStore = storeRes.data.stores?.find(
        (s) =>
          s.partner?._id === user?.id ||
          s.partner === user?.id ||
          s.partner?._id === user?._id ||
          s.partner === user?._id,
      );

      if (myStore) {
        setStore(myStore);
        setStoreId(myStore._id);
        setIsOpen(myStore.isOpen);
        setHasStore(true);

        const [statsRes, ordersRes] = await Promise.all([
          api.get(`/dashboard/${myStore._id}/daily`),
          api.get(`/order/store/${myStore._id}?status=placed`),
        ]);

        setStats(statsRes.data.stats);
        setOrders(ordersRes.data.orders || []);
      } else {
        setHasStore(false);
      }
    } catch (err) {
      console.error("Dashboard fetch error:", err);
      setHasStore(false);
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?._id]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleToggleStore = async () => {
    if (!storeId) return;
    try {
      await api.patch(`/store/${storeId}/status`, { isOpen: !isOpen });
      setIsOpen(!isOpen);
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      clearAuth();
      navigate("/partner/login");
    }
  };

  const statusColor = {
    placed: {
      dot: "bg-secondary-fixed",
      text: "text-secondary-fixed",
      border: "border-secondary-fixed/30",
      label: "New",
    },
    confirmed: {
      dot: "bg-tertiary",
      text: "text-tertiary",
      border: "border-tertiary/30",
      label: "Confirmed",
    },
    ready: {
      dot: "bg-status-success",
      text: "text-status-success",
      border: "border-status-success/30",
      label: "Ready",
    },
  };

  // ── NO STORE STATE ───────────────────────────────────────
  if (!loading && !hasStore) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 gap-6">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />
        <span
          className="material-symbols-outlined text-6xl text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
          storefront
        </span>
        <div className="text-center space-y-2">
          <h2 className="font-montserrat text-headline-lg-mobile text-on-surface">
            No store yet
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Create your store to start receiving orders
          </p>
        </div>
        <button
          onClick={() => navigate("/partner/kitchen")}
          className="bg-primary-container text-on-primary-container font-montserrat font-bold px-8 py-4 rounded-xl neon-glow-red active:scale-[0.98] transition-all"
        >
          Create Store
        </button>
        <button
          onClick={handleLogout}
          className="text-on-surface-variant text-body-md hover:text-primary transition-colors"
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-28">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gradient-to-b from-black/50 to-transparent">
        <span className="material-symbols-outlined text-primary">
          location_on
        </span>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary tracking-tight">
          Munchy
        </h1>
        <button onClick={handleLogout}>
          <span className="material-symbols-outlined text-primary">logout</span>
        </button>
      </header>

      {/* Main */}
      <main className="pt-24 px-4 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <div>
              <h2 className="font-montserrat text-title-md text-on-surface">
                Partner Hub
              </h2>
              <p className="text-body-md text-on-surface-variant">
                Welcome back, {user?.username || user?.name || "Partner"}
              </p>
            </div>
          </div>

          {/* Store name */}
          {store && (
            <p className="text-body-md text-primary font-inter">{store.name}</p>
          )}

          {/* Kitchen CTA */}
          <button
            onClick={() => navigate("/partner/kitchen")}
            className="w-full mt-2 bg-primary-container text-on-primary-container rounded-xl py-4 px-6 font-montserrat font-bold text-label-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all neon-glow-red"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              movie
            </span>
            Manage Kitchen
          </button>
        </div>

        {/* Bento Stats */}
        <section className="grid grid-cols-2 gap-4">
          <div className="bg-surface-slate rounded-xl p-4 flex flex-col justify-between border border-[rgba(255,255,255,0.12)]">
            <div className="flex items-center gap-2 mb-2 text-secondary-fixed">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                receipt_long
              </span>
              <span className="text-label-bold font-inter">Active Orders</span>
            </div>
            <div className="font-montserrat text-display-xl text-on-surface">
              {loading ? "—" : orders.length}
            </div>
          </div>

          <div className="bg-surface-slate rounded-xl p-4 flex flex-col justify-between border border-[rgba(255,255,255,0.12)]">
            <div className="flex items-center gap-2 mb-2 text-status-success">
              <span
                className="material-symbols-outlined text-[20px]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                payments
              </span>
              <span className="text-label-bold font-inter">Sales Today</span>
            </div>
            <div className="font-montserrat text-headline-lg-mobile text-on-surface flex items-baseline">
              <span className="text-on-surface-variant text-sm mr-1">₹</span>
              {loading ? "—" : (stats?.totalRevenue || 0).toLocaleString()}
            </div>
          </div>

          {/* Kitchen Status toggle */}
          <div className="col-span-2 bg-surface-slate rounded-xl p-4 flex items-center justify-between border border-[rgba(255,255,255,0.12)]">
            <div>
              <h3 className="font-montserrat text-title-md text-on-surface">
                Kitchen Status
              </h3>
              <p className="text-body-md text-on-surface-variant">
                {isOpen ? "Accepting new orders" : "Currently closed"}
              </p>
            </div>
            <button
              onClick={handleToggleStore}
              className={`relative w-14 h-8 rounded-full p-1 transition-colors duration-300 focus:outline-none ${
                isOpen ? "bg-tertiary-container" : "bg-surface-variant"
              }`}
            >
              <div
                className={`w-6 h-6 bg-surface rounded-full shadow-md transform transition-transform duration-300 ${
                  isOpen ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </section>

        {/* Live Orders */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-montserrat text-title-md text-on-surface">
              Live Orders
            </h2>
            <button
              onClick={() => navigate("/partner/orders")}
              className="text-label-bold text-primary hover:opacity-80 transition-opacity"
            >
              View All
            </button>
          </div>

          {loading ? (
            <div className="text-on-surface-variant text-body-md text-center py-8">
              Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-surface-slate rounded-xl p-8 border border-[rgba(255,255,255,0.12)] text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2 block">
                receipt_long
              </span>
              <p className="text-on-surface-variant text-body-md">
                No active orders right now
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {orders.map((order) => {
                const s = statusColor[order.status] || statusColor.placed;
                return (
                  <div
                    key={order._id}
                    className="bg-surface-slate rounded-xl p-4 border border-[rgba(255,255,255,0.12)] flex flex-col gap-3 relative overflow-hidden"
                  >
                    <div
                      className={`absolute top-0 left-0 w-1 h-full ${s.dot}`}
                    />
                    <div className="flex justify-between items-start pl-2">
                      <div>
                        <div className="text-label-bold text-on-surface-variant mb-1 font-inter">
                          ORDER #{order._id.slice(-4).toUpperCase()}
                        </div>
                        <h4 className="font-montserrat text-title-md text-on-surface">
                          {order.user?.name || "Customer"}
                        </h4>
                      </div>
                      <div
                        className={`bg-surface-container py-1 px-3 rounded-full flex items-center gap-1 border ${s.border}`}
                      >
                        <div
                          className={`w-2 h-2 rounded-full ${s.dot} animate-pulse`}
                        />
                        <span
                          className={`text-label-bold font-inter ${s.text}`}
                        >
                          {s.label}
                        </span>
                      </div>
                    </div>
                    <div className="pl-2 pt-2 border-t border-[rgba(255,255,255,0.12)] flex justify-between items-center">
                      <div className="flex items-center gap-2 text-on-surface-variant text-body-md">
                        <span className="material-symbols-outlined text-[18px]">
                          payments
                        </span>
                        ₹{order.totalPrice}
                      </div>
                      <button
                        onClick={() => navigate(`/partner/orders/${order._id}`)}
                        className="bg-surface-container hover:bg-surface-container-high transition-colors text-on-surface rounded-full w-10 h-10 flex items-center justify-center"
                      >
                        <span className="material-symbols-outlined">
                          chevron_right
                        </span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Quick Links */}
        <section className="grid grid-cols-2 gap-4 pb-4">
          <button
            onClick={() => navigate("/partner/analytics")} // ✅ fixed path
            className="bg-surface-slate rounded-xl p-4 border border-[rgba(255,255,255,0.12)] flex flex-col items-center gap-2 hover:border-primary/50 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-primary text-3xl">
              bar_chart
            </span>
            <span className="text-label-bold font-inter text-on-surface">
              Analytics
            </span>
          </button>
          <button
            onClick={() => navigate("/partner/kitchen")} // ✅ fixed path
            className="bg-surface-slate rounded-xl p-4 border border-[rgba(255,255,255,0.12)] flex flex-col items-center gap-2 hover:border-primary/50 transition-all active:scale-[0.98]"
          >
            <span className="material-symbols-outlined text-primary text-3xl">
              inventory_2
            </span>
            <span className="text-label-bold font-inter text-on-surface">
              Menu
            </span>
          </button>
        </section>
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-[rgba(255,255,255,0.12)]">
        {[
          {
            icon: "receipt_long",
            label: "Home",
            path: "/partner",
            active: true,
          },
          {
            icon: "inventory_2",
            label: "Kitchen",
            path: "/partner/kitchen",
            active: false,
          },
          {
            icon: "bar_chart",
            label: "Analytics",
            path: "/partner/analytics",
            active: false,
          },
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
            <span
              className="material-symbols-outlined"
              style={{
                fontVariationSettings: item.active ? "'FILL' 1" : "'FILL' 0",
              }}
            >
              {item.icon}
            </span>
            <span className="text-[10px] font-inter font-bold">
              {item.label}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
