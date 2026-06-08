import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Minus, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { Link } from 'react-router-dom';
import * as api from '../../api/index';
import Header from '../../components/common/Header';
import styles from './CartPage.module.css';

export default function CartPage() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => api.getCart().then(r => r.data),
  });

  const cart = data?.cart;

  const updateQty = useMutation({
    mutationFn: ({ foodId, quantity }) => api.updateCartQty({ foodId, quantity }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const removeItem = useMutation({
    mutationFn: (foodId) => api.removeFromCart(foodId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  const clearCart = useMutation({
    mutationFn: api.clearCart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });

  if (isLoading) return <div className={styles.empty}><p>Loading...</p></div>;

  if (!cart || cart.items?.length === 0) {
    return (
      <div className={styles.page}>
        <Header title="Cart" showLocation={false} />
        <div className={styles.empty}>
          <ShoppingCart size={48} strokeWidth={1} />
          <p>Your cart is empty.</p>
          <Link to="/" className={styles.browseBtn}>Browse Reels</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Header title="Cart" showLocation={false} />

      <div className={styles.content}>
        <div className={styles.storeTag}>
          🏪 {cart.store?.name || 'Kitchen'}
        </div>

        <div className={styles.items}>
          {cart.items.map(item => (
            <div key={item.food._id} className={styles.item}>
              {item.food.image && (
                <img src={item.food.image} alt={item.food.name} className={styles.itemImg} />
              )}
              <div className={styles.itemInfo}>
                <p className={styles.itemName}>{item.food.name}</p>
                <p className={styles.itemPrice}>₹{item.price}</p>
              </div>
              <div className={styles.qtyControls}>
                <button
                  className={styles.qtyBtn}
                  onClick={() => item.quantity > 1
                    ? updateQty.mutate({ foodId: item.food._id, quantity: item.quantity - 1 })
                    : removeItem.mutate(item.food._id)
                  }
                >
                  {item.quantity === 1 ? <Trash2 size={14} /> : <Minus size={14} />}
                </button>
                <span className={styles.qty}>{item.quantity}</span>
                <button
                  className={styles.qtyBtn}
                  onClick={() => updateQty.mutate({ foodId: item.food._id, quantity: item.quantity + 1 })}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Total */}
        <div className={styles.totalRow}>
          <span>Total</span>
          <span className={styles.totalAmt}>₹{cart.totalPrice}</span>
        </div>

        <Link to="/checkout" className={styles.checkoutBtn}>
          Proceed to Checkout →
        </Link>

        <button
          className={styles.clearBtn}
          onClick={() => clearCart.mutate()}
          disabled={clearCart.isPending}
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
}
