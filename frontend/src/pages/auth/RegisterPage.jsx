import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, Phone, ArrowRight } from 'lucide-react';
import { useRegister } from '../../hooks/useAuth';
import styles from './AuthPage.module.css';

export default function RegisterPage() {
  const [role, setRole] = useState('user');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const { mutate: register, isPending, error } = useRegister();

  const handleSubmit = (e) => {
    e.preventDefault();
    register({ name, email, password, role, ...(role === 'partner' && { phone }) });
  };

  return (
    <div className={styles.page}>
      <div className={styles.heroBg} />
      <div className={styles.content}>
        <h1 className={styles.brand}>Munchy</h1>

        <div className={styles.card}>
          <h2 className={styles.title}>Join the crave.</h2>
          <p className={styles.subtitle}>Create your account to get started.</p>

          <div className={styles.toggle}>
            <button
              className={`${styles.toggleBtn} ${role === 'user' ? styles.toggleActive : ''}`}
              onClick={() => setRole('user')}
              type="button"
            >
              Hungry User
            </button>
            <button
              className={`${styles.toggleBtn} ${role === 'partner' ? styles.toggleActive : ''}`}
              onClick={() => setRole('partner')}
              type="button"
            >
              Kitchen Partner
            </button>
          </div>

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputWrap}>
              <User size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="text"
                placeholder={role === 'partner' ? 'Kitchen / Business name' : 'Full name'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputWrap}>
              <Mail size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className={styles.inputWrap}>
              <Lock size={16} className={styles.inputIcon} />
              <input
                className={styles.input}
                type="password"
                placeholder="Password (8+ chars, A-Z, 0-9, @$!%*?&)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}"
                title="Must be 8+ characters with uppercase, lowercase, number and special character (@$!%*?&)"
              />
            </div>

            {role === 'partner' && (
              <div className={styles.inputWrap}>
                <Phone size={16} className={styles.inputIcon} />
                <input
                  className={styles.input}
                  type="tel"
                  placeholder="Phone number (10 digits)"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  required
                  pattern="\d{10}"
                  title="Enter a valid 10-digit phone number"
                />
              </div>
            )}

            {error && (
              <p className={styles.error}>
                {error.response?.data?.message || 'Something went wrong'}
              </p>
            )}

            <button className={styles.submitBtn} type="submit" disabled={isPending}>
              {isPending ? 'Creating account...' : 'Create Account'}
              {!isPending && <ArrowRight size={18} />}
            </button>
          </form>
        </div>

        <p className={styles.switchLink}>
          Already have an account?{' '}
          <Link to="/login">SIGN IN</Link>
        </p>
      </div>
    </div>
  );
}
