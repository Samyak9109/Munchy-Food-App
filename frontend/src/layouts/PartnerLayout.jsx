import { Outlet, NavLink } from 'react-router-dom';
import { LayoutDashboard, Film, ClipboardList, BarChart2, Store } from 'lucide-react';
import styles from './PartnerLayout.module.css';

const links = [
  { to: '/partner/dashboard', icon: LayoutDashboard, label: 'Hub'      },
  { to: '/partner/orders',    icon: ClipboardList,   label: 'Orders'   },
  { to: '/partner/reels',     icon: Film,            label: 'Reels'    },
  { to: '/partner/analytics', icon: BarChart2,       label: 'Stats'    },
  { to: '/partner/store',     icon: Store,           label: 'Kitchen'  },
];

export default function PartnerLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <nav className={styles.nav}>
        {links.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) => `${styles.link} ${isActive ? styles.active : ''}`}
          >
            <Icon size={22} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
