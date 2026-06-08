import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Mail, LogOut, Edit2, Check } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useLogout } from '../../hooks/useAuth';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './PartnerProfilePage.module.css';

export default function PartnerProfilePage() {
  const { user } = useAuthStore();
  const { mutate: logout } = useLogout();
  const qc = useQueryClient();
  const storeId = user?.stores?.[0] || null;
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');

  const { data: storeData } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => api.getStoreById(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const updateMut = useMutation({
    mutationFn: () => api.updateProfile({ name }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['profile'] }); setEditing(false); },
  });

  const uploadAvatarMut = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('avatar', file);
      return api.uploadAvatar(fd);
    },
    onSuccess: (res) => {
      // update auth store user directly to reflect new avatar immediately
      const updatedUser = { ...user, avatar: res.data.user.avatar };
      useAuthStore.getState().setAuth(updatedUser, localStorage.getItem('accessToken'), 'partner');
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });

  const store = storeData?.store;

  return (
    <div className={styles.page}>
      <Header title="Profile" showLocation={false} />
      <div className={styles.content}>
        <div className={styles.avatarSection}>
          <div className={styles.avatar} style={{ position: 'relative', overflow: 'hidden' }}>
            {user?.avatar ? <img src={user.avatar} alt={user.name} /> : <User size={40} />}
            <label style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.7rem', textAlign: 'center', padding: '4px 0', cursor: 'pointer', display: 'block' }}>
              {uploadAvatarMut.isPending ? '...' : 'Upload'}
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                if (e.target.files[0]) uploadAvatarMut.mutate(e.target.files[0]);
              }} disabled={uploadAvatarMut.isPending} />
            </label>
          </div>
          {editing
            ? <input className={styles.nameInput} value={name} onChange={e => setName(e.target.value)} />
            : <h2 className={styles.name}>{user?.name || 'Partner'}</h2>
          }
          <p className={styles.email}>{user?.email}</p>
          <span className={styles.partnerBadge}>Kitchen Partner</span>
        </div>

        <button className={styles.editBtn} onClick={() => editing ? updateMut.mutate() : setEditing(true)} disabled={updateMut.isPending}>
          {editing ? <><Check size={16} /> Save</> : <><Edit2 size={16} /> Edit</>}
        </button>

        {store && (
          <div className={styles.section}>
            <p className={styles.sectionLabel}>YOUR KITCHEN</p>
            <div className={styles.storeRow}>
              {store.image && <img src={store.image} className={styles.storeThumb} alt={store.name} />}
              <div>
                <p className={styles.storeNameText}>{store.name}</p>
                <p className={styles.storeMeta}>{store.cuisine?.join(', ')}</p>
                <p className={styles.storeMeta}>{store.address?.street}</p>
              </div>
              <span className={`${styles.storeStatus} ${store.isOpen ? styles.open : styles.closed}`}>
                {store.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>
        )}

        <div className={styles.section}>
          <div className={styles.infoRow}>
            <Mail size={16} className={styles.icon} />
            <div>
              <p className={styles.label}>Email</p>
              <p className={styles.value}>{user?.email}</p>
            </div>
          </div>
        </div>

        <div className={styles.section}>
          <button className={styles.logoutBtn} onClick={() => logout()}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
