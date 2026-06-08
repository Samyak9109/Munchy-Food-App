import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './StoreManagePage.module.css';

export default function StoreManagePage() {
  const { user } = useAuthStore();
  const qc = useQueryClient();
  const storeId = user?.stores?.[0] || user?.id;
  const [showFoodForm, setShowFoodForm] = useState(false);
  const [editFood, setEditFood] = useState(null);

  const { data: storeData } = useQuery({
    queryKey: ['my-store'],
    queryFn: () => api.getStoreById(storeId).then(r => r.data),
    enabled: !!storeId,
  });

  const { data: menuData, isLoading } = useQuery({
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

  const store = storeData?.store;
  const foods = menuData?.foods || [];

  return (
    <div className={styles.page}>
      <Header title="Kitchen" showLocation={false} />

      <div className={styles.content}>
        {/* Store info */}
        {store && (
          <div className={styles.storeCard}>
            {store.image && <img src={store.image} alt={store.name} className={styles.storeImg} />}
            <div className={styles.storeInfo}>
              <h2 className={styles.storeName}>{store.name}</h2>
              <p className={styles.storeCuisine}>{store.cuisine?.join(', ')}</p>
              <p className={styles.storeAddr}>{store.address?.street}, {store.address?.city}</p>
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

        {isLoading && <p className={styles.dim}>Loading menu...</p>}
        {!isLoading && foods.length === 0 && <p className={styles.dim}>No items yet. Add your first dish!</p>}

        <div className={styles.foodList}>
          {foods.map(food => (
            <div key={food._id} className={`${styles.foodCard} ${!food.isAvailable ? styles.unavailable : ''}`}>
              {food.image && <img src={food.image} alt={food.name} className={styles.foodThumb} />}
              <div className={styles.foodInfo}>
                <p className={styles.foodName}>{food.name}</p>
                <p className={styles.foodPrice}>₹{food.price}</p>
                {food.category && <p className={styles.foodCat}>{food.category}</p>}
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

function FoodForm({ storeId, food, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: food?.name || '',
    price: food?.price || '',
    description: food?.description || '',
    category: food?.category || '',
    isVeg: food?.isVeg ?? true,
  });

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const saveMut = useMutation({
    mutationFn: () => food
      ? api.updateFood(food._id, { ...form, storeId })
      : api.createFood({ ...form, storeId }),
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
      <input className={styles.input} placeholder="Category (e.g. Burgers)" value={form.category} onChange={e => set('category', e.target.value)} />
      <textarea className={styles.textarea} placeholder="Description" rows={3} value={form.description} onChange={e => set('description', e.target.value)} />
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
        <button className={styles.submitBtn} onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.name || !form.price}>
          {saveMut.isPending ? 'Saving...' : food ? 'Update' : 'Add Item'}
        </button>
      </div>
    </div>
  );
}
