import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";

export default function ExplorePage() {
  const navigate = useNavigate();

  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [userCoords, setUserCoords] = useState(null);
  const [locationError, setLocationError] = useState(false);

  const fetchNearbyStores = useCallback(async (lat, lng) => {
    const fetchAllStores = async () => {
      try {
        const res = await api.get("/store");
        setStores(res.data.stores || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    try {
      const res = await api.get(`/map/nearby?lat=${lat}&lng=${lng}&radius=10`);
      setStores(res.data.stores || []);
    } catch (err) {
      console.error(err);
      // fallback — fetch all stores
      fetchAllStores();
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // request GPS location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setUserCoords({ lat: latitude, lng: longitude });
          fetchNearbyStores(latitude, longitude);
        },
        () => {
          setLocationError(true);
          fetchAllStores();
        },
      );
    } else {
      fetchAllStores();
    }
  }, [fetchNearbyStores]);

  const handleGetDirections = async (store) => {
    if (!userCoords) {
      alert("Enable location to get directions");
      return;
    }
    try {
      const res = await api.get(
        `/map/directions/${store._id}?userLat=${userCoords.lat}&userLng=${userCoords.lng}`,
      );
      const { distance, duration } = res.data.directions;
      alert(`Distance: ${distance}km\nEstimated time: ${duration} minutes`);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredStores = stores.filter(
    (s) =>
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.cuisine?.some((c) => c.toLowerCase().includes(search.toLowerCase())),
  );

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
        <button onClick={() => navigate("/profile")}>
          <span className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">
            account_circle
          </span>
        </button>
      </header>

      {/* Map Placeholder */}
      <div className="relative w-full h-[280px] bg-surface-variant overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center space-y-2">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              map
            </span>
            <p className="text-body-md text-on-surface-variant">
              {locationError
                ? "Enable location for map"
                : userCoords
                  ? "Showing stores near you"
                  : "Getting your location..."}
            </p>
          </div>
        </div>

        {/* Simulated map pins */}
        {filteredStores.slice(0, 3).map((store, i) => (
          <div
            key={store._id}
            className="absolute flex flex-col items-center"
            style={{
              top: `${30 + i * 20}%`,
              left: `${20 + i * 25}%`,
            }}
          >
            <div
              className={`text-surface font-label-bold text-[10px] px-2 py-0.5 rounded-full mb-1 ${
                i % 2 === 0
                  ? "bg-primary-container shadow-[0_0_10px_rgba(255,83,82,0.4)]"
                  : "bg-secondary-container shadow-[0_0_10px_rgba(255,219,60,0.4)]"
              }`}
            >
              {store.name}
            </div>
            <span
              className={`material-symbols-outlined text-3xl drop-shadow-lg ${
                i % 2 === 0
                  ? "text-primary-container"
                  : "text-secondary-container"
              }`}
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              location_on
            </span>
          </div>
        ))}

        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />

        {/* Search bar over map */}
        <div className="absolute top-16 left-4 right-4 z-10">
          <div className="glass-panel rounded-full flex items-center px-4 py-3">
            <span className="material-symbols-outlined text-on-surface-variant mr-3">
              search
            </span>
            <input
              type="text"
              placeholder="Search for nearby cravings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-transparent border-none text-on-surface text-body-md w-full focus:ring-0 outline-none placeholder:text-on-surface-variant/50"
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <span className="material-symbols-outlined text-on-surface-variant text-sm">
                  close
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Store List */}
      <div className="px-4 pt-4 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="font-montserrat text-title-md text-on-surface">
            Nearby Kitchens
          </h2>
          <span className="text-label-bold text-on-surface-variant font-inter uppercase">
            {filteredStores.length} places
          </span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-on-surface-variant text-body-md">
            Finding kitchens near you...
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="text-center py-12">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-2">
              storefront
            </span>
            <p className="text-on-surface-variant text-body-md">
              No kitchens found
            </p>
          </div>
        ) : (
          filteredStores.map((store) => (
            <div
              key={store._id}
              onClick={() => navigate(`/store/${store._id}`)}
              className="bg-surface-slate rounded-2xl p-4 flex gap-4 border border-glass-border relative overflow-hidden group cursor-pointer active:scale-[0.98] transition-all"
            >
              {/* Image */}
              <div className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 relative">
                {store.image ? (
                  <img
                    src={store.image}
                    alt={store.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <div className="w-full h-full bg-surface-container-high flex items-center justify-center">
                    <span className="material-symbols-outlined text-on-surface-variant text-3xl">
                      storefront
                    </span>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              </div>

              {/* Info */}
              <div className="flex-1 flex flex-col justify-between py-1">
                <div>
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="font-montserrat text-title-md text-on-surface leading-tight">
                      {store.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-surface-container px-2 py-0.5 rounded-full">
                      <span
                        className="material-symbols-outlined text-secondary-container text-[14px]"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        star
                      </span>
                      <span className="text-label-bold text-on-surface font-inter">
                        {store.rating?.average?.toFixed(1) || "New"}
                      </span>
                    </div>
                  </div>
                  <p className="text-body-md text-on-surface-variant line-clamp-1">
                    {store.cuisine?.join(", ") || "Various"}
                  </p>
                </div>

                <div className="flex justify-between items-end">
                  {/* Distance */}
                  <div className="flex items-center gap-1 text-on-surface-variant text-label-bold font-inter">
                    <span className="material-symbols-outlined text-[16px]">
                      directions_walk
                    </span>
                    <span>
                      {store.distance
                        ? `${(store.distance / 1000).toFixed(1)} km`
                        : store.address?.substring(0, 20)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Open/Closed badge */}
                    <div
                      className={`text-label-bold font-inter px-3 py-1.5 rounded-full flex items-center gap-1 border ${
                        store.isOpen
                          ? "bg-secondary-container/10 text-secondary-container border-secondary-container/20"
                          : "bg-status-error/10 text-status-error border-status-error/20"
                      }`}
                    >
                      <span className="material-symbols-outlined text-[14px]">
                        {store.isOpen ? "local_mall" : "store"}
                      </span>
                      {store.isOpen ? "Open" : "Closed"}
                    </div>

                    {/* Directions */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(store);
                      }}
                      className="w-8 h-8 bg-secondary-container text-on-secondary rounded-full flex items-center justify-center active:scale-90 transition-transform"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        directions
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

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
