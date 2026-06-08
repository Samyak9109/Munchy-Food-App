import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { TrendingUp, ShoppingBag, Star, Clock } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './AnalyticsPage.module.css';

const PERIODS = ['daily', 'weekly', 'monthly'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const storeId = user?.stores?.[0] || user?.id;
  const [period, setPeriod] = useState('weekly');

  const statsFn = period === 'daily' ? api.getDailyStats : period === 'weekly' ? api.getWeeklyStats : api.getMonthlyStats;

  const { data: statsData } = useQuery({
    queryKey: ['stats', storeId, period],
    queryFn: () => statsFn(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const { data: topData } = useQuery({
    queryKey: ['top-items', storeId],
    queryFn: () => api.getTopItems(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const { data: growthData } = useQuery({
    queryKey: ['growth', storeId],
    queryFn: () => api.getGrowth(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const stats = statsData || {};
  const topItems = topData?.items || [];
  const growth = growthData?.growth || {};

  const statCards = [
    { icon: TrendingUp, label: 'Revenue',    value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, color: 'var(--success)' },
    { icon: ShoppingBag, label: 'Orders',    value: stats.totalOrders || 0,                           color: 'var(--primary)' },
    { icon: Star,        label: 'Avg Order', value: `₹${Math.round(stats.avgOrderValue || 0)}`,       color: 'var(--yellow)' },
    { icon: Clock,       label: 'Completed', value: `${stats.completionRate || 0}%`,                  color: 'var(--success)' },
  ];

  return (
    <div className={styles.page}>
      <Header title="Analytics" showLocation={false} />

      <div className={styles.content}>
        {/* Period toggle */}
        <div className={styles.periodRow}>
          {PERIODS.map(p => (
            <button
              key={p}
              className={`${styles.periodBtn} ${period === p ? styles.periodActive : ''}`}
              onClick={() => setPeriod(p)}
            >
              {p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Stat cards */}
        <div className={styles.grid}>
          {statCards.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className={styles.statCard}>
              <Icon size={18} style={{ color }} />
              <p className={styles.statValue}>{value}</p>
              <p className={styles.statLabel}>{label}</p>
            </div>
          ))}
        </div>

        {/* Growth indicator */}
        {growth.revenueGrowth !== undefined && (
          <div className={styles.growthCard}>
            <p className={styles.growthTitle}>vs Previous Period</p>
            <div className={styles.growthRow}>
              <div className={styles.growthItem}>
                <span className={styles.growthVal} style={{ color: growth.revenueGrowth >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  {growth.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(growth.revenueGrowth || 0)}%
                </span>
                <span className={styles.growthLabel}>Revenue</span>
              </div>
              <div className={styles.growthItem}>
                <span className={styles.growthVal} style={{ color: growth.ordersGrowth >= 0 ? 'var(--success)' : 'var(--error)' }}>
                  {growth.ordersGrowth >= 0 ? '↑' : '↓'} {Math.abs(growth.ordersGrowth || 0)}%
                </span>
                <span className={styles.growthLabel}>Orders</span>
              </div>
            </div>
          </div>
        )}

        {/* Top items */}
        {topItems.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Top Selling Items</h2>
            {topItems.map((item, i) => (
              <div key={item._id || i} className={styles.topItem}>
                <span className={styles.rank}>{i + 1}</span>
                <div className={styles.topItemInfo}>
                  <p className={styles.topItemName}>{item.name}</p>
                  <p className={styles.topItemSub}>{item.totalQuantity} sold · ₹{item.totalRevenue}</p>
                </div>
                <div className={styles.barWrap}>
                  <div
                    className={styles.bar}
                    style={{ width: `${Math.min(100, (item.totalQuantity / (topItems[0]?.totalQuantity || 1)) * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
