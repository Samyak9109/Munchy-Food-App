import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, clearAuth, updateUser } = useAuthStore();

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 2500);
  };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await api.get("/user/profile");
      setProfile(res.data.user);
      setForm({
        name: res.data.user.name || "",
        phone: res.data.user.phone || "",
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await api.put("/user/profile", form);
      setProfile(res.data.user);
      updateUser(res.data.user);
      setEditing(false);
      showToast("Profile updated!");
    } catch (err) {
      setError(err.response?.data?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.error(err);
    } finally {
      clearAuth();
      navigate("/login");
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return;
    try {
      await api.delete("/user/profile");
      clearAuth();
      navigate("/login");
    } catch (err) {
      showToast("Error deleting account", "error");
    }
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-28">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gradient-to-b from-black/50 to-transparent">
        <button onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">
            arrow_back
          </span>
        </button>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
          Profile
        </h1>
        <button onClick={() => setEditing(!editing)}>
          <span className="material-symbols-outlined text-primary">
            {editing ? "close" : "edit"}
          </span>
        </button>
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-16 text-on-surface-variant">
            Loading...
          </div>
        ) : (
          <>
            {/* Avatar + Name */}
            <div className="flex flex-col items-center gap-3 py-6">
              <div className="w-20 h-20 rounded-full bg-primary-container flex items-center justify-center neon-glow-red relative">
                {profile?.avatar ? (
                  <img
                    src={profile.avatar}
                    alt={profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span
                    className="material-symbols-outlined text-on-primary-container text-4xl"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    person
                  </span>
                )}
              </div>
              <div className="text-center">
                <h2 className="font-montserrat text-title-md text-on-surface">
                  {profile?.name}
                </h2>
                <p className="text-body-md text-on-surface-variant mt-1">
                  {profile?.email}
                </p>
                <div
                  className={`mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full text-label-bold font-inter ${
                    profile?.isVerified
                      ? "bg-status-success/10 text-status-success border border-status-success/30"
                      : "bg-status-error/10 text-status-error border border-status-error/30"
                  }`}
                >
                  <span
                    className="material-symbols-outlined text-[14px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {profile?.isVerified ? "verified" : "error"}
                  </span>
                  {profile?.isVerified ? "Verified" : "Not Verified"}
                </div>
              </div>
            </div>

            {/* Edit Form */}
            {editing ? (
              <div className="bg-surface-slate rounded-xl p-4 border border-glass-border space-y-4">
                <h3 className="font-montserrat text-title-md text-on-surface">
                  Edit Profile
                </h3>

                <div className="space-y-2">
                  <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                    Full Name
                  </label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary outline-none transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                    Phone
                  </label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    type="tel"
                    placeholder="10 digit number"
                    className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary outline-none transition-all"
                  />
                </div>

                {error && (
                  <p className="text-status-error text-body-md">{error}</p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full bg-primary-container text-on-primary-container font-montserrat font-bold py-3 rounded-xl neon-glow-red disabled:opacity-50 active:scale-[0.98] transition-all"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            ) : (
              /* Info Cards */
              <div className="space-y-3">
                {[
                  { icon: "person", label: "Name", value: profile?.name },
                  { icon: "email", label: "Email", value: profile?.email },
                  {
                    icon: "phone",
                    label: "Phone",
                    value: profile?.phone || "Not set",
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="bg-surface-slate rounded-xl p-4 flex items-center gap-4 border border-glass-border"
                  >
                    <span
                      className="material-symbols-outlined text-primary"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {item.icon}
                    </span>
                    <div>
                      <p className="text-label-bold text-on-surface-variant font-inter uppercase">
                        {item.label}
                      </p>
                      <p className="text-body-lg text-on-surface mt-0.5">
                        {item.value}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Links */}
            <div className="space-y-2 pt-2">
              {[
                { icon: "receipt_long", label: "My Orders", path: "/orders" },
                { icon: "favorite", label: "Favorites", path: "/favorites" },
                { icon: "help", label: "Help & FAQ", path: "/help" },
              ].map((item) => (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="w-full bg-surface-slate rounded-xl p-4 flex items-center justify-between border border-glass-border hover:border-primary/30 transition-colors active:scale-[0.98]"
                >
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {item.icon}
                    </span>
                    <span className="text-body-lg text-on-surface font-inter">
                      {item.label}
                    </span>
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant">
                    chevron_right
                  </span>
                </button>
              ))}
            </div>

            {/* Logout + Delete */}
            <div className="space-y-3 pt-2 pb-6">
              <button
                onClick={handleLogout}
                className="w-full py-3 rounded-xl border border-glass-border text-on-surface font-inter font-bold flex items-center justify-center gap-2 hover:bg-surface-container transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined">logout</span>
                Logout
              </button>
              <button
                onClick={handleDeleteAccount}
                className="w-full py-3 rounded-xl border border-status-error/30 text-status-error font-inter font-bold flex items-center justify-center gap-2 hover:bg-status-error/10 transition-colors active:scale-[0.98]"
              >
                <span className="material-symbols-outlined">delete</span>
                Delete Account
              </button>
            </div>
          </>
        )}
      </main>

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-full text-label-bold font-inter flex items-center gap-2 ${
            toast.type === "error"
              ? "bg-status-error/90"
              : "bg-status-success/90"
          } text-white`}
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
          { icon: "explore", path: "/explore", active: false },
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
            <span
              className="material-symbols-outlined"
              style={{ fontVariationSettings: "'FILL' 0" }}
            >
              {item.icon}
            </span>
          </button>
        ))}
      </nav>
    </div>
  );
}
