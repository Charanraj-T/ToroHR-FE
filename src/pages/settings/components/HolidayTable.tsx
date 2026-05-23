import { Edit2, Trash2 } from 'lucide-react';
import { type Holiday } from '../../../services/holiday.service';
import { useAuthStore } from '../../../store/authStore';
import Table, { type Column } from '../../../components/ui/Table';
import './HolidayTable.css';

interface HolidayTableProps {
  holidays: Holiday[];
  loading: boolean;
  onEdit: (holiday: Holiday) => void;
  onDelete: (holiday: Holiday) => void;
}

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
};

const HolidayTable = ({ holidays, loading, onEdit, onDelete }: HolidayTableProps) => {
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';

  const columns: Column<Holiday>[] = [
    {
      header: 'Holiday Name',
      accessor: (h) => <span className="ht-name">{h.name}</span>,
    },
    {
      header: 'Date',
      accessor: (h) => <span className="ht-date">{formatDate(h.date)}</span>,
    },
    {
      header: 'Description',
      accessor: (h) => <span className="ht-desc">{h.description || '—'}</span>,
    },
    {
      header: 'Recurring Yearly',
      accessor: (h) => (
        <span className={`ht-recurring ${h.isRecurringYearly ? 'yes' : 'no'}`}>
          {h.isRecurringYearly ? 'Yes' : 'No'}
        </span>
      ),
    },
    ...(isAdmin
      ? [
          {
            header: 'Actions',
            width: '100px' as const,
            accessor: (h: Holiday) => (
              <div className="ht-actions">
                <button
                  className="ht-action-btn edit"
                  onClick={() => onEdit(h)}
                  title="Edit holiday"
                  aria-label="Edit holiday"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  className="ht-action-btn delete"
                  onClick={() => onDelete(h)}
                  title="Delete holiday"
                  aria-label="Delete holiday"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ),
          } as Column<Holiday>,
        ]
      : []),
  ];

  return (
    <div className="holiday-table-container">
      <Table columns={columns} data={holidays} loading={loading} />
    </div>
  );
};

export default HolidayTable;
