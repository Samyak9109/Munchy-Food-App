import { Outlet } from 'react-router-dom';
import BottomNav from '../components/common/BottomNav';
import styles from './UserLayout.module.css';

export default function UserLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
}
