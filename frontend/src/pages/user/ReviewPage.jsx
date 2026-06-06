import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../../api/axios";

export default function ReviewPage() {
  const navigate = useNavigate();
  const { orderId } = useParams();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [reviews, setReviews] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const fetchOrder = useCallback(async () => {
    try {
      const res = await api.get(`/order/${orderId}`);
      setOrder(res.data.order);
      // init reviews map with default values
      const init = {};
      res.data.order.items?.forEach((item) => {
        init[item.food._id] = { rating: 0, comment: "" };
      });
      setReviews(init);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleRating = (foodId, rating) => {
    setReviews((prev) => ({ ...prev, [foodId]: { ...prev[foodId], rating } }));
  };

  const handleComment = (foodId, comment) => {
    setReviews((prev) => ({ ...prev, [foodId]: { ...prev[foodId], comment } }));
  };

  const handleSubmit = async () => {
    // validate at least one rating
    const hasRating = Object.values(reviews).some((r) => r.rating > 0);
    if (!hasRating) {
      setError("Please rate at least one item");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // submit reviews for each rated item
      await Promise.all(
        Object.entries(reviews)
          .filter(([, r]) => r.rating > 0)
          .map(([foodId, r]) =>
            api.post("/review", {
              foodId,
              storeId: order.store._id,
              rating: r.rating,
              comment: r.comment,
            }),
          ),
      );
      setSubmitted(true);
    } catch (err) {
      setError(err.response?.data?.message || "Error submitting reviews");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <span className="material-symbols-outlined text-primary text-4xl animate-pulse">
          star
        </span>
      </div>
    );
  }

  // Success screen
  if (submitted) {
    return (
      <div className="min-h-dvh bg-background flex flex-col items-center justify-center px-4 gap-6">
        <div className="w-20 h-20 rounded-full bg-secondary-container flex items-center justify-center neon-glow-yellow">
          <span
            className="material-symbols-outlined text-on-secondary text-4xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
        </div>
        <div className="text-center space-y-2">
          <h2 className="font-montserrat text-headline-lg-mobile text-on-surface">
            Thanks for the review!
          </h2>
          <p className="text-body-md text-on-surface-variant">
            Your feedback helps others discover great food
          </p>
        </div>
        <button
          onClick={() => navigate("/")}
          className="bg-primary-container text-on-primary-container font-montserrat font-bold px-8 py-3 rounded-full neon-glow-red active:scale-[0.98] transition-all"
        >
          Back to Feed
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-on-surface pb-10">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-surface-slate border-b border-glass-border">
        <button onClick={() => navigate(-1)}>
          <span className="material-symbols-outlined text-on-surface hover:text-primary">
            arrow_back
          </span>
        </button>
        <h1 className="font-montserrat text-headline-lg-mobile font-bold text-primary">
          Leave a Review
        </h1>
        <div className="w-6" />
      </header>

      <main className="pt-20 px-4 max-w-2xl mx-auto space-y-4">
        {/* Store */}
        <div className="flex items-center gap-3 py-2">
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            storefront
          </span>
          <div>
            <p className="text-label-bold text-on-surface-variant font-inter uppercase">
              Reviewing
            </p>
            <p className="font-montserrat text-title-md text-on-surface">
              {order?.store?.name}
            </p>
          </div>
        </div>

        {/* Review each item */}
        {order?.items?.map((item) => (
          <div
            key={item.food._id}
            className="bg-surface-slate rounded-xl p-4 border border-glass-border space-y-4"
          >
            {/* Food info */}
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg overflow-hidden shrink-0">
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
              <div>
                <p className="font-inter text-body-lg text-on-surface font-bold">
                  {item.food?.name}
                </p>
                <p className="text-body-md text-on-surface-variant">
                  ₹{item.price}
                </p>
              </div>
            </div>

            {/* Star Rating */}
            <div className="space-y-2">
              <p className="text-label-bold text-on-surface-variant font-inter uppercase">
                Rating
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => handleRating(item.food._id, star)}
                    className="active:scale-90 transition-transform"
                  >
                    <span
                      className={`material-symbols-outlined text-3xl transition-colors ${
                        star <= (reviews[item.food._id]?.rating || 0)
                          ? "text-secondary-container"
                          : "text-on-surface-variant"
                      }`}
                      style={{
                        fontVariationSettings:
                          star <= (reviews[item.food._id]?.rating || 0)
                            ? "'FILL' 1"
                            : "'FILL' 0",
                      }}
                    >
                      star
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div className="space-y-2">
              <p className="text-label-bold text-on-surface-variant font-inter uppercase">
                Comment (optional)
              </p>
              <textarea
                value={reviews[item.food._id]?.comment || ""}
                onChange={(e) => handleComment(item.food._id, e.target.value)}
                placeholder="How was it?"
                rows={2}
                className="w-full bg-surface-container-low border border-glass-border rounded-xl px-4 py-3 text-body-md text-on-surface focus:border-primary outline-none transition-all resize-none placeholder:text-on-surface-variant/50"
              />
            </div>
          </div>
        ))}

        {error && <p className="text-status-error text-body-md">{error}</p>}

        {/* Submit */}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-secondary-container text-on-secondary font-montserrat font-bold text-title-md py-4 rounded-xl neon-glow-yellow disabled:opacity-50 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          {submitting ? "Submitting..." : "Submit Reviews"}
        </button>
      </main>
    </div>
  );
}
