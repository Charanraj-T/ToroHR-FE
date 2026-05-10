import React from 'react';
import AttendanceIndicator from './AttendanceIndicator';
import './AttendanceTable.css';

interface AttendanceTableProps {
  data: any[];
  startDay: number;
  endDay: number;
  currentDate: number;
  onUpdate: (employee: any, day: number) => void;
  startDate: string;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ data, startDay, endDay, currentDate, onUpdate, startDate }) => {
  const [baseY, baseM] = startDate.split('-').map(Number);
  const dayCount = endDay - startDay + 1;

  const isWeekend = (day: number) => {
    const d = new Date(baseY, baseM - 1, day);
    const dayOfWeek = d.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6;
  };

  const days = Array.from({ length: dayCount }, (_, i) => startDay + i);

  return (
    <div className="attendance-matrix-container">
      <table className="attendance-matrix">
        <thead>
          <tr>
            <th className="sticky-col first-col">Employee</th>
            <th className="sticky-col second-col">Actions</th>
            {days.map(day => (
              <th key={day} className={day === currentDate ? 'current-day' : ''}>
                {day}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row) => (
            <tr key={row.id}>
              <td className="sticky-col first-col">
                <div className="employee-info-cell">
                  <div className="employee-avatar">
                    {row.avatar ? (
                      <img src={row.avatar} alt={row.fullName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {row.fullName.substring(0, 1).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="employee-name">{row.fullName}</span>
                </div>
              </td>
              <td className="sticky-col second-col actions-cell">
                {currentDate > 0 && (
                  <>
                    {row.attendance?.[currentDate] === 'Present' ? (
                      <button className="btn-table-checkout" onClick={() => onUpdate(row, currentDate)}>
                        Check-Out
                      </button>
                    ) : (
                      <button className="btn-table-checkin" onClick={() => onUpdate(row, currentDate)}>
                        Check-In
                      </button>
                    )}
                  </>
                )}
              </td>
              {days.map(day => {
                const dayStatus = row.attendance?.[day];
                const status = dayStatus || (isWeekend(day) ? 'Weekend' : 'N/A');
                
                return (
                  <td key={day} className={day === currentDate ? 'current-day' : ''}>
                    <AttendanceIndicator 
                      status={status as any} 
                      size="sm" 
                      onClick={() => onUpdate(row, day)}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AttendanceTable;
