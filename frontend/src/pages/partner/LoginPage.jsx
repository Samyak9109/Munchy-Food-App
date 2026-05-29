import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import api from "../../api/axios";

const LoginPage = () => {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [step, setStep] = useState("login"); // "login" | "verify"
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/partner/login", form);
      setAuth(res.data.account, res.data.accessToken, "partner");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/partner/register", form);
      setStep("verify");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    // auto focus next
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/auth/partner/verify-email", {
        email: form.email,
        otp: otp.join(""),
      });
      setAuth(res.data.account, res.data.accessToken, "partner");
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}/auth/partner/google`;
  };

  // ── OTP VERIFY SCREEN ──────────────────────────────────
  if (step === "verify") {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-margin-mobile">
        <div className="w-full max-w-sm space-y-stack-lg">
          {/* Header */}
          <div className="text-center space-y-stack-sm">
            <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
              Munchy
            </h1>
            <h2 className="font-montserrat text-title-md text-on-surface">
              Verify your email
            </h2>
            <p className="text-body-md text-on-surface-variant">
              Enter the 6-digit code sent to{" "}
              <span className="text-primary">{form.email}</span>
            </p>
          </div>

          {/* OTP Boxes */}
          <form onSubmit={handleVerify} className="space-y-stack-lg">
            <div className="flex justify-center gap-3">
              {otp.map((digit, i) => (
                <input
                  key={i}
                  id={`otp-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(e.target.value, i)}
                  onKeyDown={(e) => handleOtpKeyDown(e, i)}
                  className="w-12 h-14 text-center text-title-md font-montserrat font-bold text-on-surface bg-surface-container-low border border-glass-border rounded-xl focus:border-secondary-container focus:ring-1 focus:ring-secondary-container outline-none transition-all"
                />
              ))}
            </div>

            {error && (
              <p className="text-status-error text-body-md text-center">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-secondary-container text-on-secondary font-montserrat font-bold text-title-md py-4 rounded-xl neon-glow-yellow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all"
            >
              {loading ? "Verifying..." : "Confirm Pickup"}
            </button>

            <button
              type="button"
              onClick={() => setStep("login")}
              className="w-full text-on-surface-variant text-body-md text-center hover:text-primary transition-colors"
            >
              ← Back to login
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── LOGIN / REGISTER SCREEN ────────────────────────────
  return (
    <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-margin-mobile">
      <div className="w-full max-w-sm space-y-stack-lg">
        {/* Logo */}
        <div className="text-center space-y-stack-sm">
          <h1 className="font-montserrat text-display-xl font-black text-primary tracking-tight">
            Munchy
          </h1>
          <p className="text-body-md text-on-surface-variant">
            Partner Hub — Manage your kitchen
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-stack-md">
          {/* Name field — only for register */}
          {step === "register" && (
            <div className="space-y-stack-sm">
              <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                Full Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="Your name"
                value={form.name || ""}
                onChange={handleChange}
                className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          )}

          {/* Email */}
          <div className="space-y-stack-sm">
            <label className="text-label-bold text-on-surface-variant uppercase font-inter">
              Email
            </label>
            <input
              name="email"
              type="email"
              placeholder="your@email.com"
              value={form.email}
              onChange={handleChange}
              className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Password */}
          <div className="space-y-stack-sm">
            <label className="text-label-bold text-on-surface-variant uppercase font-inter">
              Password
            </label>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
            />
          </div>

          {/* Phone — only for register */}
          {step === "register" && (
            <div className="space-y-stack-sm">
              <label className="text-label-bold text-on-surface-variant uppercase font-inter">
                Phone
              </label>
              <input
                name="phone"
                type="tel"
                placeholder="10 digit number"
                value={form.phone || ""}
                onChange={handleChange}
                className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-lg text-on-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              />
            </div>
          )}

          {error && <p className="text-status-error text-body-md">{error}</p>}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            onClick={step === "register" ? handleRegister : handleLogin}
            className="w-full bg-primary-container text-on-primary-container font-montserrat font-bold text-title-md py-4 rounded-xl neon-glow-red disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all mt-stack-sm"
          >
            {loading
              ? "Please wait..."
              : step === "login"
                ? "Login to Hub"
                : "Create Account"}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-glass-border" />
          <span className="text-label-bold text-on-surface-variant">OR</span>
          <div className="flex-1 h-px bg-glass-border" />
        </div>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-surface-slate border border-glass-border text-on-surface font-inter font-bold text-body-lg py-4 rounded-xl flex items-center justify-center gap-3 hover:border-primary/50 transition-all active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Continue with Google
        </button>

        {/* Toggle login/register */}
        <p className="text-center text-body-md text-on-surface-variant">
          {step === "login" ? "New partner? " : "Already have an account? "}
          <button
            onClick={() => {
              setStep(step === "login" ? "register" : "login");
              setError("");
            }}
            className="text-primary font-bold hover:opacity-80 transition-opacity"
          >
            {step === "login" ? "Create account" : "Login"}
          </button>
        </p>
      </div>
    </div>
  );
};
export default LoginPage;
