import { useEffect, useState } from 'react';
import { FileText, Download, Eye, Check, X, XCircle, Banknote, Trash2 } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import StatusBadge from '../../../components/ui/StatusBadge';
import claimService, { type Claim } from '../../../services/claim.service';
import { useToastStore } from '../../../store/toastStore';
import {
  formatClaimAmount,
  formatClaimDate,
  getClaimActions
} from '../claimHelpers';
import EmptyState from './EmptyState';
import LoadingSkeleton from './LoadingSkeleton';
import './ClaimDetailsModal.css';

interface ClaimDetailsModalProps {
  isOpen: boolean;
  claimId: string | null;
  role: string;
  employeeId?: string;
  onClose: () => void;
  onUpdated: () => void;
}

const ClaimDetailsModal = ({
  isOpen,
  claimId,
  role,
  employeeId,
  onClose,
  onUpdated
}: ClaimDetailsModalProps) => {
  const { addToast } = useToastStore();
  const [claim, setClaim] = useState<Claim | null>(null);
  const [error, setError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const loading = Boolean(claimId && !claim && !error);

  useEffect(() => {
    if (!claimId) return;

    claimService
      .getClaimById(claimId)
      .then((data) => { setClaim(data); setError(false); })
      .catch(() => { setClaim(null); setError(true); });
  }, [claimId]);

  const handleAction = async (action: 'approve' | 'reject' | 'cancel' | 'reimburse' | 'delete') => {
    if (!claim) return;
    setActionLoading(true);

    try {
      if (action === 'approve') {
        await claimService.approveClaim(claim.id);
        addToast('Claim approved successfully', 'success');
      } else if (action === 'reject') {
        await claimService.rejectClaim(claim.id);
        addToast('Claim rejected successfully', 'success');
      } else if (action === 'cancel') {
        await claimService.cancelClaim(claim.id);
        addToast('Claim cancelled successfully', 'success');
      } else if (action === 'reimburse') {
        await claimService.reimburseClaim(claim.id);
        addToast('Claim marked as reimbursed successfully', 'success');
      } else if (action === 'delete') {
        await claimService.deleteClaim(claim.id);
        addToast('Claim deleted successfully', 'success');
      }

      onUpdated();
      onClose();
    } finally {
      setActionLoading(false);
    }
  };

  const getAttachmentUrl = (mimeType: string, data?: string | null) => {
    if (!data) return null;
    return `data:${mimeType};base64,${data}`;
  };

  const base64ToBlobUrl = (data: string, mimeType: string): string => {
    const byteChars = atob(data);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    const blob = new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
    return URL.createObjectURL(blob);
  };

  const openAttachment = (mimeType: string, data?: string | null) => {
    if (!data) return;
    const url = base64ToBlobUrl(data, mimeType);
    window.open(url);
  };

  const downloadAttachment = (mimeType: string, data?: string | null, fileName?: string) => {
    if (!data) return;
    const url = getAttachmentUrl(mimeType, data);
    if (!url) return;
    const ext = mimeType === 'application/pdf' ? '.pdf' : '.jpg';
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName || `attachment${ext}`;
    link.rel = 'noopener noreferrer';
    link.click();
  };

  const actions = claim ? getClaimActions(claim, role, employeeId) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Claim Details"
      footer={
        actions && (
          <div className="modal-footer-btns claim-details-actions">
            {actions.canReject && (
              <button
                type="button"
                className="btn-secondary btn-danger-action"
                disabled={actionLoading}
                onClick={() => handleAction('reject')}
              >
                <X size={16} /> Reject
              </button>
            )}
            {actions.canCancel && (
              <button
                type="button"
                className="btn-secondary btn-danger-action"
                disabled={actionLoading}
                onClick={() => handleAction('cancel')}
              >
                <XCircle size={16} /> Cancel
              </button>
            )}
            {actions.canReimburse && (
              <button
                type="button"
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => handleAction('reimburse')}
              >
                <Banknote size={16} /> Reimburse
              </button>
            )}
            {actions.canApprove && (
              <button
                type="button"
                className="btn-primary"
                disabled={actionLoading}
                onClick={() => handleAction('approve')}
              >
                <Check size={16} /> Approve
              </button>
            )}
            {actions.canDelete && (
              <button
                type="button"
                className="btn-secondary btn-danger-action"
                disabled={actionLoading}
                onClick={() => handleAction('delete')}
              >
                <Trash2 size={16} /> Delete
              </button>
            )}
          </div>
        )
      }
    >
      {loading ? (
        <LoadingSkeleton variant="table" count={5} />
      ) : error ? (
        <EmptyState title="Claim not found" message="This claim may have been removed or you lack access." />
      ) : claim ? (
        <div className="claim-details">
          <div className="claim-details-header">
            <div>
              <h4>{claim.name}</h4>
              <p>{claim.employee?.fullName} • {claim.employee?.employeeId}</p>
            </div>
            <StatusBadge status={claim.status} />
          </div>

          <div className="claim-details-grid">
            <div className="claim-detail-item">
              <span className="claim-detail-label">Expense Date</span>
              <span className="claim-detail-value">{formatClaimDate(claim.expenseDate)}</span>
            </div>
            <div className="claim-detail-item">
              <span className="claim-detail-label">Amount</span>
              <span className="claim-detail-value claim-detail-amount">
                {formatClaimAmount(claim.amount)}
              </span>
            </div>
            <div className="claim-detail-item full-width">
              <span className="claim-detail-label">Description</span>
              <span className="claim-detail-value">
                {claim.description?.trim() || '—'}
              </span>
            </div>
          </div>

          <div className="claim-attachments-section">
            <h5>Attachments</h5>
            {claim.attachments.length === 0 ? (
              <EmptyState
                title="No attachments"
                message="This claim has no supporting documents."
              />
            ) : (
              <div className="claim-attachments-list">
                {claim.attachments.map((attachment) => {
                  const previewUrl = getAttachmentUrl(attachment.mimeType, attachment.data);
                  const isImage = attachment.mimeType.startsWith('image/');

                  return (
                    <div key={attachment.id} className="claim-attachment-card">
                      <div className="claim-attachment-card-header">
                        <FileText size={16} />
                        <span>{attachment.fileName}</span>
                        <div className="claim-attachment-actions">
                          <button
                            type="button"
                            className="claim-attachment-action"
                            title="Open"
                            onClick={() =>
                              openAttachment(attachment.mimeType, attachment.data)
                            }
                            disabled={!previewUrl}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            type="button"
                            className="claim-attachment-action"
                            title="Download"
                            onClick={() =>
                              downloadAttachment(attachment.mimeType, attachment.data, attachment.fileName)
                            }
                            disabled={!previewUrl}
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      </div>
                      {isImage && previewUrl && (
                        <img
                          src={previewUrl}
                          alt={attachment.fileName}
                          className="claim-attachment-preview"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

export default ClaimDetailsModal;
