import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, Phone, LogOut, Trash2, Heart, ChevronRight, Edit2, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const { data } = useQuery({
    queryKey: ['profile'],
    queryFn: () => api.getProfile().then(r => r.data),
    onSuccess: (d) => {
      setName(d.user?.name || '');
      setPhone(d.user?.phone || '');
    },
  });

  const updateMut = useMutation({
    mutationFn: () => api.updateProfile({ name, phone }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      setEditing(false);
    },
  });

  const deleteMut = useMutation({
    mutationFn: api.deleteAccount,
    onSuccess: () => logout(),
  });

  const profile = data?.user || user;

  return (
    <div className={styles.page}>
      <Header title="Profile" showLocation={false} />

      <div className={styles.content}>
        {/* Avatar */}
        <div className={styles.avatarSection}>
          <div className={styles.avatar}>
            {profile?.avatar
              ? <img src={profile.avatar} alt={profile.name} />
              : <User size={40} />
            }
          </div>
          {editing ? (
            <input
              className={styles.nameInput}
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
            />
          ) : (
            <h2 className={styles.name}>{profile?.name || 'Munchy User'}</h2>
          )}
          <p className={styles.email}>{profile?.email}</p>
        </div>

        {/* Edit / save */}
        <button
          className={styles.editBtn}
          onClick={() => editing ? updateMut.mutate() : setEditing(true)}
          disabled={updateMut.isPending}
        >
          {editing ? <><Check size={16} /> Save Changes</> : <><Edit2 size={16} /> Edit Profile</>}
        </button>

        {/* Info card */}
        <div className={styles.section}>
          <div className={styles.infoRow}>
            <Mail size={16} className={styles.icon} />
            <div>
              <p className={styles.label}>Email</p>
              <p className={styles.value}>{profile?.email}</p>
            </div>
          </div>
          <div className={styles.infoRow}>
            <Phone size={16} className={styles.icon} />
            <div className={styles.infoFill}>
              <p className={styles.label}>Phone</p>
              {editing ? (
                <input
                  className={styles.inlineInput}
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Add phone number"
                />
              ) : (
                <p className={styles.value}>{profile?.phone || '—'}</p>
              )}
            </div>
          </div>
        </div>

        {/* Quick links */}
        <div className={styles.section}>
          <button className={styles.menuRow} onClick={() => navigate('/orders')}>
            <span className={styles.menuLabel}>My Orders</span>
            <ChevronRight size={18} />
          </button>
          <button className={styles.menuRow} onClick={() => navigate('/kitchens')}>
            <Heart size={16} className={styles.icon} />
            <span className={styles.menuLabel}>Favourites</span>
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Danger zone */}
        <div className={styles.section}>
          <button className={styles.logoutBtn} onClick={() => logout()}>
            <LogOut size={18} /> Sign Out
          </button>
          <button
            className={styles.deleteBtn}
            onClick={() => {
              if (confirm('Delete account? This cannot be undone.')) deleteMut.mutate();
            }}
          >
            <Trash2 size={18} /> Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}
