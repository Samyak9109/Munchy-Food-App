import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [period, setPeriod] = useState("weekly"); // daily | weekly | monthly
  const [storeId, setStoreId] = useState(null);
  const [stats, setStats] = useState(null);
  const [topItems, setTopItems] = useState([]);
  const [rushHours, setRushHours] = useState([]);
  const [growth, setGrowth] = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async (sid, p) => {
    try {
      setLoading(true);
      const [statsRes, topRes, rushRes, growthRes, breakdownRes] =
        await Promise.all([
          api.get(`/dashboard/${sid}/${p}`),
          api.get(`/dashboard/${sid}/top-items`),
          api.get(`/dashboard/${sid}/rush-hours`),
          api.get(`/dashboard/${sid}/growth`),
          api.get(`/dashboard/${sid}/breakdown`),
        ]);

      setStats(statsRes.data.stats);
      setTopItems(topRes.data.items || []);
      setRushHours(rushRes.data.rushHours || []);
      setGrowth(growthRes.data.growth);
      setBreakdown(breakdownRes.data.breakdown || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const getStore = async () => {
      try {
        const res = await api.get("/store");
        const myStore = res.data.stores?.find(
          (s) => s.partner?._id === user?.id || s.partner === user?.id,
        );
        if (myStore) {
          setStoreId(myStore._id);
          fetchAnalytics(myStore._id, period);
        }
      } catch (err) {
        console.error(err);
      }
    };
    getStore();
  }, [user?.id, fetchAnalytics]);

  const handlePeriodChange = (p) => {
    setPeriod(p);
    if (storeId) fetchAnalytics(storeId, p);
  };

  // find max orders for bar chart scaling
  const maxOrders = Math.max(...rushHours.map((h) => h.totalOrders), 1);

  const statusColors = {
    placed: "text-secondary-fixed",
    confirmed: "text-tertiary",
    ready: "text-status-success",
    pickedup: "text-primary",
    cancelled: "text-status-error",
  };

  const growthColor = (val) => {
    const num = parseFloat(val);
    return num >= 0 ? "text-status-success" : "text-status-error";
  };

  const growthIcon = (val) => {
    const num = parseFloat(val);
    return num >= 0 ? "trending_up" : "trending_down";
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-28">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => navigate("/")}>
          <span className="material-symbols-outlined text-primary">
            arrow_back
          </span>
        </button>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary tracking-tight">
          Analytics
        </h1>
        <div className="w-6" />
      </header>

      <main className="pt-24 px-4 max-w-3xl mx-auto space-y-6">
        {/* Period Toggle */}
        <div className="flex justify-between items-end gap-4">
          <div>
            <h2 className="font-montserrat text-headline-lg-mobile text-on-surface">
              Sales Analytics
            </h2>
            <p className="text-body-md text-on-surface-variant mt-1">
              Track your performance
            </p>
          </div>
          <div className="flex bg-surface-container-high rounded-full p-1 border border-[rgba(255,255,255,0.12)]">
            {["daily", "weekly", "monthly"].map((p) => (
              <button
                key={p}
                onClick={() => handlePeriodChange(p)}
                className={`px-3 py-1.5 rounded-full text-label-bold font-inter capitalize transition-colors ${
                  period === p
                    ? "bg-primary-container/20 text-primary"
                    : "text-on-surface-variant hover:text-primary"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="text-center text-on-surface-variant py-16">
            Loading analytics...
          </div>
        ) : (
          <>
            {/* Hero Stat */}
            <section className="glass-panel rounded-xl p-6 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 blur-3xl rounded-full pointer-events-none" />
              <p className="text-label-bold font-inter text-primary mb-2 uppercase tracking-widest">
                Total Revenue ({period})
              </p>
              <h3 className="font-montserrat text-display-xl text-on-surface mb-2">
                ₹{(stats?.totalRevenue || 0).toLocaleString()}
              </h3>
              {growth && (
                <div className="flex items-center gap-2">
                  <span
                    className={`flex items-center text-body-md px-2 py-1 rounded-md bg-status-success/10 ${growthColor(growth.revenue)}`}
                  >
                    <span className="material-symbols-outlined text-[16px] mr-1">
                      {growthIcon(growth.revenue)}
                    </span>
                    {growth.revenue}
                  </span>
                  <span className="text-body-md text-on-surface-variant">
                    vs last week
                  </span>
                </div>
              )}
            </section>

            {/* Bento Stats */}
            <section className="grid grid-cols-2 gap-4">
              <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    receipt
                  </span>
                  {growth && (
                    <span
                      className={`text-xs font-bold ${growthColor(growth.orders)}`}
                    >
                      {growth.orders}
                    </span>
                  )}
                </div>
                <div>
                  <p className="text-body-md text-on-surface-variant mb-1">
                    Total Orders
                  </p>
                  <p className="font-montserrat text-title-md text-on-surface">
                    {stats?.totalOrders || 0}
                  </p>
                </div>
              </div>

              <div className="glass-panel rounded-xl p-4 flex flex-col justify-between">
                <div className="flex justify-between items-start mb-4">
                  <span className="material-symbols-outlined text-on-surface-variant">
                    payments
                  </span>
                </div>
                <div>
                  <p className="text-body-md text-on-surface-variant mb-1">
                    Avg Order Value
                  </p>
                  <p className="font-montserrat text-title-md text-on-surface">
                    ₹{(stats?.avgOrderValue || 0).toFixed(0)}
                  </p>
                </div>
              </div>

              {/* Order Status Breakdown */}
              {breakdown.map((b) => (
                <div
                  key={b._id}
                  className="glass-panel rounded-xl p-4 flex flex-col justify-between"
                >
                  <div className="mb-2">
                    <span
                      className={`text-label-bold font-inter uppercase ${statusColors[b._id] || "text-on-surface-variant"}`}
                    >
                      {b._id}
                    </span>
                  </div>
                  <p className="font-montserrat text-title-md text-on-surface">
                    {b.count}
                  </p>
                </div>
              ))}
            </section>

            {/* Rush Hours Chart */}
            <section className="glass-panel rounded-xl p-6">
              <h3 className="font-montserrat text-title-md text-on-surface mb-6">
                Rush Hours
              </h3>
              {rushHours.length === 0 ? (
                <p className="text-on-surface-variant text-body-md text-center py-4">
                  No data yet
                </p>
              ) : (
                <>
                  <div className="h-40 flex items-end justify-between gap-1 border-b border-[rgba(255,255,255,0.12)] pb-2">
                    {rushHours.map((h) => (
                      <div
                        key={h._id}
                        className="flex-1 flex flex-col items-center gap-1 group"
                      >
                        <div className="relative w-full">
                          <div
                            className="w-full bg-primary-container/60 hover:bg-primary-container rounded-t-sm transition-colors"
                            style={{
                              height: `${(h.totalOrders / maxOrders) * 120}px`,
                              minHeight: "4px",
                            }}
                          />
                          <div className="absolute -top-7 left-1/2 -translate-x-1/2 bg-surface-slate text-xs py-0.5 px-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            {h.totalOrders} orders
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2 text-[10px] text-on-surface-variant font-inter">
                    {rushHours
                      .filter((_, i) => i % 3 === 0)
                      .map((h) => (
                        <span key={h._id}>{h._id}:00</span>
                      ))}
                  </div>
                </>
              )}
            </section>

            {/* Top Items */}
            <section className="glass-panel rounded-xl p-6">
              <h3 className="font-montserrat text-title-md text-on-surface mb-6">
                Top Performers
              </h3>
              {topItems.length === 0 ? (
                <p className="text-on-surface-variant text-body-md text-center py-4">
                  No sales data yet
                </p>
              ) : (
                <div className="space-y-4">
                  {topItems.map((item, index) => (
                    <div
                      key={item._id}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-container-highest transition-colors border border-transparent hover:border-[rgba(255,255,255,0.12)]"
                    >
                      <div className="flex items-center gap-4">
                        {/* Rank */}
                        <span className="font-montserrat text-headline-lg-mobile font-bold text-on-surface-variant w-6 text-center">
                          {index + 1}
                        </span>
                        {/* Image */}
                        <div className="w-12 h-12 rounded-lg bg-surface-bright overflow-hidden flex-shrink-0">
                          {item.food?.image ? (
                            <img
                              src={item.food.image}
                              alt={item.food.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="material-symbols-outlined text-on-surface-variant text-sm">
                                restaurant
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-body-md font-bold text-on-surface">
                            {item.food?.name}
                          </p>
                          <p className="text-[11px] text-on-surface-variant mt-0.5">
                            {item.totalSold} orders
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-montserrat text-price-display text-on-surface">
                          ₹{item.totalRevenue?.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-[rgba(255,255,255,0.12)]">
        {[
          { icon: "receipt_long", label: "Home", path: "/", active: false },
          {
            icon: "inventory_2",
            label: "Kitchen",
            path: "/kitchen",
            active: false,
          },
          {
            icon: "bar_chart",
            label: "Analytics",
            path: "/analytics",
            active: true,
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
