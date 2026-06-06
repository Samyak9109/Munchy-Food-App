import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useCartStore } from "../../store/cartStore";
import { useChatStore } from "../../store/chatStore";
import api from "../../api/axios";

const MOOD_CHIPS = [
  { label: "Stressed 😫", message: "I'm stressed and need comfort food" },
  { label: "Hungry! 🤤", message: "I'm really hungry, what's good?" },
  {
    label: "Date Night 🕯️",
    message: "I need something romantic for a date night",
  },
  { label: "Healthy 🥗", message: "I want something healthy and light" },
  { label: "Spicy 🌶️", message: "I'm craving something really spicy" },
  { label: "Sweet Tooth 🍰", message: "I want something sweet for dessert" },
];

export default function ChatbotPage() {
  const navigate = useNavigate();
  const { setCart } = useCartStore();
  const { conversationHistory, setHistory, clearHistory } = useChatStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [userCoords, setUserCoords] = useState(null);
  const [addingToCart, setAddingToCart] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // get user location for nearby recommendations
    navigator.geolocation?.getCurrentPosition(
      (pos) =>
        setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
    );
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conversationHistory, loading]);

  const sendMessage = useCallback(
    async (message) => {
      if (!message.trim() || loading) return;

      const userMessage = { role: "user", content: message };
      const updatedHistory = [...conversationHistory, userMessage];
      setHistory(updatedHistory);
      setInput("");
      setLoading(true);

      try {
        const res = await api.post("/chatbot", {
          message,
          lat: userCoords?.lat,
          lng: userCoords?.lng,
          conversationHistory,
        });

        setHistory(res.data.conversationHistory);
      } catch (err) {
        const errorMessage = {
          role: "assistant",
          content:
            "Sorry, I'm having trouble connecting right now. Try again in a moment! 🍕",
        };
        setHistory([...updatedHistory, errorMessage]);
      } finally {
        setLoading(false);
      }
    },
    [conversationHistory, loading, setHistory, userCoords],
  );

  const handleAddToCart = async (foodId, foodName) => {
    setAddingToCart(foodId);
    try {
      const res = await api.post("/cart/add", { foodId, quantity: 1 });
      setCart(res.data.cart);
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToCart(null);
    }
  };

  // parse food recommendations from AI response
  const parseRecommendations = (content) => {
    // look for food items with prices like ₹XX or $XX
    const priceRegex = /[₹$][\d,]+/g;
    return priceRegex.test(content);
  };

  return (
    <div className="min-h-dvh bg-background text-on-surface flex flex-col">
      {/* TopBar */}
      <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 h-16 bg-gradient-to-b from-black/50 to-transparent">
        <span
          className="material-symbols-outlined text-primary"
          style={{ fontVariationSettings: "'FILL' 1" }}
        >
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

      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-container/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-container/10 rounded-full blur-[100px]" />
      </div>

      {/* Messages */}
      <main
        className="flex-1 overflow-y-auto pt-20 pb-[160px] px-4 flex flex-col gap-4 relative z-10"
        style={{ scrollbarWidth: "none" }}
      >
        {/* Greeting — always shown */}
        <div className="flex items-start gap-3 w-full max-w-[85%] self-start">
          <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 neon-glow-red">
            <span className="material-symbols-outlined text-on-primary-container text-sm">
              smart_toy
            </span>
          </div>
          <div className="bg-surface-slate border border-glass-border rounded-2xl rounded-tl-sm p-4 text-on-surface">
            <p className="text-body-md font-inter">
              Tell me how you feel, I will find your meal. 🍕
            </p>
          </div>
        </div>

        {/* Conversation history */}
        {conversationHistory.map((msg, i) => (
          <div
            key={i}
            className={`flex items-end gap-3 w-full max-w-[85%] ${
              msg.role === "user" ? "self-end flex-row-reverse" : "self-start"
            }`}
          >
            {/* Avatar */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === "user"
                  ? "bg-surface-variant"
                  : "bg-primary-container neon-glow-red"
              }`}
            >
              <span className="material-symbols-outlined text-sm text-on-surface-variant">
                {msg.role === "user" ? "person" : "smart_toy"}
              </span>
            </div>

            {/* Message bubble */}
            <div
              className={`rounded-2xl p-4 text-on-surface ${
                msg.role === "user"
                  ? "bg-surface-variant rounded-tr-sm"
                  : "bg-surface-slate border border-glass-border rounded-tl-sm"
              }`}
            >
              <p className="text-body-md font-inter whitespace-pre-wrap">
                {msg.content}
              </p>
            </div>
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex items-start gap-3 w-full max-w-[85%] self-start">
            <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center shrink-0 neon-glow-red">
              <span className="material-symbols-outlined text-on-primary-container text-sm">
                smart_toy
              </span>
            </div>
            <div className="bg-surface-slate border border-glass-border rounded-2xl rounded-tl-sm p-4">
              <div className="flex gap-1 items-center h-5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-primary rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* Bottom Input Area */}
      <div className="fixed bottom-0 w-full bg-surface-slate/90 backdrop-blur-xl border-t border-glass-border p-4 pb-8 z-40 flex flex-col gap-3">
        {/* Mood Chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1"
          style={{ scrollbarWidth: "none" }}
        >
          {MOOD_CHIPS.map((chip) => (
            <button
              key={chip.label}
              onClick={() => sendMessage(chip.message)}
              disabled={loading}
              className="shrink-0 bg-surface-variant border border-glass-border rounded-xl px-4 py-2 text-label-bold font-inter text-on-surface hover:bg-surface-bright transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {chip.label}
            </button>
          ))}

          {/* Clear chat */}
          {conversationHistory.length > 0 && (
            <button
              onClick={clearHistory}
              className="shrink-0 bg-status-error/10 border border-status-error/20 rounded-xl px-4 py-2 text-label-bold font-inter text-status-error hover:bg-status-error/20 transition-colors whitespace-nowrap"
            >
              Clear 🗑️
            </button>
          )}
        </div>

        {/* Input */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Type or tap a mood..."
            className="w-full bg-surface border border-glass-border rounded-xl py-3 pl-4 pr-12 text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/50 transition-all"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || loading}
            className="absolute right-2 w-8 h-8 flex items-center justify-center rounded-full bg-primary text-on-primary hover:bg-primary-fixed transition-colors active:scale-90 disabled:opacity-50"
          >
            <span
              className="material-symbols-outlined text-[20px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              arrow_upward
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
