import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Store } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './StoreManagePage.module.css';

export default function StoreManagePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();

  // Partner model returns stores[] array; fall back gracefully
  const storeId = user?.stores?.[0] || null;

  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editFood, setEditFood] = useState(null);

  const { data: storeData, isLoading: storeLoading } = useQuery({
    queryKey: ['my-store', storeId],
    queryFn: () => api.getStoreById(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const { data: menuData, isLoading: menuLoading } = useQuery({
    queryKey: ['store-menu', storeId],
    queryFn: () => api.getStoreMenu(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const toggleAvail = useMutation({
    mutationFn: (foodId) => api.toggleAvailability(foodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-menu'] }),
  });

  const deleteFood = useMutation({
    mutationFn: (foodId) => api.deleteFood(foodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['store-menu'] }),
  });

  const uploadStoreImageMut = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('image', file);
      return api.uploadStoreImage(storeId, fd);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-store'] }),
  });

  const store = storeData?.store;
  // Backend getStoreMenu returns { store, menu } not { foods }
  const foods = menuData?.menu || [];

  // ── If partner has no store yet, show creation form ────────────────────
  if (!storeId && !storeLoading) {
    return (
      <div className={styles.page}>
        <Header title="Kitchen" showLocation={false} />
        <CreateKitchenForm />
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header title="Kitchen" showLocation={false} />

      <div className={styles.content}>
        {/* Store info */}
        {store && (
          <div className={styles.storeCard}>
            <div style={{ position: 'relative', width: 100, height: 100, flexShrink: 0, borderRadius: 8, overflow: 'hidden', background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {store.image ? (
                <img src={store.image} alt={store.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Store size={32} style={{ color: 'var(--text-muted)' }} />
              )}
              <label style={{ position: 'absolute', bottom: 0, width: '100%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '0.75rem', textAlign: 'center', padding: '4px 0', cursor: 'pointer' }}>
                {uploadStoreImageMut.isPending ? 'Uploading...' : 'Cover'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                  if (e.target.files[0]) uploadStoreImageMut.mutate(e.target.files[0]);
                }} disabled={uploadStoreImageMut.isPending} />
              </label>
            </div>
            <div className={styles.storeInfo}>
              <h2 className={styles.storeName}>{store.name}</h2>
              <p className={styles.storeCuisine}>{store.cuisine?.join(', ')}</p>
              {/* address is a plain String in the model */}
              <p className={styles.storeAddr}>{store.address}</p>
            </div>
          </div>
        )}

        {/* Menu management */}
        <div className={styles.menuHeader}>
          <h2>Menu Items</h2>
          <button className={styles.addBtn} onClick={() => { setEditFood(null); setShowFoodForm(true); }}>
            <Plus size={16} /> Add Item
          </button>
        </div>

        {showFoodForm && (
          <FoodForm
            storeId={storeId}
            food={editFood}
            onClose={() => { setShowFoodForm(false); setEditFood(null); }}
          />
        )}

        {menuLoading && <p className={styles.dim}>Loading menu...</p>}
        {!menuLoading && foods.length === 0 && <p className={styles.dim}>No items yet. Add your first dish!</p>}

        <div className={styles.foodList}>
          {foods.map(food => (
            <div key={food._id} className={`${styles.foodCard} ${!food.isAvailable ? styles.unavailable : ''}`}>
              {food.image && <img src={food.image} alt={food.name} className={styles.foodThumb} />}
              <div className={styles.foodInfo}>
                <p className={styles.foodName}>{food.name}</p>
                <p className={styles.foodPrice}>₹{food.price}</p>
                {food.category && (
                  <p className={styles.foodCat}>
                    {Array.isArray(food.category) ? food.category.join(', ') : food.category}
                  </p>
                )}
              </div>
              <div className={styles.foodActions}>
                <button
                  className={`${styles.iconBtn} ${food.isAvailable ? styles.available : styles.unavailBtn}`}
                  onClick={() => toggleAvail.mutate(food._id)}
                  title={food.isAvailable ? 'Mark unavailable' : 'Mark available'}
                >
                  {food.isAvailable ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                </button>
                <button className={styles.iconBtn} onClick={() => { setEditFood(food); setShowFoodForm(true); }}>
                  <Pencil size={16} />
                </button>
                <button
                  className={`${styles.iconBtn} ${styles.deleteBtn}`}
                  onClick={() => { if (confirm('Delete item?')) deleteFood.mutate(food._id); }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CREATE KITCHEN FORM (new partners with no store yet) ───────────────────
function CreateKitchenForm() {
  const qc = useQueryClient();
  const { user, setAuth } = useAuthStore();
  const [form, setFormState] = useState({
    name: '',
    address: '',
    cuisine: '',
    description: '',
  });
  const [error, setError] = useState('');

  const setF = (key, val) => setFormState(f => ({ ...f, [key]: val }));

  const createStore = useMutation({
    mutationFn: () => {
      const cuisines = form.cuisine.split(',').map(s => s.trim()).filter(Boolean);
      return api.createStore({
        name: form.name,
        address: form.address,
        cuisine: cuisines.length > 0 ? cuisines : ['General'], // Default cuisine if empty
        description: form.description,
        // dummy coordinates required by store model
        coordinates: { lat: 0, lng: 0 },
      });
    },
    onSuccess: (res) => {
      const newStoreId = res.data.store?._id;
      if (newStoreId) {
        // Patch the authStore user with the new store id
        const updatedUser = { ...user, stores: [newStoreId] };
        setAuth(updatedUser, localStorage.getItem('accessToken'), 'partner');
      }
      qc.invalidateQueries({ queryKey: ['my-store'] });
    },
    onError: (err) => {
      const data = err.response?.data;
      if (data?.errors?.length > 0) {
        setError(data.errors.map(e => e.msg).join(', '));
      } else {
        setError(data?.message || 'Failed to create kitchen');
      }
    },
  });

  return (
    <div className={styles.content}>
      <div className={styles.form} style={{ maxWidth: 480, margin: '2rem auto' }}>
        <Store size={32} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
        <h2 className={styles.formTitle}>Create Your Kitchen</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
          Set up your store profile before adding menu items.
        </p>
        <input className={styles.input} placeholder="Kitchen name *" value={form.name} onChange={e => setF('name', e.target.value)} />
        <input className={styles.input} placeholder="Address *" value={form.address} onChange={e => setF('address', e.target.value)} />
        <input className={styles.input} placeholder="Cuisine types (comma-separated)" value={form.cuisine} onChange={e => setF('cuisine', e.target.value)} />
        <textarea className={styles.textarea} placeholder="Description" rows={3} value={form.description} onChange={e => setF('description', e.target.value)} />
        {error && <p className={styles.error}>{error}</p>}
        <button
          className={styles.submitBtn}
          onClick={() => createStore.mutate()}
          disabled={createStore.isPending || !form.name || !form.address}
        >
          {createStore.isPending ? 'Creating...' : 'Create Kitchen'}
        </button>
      </div>
    </div>
  );
}

// ── FOOD FORM (uses FormData to support file uploads) ──────────────────────
const VALID_CATEGORIES = ['breakfast', 'lunch', 'dinner', 'snacks', 'drinks', 'desserts'];

function FoodForm({ storeId, food, onClose }) {
  const qc = useQueryClient();
  const videoRef = useRef(null);
  const imageRef = useRef(null);

  const [form, setFormState] = useState({
    name: food?.name || '',
    price: food?.price || '',
    description: food?.description || '',
    category: food?.category?.[0] || food?.category || '',
    isVeg: food?.isVeg ?? true,
  });

  const set = (key, val) => setFormState(f => ({ ...f, [key]: val }));

  const saveMut = useMutation({
    mutationFn: () => {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('price', form.price);
      fd.append('description', form.description);
      fd.append('category', form.category);
      fd.append('isVeg', form.isVeg);
      fd.append('store', storeId);

      if (videoRef.current?.files[0]) fd.append('video', videoRef.current.files[0]);
      if (imageRef.current?.files[0]) fd.append('image', imageRef.current.files[0]);

      return food
        ? api.updateFood(food._id, fd)
        : api.createFood(fd);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['store-menu'] });
      onClose();
    },
  });

  return (
    <div className={styles.form}>
      <h2 className={styles.formTitle}>{food ? 'Edit Item' : 'New Item'}</h2>

      <input className={styles.input} placeholder="Item name *" value={form.name} onChange={e => set('name', e.target.value)} />
      <input className={styles.input} placeholder="Price (₹) *" type="number" value={form.price} onChange={e => set('price', e.target.value)} />

      <select className={styles.input} value={form.category} onChange={e => set('category', e.target.value)}>
        <option value="">Select category *</option>
        {VALID_CATEGORIES.map(c => (
          <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
        ))}
      </select>

      <textarea className={styles.textarea} placeholder="Description" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />

      {/* Image upload (required for new items) */}
      <div className={styles.fileRow}>
        <label className={styles.fileLabel}>
          🖼 Image {!food && <span style={{ color: 'var(--accent)' }}>*</span>}
        </label>
        <input ref={imageRef} type="file" accept="image/*" className={styles.fileInput} />
      </div>

      {/* Video upload (optional) */}
      <div className={styles.fileRow}>
        <label className={styles.fileLabel}>🎥 Video (optional)</label>
        <input ref={videoRef} type="file" accept="video/*" className={styles.fileInput} />
      </div>

      <div className={styles.vegRow}>
        <span>Veg item</span>
        <button
          className={`${styles.toggle} ${form.isVeg ? styles.toggleOn : ''}`}
          onClick={() => set('isVeg', !form.isVeg)}
          type="button"
        >
          <span className={styles.toggleThumb} />
        </button>
      </div>

      {saveMut.error && <p className={styles.error}>{saveMut.error.response?.data?.message || 'Save failed'}</p>}

      <div className={styles.formBtns}>
        <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
        <button
          className={styles.submitBtn}
          onClick={() => saveMut.mutate()}
          disabled={saveMut.isPending || !form.name || !form.price || !form.category}
        >
          {saveMut.isPending ? 'Saving...' : food ? 'Update' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}
