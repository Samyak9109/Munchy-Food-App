import { Outlet } from 'react-router-dom';
import BottomNav from '../components/common/BottomNav';
import ErrorBoundary from '../components/common/ErrorBoundary';
import styles from './UserLayout.module.css';

export default function UserLayout() {
  return (
    <div className={styles.layout}>
      <main className={styles.main}>
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
      <BottomNav />
    </div>
  );
}
