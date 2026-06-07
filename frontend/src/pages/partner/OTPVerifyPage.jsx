import { useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle, Phone } from 'lucide-react';
import * as api from '../../api/index';
import styles from './OTPVerifyPage.module.css';

export default function OTPVerifyPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const inputRefs = useRef([]);

  const { data } = useQuery({
    queryKey: ['order', orderId],
    queryFn: () => api.getOrderById(orderId).then(r => r.data),
  });

  const verify = useMutation({
    mutationFn: () => api.verifyPickupOTP(orderId, { otp: otp.join('') }),
    onSuccess: () => navigate('/partner/dashboard'),
    onError: (err) => setError(err.response?.data?.message || 'Invalid OTP'),
  });

  const handleDigit = (val, idx) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...otp];
    next[idx] = val;
    setOtp(next);
    setError('');
    if (val && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleKeyDown = (e, idx) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const order = data?.order;
  const otpFull = otp.join('').length === 6;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.back} onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className={styles.title}>Order #{orderId?.slice(-4).toUpperCase()}</h1>
        <div style={{ width: 36 }} />
      </div>

      {/* Ready banner */}
      <div className={styles.readyBanner}>
        <div>
          <p className={styles.readyTitle}>Ready for Pickup</p>
          <p className={styles.readySub}>Waiting for customer verification</p>
        </div>
        <span className={styles.readyIcon}>⏱</span>
      </div>

      {/* Customer */}
      {order?.user && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>CUSTOMER DETAILS</p>
          <div className={styles.customerCard}>
            <div className={styles.customerAvatar}>
              {order.user.avatar
                ? <img src={order.user.avatar} alt={order.user.name} />
                : order.user.name?.[0]
              }
            </div>
            <div className={styles.customerInfo}>
              <p className={styles.customerName}>{order.user.name}</p>
              {order.user.phone && <p className={styles.customerPhone}>📱 {order.user.phone}</p>}
            </div>
            {order.user.phone && (
              <a href={`tel:${order.user.phone}`} className={styles.callBtn}><Phone size={18} /></a>
            )}
          </div>
        </div>
      )}

      {/* Order items */}
      {order?.items && (
        <div className={styles.section}>
          <p className={styles.sectionLabel}>ORDER CONTENTS</p>
          <div className={styles.itemsCard}>
            {order.items.map((item, i) => (
              <div key={i} className={`${styles.item} ${i < order.items.length - 1 ? styles.itemBorder : ''}`}>
                <span className={styles.qty}>{item.quantity}x</span>
                <div>
                  <p className={styles.itemName}>{item.food?.name}</p>
                  {item.note && <p className={styles.itemNote}>{item.note}</p>}
                </div>
              </div>
            ))}
            <div className={styles.total}>
              <span>Total Items: {order.items.reduce((a, i) => a + i.quantity, 0)}</span>
              <span className={styles.totalAmt}>₹{order.totalPrice}</span>
            </div>
          </div>
        </div>
      )}

      {/* OTP input */}
      <div className={styles.section}>
        <div className={styles.otpCard}>
          <h2>Verify Customer Pickup</h2>
          <p>Ask the customer for their 6-digit order code to release the food.</p>

          <div className={styles.otpRow}>
            {otp.map((d, i) => (
              <>
                {i === 3 && <span key="dash" className={styles.dash}>-</span>}
                <input
                  key={i}
                  ref={el => inputRefs.current[i] = el}
                  className={`${styles.otpInput} ${d ? styles.otpFilled : ''}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={e => handleDigit(e.target.value, i)}
                  onKeyDown={e => handleKeyDown(e, i)}
                />
              </>
            ))}
          </div>

          {error && <p className={styles.error}>{error}</p>}

          <button
            className={styles.confirmBtn}
            onClick={() => verify.mutate()}
            disabled={!otpFull || verify.isPending}
          >
            <CheckCircle size={20} />
            {verify.isPending ? 'Verifying...' : 'Confirm Pickup'}
          </button>
        </div>
      </div>
    </div>
  );
}
