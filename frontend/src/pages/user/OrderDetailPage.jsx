import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MapPin, Store } from 'lucide-react';
import * as api from '../../api/index';
import styles from './OrderDetailPage.module.css';

const STATUS_STEPS = ['placed', 'confirmed', 'ready', 'pickedup'];
const STATUS_LABEL = {
  placed: 'Order Placed',
  confirmed: 'Preparing',
  ready: 'Ready for Pickup',
  pickedup: 'Picked Up',
  cancelled: 'Cancelled',
};

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => api.getOrderById(id).then(r => r.data),
    refetchInterval: (data) => {
      const status = data?.order?.status;
      return ['placed', 'confirmed', 'ready'].includes(status) ? 8000 : false;
    },
  });

  const order = data?.order;

  if (isLoading) return <div className={styles.loading}>Loading order...</div>;
  if (!order) return <div className={styles.loading}>Order not found.</div>;

  const stepIdx = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';
  const showPickupCode = !!order.pickupCode && !isCancelled;

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}><ArrowLeft size={20} /></button>
        <h1 className={styles.title}>Order #{order._id.slice(-4).toUpperCase()}</h1>
        <div style={{ width: 36 }} />
      </div>

      <div className={styles.content}>
        {/* Pickup code is visible only to the customer who owns this order. */}
        {showPickupCode && (
          <div className={styles.otpCard}>
            <div className={styles.mapThumb}>
              <MapPin size={20} />
              <span>3 min away</span>
            </div>
            <div className={styles.readyBadge}>
              {order.status === 'ready' ? '✓ READY FOR PICKUP' : STATUS_LABEL[order.status]?.toUpperCase()}
            </div>
            <p className={styles.otpHint}>Your pickup code</p>
            <div className={styles.otpDigits}>
              {String(order.pickupCode).split('').map((digit, index) => (
                <span key={`${digit}-${index}`} className={styles.digit}>{digit}</span>
              ))}
            </div>
            <p className={styles.otpSub}>Give this code to the kitchen partner when collecting your order.</p>
            {order.store && (
              <div className={styles.storeRow}>
                <Store size={16} />
                <div>
                  <p className={styles.storeName}>{order.store.name}</p>
                  <p className={styles.storeAddr}>
                    {typeof order.store.address === 'string'
                      ? order.store.address
                      : order.store.address?.street}
                  </p>
                </div>
                <button className={styles.dirBtn}>◆</button>
              </div>
            )}
          </div>
        )}

        {/* Status stepper */}
        {!isCancelled && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Order Status</h2>
            <div className={styles.stepper}>
              {STATUS_STEPS.map((step, i) => (
                <div key={step} className={styles.stepRow}>
                  <div className={`${styles.stepDot} ${i <= stepIdx ? styles.stepDone : ''}`}>
                    {i < stepIdx ? '✓' : i + 1}
                  </div>
                  <div className={styles.stepInfo}>
                    <p className={`${styles.stepLabel} ${i === stepIdx ? styles.stepCurrent : ''}`}>
                      {STATUS_LABEL[step]}
                    </p>
                  </div>
                  {i < STATUS_STEPS.length - 1 && (
                    <div className={`${styles.stepLine} ${i < stepIdx ? styles.stepLineDone : ''}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isCancelled && (
          <div className={styles.cancelledBanner}>
            <p>Order Cancelled</p>
          </div>
        )}

        {/* Order summary */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Order Summary</h2>
          <p className={styles.storeTag}>🏪 {order.store?.name}</p>
          {order.items?.map((item, i) => (
            <div key={i} className={styles.item}>
              {item.food?.image && <img src={item.food.image} alt={item.food.name} className={styles.itemImg} />}
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.food?.name}</p>
                {item.note && <p className={styles.itemNote}>{item.note}</p>}
              </div>
              <div className={styles.itemRight}>
                <span className={styles.itemQty}>×{item.quantity}</span>
                <span className={styles.itemPrice}>₹{item.price}</span>
              </div>
            </div>
          ))}
          <div className={styles.totalRow}>
            <span>Total</span>
            <span className={styles.totalAmt}>₹{order.totalPrice}</span>
          </div>
        </div>

        {/* Payment */}
        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Payment</h2>
          <div className={styles.infoRow}>
            <span>Method</span>
            <span>{order.payment?.method || order.paymentMethod || '—'}</span>
          </div>
          <div className={styles.infoRow}>
            <span>Status</span>
            <span className={order.payment?.status === 'paid' ? styles.paid : styles.pending}>
              {order.payment?.status || 'pending'}
            </span>
          </div>
          <div className={styles.infoRow}>
            <span>Date</span>
            <span>{new Date(order.createdAt).toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
