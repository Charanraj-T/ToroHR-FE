import React from 'react';
import AttendanceIndicator from './AttendanceIndicator';
import { isWeekend } from '../../../lib/date';
import './AttendanceTable.css';

type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Weekend' | 'Half-day' | 'Holiday' | 'N/A';

interface AttendanceTableRow {
  id: string;
  fullName: string;
  employeeId: string;
  avatar: string | null;
  attendance: Record<string, string>;
}

interface AttendanceTableProps {
  data: AttendanceTableRow[];
  startDay: number;
  endDay: number;
  currentDate: number;
  onUpdate: (employee: AttendanceTableRow, day: number) => void;
  startDate: string;
  holidayDates?: Set<string>;
}

const AttendanceTable: React.FC<AttendanceTableProps> = ({ data, startDay, endDay, currentDate, onUpdate, startDate, holidayDates }) => {
  const [baseY, baseM] = startDate.split('-').map(Number);

  const today = new Date();
  const todayY = today.getFullYear();
  const todayM = today.getMonth() + 1;
  const todayD = today.getDate();

  const isFutureDay = (day: number) => {
    return baseY > todayY || (baseY === todayY && baseM > todayM) || (baseY === todayY && baseM === todayM && day > todayD);
  };

  const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i);
  const futureDays = new Set(days.filter(isFutureDay));

  const isHoliday = (day: number) => {
    const dateStr = `${baseY}-${String(baseM).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return holidayDates?.has(dateStr) || false;
  };

  const getDayStatus = (day: number, dayStatus: string | undefined): AttendanceStatus => {
    if (dayStatus) return dayStatus as AttendanceStatus;
    if (isHoliday(day)) return 'Holiday' as const;
    if (isWeekend(baseY, baseM, day)) return 'Holiday' as const;
    return 'N/A' as const;
  };

  const getWorkedDays = (row: AttendanceTableRow) => {
    let count = 0;
    days.forEach(day => {
      const status = getDayStatus(day, row.attendance?.[day]);
      if (status === 'Present' || status === 'Half-day') count++;
    });
    return count;
  };

  return (
    <div className="attendance-matrix-container">
      <table className="attendance-matrix">
        <thead>
          <tr>
            <th className="sticky-col first-col">Employee</th>
            <th className="sticky-col second-col">Actions</th>
            <th className="sticky-col third-col">Worked</th>
            {days.map(day => (
              <th key={day} className={`${day === currentDate ? 'current-day' : ''}${futureDays.has(day) ? ' future-day' : ''}`}>
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
              <td className="sticky-col third-col summary-cell worked-cell">{getWorkedDays(row)}</td>
              {days.map(day => {
                const dayStatus = row.attendance?.[day];
                const status = getDayStatus(day, dayStatus);

                const isFuture = futureDays.has(day);
                return (
                  <td key={day} className={`${day === currentDate ? 'current-day' : ''}${isFuture ? ' future-day' : ''}`}>
                    <AttendanceIndicator
                      status={status}
                      size="sm"
                      onClick={isFuture ? undefined : () => onUpdate(row, day)}
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
