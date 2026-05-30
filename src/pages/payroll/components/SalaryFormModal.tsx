import { useEffect, useMemo, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import type { Employee } from '../../../services/employee.service';
import type { EmploymentType, SalaryStructure } from '../../../services/payroll.service';
import payrollService from '../../../services/payroll.service';
import { useToastStore } from '../../../store/toastStore';
import { MONTH_NAMES, buildYearOptions, formatCurrency } from '../payrollHelpers';
import LoadingSkeleton from '../../claims/components/LoadingSkeleton';
import './SalaryFormModal.css';

interface SalaryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employees: Employee[];
  editingStructure?: SalaryStructure | null;
}

const SalaryFormModal = ({
  isOpen,
  onClose,
  onSuccess,
  employees,
  editingStructure
}: SalaryFormModalProps) => {
  const { addToast } = useToastStore();
  const isEdit = Boolean(editingStructure);
  const submittedRef = useRef(false);

  const [employeeId, setEmployeeId] = useState('');
  const [employmentType, setEmploymentType] = useState<EmploymentType>('Full-time');
  const [effectiveMonth, setEffectiveMonth] = useState(String(new Date().getMonth() + 1));
  const [effectiveYear, setEffectiveYear] = useState(String(new Date().getFullYear()));
  const [basic, setBasic] = useState('');
  const [hra, setHra] = useState('');
  const [special, setSpecial] = useState('');
  const [pf, setPf] = useState('');
  const [dailyAmount, setDailyAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const years = buildYearOptions();

  useEffect(() => {
    if (!isOpen) return;

    if (editingStructure) {
      setEmployeeId(editingStructure.employee?.id || '');
      setEmploymentType(editingStructure.employmentType);
      setEffectiveMonth(String(editingStructure.effectiveMonth));
      setEffectiveYear(String(editingStructure.effectiveYear));
      setBasic(String(editingStructure.basic || ''));
      setHra(String(editingStructure.houseRentAllowance || ''));
      setSpecial(String(editingStructure.specialAllowance || ''));
      setPf(editingStructure.pf != null ? String(editingStructure.pf) : '');
      setDailyAmount(String(editingStructure.dailyAmount || ''));
    } else {
      const now = new Date();
      setEmployeeId('');
      setEmploymentType('Full-time');
      setEffectiveMonth(String(now.getMonth() + 1));
      setEffectiveYear(String(now.getFullYear()));
      setBasic('');
      setHra('');
      setSpecial('');
      setDailyAmount('');

      payrollService.getPayrollSettings().then((settings) => {
        setPf(String(settings.defaultPF));
      }).catch(() => {
        setPf('');
      });
    }
    setErrors({});
    submittedRef.current = false;
  }, [isOpen, editingStructure]);

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  useEffect(() => {
    if (selectedEmployee && !isEdit) {
      setEmploymentType(selectedEmployee.employmentType);
    }
  }, [selectedEmployee, isEdit]);

  const gross = useMemo(() => {
    const b = parseFloat(basic) || 0;
    const h = parseFloat(hra) || 0;
    const s = parseFloat(special) || 0;
    return b + h + s;
  }, [basic, hra, special]);

  const netPreview = useMemo(() => {
    const pfVal = pf === '' ? 0 : parseFloat(pf) || 0;
    return Math.max(0, gross - pfVal);
  }, [gross, pf]);

  const validate = () => {
    const next: Record<string, string> = {};
    if (!isEdit && !employeeId) next.employeeId = 'Employee is required';
    if (!effectiveMonth) next.effectiveMonth = 'Month is required';
    if (!effectiveYear) next.effectiveYear = 'Year is required';

    if (employmentType === 'Full-time') {
      if (!basic || parseFloat(basic) <= 0) next.basic = 'Basic must be greater than 0';
    } else if (!dailyAmount || parseFloat(dailyAmount) <= 0) {
      next.dailyAmount = 'Daily amount must be greater than 0';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);

    try {
      const payload = {
        employeeId: isEdit ? editingStructure!.employee!.id : employeeId,
        employmentType,
        effectiveMonth: parseInt(effectiveMonth, 10),
        effectiveYear: parseInt(effectiveYear, 10),
        ...(employmentType === 'Full-time'
          ? {
              basic: parseFloat(basic),
              houseRentAllowance: parseFloat(hra) || 0,
              specialAllowance: parseFloat(special) || 0,
              pf: pf === '' ? null : parseFloat(pf)
            }
          : { dailyAmount: parseFloat(dailyAmount) })
      };

      if (isEdit && editingStructure) {
        await payrollService.updateSalaryStructure(editingStructure.id, payload);
      } else {
        await payrollService.createSalaryStructure(payload);
      }

      addToast('Salary saved successfully', 'success');
      onSuccess();
      onClose();
    } catch {
      submittedRef.current = false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Salary Structure' : 'Add Salary Structure'}
      footer={
        <div className="modal-footer-btns">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button type="submit" form="salary-form" className="btn-primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      {loading && isEdit ? (
        <LoadingSkeleton variant="table" count={4} />
      ) : (
        <form id="salary-form" className="salary-form" onSubmit={handleSubmit}>
          {!isEdit && (
            <div className="form-group">
              <label className="form-label">Employee *</label>
              <select
                className={`form-input ${errors.employeeId ? 'input-error' : ''}`}
                value={employeeId}
                onChange={(e) => setEmployeeId(e.target.value)}
              >
                <option value="">Select employee</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.fullName} ({emp.employeeId}) – {emp.employmentType}
                  </option>
                ))}
              </select>
              {errors.employeeId && <span className="form-error">{errors.employeeId}</span>}
            </div>
          )}

          <div className="salary-form-row">
            <div className="form-group">
              <label className="form-label">Effective Month *</label>
              <select
                className="form-input"
                value={effectiveMonth}
                onChange={(e) => setEffectiveMonth(e.target.value)}
                disabled={isEdit}
              >
                {MONTH_NAMES.map((name, i) => (
                  <option key={name} value={String(i + 1)}>{name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Effective Year *</label>
              <select
                className="form-input"
                value={effectiveYear}
                onChange={(e) => setEffectiveYear(e.target.value)}
                disabled={isEdit}
              >
                {years.map((y) => (
                  <option key={y} value={String(y)}>{y}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Employment Type</label>
            <input className="form-input" value={employmentType} disabled readOnly />
          </div>

          {employmentType === 'Full-time' ? (
            <>
              <div className="form-group">
                <label className="form-label">Basic *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`form-input ${errors.basic ? 'input-error' : ''}`}
                  value={basic}
                  onChange={(e) => setBasic(e.target.value)}
                />
                {errors.basic && <span className="form-error">{errors.basic}</span>}
              </div>
              <div className="salary-form-row">
                <div className="form-group">
                  <label className="form-label">House Rent Allowance</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={hra}
                    onChange={(e) => setHra(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Special Allowance</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={special}
                    onChange={(e) => setSpecial(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">PF</label>
                <input
                  type="number"
                  min="0"
                  className="form-input"
                  value={pf}
                  onChange={(e) => setPf(e.target.value)}
                  placeholder="Uses default PF if empty"
                />
              </div>
              <div className="salary-preview-card">
                <div><span>Gross</span><strong>{formatCurrency(gross)}</strong></div>
                <div><span>Net Preview</span><strong>{formatCurrency(netPreview)}</strong></div>
              </div>
            </>
          ) : (
            <div className="form-group">
              <label className="form-label">Daily Amount *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className={`form-input ${errors.dailyAmount ? 'input-error' : ''}`}
                value={dailyAmount}
                onChange={(e) => setDailyAmount(e.target.value)}
              />
              {errors.dailyAmount && <span className="form-error">{errors.dailyAmount}</span>}
            </div>
          )}
        </form>
      )}
    </Modal>
  );
};

export default SalaryFormModal;
