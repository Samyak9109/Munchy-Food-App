import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import * as authApi from '../../api/auth';
import styles from './AuthPage.module.css';

export default function VerifyOTPPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const email = sessionStorage.getItem('pendingEmail');
  const role = sessionStorage.getItem('pendingRole');

  const { mutate: verify, isPending } = useMutation({
    mutationFn: () => authApi.verifyEmail({ email, otp }, role),
    onSuccess: (res) => {
      const { account, accessToken } = res.data;
      setAuth(account, accessToken, role);
      sessionStorage.removeItem('pendingEmail');
      sessionStorage.removeItem('pendingRole');
      navigate(role === 'partner' ? '/partner/dashboard' : '/');
    },
    onError: (err) => {
      setError(err.response?.data?.message || 'Verification failed');
    },
  });

  if (!email || !role) {
    return (
      <div className={styles.page}>
        <div className={styles.content}>
          <p>Invalid session. Please register again.</p>
          <button onClick={() => navigate('/register')} className={styles.submitBtn}>
            Go back
          </button>
        </div>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    verify();
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={styles.content}>
        <h1 className={styles.brand}>Munchy</h1>

        <div className={styles.card}>
          <h2 className={styles.title}>Verify your email</h2>
          <p className={styles.subtitle}>
            We sent a 6-digit code to <strong>{email}</strong>
          </p>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrap}>
              <input
                className={styles.input}
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                maxLength={6}
                required
                style={{ textAlign: 'center', letterSpacing: '0.25em', fontSize: '1.2rem' }}
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} type="submit" disabled={isPending || otp.length < 6}>
              {isPending ? 'Verifying...' : 'Verify Email'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
