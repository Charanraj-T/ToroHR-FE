import StatsCard from '../../../components/ui/StatsCard';
import LoadingSkeleton from '../../claims/components/LoadingSkeleton';
import type { PayrollSummary } from '../../../services/payroll.service';
import { FileEdit, CheckCircle2, Banknote } from 'lucide-react';

interface PayrollSummaryCardsProps {
  summary: PayrollSummary;
  loading?: boolean;
}

const PayrollSummaryCards = ({ summary, loading }: PayrollSummaryCardsProps) => {
  if (loading) {
    return <LoadingSkeleton variant="cards" count={3} />;
  }

  return (
    <div className="payroll-summary-grid">
      <StatsCard title="Draft" value={summary.Draft} icon={<FileEdit size={24} />} variant="blue" />
      <StatsCard
        title="Processed"
        value={summary.Processed}
        icon={<CheckCircle2 size={24} />}
        variant="green"
      />
      <StatsCard title="Paid" value={summary.Paid} icon={<Banknote size={24} />} variant="dark" />
    </div>
  );
};

export default PayrollSummaryCards;
