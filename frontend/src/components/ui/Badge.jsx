import styles from './Badge.module.css';

/**
 * Text-based status Badge
 * @param {'open' | 'closed' | 'warning' | 'neutral' | 'primary'} variant
 */
export default function Badge({
  children,
  variant = 'neutral',
  className = '',
}) {
  return (
    <span className={`${styles.badge} ${styles[variant] || styles.neutral} ${className}`}>
      {children}
    </span>
  );
}
