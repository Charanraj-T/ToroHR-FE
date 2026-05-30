import { Eye, Edit2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import type { TenantListItem } from '../../services/tenant.service';

interface TenantTableProps {
  tenants: TenantListItem[];
  loading: boolean;
  onView: (tenant: TenantListItem) => void;
  onEdit: (tenant: TenantListItem) => void;
  onStatusToggle: (tenant: TenantListItem) => void;
}

const TenantTable = ({ tenants, loading, onView, onEdit, onStatusToggle }: TenantTableProps) => {
  if (loading) {
    return (
      <div className="table-loader">
        <Loader2 size={32} className="spin" />
      </div>
    );
  }

  if (tenants.length === 0) {
    return (
      <div className="table-empty">
        <p>No tenants found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            <th>Company Name</th>
            <th>Company Email</th>
            <th>Company Phone</th>
            <th>Status</th>
            <th>Admins</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((tenant) => (
            <tr key={tenant.id}>
              <td className="company-cell">
                <span className="company-name">{tenant.companyName}</span>
              </td>
              <td>{tenant.companyEmail}</td>
              <td>{tenant.companyPhone}</td>
              <td>
                <span className={`badge ${tenant.status === 'Active' ? 'badge-success' : 'badge-danger'}`}>
                  {tenant.status}
                </span>
              </td>
              <td>{tenant.adminCount ?? 0}</td>
              <td>
                <div className="action-btns">
                  <button className="action-btn action-btn-edit" title="View" onClick={() => onView(tenant)}>
                    <Eye size={16} />
                  </button>
                  <button className="action-btn action-btn-edit" title="Edit" onClick={() => onEdit(tenant)}>
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={`action-btn ${tenant.status === 'Active' ? 'action-btn-delete' : 'action-btn-approve'}`}
                    title={tenant.status === 'Active' ? 'Deactivate' : 'Activate'}
                    onClick={() => onStatusToggle(tenant)}
                  >
                    {tenant.status === 'Active' ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TenantTable;
