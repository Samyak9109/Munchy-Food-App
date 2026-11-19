import { useToastStore } from '../../store/toastStore';
import styles from './ToastContainer.module.css';

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  if (toasts.length === 0) return null;

  return (
    <div className={styles.container} role="status" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          className={`${styles.toast} ${styles[toast.type]}`}
          onClick={() => dismiss(toast.id)}
          aria-label={`Dismiss notification: ${toast.message}`}
        >
          <span className={styles.bar} />
          <span className={styles.message}>{toast.message}</span>
          <span className={styles.close} aria-hidden="true">✕</span>
        </button>
      ))}
    </div>
  );
}