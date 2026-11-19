import { useState } from 'react';
import { MapPin, User, Search, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLocationStore, getUserLocation } from '../../store/locationStore';
import { useToastStore } from '../../store/toastStore';
import * as api from '../../api/index';
import { useMutation } from '@tanstack/react-query';
import styles from './Header.module.css';

export default function Header({ title = 'Munchy', showLocation = true, showProfile = true }) {
  const { role, user } = useAuthStore();
  const location = useLocationStore((s) => ({ lat: s.lat, lng: s.lng, label: s.label, source: s.source }));
  const setLocation = useLocationStore((s) => s.setLocation);
  const clearLocation = useLocationStore((s) => s.clearLocation);
  const toast = useToastStore((s) => s.push);

  const [query, setQuery] = useState('');

  const geocodeMut = useMutation({
    mutationFn: (q) => api.geocode(q).then((r) => r.data.results || []),
    onSuccess: (results) => {
      if (results.length === 0) {
        toast('No places found for that address', 'error');
        return;
      }
      const first = results[0];
      setLocation(first.lat, first.lng, first.label, 'search');
      toast('Location set', 'success');
      setQuery('');
    },
    onError: () => toast('Could not reach the geocoding service', 'error'),
  });

  async function handleLocationClick() {
    try {
      const { lat, lng } = await getUserLocation();
      setLocation(lat, lng, `${lat.toFixed(4)}, ${lng.toFixed(4)}`, 'gps');
      toast('Location found', 'success');
    } catch (error) {
      toast(error.message, 'error');
    }
  }

  function handleSearchSubmit() {
    if (query.trim().length < 2) {
      toast('Type at least 2 characters to search', 'error');
      return;
    }
    geocodeMut.mutate(query.trim());
  }

  return (
    <header className={styles.header}>
      {showLocation && (
        <div className={styles.locationWrap}>
          <button
            className={`${styles.iconBtn} ${location.source ? styles.locationActive : ''}`}
            aria-label="Use my location"
            onClick={handleLocationClick}
            title="Use my location"
          >
            <MapPin size={20} />
          </button>

          {location.label ? (
            <div className={styles.locationPill}>
              <span className={styles.locationText} title={location.label}>
                {location.label}
              </span>
              <button
                className={styles.locationClear}
                aria-label="Clear location"
                onClick={clearLocation}
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <div className={styles.searchWrap}>
              <Search size={16} className={styles.searchIcon} />
              <input
                className={styles.searchInput}
                placeholder="Search address..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit();
                }}
              />
              {query && (
                <button className={styles.searchClear} aria-label="Clear" onClick={() => setQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
          )}
        </div>
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