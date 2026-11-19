import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { ClipboardList, CreditCard } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './OrdersPage.module.css';

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders().then(r => r.data),
  });

  const orders = data?.orders || [];
  const navigate = useNavigate();

  const handlePayNow = (e, order) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/checkout?orderId=${order._id}&pay=1`);
  };

  return (
    <div className={styles.page}>
      <Header title="Orders" showLocation={false} />

      <div className={styles.content}>
        {isLoading && <p className={styles.dim}>Loading...</p>}
        {!isLoading && orders.length === 0 && (
          <div className={styles.empty}>
            <ClipboardList size={48} strokeWidth={1} />
            <p>No orders yet.</p>
          </div>
        )}
        {orders.map(order => (
          <Link key={order._id} to={`/orders/${order._id}`} className={styles.card}>
            <div className={styles.cardTop}>
              <span className={styles.orderId}>ORDER #{order._id.slice(-4).toUpperCase()}</span>
              <span className={`${styles.status} ${styles[`status_${order.status}`] || ''}`}>
                ● {order.status.replace('_', ' ').toUpperCase()}
              </span>
            </div>
            <p className={styles.storeName}>{order.store?.name}</p>
            <p className={styles.items}>
              {order.items.map(i => i.food?.name).filter(Boolean).join(', ')}
            </p>
            <div className={styles.cardBottom}>
              <span className={styles.total}>₹{order.totalPrice}</span>
              {order.needsPayment && (
                <button
                  className={styles.payBtn}
                  onClick={(e) => handlePayNow(e, order)}
                >
                  <CreditCard size={14} /> Pay Now
                </button>
              )}
              <span className={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
