import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Banknote, CreditCard } from 'lucide-react';
import * as api from '../../api/index';
import styles from './CheckoutPage.module.css';

// Lazily inject the Razorpay SDK only when a payment is actually triggered.
// This avoids the flood of preload warnings that occur when checkout.js is
// loaded eagerly on every page via index.html.
function loadRazorpay() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

const PAYMENT_METHODS = [
  { id: 'razorpay', icon: CreditCard, label: 'Card / UPI', sub: 'Razorpay secure checkout' },
  { id: 'cash',     icon: Banknote,   label: 'Cash on Pickup', sub: 'Pay when you collect' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [searchParams] = useSearchParams();
  const [payMethod, setPayMethod] = useState('cash');
  const [note, setNote] = useState('');
  const [payError, setPayError] = useState(null);

  // When re-paying a pending_payment order, skip cart
  const existingOrderId = searchParams.get('orderId');
  const isRepay = searchParams.get('pay') === '1' && existingOrderId;

  const { data } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart().then(r => r.data),
    enabled: !isRepay,
  });

  const { data: orderData } = useQuery({
    queryKey: ['order', existingOrderId],
    queryFn: () => api.getOrderById(existingOrderId).then(r => r.data),
    enabled: !!isRepay,
  });

  const cart = data?.cart;
  const repayOrder = orderData?.order;

  // Get server-side preview totals instead of client-side math
  const { data: preview } = useQuery({
    queryKey: ['orderPreview'],
    queryFn: () => api.getOrderPreview().then(r => r.data),
    enabled: !isRepay && !!cart && cart.items?.length > 0,
  });

  const placeOrder = useMutation({
    mutationFn: () => api.placeOrder({
      storeId: cart.store._id,
      paymentMethod: payMethod,
      note,
    }),
    onSuccess: async (res) => {
      const order = res.data.order;
      if (payMethod === 'razorpay') {
        await openRazorpay(order._id);
      } else {
        await api.cashPayment({ orderId: order._id });
        qc.invalidateQueries({ queryKey: ['cart'] });
        navigate(`/orders/${order._id}`);
      }
    },
    onError: (err) => {
      setPayError(err.response?.data?.message || 'Order failed');
    },
  });

  // Open Razorpay checkout for an order. Handles dismiss, failure, verify errors.
  const openRazorpay = async (orderId) => {
    setPayError(null);
    try {
      const loaded = await loadRazorpay();
      if (!loaded) {
        setPayError('Failed to load Razorpay SDK. Check internet connection.');
        return;
      }

      const payRes = await api.initiatePayment({ orderId });
      const { razorpayOrder, key } = payRes.data;

      const options = {
        key: key || import.meta.env.VITE_RAZORPAY_KEY,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        order_id: razorpayOrder.id,
        handler: async (response) => {
          try {
            await api.verifyPayment({ orderId, ...response });
            qc.invalidateQueries({ queryKey: ['cart'] });
            qc.invalidateQueries({ queryKey: ['orders'] });
            navigate(`/orders/${orderId}`);
          } catch (err) {
            setPayError('Payment verification failed. Please try again.');
          }
        },
        modal: {
          ondismiss: () => {
            setPayError('Payment cancelled. You can retry from Orders.');
          },
        },
        theme: { color: '#FF5352' },
      };
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setPayError(err.response?.data?.message || 'Payment initiation failed');
    }
  };

  // Re-pay flow: open Razorpay for existing pending_payment order
  useEffect(() => {
    if (isRepay && repayOrder && repayOrder.status === 'pending_payment') {
      openRazorpay(repayOrder._id);
    }
  }, [isRepay, repayOrder]);

  if (!isRepay && (!cart || cart.items?.length === 0)) {
    navigate('/cart');
    return null;
  }

  if (isRepay && !repayOrder) {
    return <div className={styles.page}><p>Loading order...</p></div>;
  }

  // Server-side totals (never client-side math)
  const subtotal = isRepay
    ? repayOrder.subtotal
    : preview?.subtotal ?? cart?.totalPrice ?? 0;
  const tax = isRepay
    ? repayOrder.tax
    : preview?.tax ?? Math.round(subtotal * 0.05);
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

        {(placeOrder.error || payError) && (
          <p className={styles.error}>{payError || placeOrder.error.response?.data?.message || 'Order failed'}</p>
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
