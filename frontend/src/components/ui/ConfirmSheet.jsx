import { useEffect, useRef } from 'react';
import Button from './Button';
import styles from './ConfirmSheet.module.css';

/**
 * ConfirmSheet: Modal/Bottom-sheet replacement for window.confirm()
 */
export default function ConfirmSheet({
  isOpen,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDanger = false,
  onConfirm,
  onCancel,
}) {
  const cancelBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;
    cancelBtnRef.current?.focus();

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  return (
    <div className={styles.backdrop} onClick={onCancel} role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <div className={styles.sheet} onClick={(e) => e.stopPropagation()}>
        <h3 id="confirm-title" className={styles.title}>{title}</h3>
        {message && <p className={styles.message}>{message}</p>}
        <div className={styles.actions}>
          <Button
            ref={cancelBtnRef}
            variant="ghost"
            onClick={onCancel}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={isDanger ? 'danger' : 'primary'}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
