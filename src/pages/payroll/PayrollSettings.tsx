import PageHeader from '../../components/ui/PageHeader';
import PayrollSettingsForm from './components/PayrollSettingsForm';
import './Payroll.css';

const PayrollSettingsPage = () => (
  <div className="payroll-page animate-fade-in">
    <PageHeader
      title="Payroll Settings"
      subtitle="Configure payroll generation and default deductions"
    />
    <PayrollSettingsForm />
  </div>
);

export default PayrollSettingsPage;
