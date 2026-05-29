import './LoadingSkeleton.css';

interface LoadingSkeletonProps {
  variant?: 'cards' | 'table';
  count?: number;
}

const LoadingSkeleton = ({ variant = 'cards', count = 4 }: LoadingSkeletonProps) => {
  if (variant === 'table') {
    return (
      <div className="claim-skeleton-table">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="claim-skeleton-row" />
        ))}
      </div>
    );
  }

  return (
    <div className="claim-skeleton-cards">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="claim-skeleton-card">
          <div className="claim-skeleton-icon" />
          <div className="claim-skeleton-lines">
            <div className="claim-skeleton-line short" />
            <div className="claim-skeleton-line long" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default LoadingSkeleton;
