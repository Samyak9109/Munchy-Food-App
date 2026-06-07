import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './OrdersPage.module.css';

const STATUS_COLOR = {
  placed:     'var(--text-dim)',
  confirmed:  'var(--primary)',
  ready:      'var(--yellow)',
  pickedup:   'var(--success)',
  cancelled:  'var(--error)',
};

export default function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['orders'],
    queryFn: () => api.getOrders().then(r => r.data),
  });

  const orders = data?.orders || [];

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
              <span className={styles.status} style={{ color: STATUS_COLOR[order.status] }}>
                ● {order.status.toUpperCase()}
              </span>
            </div>
            <p className={styles.storeName}>{order.store?.name}</p>
            <p className={styles.items}>
              {order.items.map(i => i.food?.name).filter(Boolean).join(', ')}
            </p>
            <div className={styles.cardBottom}>
              <span className={styles.total}>₹{order.totalPrice}</span>
              <span className={styles.date}>{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
