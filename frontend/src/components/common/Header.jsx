import { MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './Header.module.css';

export default function Header({ title = 'Munchy', showLocation = true, showProfile = true }) {
  return (
    <header className={styles.header}>
      {showLocation && (
        <button className={styles.iconBtn} aria-label="Location">
          <MapPin size={20} />
        </button>
      )}
      <h1 className={styles.logo}>{title}</h1>
      {showProfile && (
        <Link to="/profile" className={styles.iconBtn} aria-label="Profile">
          <User size={20} />
        </Link>
      )}
    </header>
  );
}
