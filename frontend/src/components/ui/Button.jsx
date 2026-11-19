import styles from './Button.module.css';

/**
 * Reusable Button component
 * @param {'primary' | 'secondary' | 'ghost' | 'glass' | 'danger'} variant
 * @param {'sm' | 'md' | 'lg'} size
 * @param {boolean} loading
 */
export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  return (
    <button
      className={`${styles.button} ${styles[variant] || styles.primary} ${styles[size] || styles.md} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden="true" /> : children}
    </button>
  );
}
