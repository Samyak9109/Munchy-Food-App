import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Film, ClipboardList, TrendingUp, Store } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './DashboardPage.module.css';

const STATUS_COLOR = { placed: '#ffdb3c', confirmed: 'var(--primary)', ready: 'var(--success)', pickedup: 'var(--text-dim)', cancelled: 'var(--error)' };
const STATUS_LABEL = { placed: 'New', confirmed: 'Preparing', ready: 'Ready', pickedup: 'Done', cancelled: 'Cancelled' };

export default function DashboardPage() {
  const { user, setAuth, role } = useAuthStore();
  const qc = useQueryClient();

  // user.stores[0] is populated after our auth fix (login / verifyEmail / refreshToken).
  // NEVER fall back to user.id — that is the partner's own DB _id, not a store id.
  const cachedStoreId = user?.stores?.[0] || null;

  // ── Self-heal: if stores[] is missing from cached session, fetch via /store/partner/my-store ──
  const { data: myStoreData } = useQuery({
    queryKey: ['my-store-self-heal'],
    queryFn: () => api.getMyStore().then(r => r.data),
    enabled: !cachedStoreId,          // only run when cache is stale
    retry: false,
    onSuccess: (data) => {
      if (data.store?._id) {
        // Patch authStore so subsequent navigations use the correct storeId
        const updatedUser = { ...user, stores: [data.store._id] };
        setAuth(updatedUser, localStorage.getItem('accessToken'), 'partner');
        qc.invalidateQueries({ queryKey: ['my-store'] });
      }
    },
  });

  const storeId = cachedStoreId || myStoreData?.store?._id || null;

  const { data: storeData, isLoading: storeLoading } = useQuery({
    queryKey: ['my-store', storeId],
    queryFn: () => api.getStoreById(storeId).then(r => r.data),
    enabled: !!storeId,
    retry: false,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['store-orders', storeId],
    queryFn: () => api.getStoreOrders(storeId).then(r => r.data),
    enabled: !!storeId,
    refetchInterval: 15000,
  });

  const { data: stats } = useQuery({
    queryKey: ['daily-stats', storeId],
    queryFn: () => api.getDailyStats(storeId).then(r => r.data),
    enabled: !!storeId,
    retry: false,
  });

  const toggleStatus = useMutation({
    mutationFn: () => api.toggleStoreStatus(storeId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-store'] }),
  });

  const store = storeData?.store;
  const orders = ordersData?.orders || [];
  const activeOrders = orders.filter(o => ['placed', 'confirmed', 'ready'].includes(o.status));
  const salesToday = stats?.totalRevenue || 0;

  // Still loading (either cache or self-heal)
  if (storeLoading && !store) {
    return (
      <div className={styles.page}>
        <Header title="Munchy" />
        <div className={styles.content}>
          <p className={styles.dim}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Partner genuinely has no store — redirect to create
  if (!storeLoading && !storeId && !myStoreData?.store) {
    return (
      <div className={styles.page}>
        <Header title="Munchy" />
        <div className={styles.content}>
          <div className={styles.welcome}>
            <Store size={40} style={{ color: 'var(--primary)', marginBottom: 8 }} />
            <h2>No Kitchen Found</h2>
            <p>You haven't set up your kitchen yet.</p>
            <Link to="/partner/store" className={styles.uploadBtn} style={{ marginTop: 16 }}>
              Create Your Kitchen →
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
            disabled={toggleStatus.isPending || !storeId}
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
              <OrderCard key={order._id} order={order} />
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
