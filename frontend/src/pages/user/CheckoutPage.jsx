import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Wallet, Banknote, CreditCard } from 'lucide-react';
import * as api from '../../api/index';
import styles from './CheckoutPage.module.css';

const PAYMENT_METHODS = [
  { id: 'razorpay', icon: CreditCard, label: 'Card / UPI', sub: 'Razorpay secure checkout' },
  { id: 'cash',     icon: Banknote,   label: 'Cash on Pickup', sub: 'Pay when you collect' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [payMethod, setPayMethod] = useState('cash');
  const [note, setNote] = useState('');

  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart().then(r => r.data),
  });

  const cart = data?.cart;

  const placeOrder = useMutation({
    mutationFn: () => api.placeOrder({
      storeId: cart.store._id,
      paymentMethod: payMethod,
      note,
    }),
    onSuccess: async (res) => {
      const order = res.data.order;
      if (payMethod === 'razorpay') {
        // Initiate Razorpay
        const payRes = await api.initiatePayment({ orderId: order._id });
        const { razorpayOrderId, amount, currency } = payRes.data;
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY,
          amount,
          currency,
          order_id: razorpayOrderId,
          handler: async (response) => {
            await api.verifyPayment({ orderId: order._id, ...response });
            qc.invalidateQueries({ queryKey: ['cart'] });
            navigate(`/orders/${order._id}`);
          },
          theme: { color: '#FF5352' },
        };
        const rzp = new window.Razorpay(options);
        rzp.open();
      } else {
        await api.cashPayment({ orderId: order._id });
        qc.invalidateQueries({ queryKey: ['cart'] });
        navigate(`/orders/${order._id}`);
      }
    },
  });

  if (!cart || cart.items?.length === 0) {
    navigate('/cart');
    return null;
  }

  const subtotal = cart.totalPrice;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + tax;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className={styles.title}>Checkout</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.content}>
        {/* Order summary */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          <div className={styles.storeTag}>🏪 {cart.store?.name}</div>
          {cart.items.map(item => (
            <div key={item.food._id} className={styles.item}>
              <span className={styles.itemQty}>{item.quantity}×</span>
              <span className={styles.itemName}>{item.food.name}</span>
              <span className={styles.itemPrice}>₹{item.price}</span>
            </div>
          ))}
        </div>

        {/* Note */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Special Instructions</h2>
          <textarea
            className={styles.noteInput}
            placeholder="Extra spicy, no onions..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={3}
          />
        </div>

        {/* Payment method */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment</h2>
          <div className={styles.payMethods}>
            {PAYMENT_METHODS.map(({ id, icon: Icon, label, sub }) => (
              <button
                key={id}
                className={`${styles.payOption} ${payMethod === id ? styles.payActive : ''}`}
                onClick={() => setPayMethod(id)}
              >
                <Icon size={20} />
                <div className={styles.payText}>
                  <span className={styles.payLabel}>{label}</span>
                  <span className={styles.paySub}>{sub}</span>
                </div>
                <div className={`${styles.radio} ${payMethod === id ? styles.radioActive : ''}`} />
              </button>
            ))}
          </div>
        </div>

        {/* Totals */}
        <div className={styles.totals}>
          <div className={styles.totalRow}>
            <span>Subtotal</span><span>₹{subtotal}</span>
          </div>
          <div className={styles.totalRow}>
            <span>Tax (5%)</span><span>₹{tax}</span>
          </div>
          <div className={`${styles.totalRow} ${styles.grandTotal}`}>
            <span>Total</span><span>₹{total}</span>
          </div>
        </div>

        {placeOrder.error && (
          <p className={styles.error}>{placeOrder.error.response?.data?.message || 'Order failed'}</p>
        )}

        <button
          className={styles.placeBtn}
          onClick={() => placeOrder.mutate()}
          disabled={placeOrder.isPending}
        >
          {placeOrder.isPending ? 'Placing Order...' : `Place Order · ₹${total}`}
        </button>
      </div>
    </div>
  );
}
