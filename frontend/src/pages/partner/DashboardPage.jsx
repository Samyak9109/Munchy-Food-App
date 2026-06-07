import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Film, ClipboardList, TrendingUp, ToggleRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './DashboardPage.module.css';

const STATUS_COLOR = { placed: '#ffdb3c', confirmed: 'var(--primary)', ready: 'var(--success)', pickedup: 'var(--text-dim)', cancelled: 'var(--error)' };
const STATUS_LABEL = { placed: 'New', confirmed: 'Preparing', ready: 'Ready', pickedup: 'Done', cancelled: 'Cancelled' };

export default function DashboardPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const storeId = user?.stores?.[0];

  if (!storeId) {
    return (
      <div className={styles.page}>
        <Header title="Dashboard" />
        <div className={styles.empty}>
          <p>You haven't created a store yet.</p>
          <Link to="/partner/store">Create Your Store →</Link>
        </div>
      </div>
    );
  }

  const { data: storeData } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => api.getStoreById(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['store-orders', storeId],
    queryFn: () => api.getStoreOrders(storeId).then(r => r.data),
    enabled: !!storeId,
    refetchInterval: 15000, // poll every 15s
  });

  const { data: stats } = useQuery({
    queryKey: ['daily-stats', storeId],
    queryFn: () => api.getDailyStats(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const toggleStatus = useMutation({
    mutationFn: () => api.toggleStoreStatus(storeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-store'] }),
  });

  const store = storeData?.store;
  const orders = ordersData?.orders || [];
  const activeOrders = orders.filter(o => ['placed', 'confirmed', 'ready'].includes(o.status));
  const salesToday = stats?.totalRevenue || 0;

  return (
    <div className={styles.page}>
      <Header title="Munchy" />

      <div className={styles.content}>
        <div className={styles.welcome}>
          <h2>Partner Hub</h2>
          <p>Manage your high-energy kitchen</p>
        </div>

        {/* Upload reel CTA */}
        <Link to="/partner/reels/new" className={styles.uploadBtn}>
          <Film size={20} />
          Upload New Reel
        </Link>

        {/* Stats grid */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <ClipboardList size={18} style={{ color: 'var(--yellow)' }} />
              <span style={{ color: 'var(--yellow)' }}>Active Orders</span>
            </div>
            <p className={styles.statValue}>{activeOrders.length}</p>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statHeader}>
              <TrendingUp size={18} style={{ color: 'var(--success)' }} />
              <span style={{ color: 'var(--success)' }}>Sales Today</span>
            </div>
            <p className={styles.statValue}>₹{salesToday.toLocaleString()}</p>
          </div>
        </div>

        {/* Kitchen status toggle */}
        <div className={styles.statusCard}>
          <div>
            <p className={styles.statusTitle}>Kitchen Status</p>
            <p className={styles.statusSub}>
              {store?.isOpen ? 'Accepting new orders' : 'Kitchen is closed'}
            </p>
          </div>
          <button
            className={`${styles.toggle} ${store?.isOpen ? styles.toggleOn : ''}`}
            onClick={() => toggleStatus.mutate()}
            disabled={toggleStatus.isPending}
          >
            <span className={styles.toggleThumb} />
          </button>
        </div>

        {/* Live orders */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h3>Live Orders</h3>
            <Link to="/partner/orders" className={styles.viewAll}>View All</Link>
          </div>

          {activeOrders.length === 0 ? (
            <p className={styles.dim}>No active orders right now.</p>
          ) : (
            activeOrders.slice(0, 5).map(order => (
              <OrderCard key={order._id} order={order} storeId={storeId} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order }) {
  const qc = useQueryClient();
  const statusColor = STATUS_COLOR[order.status] || 'var(--text-dim)';

  const updateStatus = useMutation({
    mutationFn: (status) => api.updateOrderStatus(order._id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-orders'] }),
  });

  return (
    <Link to={`/partner/orders/${order._id}`} className={styles.orderCard}>
      <div className={styles.orderLeft} style={{ borderColor: statusColor }} />
      <div className={styles.orderInfo}>
        <div className={styles.orderTop}>
          <span className={styles.orderNum}>ORDER #{order._id.slice(-4).toUpperCase()}</span>
          <span className={styles.orderStatus} style={{ color: statusColor, borderColor: statusColor }}>
            ● {STATUS_LABEL[order.status]}
          </span>
        </div>
        <p className={styles.customerName}>{order.user?.name || 'Customer'}</p>
        <p className={styles.orderMeta}>
          🕐 {order.status === 'ready' ? 'Customer arriving' : 'Pickup in ~15m'} →
        </p>
      </div>
    </Link>
  );
}
