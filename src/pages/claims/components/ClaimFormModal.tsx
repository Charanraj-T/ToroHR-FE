import { useEffect, useRef, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import claimService, { type Claim } from '../../../services/claim.service';
import { useToastStore } from '../../../store/toastStore';
import AttachmentUploader, { type AttachmentFile } from './AttachmentUploader';
import LoadingSkeleton from './LoadingSkeleton';
import './ClaimFormModal.css';

interface ClaimFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  editingClaim?: Claim | null;
}

const toDateInputValue = (value?: string) => {
  if (!value) return '';
  return value.split('T')[0];
};

const mapExistingAttachments = (claim?: Claim | null): AttachmentFile[] =>
  (claim?.attachments || []).map((attachment) => ({
    id: attachment.id,
    fileName: attachment.fileName,
    mimeType: attachment.mimeType,
    data: attachment.data || '',
    size: attachment.size,
    isExisting: true
  }));

const ClaimFormModal = ({ isOpen, onClose, onSuccess, editingClaim }: ClaimFormModalProps) => {
  const { addToast } = useToastStore();
  const isEditMode = Boolean(editingClaim);
  const submittedRef = useRef(false);

  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState('');
  const [description, setDescription] = useState('');
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isOpen) return;

    if (editingClaim) {
      setName(editingClaim.name);
      setAmount(String(editingClaim.amount));
      setExpenseDate(toDateInputValue(editingClaim.expenseDate));
      setDescription(editingClaim.description || '');
      setAttachments(mapExistingAttachments(editingClaim));
      setErrors({});
      submittedRef.current = false;

      if (editingClaim.attachments.some((item) => !item.data)) {
        setDetailLoading(true);
        claimService
          .getClaimById(editingClaim.id)
          .then((claim) => setAttachments(mapExistingAttachments(claim)))
          .catch(() => {})
          .finally(() => setDetailLoading(false));
      }
      return;
    }

    setName('');
    setAmount('');
    setExpenseDate('');
    setDescription('');
    setAttachments([]);
    setErrors({});
    submittedRef.current = false;
  }, [isOpen, editingClaim]);

  const validate = () => {
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) nextErrors.name = 'Claim name is required';

    const parsedAmount = parseFloat(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      nextErrors.amount = 'Amount must be greater than 0';
    }

    if (!expenseDate) nextErrors.expenseDate = 'Expense date is required';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    if (submittedRef.current) return;
    submittedRef.current = true;
    setLoading(true);

    try {
      const payload = {
        name: name.trim(),
        amount: parseFloat(amount),
        expenseDate,
        description: description.trim(),
        attachments: attachments.map(({ fileName, mimeType, data }) => ({
          fileName,
          mimeType,
          data
        }))
      };

      if (isEditMode && editingClaim) {
        await claimService.updateClaim(editingClaim.id, payload);
        addToast('Claim updated successfully', 'success');
      } else {
        await claimService.createClaim(payload);
        addToast('Claim submitted successfully', 'success');
      }

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
      title={isEditMode ? 'Edit Claim' : 'New Claim'}
      footer={
        <div className="modal-footer-btns">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>
            Cancel
          </button>
          <button
            type="submit"
            form="claim-form"
            className="btn-primary"
            disabled={loading || detailLoading}
          >
            {loading ? (
              <span className="claim-form-loading">
                <span className="spinner spin" /> Saving...
              </span>
            ) : isEditMode ? (
              'Save Changes'
            ) : (
              'Submit Claim'
            )}
          </button>
        </div>
      }
    >
      {detailLoading ? (
        <LoadingSkeleton variant="table" count={4} />
      ) : (
        <form id="claim-form" className="claim-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="claim-name">
              Claim Name <span className="required">*</span>
            </label>
            <input
              id="claim-name"
              type="text"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Client travel reimbursement"
              maxLength={200}
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="claim-form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="claim-amount">
                Amount (INR) <span className="required">*</span>
              </label>
              <input
                id="claim-amount"
                type="number"
                min="0.01"
                step="0.01"
                className={`form-input ${errors.amount ? 'input-error' : ''}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="claim-date">
                Expense Date <span className="required">*</span>
              </label>
              <input
                id="claim-date"
                type="date"
                className={`form-input ${errors.expenseDate ? 'input-error' : ''}`}
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
              {errors.expenseDate && <span className="form-error">{errors.expenseDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="claim-description">
              Description
            </label>
            <textarea
              id="claim-description"
              className="form-textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional details about this expense..."
              maxLength={1000}
            />
          </div>

          <AttachmentUploader files={attachments} onChange={setAttachments} disabled={loading} />
        </form>
      )}
    </Modal>
  );
};

export default ClaimFormModal;
