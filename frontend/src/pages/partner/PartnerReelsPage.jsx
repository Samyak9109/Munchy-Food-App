import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Film, Plus, Trash2, Eye, Heart, Upload } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './PartnerReelsPage.module.css';

export default function PartnerReelsPage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const storeId = user?.stores?.[0] || null;
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['partner-reels', storeId],
    queryFn: () => api.getReelsByStore(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const deleteReel = useMutation({
    mutationFn: (id) => api.deleteReel(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['partner-reels'] }),
  });

  const reels = data?.reels || [];

  if (!storeId) {
    return (
      <div className={styles.page}>
        <Header title="Reels" showLocation={false} />
        <div className={styles.content} style={{ textAlign: 'center', marginTop: '3rem' }}>
          <p>Please create a Kitchen first from the Kitchen tab.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header title="Reels" showLocation={false} />

      <div className={styles.content}>
        <button className={styles.uploadBtn} onClick={() => setShowForm(true)}>
          <Plus size={18} /> New Reel
        </button>

        {showForm && <UploadForm storeId={storeId} onClose={() => setShowForm(false)} />}

        {isLoading && <p className={styles.dim}>Loading...</p>}
        {!isLoading && reels.length === 0 && (
          <div className={styles.empty}>
            <Film size={48} strokeWidth={1} />
            <p>No reels yet. Upload your first!</p>
          </div>
        )}

        <div className={styles.grid}>
          {reels.map(reel => (
            <div key={reel._id} className={styles.reelCard}>
              <div className={styles.thumb}>
                {reel.food?.image
                  ? <img src={reel.food.image} alt={reel.food?.name} />
                  : <Film size={24} />
                }
              </div>
              <div className={styles.reelInfo}>
                <p className={styles.reelName}>{reel.food?.name || 'Reel'}</p>
                <div className={styles.reelMeta}>
                  <span><Eye size={12} /> {reel.views || 0}</span>
                  <span><Heart size={12} /> {reel.likes || 0}</span>
                </div>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => { if (confirm('Delete reel?')) deleteReel.mutate(reel._id); }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function UploadForm({ storeId, onClose }) {
  const qc = useQueryClient();
  const [caption, setCaption] = useState('');
  const [foodId, setFoodId] = useState('');
  const [file, setFile] = useState(null);
  const fileRef = useRef();

  const { data: menuData } = useQuery({
    queryKey: ['store-menu', storeId],
    queryFn: () => api.getStoreMenu(storeId).then(r => r.data),
  });

  const createReel = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('storeId', storeId);
      fd.append('foodId', foodId);
      fd.append('caption', caption);
      if (file) fd.append('video', file);
      return api.createReel(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['partner-reels'] });
      onClose();
    },
  });

  const foods = menuData?.menu || [];

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>Upload Reel</h2>

      <div
        className={styles.dropZone}
        onClick={() => fileRef.current?.click()}
      >
        <Upload size={24} />
        <p>{file ? file.name : 'Tap to upload video'}</p>
        <input ref={fileRef} type="file" accept="video/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
      </div>

      <select className={styles.select} value={foodId} onChange={e => setFoodId(e.target.value)}>
        <option value="">Select food item</option>
        {foods.map(f => <option key={f._id} value={f._id}>{f.name}</option>)}
      </select>

      <textarea
        className={styles.textarea}
        placeholder="Caption..."
        value={caption}
        onChange={e => setCaption(e.target.value)}
        rows={3}
      />

      {createReel.error && <p className={styles.error}>{createReel.error.response?.data?.message || 'Upload failed'}</p>}

      <div className={styles.formBtns}>
        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        <button className={styles.submitBtn} onClick={() => createReel.mutate()} disabled={createReel.isPending || !foodId}>
          {createReel.isPending ? 'Uploading...' : 'Upload'}
        </button>
      </div>
    </div>
  );
}
