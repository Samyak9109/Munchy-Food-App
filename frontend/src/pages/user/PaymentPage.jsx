import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../../api/axios";

export default function PaymentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const orderId = location.state?.orderId;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [method, setMethod] = useState("upi");
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/order/${orderId}`);
      setOrder(res.data.order);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!orderId) {
      navigate("/orders");
      return;
    }
    fetchOrder();
  }, [orderId, fetchOrder, navigate]);

  const handleOnlinePayment = async () => {
    setProcessing(true);
    setError("");
    try {
      // initiate payment — get razorpay order
      const res = await api.post("/payment/initiate", { orderId, method });
      const { razorpayOrder, key } = res.data;

      // load razorpay script
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key,
          amount: razorpayOrder.amount,
          currency: "INR",
          name: "Munchy",
          description: `Order #${orderId.slice(-4).toUpperCase()}`,
          order_id: razorpayOrder.id,
          handler: async (response) => {
            try {
              // verify payment
              await api.post("/payment/verify", {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                orderId,
              });
              navigate(`/orders/${orderId}`, { replace: true });
            } catch (err) {
              setError("Payment verification failed. Contact support.");
            }
          },
          prefill: {},
          theme: { color: "#FF5352" },
          modal: {
            ondismiss: () => setProcessing(false),
          },
        };

        const rzp = new window.Razorpay(options);
        rzp.open();
      };
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed");
      setProcessing(false);
    }
  };

  const handleCashPayment = async () => {
    setProcessing(true);
    setError("");
    try {
      await api.post("/payment/cash", { orderId });
      navigate(`/orders/${orderId}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Error selecting cash payment");
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
          payments
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-10">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-slate border-b border-glass-border">
        <button onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-on-surface hover:text-primary transition-colors">
            arrow_back
          </span>
        </button>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
          Payment
        </h1>
        <div className="w-6" />
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
        {/* Order Summary */}
        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-label-bold text-on-surface-variant font-inter uppercase mb-3">
            Order Summary
          </h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-montserrat text-title-md text-on-surface">
                {order?.store?.name}
              </p>
              <p className="text-body-md text-on-surface-variant mt-1">
                {order?.items?.length} items • Order #
                {orderId?.slice(-4).toUpperCase()}
              </p>
            </div>
            <p className="font-montserrat text-headline-lg-mobile text-primary font-bold">
              ₹{order?.totalPrice}
            </p>
          </div>
        </div>

        {/* Payment Method */}
        <div className="glass-panel rounded-xl p-4 space-y-3">
          <h3 className="text-label-bold text-on-surface-variant font-inter uppercase">
            Payment Method
          </h3>

          {[
            {
              id: "upi",
              icon: "smartphone",
              label: "UPI",
              desc: "Pay via any UPI app",
            },
            {
              id: "card",
              icon: "credit_card",
              label: "Card",
              desc: "Credit or Debit card",
            },
            {
              id: "cash",
              icon: "currency_rupee",
              label: "Cash Pickup",
              desc: "Pay when you collect your order",
            },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all active:scale-[0.98] ${
                method === m.id
                  ? "border-primary bg-primary/5 neon-glow-red"
                  : "border-glass-border bg-surface-container hover:border-primary/30"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  method === m.id
                    ? "bg-primary-container text-on-primary-container"
                    : "bg-surface-container-high text-on-surface-variant"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  {m.icon}
                </span>
              </div>
              <div className="text-left flex-1">
                <p
                  className={`font-montserrat text-title-md ${
                    method === m.id ? "text-primary" : "text-on-surface"
                  }`}
                >
                  {m.label}
                </p>
                <p className="text-body-md text-on-surface-variant mt-0.5">
                  {m.desc}
                </p>
              </div>
              <div
                className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  method === m.id
                    ? "border-primary"
                    : "border-on-surface-variant"
                }`}
              >
                {method === m.id && (
                  <div className="w-3 h-3 rounded-full bg-primary" />
                )}
              </div>
            </button>
          ))}
        </div>

        {error && (
          <p className="text-status-error text-body-md px-1">{error}</p>
        )}

        {/* Pay Button */}
        <button
          onClick={method === "cash" ? handleCashPayment : handleOnlinePayment}
          disabled={processing}
          className="w-full bg-primary-container text-on-primary-container font-montserrat font-bold text-title-md py-4 rounded-xl neon-glow-red disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {method === "cash" ? "local_mall" : "payments"}
          </span>
          {processing
            ? "Processing..."
            : method === "cash"
              ? "Confirm Cash Pickup"
              : `Pay ₹${order?.totalPrice}`}
        </button>

        <p className="text-center text-label-bold text-on-surface-variant font-inter">
          🔒 Payments secured by Razorpay
        </p>
      </main>
    </div>
  );
}
