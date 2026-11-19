import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import * as authApi from '../../api/auth';
import styles from './AuthPage.module.css';

/**
 * Landing page for Google OAuth success redirect.
 * Backend redirects to /auth/success?role=... after setting refresh cookie.
 * We call POST /auth/refresh to get the access token and account details.
 */
export default function AuthSuccessPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const role = searchParams.get('role');

    if (!role) {
      navigate('/auth/error');
      return;
    }

    authApi.refresh()
      .then((res) => {
        const { account, accessToken } = res.data;
        setAuth(account, accessToken, role);
        navigate(role === 'partner' ? '/partner/dashboard' : '/', { replace: true });
      })
      .catch(() => {
        navigate('/auth/error', { replace: true });
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={styles.content}>
        <h1 className={styles.brand}>Munchy</h1>
        <div className={styles.card}>
          <p className={styles.signingIn}>
            Signing you in…
          </p>
        </div>
      </div>
    </div>
  );
}
