import { MapPin, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import styles from './Header.module.css';

export default function Header({ title = 'Munchy', showLocation = true, showProfile = true }) {
  const { role, user } = useAuthStore();

  const handleLocationClick = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => alert(`Location found! Lat: ${position.coords.latitude.toFixed(4)}, Lng: ${position.coords.longitude.toFixed(4)}`),
        () => alert('Unable to retrieve your location')
      );
    } else {
      alert('Geolocation is not supported by your browser');
    }
  };

  return (
    <header className={styles.header}>
      {showLocation && (
        <button className={styles.iconBtn} aria-label="Location" onClick={handleLocationClick}>
          <MapPin size={20} />
        </button>
      )}
      <h1 className={styles.logo}>{title}</h1>
      {showProfile && (
        <Link to={role === 'partner' ? '/partner/profile' : '/profile'} className={styles.iconBtn} aria-label="Profile">
          {user?.avatar
            ? <img className={styles.profileImage} src={user.avatar} alt={user.name || 'Profile'} />
            : <User size={20} />
          }
        </Link>
      )}
    </header>
  );
}
