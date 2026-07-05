import React, { useState, useEffect, useRef } from 'react';
import { InputField, SelectField } from '../../../components/ui/FormFields';
import employeeService, { type Employee, type EmployeeDocument } from '../../../services/employee.service';
import { useToastStore } from '../../../store/toastStore';
import { ALLOWED_FILE_TYPES, ALLOWED_EXTENSIONS, MAX_FILE_SIZE, fileToBase64, getFileIcon } from '../../../lib/file';
import { getTodayIST } from '../../../lib/date';
import { Loader2, Save, X, Upload, Plus, Trash2 } from 'lucide-react';
import './EmployeeForm.css';

interface EmployeeFormProps {
  initialData?: Partial<Employee>;
  onSubmit: (data: Partial<Employee>) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
}

const MAX_DOCUMENTS = 10;

const EmployeeForm: React.FC<EmployeeFormProps> = ({ initialData, onSubmit, onCancel, loading }) => {
  const [formData, setFormData] = useState<Partial<Employee & { reportingManagerId?: string }>>(() => {
    const data: Record<string, unknown> = {
      fullName: '', email: '', phoneNumber: '', dateOfBirth: '', joiningDate: '',
      department: '', designation: '', employmentType: '', role: '',
      reportingManagerId: '', password: '', bankName: '', accountNumber: '',
      ifscCode: '', branchName: '', panNumber: '', aadhaarNumber: '',
      nationality: '', address: { line1: '', line2: '', city: '', state: '', country: '', postalCode: '' },
      education: [],
      ...initialData
    };

    // Ensure no null values for controlled inputs
    Object.keys(data).forEach(key => {
      if (data[key] === null) data[key] = '';
    });

    // Format dates for input type="date"
    if (data.dateOfBirth) data.dateOfBirth = new Date(data.dateOfBirth as string).toISOString().split('T')[0];
    if (data.joiningDate) data.joiningDate = new Date(data.joiningDate as string).toISOString().split('T')[0];

    // Extract ID if reportingManager is an object
    if (typeof initialData?.reportingManager === 'object') {
      const rm = initialData.reportingManager as { id: string };
      data.reportingManagerId = rm?.id || '';
    }

    return data;
  });

  const [managers, setManagers] = useState<Array<{ id: string; fullName: string; employeeId: string }>>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [formDocuments, setFormDocuments] = useState<EmployeeDocument[]>(() => {
    if (initialData?.documents) {
      return initialData.documents.map((doc) => ({
        id: doc.id, fileName: doc.fileName, mimeType: doc.mimeType, size: doc.size, isExisting: !!doc.id
      }));
    }
    return [];
  });

  useEffect(() => {
    const fetchManagers = async () => {
      try {
        const data = await employeeService.getManagers();
        setManagers(data);
      } catch {
        useToastStore.getState().addToast('Failed to load managers', 'error');
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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...(prev.address || {}), [name]: value }
    }));
  };

  const handleEducationChange = (index: number, field: string, value: string) => {
    const list = [...(formData.education || [])];
    list[index] = { ...list[index], [field]: value };
    setFormData(prev => ({ ...prev, education: list }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...(prev.education || []), { degree: '', duration: '', institute: '', grade: '' }]
    }));
  };

  const removeEducation = (index: number) => {
    const list = [...(formData.education || [])];
    list.splice(index, 1);
    setFormData(prev => ({ ...prev, education: list }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.fullName) newErrors.fullName = 'Full Name is required';
    else if (formData.fullName.length > 60) newErrors.fullName = 'Full Name cannot exceed 60 characters';
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Phone Number is required';
    else if (!/^[6-9]\d{9}$/.test(formData.phoneNumber)) newErrors.phoneNumber = 'Phone number must be 10 digits';
    if (formData.dateOfBirth) {
      const dob = new Date(formData.dateOfBirth);
      const { year, month, day } = getTodayIST();
      const minDate = new Date(year - 18, month - 1, day);
      if (dob > minDate) {
        newErrors.dateOfBirth = 'Enter valid age';
      }
    }
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.designation) newErrors.designation = 'Designation is required';
    if (!formData.joiningDate) newErrors.joiningDate = 'Joining Date is required';
    if (!formData.employmentType) newErrors.employmentType = 'Employment Type is required';
    if (!formData.role) newErrors.role = 'Role is required';
    if (!initialData?.id && !formData.password) newErrors.password = 'Password is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file) return;

    if (formDocuments.length >= MAX_DOCUMENTS) {
      alert(`A maximum of ${MAX_DOCUMENTS} documents is allowed`);
      return;
    }

    if (!ALLOWED_FILE_TYPES.includes(file.type as typeof ALLOWED_FILE_TYPES[number])) {
      alert('Unsupported file type. Allowed: JPG, PNG, PDF');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File exceeds maximum size of 5MB');
      return;
    }

    const data = await fileToBase64(file);
    setFormDocuments((prev) => [
      ...prev,
      {
        id: `new-${Date.now()}`,
        fileName: file.name,
        mimeType: file.type,
        data,
        size: file.size
      }
    ]);
  };

  const removeDocument = (docId: string) => {
    setFormDocuments((prev) => prev.filter((d) => d.id !== docId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const cleanDocuments = formDocuments.map(({ id, ...rest }) => {
        if (id && id.startsWith('new-')) return rest;
        return { id, ...rest };
      });

      const cleanData = { ...formData, documents: cleanDocuments } as Partial<Employee>;

      if (!cleanData.password) {
        delete cleanData.password;
      }

      onSubmit(cleanData);
    }
  };

  const { year: curYear, month: curMonth, day: curDay } = getTodayIST();
  const maxDobDate = `${curYear - 18}-${String(curMonth).padStart(2, '0')}-${String(curDay).padStart(2, '0')}`;

  return (
    <form className="employee-form" onSubmit={handleSubmit}>
      <div className="form-section">
        {/* Section A: Personal Details */}
        <div className="form-card">
          <h3>Personal Details</h3>
          <div className="form-grid-3">
            <InputField label="Full Name" name="fullName" value={formData.fullName} onChange={handleChange} error={errors.fullName} placeholder="John Doe" required maxLength={60} />
            <InputField label="Email Address" name="email" type="email" value={formData.email} onChange={handleChange} error={errors.email} placeholder="john@company.com" required maxLength={254} />
            <InputField label="Phone Number" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} error={errors.phoneNumber} placeholder="9876543210" required maxLength={10} />
            <InputField label="Date of Birth" name="dateOfBirth" type="date" value={formData.dateOfBirth} onChange={handleChange} error={errors.dateOfBirth} max={maxDobDate} required />
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
            <InputField label="Nationality" name="nationality" value={formData.nationality} onChange={handleChange} placeholder="Indian" />
          </div>
        </div>

        {/* Section B: Employment Details */}
        <div className="form-card">
          <h3>Employment Details</h3>
          <div className="form-grid-3">
            <InputField label="Employee ID" name="employeeId" value={formData.employeeId} disabled placeholder="Auto-generated" />
            <InputField label="Joining Date" name="joiningDate" type="date" value={formData.joiningDate} onChange={handleChange} error={errors.joiningDate} required />
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
              required
              error={errors.employmentType}
            />
          </div>
        </div>

        {/* Section C: Reporting & Role */}
        <div className="form-card">
          <h3>Reporting & Role</h3>
          <div className="form-grid-3">
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
              error={errors.role}
            />
          </div>
        </div>

        {/* Section D: Bank & Government Details */}
        <div className="form-card">
          <h3>Bank & Government Details</h3>
          <div className="form-grid-3">
            <InputField label="Bank Name" name="bankName" value={formData.bankName} onChange={handleChange} placeholder="Global Bank" />
            <InputField label="Branch Name" name="branchName" value={formData.branchName} onChange={handleChange} placeholder="Main Branch" />
            <InputField label="Account Number" name="accountNumber" value={formData.accountNumber} onChange={handleChange} placeholder="1234567890" />
            <InputField label="IFSC Code" name="ifscCode" value={formData.ifscCode} onChange={handleChange} placeholder="GBNK0001234" />
            <InputField label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} placeholder="ABCDE1234F" />
            <InputField label="Aadhaar Number" name="aadhaarNumber" value={formData.aadhaarNumber} onChange={handleChange} placeholder="1234 5678 9012" />
          </div>
        </div>

        {/* Section E: Address */}
        <div className="form-card">
          <h3>Address</h3>
          <div className="form-grid-3">
            <InputField label="Address Line 1" name="line1" value={formData.address?.line1 || ''} onChange={handleAddressChange} />
            <InputField label="Address Line 2" name="line2" value={formData.address?.line2 || ''} onChange={handleAddressChange} />
            <InputField label="City" name="city" value={formData.address?.city || ''} onChange={handleAddressChange} />
            <InputField label="State" name="state" value={formData.address?.state || ''} onChange={handleAddressChange} />
            <InputField label="Country" name="country" value={formData.address?.country || ''} onChange={handleAddressChange} />
            <InputField label="Postal Code" name="postalCode" value={formData.address?.postalCode || ''} onChange={handleAddressChange} />
          </div>
        </div>

        {/* Section F: Education */}
        <div className="form-card">
          <h3>Education</h3>
          {(formData.education || []).map((edu, index) => (
            <div key={index} className="education-entry" style={{ border: '1px solid var(--border-color)', borderRadius: '8px', padding: '16px', marginBottom: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <strong>Education #{index + 1}</strong>
                <button type="button" className="btn-icon" onClick={() => removeEducation(index)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger-color)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="form-grid-2">
                <InputField label="Degree" name={`degree-${index}`} value={edu.degree} onChange={(e) => handleEducationChange(index, 'degree', e.target.value)} placeholder="B.E. Computer Science" />
                <InputField label="Duration" name={`duration-${index}`} value={edu.duration} onChange={(e) => handleEducationChange(index, 'duration', e.target.value)} placeholder="2018 - 2022" />
                <InputField label="Institute" name={`institute-${index}`} value={edu.institute} onChange={(e) => handleEducationChange(index, 'institute', e.target.value)} placeholder="University Name" />
                <InputField label="Grade" name={`grade-${index}`} value={edu.grade} onChange={(e) => handleEducationChange(index, 'grade', e.target.value)} placeholder="8.5 CGPA / 85%" />
              </div>
            </div>
          ))}
          <button type="button" className="btn-secondary" onClick={addEducation} style={{ marginTop: '8px' }}>
            <Plus size={16} /> Add Education
          </button>
        </div>

        {/* Section G: Documents */}
        <div className="form-card">
          <h3>Documents</h3>
          <p className="form-documents-hint">JPG, PNG, or PDF — max 5 MB each (up to {MAX_DOCUMENTS} files)</p>

          {formDocuments.length > 0 && (
            <div className="form-documents-list">
              {formDocuments.map((doc) => (
                <div key={doc.id} className="form-document-item">
                  <span className="form-document-item-icon">{getFileIcon(doc.mimeType)}</span>
                  <span className="form-document-item-name" title={doc.fileName}>{doc.fileName}</span>
                  <button type="button" className="form-document-remove-btn" onClick={() => removeDocument(doc.id)} aria-label={`Remove ${doc.fileName}`}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div
            className={`form-document-upload-zone${formDocuments.length >= MAX_DOCUMENTS ? ' disabled' : ''}`}
            onClick={() => formDocuments.length < MAX_DOCUMENTS && documentInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && formDocuments.length < MAX_DOCUMENTS && documentInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-disabled={formDocuments.length >= MAX_DOCUMENTS}
          >
            <Upload size={20} />
            <span>{formDocuments.length >= MAX_DOCUMENTS ? `Maximum ${MAX_DOCUMENTS} documents reached` : 'Click to upload document'}</span>
            <input ref={documentInputRef} type="file" accept={ALLOWED_EXTENSIONS} hidden onChange={handleFileSelect} />
          </div>
        </div>
      </div>

      <div className="form-actions-row">
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
