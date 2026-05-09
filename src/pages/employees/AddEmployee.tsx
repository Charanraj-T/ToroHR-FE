import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import EmployeeForm from './components/EmployeeForm';
import employeeService, { type Employee } from '../../services/employee.service';
import { useToastStore } from '../../store/toastStore';

const AddEmployee = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const addToast = useToastStore(state => state.addToast);

  const handleSubmit = async (data: Partial<Employee>) => {
    setLoading(true);
    try {
      await employeeService.createEmployee(data);
      addToast('Employee created successfully', 'success');
      navigate('/employees');
    } catch (error) {
      console.error('Failed to create employee', error);
      // Handle error display
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-employee-page">
      <PageHeader 
        title="Add New Employee" 
        subtitle="Onboard a new member to your organization"
      />
      <EmployeeForm 
        onSubmit={handleSubmit} 
        onCancel={() => navigate('/employees')} 
        loading={loading}
      />
    </div>
  );
};

export default AddEmployee;
