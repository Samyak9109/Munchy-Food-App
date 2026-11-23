import styles from './EmptyState.module.css';

/**
 * EmptyState primitive
 */
export default function EmptyState({
  icon = '🍽️',
  title = 'Nothing here yet',
  hint,
  action,
  className = '',
}) {
  return (
    <div className={`${styles.container} ${className}`}>
      <div className={styles.icon} aria-hidden="true">{icon}</div>
      <h3 className={styles.title}>{title}</h3>
      {hint && <p className={styles.hint}>{hint}</p>}
      {action}
    </div>
  );
}
