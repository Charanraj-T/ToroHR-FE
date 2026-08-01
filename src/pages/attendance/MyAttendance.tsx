import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import AttendanceCard from './components/AttendanceCard';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import attendanceService, { type AttendanceRecord } from '../../services/attendance.service';
import { useToastStore } from '../../store/toastStore';
import { buildDateStr, getMonthBoundaries, getTodayIST, toISTTime } from '../../lib/date';
import './MyAttendance.css';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MyAttendance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [summaryStats, setSummaryStats] = useState({ present: 0, absent: 0, avgHours: '0h' });
  const [refreshKey, setRefreshKey] = useState(0);
  const addToast = useToastStore(state => state.addToast);

  const { year: todayYear, month: todayMonth } = getTodayIST();
  const [selectedYear, setSelectedYear] = useState(todayYear);
  const [selectedMonth, setSelectedMonth] = useState(todayMonth);

  const boundaries = useMemo(() => getMonthBoundaries(selectedYear, selectedMonth), [selectedYear, selectedMonth]);

  const yearOptions = useMemo(() => {
    const currentYear = todayYear;
    const years: number[] = [];
    for (let y = currentYear; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }, [todayYear]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { year, month, day } = getTodayIST();
      const todayStr = buildDateStr(year, month, day);
      try {
        const todayRes = await attendanceService.getMyAttendance({ startDate: todayStr, endDate: todayStr });
        if (!cancelled) setTodayRecord(todayRes?.data?.[0] || null);
      } catch {
        if (!cancelled) setTodayRecord(null);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const historyRes = await attendanceService.getMyAttendance({ startDate: boundaries.start, endDate: boundaries.end });
        if (cancelled) return;
        setHistory((historyRes?.data || []) as AttendanceRecord[]);
      } catch {
        if (!cancelled) addToast('Failed to load attendance data', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, addToast, boundaries.start, boundaries.end]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const statsRes = await attendanceService.getEmployeeStats({ month: selectedMonth, year: selectedYear });
        if (cancelled) return;
        const s = statsRes?.data;
        if (!s) return;
        const presentDays = (s.present || 0) + (s.halfday || 0);
        const avg = presentDays > 0 ? (s.presentHours || 0) / presentDays : 0;
        setSummaryStats({
          present: presentDays,
          absent: s.absent || 0,
          avgHours: `${avg.toFixed(1)}h`
        });
      } catch {
        // keep previous summary values on failure
      }
    })();
    return () => { cancelled = true; };
  }, [selectedMonth, selectedYear, refreshKey]);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await attendanceService.checkIn();
      addToast('Checked in successfully!', 'success');
      setRefreshKey((k) => k + 1);
    } catch {
      addToast('Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await attendanceService.checkOut();
      addToast('Checked out successfully!', 'success');
      setRefreshKey((k) => k + 1);
    } catch {
      addToast('Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const getAttendanceState = () => {
    if (!todayRecord) return 'not_checked_in';
    if (todayRecord.checkInTime && !todayRecord.checkOutTime) return 'checked_in';
    if (todayRecord.checkInTime && todayRecord.checkOutTime) return 'checked_out';
    return 'not_checked_in';
  };

  const formatTime = (t: string | undefined) => {
    if (!t) return undefined;
    return toISTTime(t);
  };

  const columns = useMemo(() => [
    {
      header: 'Date',
      accessor: (item: AttendanceRecord) => new Date(item.date).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC'
      })
    },
    {
      header: 'Check In',
      accessor: (item: AttendanceRecord) => item.checkInTime ? toISTTime(item.checkInTime) : '--:--'
    },
    {
      header: 'Check Out',
      accessor: (item: AttendanceRecord) => item.checkOutTime ? toISTTime(item.checkOutTime) : '--:--'
    },
    { header: 'Work Hours', accessor: (item: AttendanceRecord) => item.hoursWorked ? `${item.hoursWorked.toFixed(1)}h` : '0h' },
    {
      header: 'Status',
      accessor: (item: AttendanceRecord) => <StatusBadge status={item.status} />
    }
  ], []);

  const isCurrentMonth = selectedYear === todayYear && selectedMonth === todayMonth;

  return (
    <div className="my-attendance-page">
      <PageHeader 
        title="My Attendance" 
        subtitle="Manage your daily check-ins and view attendance history"
      />

      <div className="my-attendance-top">
        <AttendanceCard 
          status={getAttendanceState()}
          checkInTime={formatTime(todayRecord?.checkInTime)}
          checkOutTime={formatTime(todayRecord?.checkOutTime)}
          hoursWorked={todayRecord?.hoursWorked ? `${Math.floor(todayRecord.hoursWorked)}h ${Math.round((todayRecord.hoursWorked % 1) * 60)}m` : undefined}
          onCheckIn={handleCheckIn}
          onCheckOut={handleCheckOut}
          loading={actionLoading}
        />

        <div className="summary-card">
          <h3>Monthly Summary</h3>
          <div className="summary-stats">
            <div className="summary-item">
              <span className="label">Present Days</span>
              <span className="value">{summaryStats.present}</span>
            </div>
            <div className="summary-item">
              <span className="label">Absent Days</span>
              <span className="value">{summaryStats.absent}</span>
            </div>
            <div className="summary-item">
              <span className="label">Average Hours</span>
              <span className="value">{summaryStats.avgHours}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="history-section">
        <div className="section-header">
          <h3>Attendance History</h3>
          <div className="history-filters">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              aria-label="Select month"
            >
              {MONTHS.map((m, index) => (
                <option key={index + 1} value={index + 1}>{m}</option>
              ))}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              aria-label="Select year"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <button className="btn-secondary sm" onClick={() => {
              attendanceService.exportCsv({ startDate: boundaries.start, endDate: boundaries.end });
            }}>
              <Download size={16} /> Export CSV
            </button>
          </div>
        </div>

        <div className="history-table-container">
          {loading ? (
            <div className="loading-state">Loading history...</div>
          ) : (
            <>
              <Table 
                columns={columns} 
                data={history} 
              />
              {history.length === 0 && !loading && (
                <div className="no-records-note">
                  No attendance records found for {MONTHS[selectedMonth - 1]} {selectedYear}.
                  {isCurrentMonth && ' Check in to record your first entry for this month.'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
