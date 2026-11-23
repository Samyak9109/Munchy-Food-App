import styles from './StatCard.module.css';

/**
 * StatCard for partner dashboard metrics
 */
export default function StatCard({ label, value, subtext, className = '' }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
      {subtext && <span className={styles.subtext}>{subtext}</span>}
    </div>
  );
}
