import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './PartnerOrdersPage.module.css';

const TABS = ['active', 'ready', 'pickedup', 'cancelled'];
const STATUS_LABEL = { placed: 'New', confirmed: 'Preparing', ready: 'Ready', pickedup: 'Done', cancelled: 'Cancelled' };
const STATUS_COLOR = { placed: 'var(--yellow)', confirmed: 'var(--primary)', ready: 'var(--success)', pickedup: 'var(--text-muted)', cancelled: 'var(--error)' };

export default function PartnerOrdersPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState('active');
  const storeId = user?.stores?.[0] || null;

  const { data, isLoading } = useQuery({
    queryKey: ['store-orders', storeId],
    queryFn: () => api.getStoreOrders(storeId).then(r => r.data),
    enabled: !!storeId,
    refetchInterval: 10000,
  });

  const updateStatus = useMutation({
    mutationFn: ({ orderId, status }) => api.updateOrderStatus(orderId, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-orders'] }),
  });

  const orders = data?.orders || [];
  const filtered = tab === 'active'
    ? orders.filter(o => ['placed', 'confirmed'].includes(o.status))
    : orders.filter(o => o.status === tab);

  const NEXT_STATUS = { placed: 'confirmed', confirmed: 'ready' };

  if (!storeId) {
    return (
      <div className={styles.page}>
        <Header title="Orders" showLocation={false} />
        <div className={styles.content} style={{ textAlign: 'center', marginTop: '3rem', padding: '0 1rem' }}>
          <p>Please create a Kitchen first from the Kitchen tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header title="Orders" showLocation={false} />

      <div className={styles.tabs}>
        {TABS.map(t => (
          <button key={t} className={`${styles.tab} ${tab === t ? styles.tabActive : ''}`} onClick={() => setTab(t)}>
            {t === 'active' ? 'Active' : STATUS_LABEL[t]}
          </button>
        ))}
      </div>

      <div className={styles.list}>
        {isLoading && <p className={styles.dim}>Loading...</p>}
        {!isLoading && filtered.length === 0 && <p className={styles.dim}>No orders here.</p>}
        {filtered.map(order => {
          const nextStatus = NEXT_STATUS[order.status];
          return (
            <div key={order._id} className={styles.card} onClick={() => navigate(`/partner/orders/${order._id}`)}>
              <div className={styles.cardLeft} style={{ background: STATUS_COLOR[order.status] }} />
              <div className={styles.cardBody}>
                <div className={styles.cardTop}>
                  <span className={styles.orderId}>#{order._id.slice(-4).toUpperCase()}</span>
                  <span className={styles.status} style={{ color: STATUS_COLOR[order.status] }}>
                    ● {STATUS_LABEL[order.status]}
                  </span>
                </div>
                <p className={styles.customerName}>{order.user?.name || 'Customer'}</p>
                <p className={styles.items}>
                  {order.items?.map(i => `${i.quantity}× ${i.food?.name}`).join(', ')}
                </p>
                <div className={styles.cardBottom}>
                  <span className={styles.total}>₹{order.totalPrice}</span>
                  {nextStatus && (
                    <button
                      className={styles.actionBtn}
                      onClick={e => { e.stopPropagation(); updateStatus.mutate({ orderId: order._id, status: nextStatus }); }}
                      disabled={updateStatus.isPending}
                    >
                      Mark {STATUS_LABEL[nextStatus]}
                    </button>
                  )}
                  {order.status === 'ready' && (
                    <button
                      className={`${styles.actionBtn} ${styles.otpBtn}`}
                      onClick={e => { e.stopPropagation(); navigate(`/partner/orders/${order._id}`); }}
                    >
                      Verify OTP
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
