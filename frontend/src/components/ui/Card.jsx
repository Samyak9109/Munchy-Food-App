import styles from './Card.module.css';

/**
 * Surface Card primitive
 * @param {boolean} interactive
 */
export default function Card({
  children,
  interactive = false,
  className = '',
  as: Component = 'div',
  ...props
}) {
  return (
    <Component
      className={`${styles.card} ${interactive ? styles.interactive : ''} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
