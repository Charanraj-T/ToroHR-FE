import { FileX2 } from 'lucide-react';
import './EmptyState.css';

interface EmptyStateProps {
  title?: string;
  message?: string;
  icon?: React.ReactNode;
}

const EmptyState = ({
  title = 'No claims found',
  message = 'Try adjusting your filters or create a new claim.',
  icon
}: EmptyStateProps) => (
  <div className="claim-empty-state">
    <div className="claim-empty-icon">{icon || <FileX2 size={32} />}</div>
    <h4>{title}</h4>
    <p>{message}</p>
  </div>
);

export default EmptyState;
