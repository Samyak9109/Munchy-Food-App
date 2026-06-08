import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import * as authApi from '../../api/auth';
import styles from './ForgotPasswordPage.module.css';

export default function ForgotPasswordPage() {
  const [role, setRole] = useState('user');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => authApi.forgotPassword({ email }, role),
    onSuccess: () => setSent(true),
  });

  if (sent) {
    return (
      <div className={styles.page}>
        <div className={styles.successBox}>
          <CheckCircle size={48} color="var(--success)" />
          <h2>Check your email</h2>
          <p>Reset link sent to <strong>{email}</strong></p>
          <Link to="/login" className={styles.backBtn}>Back to Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={styles.content}>
        <Link to="/login" className={styles.backLink}><ArrowLeft size={20} /></Link>
        <h1 className={styles.brand}>Munchy</h1>

        <div className={styles.card}>
          <h2 className={styles.title}>Forgot password?</h2>
          <p className={styles.subtitle}>Enter your email and we'll send a reset link.</p>

          <div className={styles.toggle}>
            <button className={`${styles.toggleBtn} ${role === 'user' ? styles.toggleActive : ''}`} onClick={() => setRole('user')} type="button">Hungry User</button>
            <button className={`${styles.toggleBtn} ${role === 'partner' ? styles.toggleActive : ''}`} onClick={() => setRole('partner')} type="button">Kitchen Partner</button>
          </div>

          <div className={styles.inputWrap}>
            <Mail size={16} className={styles.inputIcon} />
            <input
              className={styles.input}
              type="email"
              placeholder="Email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          {error && <p className={styles.error}>{error.response?.data?.message || 'Something went wrong'}</p>}

          <button className={styles.submitBtn} onClick={() => mutate()} disabled={isPending || !email}>
            {isPending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </div>
      </div>
    </div>
  );
}
