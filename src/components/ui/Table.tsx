import React from 'react';
import './Table.css';

export interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  width?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
}

function Table<T extends { id: string }>({ columns, data, loading, onRowClick }: TableProps<T>) {
  if (loading) {
    return (
      <div className="table-loader">
        <div className="skeleton-rows">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="skeleton-row"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-empty">
        <div className="empty-icon">📂</div>
        <p>No data found</p>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="custom-table">
        <thead>
          <tr>
            {columns.map((col, index) => (
              <th key={index} style={{ width: col.width }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => (
            <tr key={item.id} onClick={() => onRowClick?.(item)} className={onRowClick ? 'clickable' : ''}>
              {columns.map((col, index) => (
                <td key={index}>
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : (item[col.accessor] as React.ReactNode)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
