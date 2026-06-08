import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as authApi from '../../api/auth';
import styles from './AuthPage.module.css';

/**
 * Landing page for Google OAuth success redirect.
 * Backend redirects to /auth/success?token=...&role=...
 * We read those params, fetch the account, call setAuth, then navigate.
 */
export default function AuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const role = searchParams.get('role');

    if (!token || !role) {
      navigate('/auth/error');
      return;
    }

    // Decode the JWT payload to get basic user info
    // (The refresh endpoint returns the full account object when called.)
    // We'll store the token first, then attempt a silent refresh to get account details.
    localStorage.setItem('accessToken', token);

    // Use the refresh endpoint to get account details
    authApi.refresh()
      .then((res) => {
        const { account, accessToken: newToken } = res.data;
        setAuth(account, newToken || token, role);
        navigate(role === 'partner' ? '/partner/dashboard' : '/', { replace: true });
      })
      .catch(() => {
        // Fallback: build a minimal account from the JWT
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setAuth(
            { id: payload.userId, email: '', username: '', role },
            token,
            role
          );
          navigate(role === 'partner' ? '/partner/dashboard' : '/', { replace: true });
        } catch {
          navigate('/auth/error', { replace: true });
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={styles.content}>
        <h1 className={styles.brand}>Munchy</h1>
        <div className={styles.card}>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            Signing you in…
          </p>
        </div>
      </div>
    </div>
  );
}
