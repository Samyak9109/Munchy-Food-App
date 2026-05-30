import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import { useAuthStore } from "../../store/authStore";

export default function KitchenPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [store, setStore] = useState(null);
  const [foodItems, setFoodItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    price: "",
    category: [],
    store: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const CATEGORIES = [
    "breakfast",
    "lunch",
    "dinner",
    "snacks",
    "drinks",
    "desserts",
  ];

  const fetchKitchenData = useCallback(async () => {
    try {
      const storeRes = await api.get("/store");
      const myStore = storeRes.data.stores?.find(
        (s) => s.partner?._id === user?.id || s.partner === user?.id,
      );

      if (myStore) {
        setStore(myStore);
        setForm((prev) => ({ ...prev, store: myStore._id }));

        const menuRes = await api.get(`/store/${myStore._id}/menu`);
        setFoodItems(menuRes.data.menu || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchKitchenData();
  }, [fetchKitchenData]);

  const handleFormChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const toggleCategory = (cat) => {
    setForm((prev) => ({
      ...prev,
      category: prev.category.includes(cat)
        ? prev.category.filter((c) => c !== cat)
        : [...prev.category, cat],
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setVideoFile(file);
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("name", form.name);
      formData.append("description", form.description);
      formData.append("price", form.price);
      formData.append("store", form.store);
      form.category.forEach((cat) => formData.append("category", cat));
      formData.append("image", imageFile);
      if (videoFile) formData.append("video", videoFile);

      await api.post("/food/addFood", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // reset form
      setForm({
        name: "",
        description: "",
        price: "",
        category: [],
        store: store?._id || "",
      });
      setImageFile(null);
      setVideoFile(null);
      setImagePreview(null);
      setShowAddForm(false);
      fetchKitchenData();
    } catch (err) {
      setError(err.response?.data?.message || "Error adding food item");
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleAvailability = async (foodId, current) => {
    try {
      await api.patch(`/food/${foodId}/availability`, {
        isAvailable: !current,
      });
      setFoodItems((prev) =>
        prev.map((f) =>
          f._id === foodId ? { ...f, isAvailable: !current } : f,
        ),
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!confirm("Delete this food item?")) return;
    try {
      await api.delete(`/food/${foodId}`);
      setFoodItems((prev) => prev.filter((f) => f._id !== foodId));
    } catch (err) {
      console.error(err);
    }
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
          Kitchen
        </h1>
        <div className="w-6" />
      </header>

      <main className="pt-24 px-4 max-w-3xl mx-auto space-y-6">
        {/* Store Info */}
        {store && (
          <div className="bg-surface-slate rounded-xl overflow-hidden border border-[rgba(255,255,255,0.12)]">
            {store.image && (
              <div className="h-32 w-full relative">
                <img
                  src={store.image}
                  alt={store.name}
                  className="w-full h-full object-cover opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-surface-slate to-transparent" />
              </div>
            )}
            <div className="p-4">
              <h2 className="font-montserrat text-title-md text-on-surface">
                {store.name}
              </h2>
              <p className="text-body-md text-on-surface-variant mt-1">
                {store.description || "No description set"}
              </p>
              <div className="flex items-center gap-2 mt-3">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span
                      key={star}
                      className="material-symbols-outlined text-secondary-fixed text-sm"
                      style={{
                        fontVariationSettings:
                          star <= Math.round(store.rating?.average || 0)
                            ? "'FILL' 1"
                            : "'FILL' 0",
                      }}
                    >
                      star
                    </span>
                  ))}
                </div>
                <span className="text-label-bold text-on-surface-variant font-inter">
                  {store.rating?.average?.toFixed(1) || "0.0"} •{" "}
                  {store.rating?.count || 0} reviews
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Menu Management Header */}
        <div className="flex items-center justify-between">
          <h2 className="font-montserrat text-title-md text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">
              inventory_2
            </span>
            Menu ({foodItems.length})
          </h2>
        </div>

        {/* Food Items */}
        {loading ? (
          <div className="text-center text-on-surface-variant py-8">
            Loading menu...
          </div>
        ) : (
          <div className="space-y-3">
            {foodItems.map((item) => (
              <div
                key={item._id}
                className={`bg-surface-slate rounded-xl p-3 border border-[rgba(255,255,255,0.12)] flex items-center justify-between transition-opacity ${
                  !item.isAvailable ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  {/* Image */}
                  <div className="w-14 h-14 rounded-lg bg-surface-container-low overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <span className="material-symbols-outlined text-on-surface-variant">
                          restaurant
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div>
                    <p className="text-body-lg text-on-surface font-inter leading-tight">
                      {item.name}
                    </p>
                    <p className="text-price-display text-primary-fixed-dim text-sm mt-0.5 font-montserrat font-bold">
                      ₹{item.price}
                    </p>
                    {item.video && (
                      <span className="text-[10px] text-tertiary font-inter flex items-center gap-1 mt-1">
                        <span className="material-symbols-outlined text-[12px]">
                          movie
                        </span>
                        Reel attached
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2">
                  {/* Availability Toggle */}
                  <button
                    onClick={() =>
                      handleToggleAvailability(item._id, item.isAvailable)
                    }
                    className={`relative w-12 h-6 rounded-full p-1 transition-colors duration-300 ${
                      item.isAvailable
                        ? "bg-status-success"
                        : "bg-surface-variant"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 bg-surface rounded-full shadow transform transition-transform duration-300 ${
                        item.isAvailable ? "translate-x-6" : "translate-x-0"
                      }`}
                    />
                  </button>
                  <span
                    className={`text-[10px] font-inter font-bold uppercase tracking-wider ${
                      item.isAvailable
                        ? "text-status-success"
                        : "text-on-surface-variant"
                    }`}
                  >
                    {item.isAvailable ? "In Stock" : "Out of Stock"}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteFood(item._id)}
                    className="text-status-error hover:opacity-80 transition-opacity"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      delete
                    </span>
                  </button>
                </div>
              </div>
            ))}

            {/* Add New Item Button */}
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 border border-dashed border-[rgba(255,255,255,0.12)] rounded-xl text-on-surface-variant hover:text-primary hover:border-primary/50 transition-colors flex items-center justify-center gap-2 text-label-bold font-inter"
            >
              <span className="material-symbols-outlined text-lg">add</span>
              ADD NEW ITEM
            </button>
          </div>
        )}
      </main>

      {/* Add Food Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end">
          <div className="w-full max-w-3xl mx-auto bg-surface-slate rounded-t-2xl p-6 space-y-4 max-h-[90dvh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-montserrat text-title-md text-on-surface">
                Add Food Item
              </h3>
              <button onClick={() => setShowAddForm(false)}>
                <span className="material-symbols-outlined text-on-surface-variant">
                  close
                </span>
              </button>
            </div>

            <form onSubmit={handleAddFood} className="space-y-4">
              {/* Image Upload */}
              <div className="space-y-2">
                <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                  Food Image *
                </label>
                <label className="block w-full h-40 rounded-xl border-2 border-dashed border-[rgba(255,255,255,0.12)] hover:border-primary/50 transition-colors cursor-pointer overflow-hidden relative">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-on-surface-variant">
                      <span className="material-symbols-outlined text-3xl">
                        add_photo_alternate
                      </span>
                      <span className="text-body-md">Tap to upload image</span>
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Video Upload */}
              <div className="space-y-2">
                <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                  Reel Video (optional)
                </label>
                <label className="block w-full py-4 rounded-xl border border-dashed border-[rgba(255,255,255,0.12)] hover:border-tertiary/50 transition-colors cursor-pointer">
                  <div className="flex items-center justify-center gap-2 text-on-surface-variant">
                    <span className="material-symbols-outlined">movie</span>
                    <span className="text-body-md">
                      {videoFile ? videoFile.name : "Tap to upload video"}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoChange}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Name */}
              <div className="space-y-2">
                <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                  Item Name *
                </label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleFormChange}
                  placeholder="e.g. Spicy Ramen"
                  className="w-full bg-surface-container-low border border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Description */}
              <div className="space-y-2">
                <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  placeholder="What makes this dish special?"
                  rows={3}
                  className="w-full bg-surface-container-low border border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-3 text-body-md text-on-surface focus:border-primary outline-none transition-all resize-none"
                />
              </div>

              {/* Price */}
              <div className="space-y-2">
                <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                  Price (₹) *
                </label>
                <input
                  name="price"
                  type="number"
                  value={form.price}
                  onChange={handleFormChange}
                  placeholder="0.00"
                  className="w-full bg-surface-container-low border border-[rgba(255,255,255,0.12)] rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary outline-none transition-all"
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                  Category *
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-label-bold font-inter capitalize transition-all ${
                        form.category.includes(cat)
                          ? "bg-primary-container text-on-primary-container"
                          : "bg-surface-container border border-[rgba(255,255,255,0.12)] text-on-surface-variant"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {error && (
                <p className="text-status-error text-body-md">{error}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={
                  submitting ||
                  !imageFile ||
                  !form.name ||
                  !form.price ||
                  form.category.length === 0
                }
                className="w-full bg-primary-container text-on-primary-container font-montserrat font-bold text-title-md py-4 rounded-xl neon-glow-red disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
              >
                {submitting ? "Uploading..." : "Add to Menu"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 bg-surface/80 backdrop-blur-xl border-t border-[rgba(255,255,255,0.12)]">
        {[
          { icon: "receipt_long", label: "Home", path: "/", active: false },
          {
            icon: "inventory_2",
            label: "Kitchen",
            path: "/kitchen",
            active: true,
          },
          {
            icon: "bar_chart",
            label: "Analytics",
            path: "/analytics",
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
