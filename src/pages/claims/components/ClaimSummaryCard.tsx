import StatsCard from '../../../components/ui/StatsCard';

interface ClaimSummaryCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: 'dark' | 'green' | 'blue' | 'white' | 'red';
}

const ClaimSummaryCard = ({ title, value, icon, variant = 'white' }: ClaimSummaryCardProps) => {
  return <StatsCard title={title} value={value} icon={icon} variant={variant} />;
};

export default ClaimSummaryCard;
