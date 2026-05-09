import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';
import EmployeeForm from './components/EmployeeForm';
import employeeService, { type Employee } from '../../services/employee.service';
import { useToastStore } from '../../store/toastStore';

const EditEmployee = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const addToast = useToastStore(state => state.addToast);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const response = await employeeService.getEmployeeById(id);
        setEmployee(response.data.employee);
      } catch (error) {
        console.error('Failed to fetch employee', error);
      } finally {
        setFetching(false);
      }
    };
    fetchEmployee();
  }, [id]);

  const handleSubmit = async (data: Partial<Employee>) => {
    if (!id) return;
    setLoading(true);
    try {
      await employeeService.updateEmployee(id!, data);
      addToast('Employee updated successfully', 'success');
      navigate(`/employees/${id}`);
    } catch (error) {
      console.error('Failed to update employee', error);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return <div className="loading-state">Loading employee data...</div>;
  }

  if (!employee) {
    return <div className="error-state">Employee not found</div>;
  }

  return (
    <div className="edit-employee-page">
      <PageHeader 
        title={`Edit Employee: ${employee.fullName}`} 
        subtitle={`Employee ID: ${employee.employeeId}`}
      />
      <EmployeeForm 
        initialData={employee}
        onSubmit={handleSubmit} 
        onCancel={() => navigate('/employees')} 
        loading={loading}
      />
    </div>
  );
};

export default EditEmployee;
