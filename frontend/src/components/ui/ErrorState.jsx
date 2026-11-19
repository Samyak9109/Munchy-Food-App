import Button from './Button';
import styles from './EmptyState.module.css';

/**
 * ErrorState primitive with retry
 */
export default function ErrorState({
  title = 'Something went wrong',
  message = 'An error occurred while loading this content.',
  onRetry,
  className = '',
}) {
  return (
    <div className={`${styles.container} ${className}`} role="alert">
      <div className={styles.icon} aria-hidden="true">⚠️</div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.hint}>{message}</p>
      {onRetry && (
        <Button variant="ghost" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}
