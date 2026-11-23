import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import IconButton from './IconButton';
import styles from './PageHeader.module.css';

/**
 * Standardized PageHeader for both User and Partner views
 */
export default function PageHeader({
  title,
  subtitle,
  onBack,
  showBack = false,
  actions,
  className = '',
}) {
  const navigate = useNavigate();

  const handleBack = onBack || (() => navigate(-1));

  return (
    <header className={`${styles.header} ${className}`}>
      <div className={styles.left}>
        {showBack && (
          <IconButton
            ariaLabel="Go back"
            onClick={handleBack}
          >
            <ArrowLeft size={20} />
          </IconButton>
        )}
        <div>
          <h1 className={styles.title}>{title}</h1>
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      </div>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  );
}
