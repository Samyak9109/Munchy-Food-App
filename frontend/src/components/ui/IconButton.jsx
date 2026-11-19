import styles from './IconButton.module.css';

/**
 * Accessible Icon-only Button
 * @param {string} ariaLabel Mandatory accessible label
 * @param {'default' | 'glass'} variant
 */
export default function IconButton({
  children,
  ariaLabel,
  variant = 'default',
  className = '',
  disabled = false,
  ...props
}) {
  return (
    <button
      className={`${styles.iconBtn} ${variant === 'glass' ? styles.glass : ''} ${className}`}
      aria-label={ariaLabel}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
