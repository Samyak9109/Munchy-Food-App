import { useNavigate } from 'react-router-dom';
import styles from './AuthPage.module.css';

export default function AuthErrorPage() {
  const navigate = useNavigate();

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={styles.content}>
        <h1 className={styles.brand}>Munchy</h1>
        <div className={styles.card}>
          <h2 className={styles.title}>Sign-in failed</h2>
          <p className={styles.subtitle}>
            Something went wrong during Google sign-in. Please try again.
          </p>
          <button
            className={styles.submitBtn}
            onClick={() => navigate('/login', { replace: true })}
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
