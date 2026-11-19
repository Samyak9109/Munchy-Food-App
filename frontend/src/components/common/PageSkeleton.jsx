import styles from './PageSkeleton.module.css';

export default function PageSkeleton() {
  return (
    <div className={styles.skeletonContainer} aria-label="Loading content" role="status">
      <div className={styles.skeletonHeader} />
      <div className={styles.skeletonBanner} />
      <div className={styles.skeletonList}>
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
        <div className={styles.skeletonCard} />
      </div>
    </div>
  );
}
