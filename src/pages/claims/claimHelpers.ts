import type { Claim, ClaimStatus } from '../../services/claim.service';

export const formatClaimDate = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC'
  });
};

export const formatClaimAmount = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2
  }).format(amount);

export const getAttachmentCountLabel = (count: number) =>
  count === 1 ? '1 File' : `${count} Files`;

export const isOwnClaim = (claim: Claim, employeeId?: string) =>
  Boolean(employeeId && claim.employee?.id === employeeId);

export const isTeamClaim = (claim: Claim, managerEmployeeId?: string) => {
  if (!managerEmployeeId || isOwnClaim(claim, managerEmployeeId)) return false;
  const managerId = claim.employee?.reportingManagerId;
  if (!managerId) return false;
  return managerId.toString() === managerEmployeeId;
};

export interface ClaimActions {
  canView: boolean;
  canEdit: boolean;
  canCancel: boolean;
  canApprove: boolean;
  canReject: boolean;
  canReimburse: boolean;
}

export const getClaimActions = (
  claim: Claim,
  role: string,
  employeeId?: string
): ClaimActions => {
  const status = claim.status as ClaimStatus;
  const own = isOwnClaim(claim, employeeId);
  const team = role === 'Manager' && isTeamClaim(claim, employeeId);

  const base = {
    canView: true,
    canEdit: false,
    canCancel: false,
    canApprove: false,
    canReject: false,
    canReimburse: false
  };

  if (role === 'Employee' || (role === 'Manager' && own)) {
    if (status === 'Pending') {
      return { ...base, canEdit: true, canCancel: true };
    }
    if (status === 'Approved') {
      return { ...base, canCancel: true };
    }
    return base;
  }

  if (role === 'Manager' && team) {
    if (status === 'Pending') {
      return { ...base, canApprove: true, canReject: true };
    }
    if (status === 'Approved') {
      return { ...base, canReimburse: true, canCancel: true };
    }
    return base;
  }

  if (role === 'Admin') {
    if (status === 'Pending') {
      return { ...base, canApprove: true, canReject: true };
    }
    if (status === 'Approved') {
      return { ...base, canReimburse: true, canCancel: true };
    }
    return base;
  }

  return base;
};
