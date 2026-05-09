import React, { useState, useEffect } from 'react';
import { InputField, SelectField } from '../../../components/ui/FormFields';
import employeeService, { type Employee } from '../../../services/employee.service';
import { Loader2, Save, X } from 'lucide-react';
import './EmployeeForm.css';

interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<Partial<Employee & { reportingManagerId?: string }>>(() => {
    const data: any = {
      fullName: '', email: '', phoneNumber: '', dateOfBirth: '', joiningDate: '',
      department: '', designation: '', employmentType: '', role: '',
      reportingManagerId: '', password: '', bankName: '', accountNumber: '',
      ifscCode: '', branchName: '', panNumber: '', aadhaarNumber: '',
      ...initialData
    };

    // Ensure no null values for controlled inputs
    Object.keys(data).forEach(key => {
      if (data[key] === null) data[key] = '';
    });

    // Format dates for input type="date"
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth).toISOString().split('T')[0];
    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate).toISOString().split('T')[0];

    // Extract ID if reportingManager is an object
    if (typeof initialData?.reportingManager === 'object') {
      data.reportingManagerId = (initialData.reportingManager as any)?.id || '';
    }

    return data;
  });

  const [managers, setManagers] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const data = await employeeService.getManagers();
        setManagers(data);
      } catch (error) {
        console.error('Failed to fetch managers', error);
      }
    };
    fetchManagers();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!initialData?.id && !formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      // Clean up data before submission
      const cleanData = { ...formData };
      
      // Remove empty password to avoid Joi validation error on backend
      if (!cleanData.password) {
        delete cleanData.password;
      }

      // Convert empty strings to null for backend optional fields if needed
      // but usually the backend handles it. Here we focus on password.
      
      onSubmit(cleanData);
    }
  };

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-sections">
        {/* Section A: Personal Details */}
        <div className="form-card">
          <h3>Personal Details</h3>
          <div className="form-grid">
            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="John Doe" required />
            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="john@company.com" required />
            <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} placeholder="98765 43210" required />
            <InputField label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} required />
            <InputField 
              label={initialData?.id ? "Update Password" : "Login Password"} 
              name="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
              helperText={initialData?.id ? "Leave blank to keep current password" : "Required for new employees"}
              required={!initialData?.id} 
            />
          </div>
        </div>

        {/* Section B: Employment Details */}
        <div className="form-card">
          <h3>Employment Details</h3>
          <div className="form-grid">
            <InputField label="Employee ID" name="employeeId" value={formData.employeeId} disabled placeholder="Auto-generated" />
            <InputField label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} required />
            <SelectField 
              label="Department" 
              name="department" 
              value={formData.department} 
              onChange={handleChange} 
              error={errors.department}
              options={[
                { value: '', label: 'Select Department' },
                { value: 'Engineering', label: 'Engineering' },
                { value: 'HR', label: 'HR' },
                { value: 'Finance', label: 'Finance' },
                { value: 'Operations', label: 'Operations' },
                { value: 'Marketing', label: 'Marketing' }
              ]} 
              required 
            />
            <InputField label="Designation" name="designation" value={formData.designation} onChange={handleChange} error={errors.designation} placeholder="Software Engineer" required />
            <SelectField 
              label="Employment Type" 
              name="employmentType" 
              value={formData.employmentType} 
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Type' },
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Contract', label: 'Contract' }
              ]} 
            />
          </div>
        </div>

        {/* Section C: Reporting & Role */}
        <div className="form-card">
          <h3>Reporting & Role</h3>
          <div className="form-grid">
            <SelectField 
              label="Reporting Manager" 
              name="reportingManagerId" 
              value={formData.reportingManagerId} 
              onChange={handleChange}
              options={[
                { value: '', label: 'None (Self/Top)' },
                ...managers.map(m => ({ value: m.id, label: `${m.fullName} (${m.employeeId})` }))
              ]} 
            />
            <SelectField 
              label="Role" 
              name="role" 
              value={formData.role} 
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Role' },
                { value: 'Employee', label: 'Employee' },
                { value: 'Manager', label: 'Manager' }
              ]} 
              required
            />
          </div>
        </div>



        {/* Section E: Bank & Government Details */}
        <div className="form-card">
          <h3>Bank & Government Details</h3>
          <div className="form-grid">
            <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="Global Bank" />
            <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="1234567890" />
            <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="GBNK0001234" />
            <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" />
            <InputField label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} placeholder="1234 5678 9012" />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel} disabled={loading}>
          <X size={18} /> Cancel
        </button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
          {initialData?.id ? 'Update Employee' : 'Create Employee'}
        </button>
      </div>
    </form>
  );
};

export default EmployeeForm;
