import { Download, Building2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import type { Payroll, FullTimeSalarySnapshot } from '../../../services/payroll.service';
import {
  formatCurrency,
  formatMonthYear,
  getNetPay
} from '../payrollHelpers';
import './PayslipViewerModal.css';

interface PayslipViewerModalProps {
  isOpen: boolean;
  payroll: Payroll | null;
  onClose: () => void;
  onDownload?: () => void;
  downloadLoading?: boolean;
}

const PayslipViewerModal = ({
  isOpen,
  payroll,
  onClose,
  onDownload,
  downloadLoading
}: PayslipViewerModalProps) => {
  if (!payroll) return null;

  const company = payroll.companySnapshot || {};
  const attendance = payroll.attendanceSnapshot || {};
  const salary = payroll.salarySnapshot || {};
  const isFullTime = payroll.employmentType === 'Full-time';
  const ftSalary = isFullTime ? (salary as FullTimeSalarySnapshot) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      footer={
        onDownload ? (
          <div className="modal-footer-btns">
            <button type="button" className="btn-secondary" onClick={onClose}>Close</button>
            <button
              type="button"
              className="btn-primary"
              onClick={onDownload}
              disabled={downloadLoading}
            >
              <Download size={16} />
              {downloadLoading ? 'Downloading...' : 'Download PDF'}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="payslip-viewer">
        <div className="payslip-header">
          {company.logo ? (
            <img src={company.logo} alt={company.companyName} className="payslip-logo" />
          ) : (
            <div className="payslip-logo-placeholder">
              <Building2 size={28} />
            </div>
          )}
          <div className="payslip-company-info">
            <h3>{company.companyName || 'ToroHR'}</h3>
            {company.address && <p>{company.address}</p>}
          </div>
        </div>

        <div className="payslip-title-row">
          <h4>Payslip – {formatMonthYear(payroll.month, payroll.year)}</h4>
          <StatusBadge status={payroll.status} />
        </div>

        <section className="payslip-section">
          <h5>Employee Details</h5>
          <div className="payslip-grid">
            <div><span>Name</span><strong>{payroll.employeeName}</strong></div>
            <div><span>Employee ID</span><strong>{payroll.employeeCode}</strong></div>
            <div><span>Designation</span><strong>{payroll.designation || '—'}</strong></div>
            <div><span>Employment Type</span><strong>{payroll.employmentType}</strong></div>
          </div>
        </section>

        <section className="payslip-section">
          <h5>Attendance Summary</h5>
          <div className="payslip-grid payslip-grid-5">
            <div><span>Working Days</span><strong>{attendance.workingDays ?? 0}</strong></div>
            <div><span>Present</span><strong>{attendance.presentDays ?? 0}</strong></div>
            <div><span>Leave</span><strong>{attendance.leaveDays ?? 0}</strong></div>
            <div><span>Holiday</span><strong>{attendance.holidayDays ?? 0}</strong></div>
            <div><span>LOP</span><strong>{attendance.lopDays ?? 0}</strong></div>
          </div>
        </section>

        <section className="payslip-section">
          <h5>Salary Details</h5>
          {isFullTime && ftSalary ? (
            <div className="payslip-salary-breakdown">
              <div className="payslip-salary-group">
                <h6>Earnings</h6>
                <div className="payslip-line"><span>Basic</span><span>{formatCurrency(ftSalary.basic)}</span></div>
                <div className="payslip-line">
                  <span>House Rent Allowance</span>
                  <span>{formatCurrency(ftSalary.houseRentAllowance)}</span>
                </div>
                <div className="payslip-line">
                  <span>Special Allowance</span>
                  <span>{formatCurrency(ftSalary.specialAllowance)}</span>
                </div>
                <div className="payslip-line payslip-total">
                  <span>Gross</span>
                  <span>{formatCurrency(ftSalary.gross)}</span>
                </div>
              </div>
              <div className="payslip-salary-group">
                <h6>Deductions</h6>
                <div className="payslip-line"><span>PF</span><span>{formatCurrency(ftSalary.pf)}</span></div>
                <div className="payslip-line">
                  <span>LOP Deduction</span>
                  <span>{formatCurrency(ftSalary.lopDeduction)}</span>
                </div>
              </div>
              <div className="payslip-net-row">
                <span>Net Pay</span>
                <strong>{formatCurrency(getNetPay(payroll))}</strong>
              </div>
            </div>
          ) : (
            <div className="payslip-salary-breakdown">
              <div className="payslip-line">
                <span>Daily Amount</span>
                <span>{formatCurrency((salary as { dailyAmount?: number }).dailyAmount || 0)}</span>
              </div>
              <div className="payslip-line">
                <span>Present Days</span>
                <span>{(salary as { payableDays?: number }).payableDays ?? attendance.presentDays ?? 0}</span>
              </div>
              <div className="payslip-net-row">
                <span>Total Pay</span>
                <strong>{formatCurrency(getNetPay(payroll))}</strong>
              </div>
            </div>
          )}
        </section>

        <footer className="payslip-footer">
          <div><span>Payslip Number</span><strong>{payroll.payrollNumber}</strong></div>
          <div><span>Status</span><strong>{payroll.status}</strong></div>
          {payroll.paidAt && (
            <div>
              <span>Paid Date</span>
              <strong>{new Date(payroll.paidAt).toLocaleDateString('en-IN')}</strong>
            </div>
          )}
        </footer>
      </div>
    </Modal>
  );
};

export default PayslipViewerModal;
