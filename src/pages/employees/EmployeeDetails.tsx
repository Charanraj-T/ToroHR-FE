import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, User, Briefcase, Landmark, ShieldCheck } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatusBadge from '../../components/ui/StatusBadge';
import employeeService, { type Employee } from '../../services/employee.service';
import { useAuthStore } from '../../store/authStore';
import './EmployeeDetails.css';

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const user = useAuthStore(state => state.user);

  useEffect(() => {
    const fetchEmployee = async () => {
      if (!id) return;
      try {
        const response = await employeeService.getEmployeeById(id);
        setEmployee(response.data.employee);
      } catch (error) {
        console.error('Failed to fetch employee', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployee();
  }, [id]);

  if (loading) return <div className="loading-state">Loading profile...</div>;
  if (!employee) return <div className="error-state">Employee not found</div>;

  const DetailRow = ({ label, value }: { label: string, value?: string }) => (
    <div className="detail-row">
      <span className="detail-label">{label}</span>
      <span className="detail-value">{value || 'N/A'}</span>
    </div>
  );

  const canEdit = user?.role === 'Admin' || user?.role === 'Manager';

  return (
    <div className="employee-details-page">
      <PageHeader 
        title={employee.fullName}
        subtitle={employee.designation}
        actions={
          canEdit ? (
            <>
              <button className="btn-secondary" onClick={() => navigate('/employees')}>
                <ArrowLeft size={18} /> Back
              </button>
              <button className="btn-primary" onClick={() => navigate(`/employees/edit/${employee.id}`)}>
                <Edit size={18} /> Edit Profile
              </button>
            </>
          ) : null
        }
      />

      <div className="details-grid">
        {/* Personal & Employment Header */}
        <div className="profile-header-card">
          <div className="profile-avatar-large">
            {employee.fullName.substring(0, 2).toUpperCase()}
          </div>
          <div className="profile-main-info">
            <h2>{employee.fullName}</h2>
            <div className="profile-badges">
              <StatusBadge status={employee.status} />
              <span className="role-badge">{employee.role}</span>
            </div>
            <p className="profile-email">{employee.email}</p>
          </div>
        </div>

        {/* Details Sections */}
        <div className="sections-container">
          <div className="detail-section">
            <div className="section-title">
              <User size={18} /> <h3>Personal Information</h3>
            </div>
            <div className="detail-content grid-2">
              <DetailRow label="Full Name" value={employee.fullName} />
              <DetailRow label="Email" value={employee.email} />
              <DetailRow label="Phone" value={employee.phoneNumber} />
              <DetailRow label="Date of Birth" value={employee.dateOfBirth ? new Date(employee.dateOfBirth).toLocaleDateString('en-IN') : 'N/A'} />
            </div>
          </div>

          <div className="detail-section">
            <div className="section-title">
              <Briefcase size={18} /> <h3>Employment Information</h3>
            </div>
            <div className="detail-content grid-2">
              <DetailRow label="Employee ID" value={employee.employeeId} />
              <DetailRow label="Department" value={employee.department} />
              <DetailRow label="Designation" value={employee.designation} />
              <DetailRow label="Joining Date" value={employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-IN') : 'N/A'} />
              <DetailRow label="Employment Type" value={employee.employmentType} />
              <DetailRow label="Reporting Manager" value={(employee.reportingManager && typeof employee.reportingManager === 'object') ? (employee.reportingManager as any).fullName : 'N/A'} />
            </div>
          </div>

          <div className="detail-section">
            <div className="section-title">
              <Landmark size={18} /> <h3>Bank Details</h3>
            </div>
            <div className="detail-content grid-2">
              <DetailRow label="Bank Name" value={employee.bankName} />
              <DetailRow label="Account Number" value={employee.accountNumber} />
              <DetailRow label="IFSC Code" value={employee.ifscCode} />
              <DetailRow label="Branch Name" value={employee.branchName} />
            </div>
          </div>

          <div className="detail-section">
            <div className="section-title">
              <ShieldCheck size={18} /> <h3>Government IDs</h3>
            </div>
            <div className="detail-content grid-2">
              <DetailRow label="PAN Number" value={employee.panNumber} />
              <DetailRow label="Aadhaar Number" value={employee.aadhaarNumber} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;
