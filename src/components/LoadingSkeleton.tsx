import styles from './LoadingSkeleton.module.css';

interface LoadingSkeletonProps {
  variant?: 'text' | 'rect' | 'circle';
  width?: string | number;
  height?: string | number;
  count?: number;
}

export default function LoadingSkeleton({ 
  variant = 'rect', 
  width = '100%', 
  height = 20,
  count = 1 
}: LoadingSkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => i);

  const getClassName = () => {
    switch (variant) {
      case 'text':
        return styles.skeletonText;
      case 'circle':
        return styles.skeletonCircle;
      default:
        return styles.skeletonRect;
    }
  };

  return (
    <>
      {skeletons.map((_, index) => (
        <div
          key={index}
          className={`${styles.skeleton} ${getClassName()}`}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: typeof height === 'number' ? `${height}px` : height,
          }}
        />
      ))}
    </>
  );
}

export function NewsFeedSkeleton() {
  return (
    <div className={styles.newsFeedSkeleton}>
      {[1, 2, 3].map((i) => (
        <div key={i} className={styles.newsItemSkeleton}>
          <LoadingSkeleton width={80} height={12} />
          <LoadingSkeleton width="100%" height={16} />
          <LoadingSkeleton width="70%" height={12} />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.tableSkeleton}>
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className={styles.tableRowSkeleton}>
          <LoadingSkeleton variant="circle" width={24} height={24} />
          <LoadingSkeleton width="30%" height={14} />
          <LoadingSkeleton width="20%" height={14} />
          <LoadingSkeleton width="15%" height={14} />
        </div>
      ))}
    </div>
  );
}