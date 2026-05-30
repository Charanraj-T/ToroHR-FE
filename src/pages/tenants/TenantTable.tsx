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
      <div className="table-empty-state">
        <p>No tenants found</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="table">
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
                <span className={`status-badge ${tenant.status === 'Active' ? 'active' : 'inactive'}`}>
                  {tenant.status}
                </span>
              </td>
              <td>{tenant.adminCount ?? 0}</td>
              <td>
                <div className="action-btn-group">
                  <button className="action-btn view" title="View" onClick={() => onView(tenant)}>
                    <Eye size={16} />
                  </button>
                  <button className="action-btn edit" title="Edit" onClick={() => onEdit(tenant)}>
                    <Edit2 size={16} />
                  </button>
                  <button
                    className={`action-btn ${tenant.status === 'Active' ? 'warning' : 'success'}`}
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
