import { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { SendHorizontal, Bot } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './ChatbotPage.module.css';

const MOODS = ['Stressed 😩', 'Hungry! 🤤', 'Date Night 🕯️', 'Lazy 😴', 'Celebrate 🎉'];

export default function ChatbotPage() {
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Tell me how you feel, I will find your meal. 🍕' }
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  const { mutate: send, isPending } = useMutation({
    mutationFn: (msg) => api.sendChatMessage({ message: msg }),
    onSuccess: (res) => {
      setMessages(prev => [...prev, {
        role: 'bot',
        text: res.data.reply || res.data.message,
        foods: res.data.recommendations || [],
      }]);
    },
    onError: () => {
      setMessages(prev => [...prev, { role: 'bot', text: 'Oops! Try again 😅' }]);
    },
  });

  const handleSend = (msg) => {
    const text = msg || input.trim();
    if (!text) return;
    setMessages(prev => [...prev, { role: 'user', text }]);
    setInput('');
    send(text);
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className={styles.page}>
      <Header title="AI Mood" />

      <div className={styles.messages}>
        {messages.map((m, i) => (
          <div key={i} className={`${styles.msgRow} ${m.role === 'user' ? styles.userRow : ''}`}>
            {m.role === 'bot' && (
              <span className={styles.botAvatar}><Bot size={16} /></span>
            )}
            <div className={styles.bubble}>
              <p>{m.text}</p>
              {m.foods?.length > 0 && (
                <div className={styles.foodCards}>
                  {m.foods.map(f => (
                    <FoodCard key={f._id} food={f} />
                  ))}
                </div>
              )}
            </div>
            {m.role === 'user' && <span className={styles.userAvatar} />}
          </div>
        ))}
        {isPending && (
          <div className={styles.msgRow}>
            <span className={styles.botAvatar}><Bot size={16} /></span>
            <div className={styles.bubble}><p className={styles.typing}>···</p></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mood chips */}
      <div className={styles.chips}>
        {MOODS.map(m => (
          <button key={m} className={styles.chip} onClick={() => handleSend(m)}>{m}</button>
        ))}
      </div>

      {/* Input */}
      <div className={styles.inputRow}>
        <input
          className={styles.input}
          placeholder="Type or tap a mood..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
        />
        <button
          className={styles.sendBtn}
          onClick={() => handleSend()}
          disabled={isPending || !input.trim()}
        >
          <SendHorizontal size={18} />
        </button>
      </div>
    </div>
  );
}

function FoodCard({ food }) {
  return (
    <Link to={`/food/${food._id}`} className={styles.foodCard}>
      {food.image && <img src={food.image} alt={food.name} className={styles.foodImg} />}
      <span className={styles.matchBadge}>⚡ {food.match || 98}% Match</span>
      <div className={styles.foodInfo}>
        <p className={styles.foodName}>{food.name}</p>
        <p className={styles.foodStore}>🏪 {food.store?.name} · {food.distance || '—'}</p>
        <div className={styles.foodBottom}>
          <span className={styles.foodPrice}>₹{food.price}</span>
          <button className={styles.addBtn} onClick={e => e.preventDefault()}>+</button>
        </div>
      </div>
    </Link>
  );
}
