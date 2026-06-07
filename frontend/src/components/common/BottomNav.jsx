import { NavLink } from 'react-router-dom';
import { Film, Compass, Bot, ShoppingCart, ClipboardList } from 'lucide-react';
import { useCartStore } from '../../store/cartStore';
import styles from './BottomNav.module.css';

const links = [
  { to: '/',         icon: Film,          label: 'Reels'    },
  { to: '/kitchens', icon: Compass,       label: 'Find'     },
  { to: '/chatbot',  icon: Bot,           label: 'Mood'     },
  { to: '/cart',     icon: ShoppingCart,  label: 'Cart', cart: true },
  { to: '/orders',   icon: ClipboardList, label: 'Orders'   },
];

export default function BottomNav() {
  const { itemCount } = useCartStore();

  return (
    <nav className={styles.nav}>
      {links.map(({ to, icon: Icon, label, cart }) => (
        <NavLink
          key={to}
          to={to}
          end={to === '/'}
          className={({ isActive }) =>
            `${styles.link} ${isActive ? styles.active : ''}`
          }
        >
          <span className={styles.iconWrap}>
            <Icon size={22} />
            {cart && itemCount > 0 && (
              <span className={styles.badge}>{itemCount}</span>
            )}
          </span>
          <span className={styles.label}>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
