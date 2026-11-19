import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { TrendingUp, ShoppingBag, Star, Clock } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import { Button, EmptyState } from '../../components/ui/index';
import styles from './AnalyticsPage.module.css';

const PERIODS = ['daily', 'weekly', 'monthly'];

export default function AnalyticsPage() {
  const { user } = useAuthStore();
  const storeId = user?.stores?.[0] || null;
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
    { icon: TrendingUp, label: 'Revenue',    value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, iconClass: styles.iconSuccess },
    { icon: ShoppingBag, label: 'Orders',    value: stats.totalOrders || 0,                           iconClass: styles.iconPrimary },
    { icon: Star,        label: 'Avg Order', value: `₹${Math.round(stats.avgOrderValue || 0)}`,       iconClass: styles.iconSecondary },
    { icon: Clock,       label: 'Completed', value: `${stats.completionRate || 0}%`,                  iconClass: styles.iconSuccess },
  ];

  if (!storeId) {
    return (
      <div className={styles.page}>
        <Header title="Analytics" showLocation={false} />
        <EmptyState
          icon="📊"
          title="No Kitchen Found"
          hint="Create a kitchen first to start tracking your revenue, order volume, and sales analytics."
          action={
            <Button variant="primary" onClick={() => window.location.href = '/partner/store'}>
              Create Kitchen
            </Button>
          }
        />
      </div>
    );
  }

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
          {statCards.map(({ icon: Icon, label, value, iconClass }) => (
            <div key={label} className={styles.statCard}>
              <Icon size={18} className={iconClass} />
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
                <span className={`${styles.growthVal} ${growth.revenueGrowth >= 0 ? styles.growthPositive : styles.growthNegative}`}>
                  {growth.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(growth.revenueGrowth || 0)}%
                </span>
                <span className={styles.growthLabel}>Revenue</span>
              </div>
              <div className={styles.growthItem}>
                <span className={`${styles.growthVal} ${growth.ordersGrowth >= 0 ? styles.growthPositive : styles.growthNegative}`}>
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
