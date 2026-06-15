import React, { useState, useEffect, useMemo } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import AttendanceCard from './components/AttendanceCard';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import attendanceService from '../../services/attendance.service';
import { useToastStore } from '../../store/toastStore';
import { formatDateOnly, getMonthBoundaries, toISTTime } from '../../lib/date';
import './MyAttendance.css';

interface AttendanceRecord {
  id: string;
  date: string;
  checkInTime?: string;
  checkOutTime?: string;
  hoursWorked?: number;
  status: string;
}

interface AttendanceStats {
  present: number;
  absent: number;
  hoursWorked: number;
}

const MyAttendance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [history, setHistory] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [summaryStats, setSummaryStats] = useState({ present: 0, absent: 0, avgHours: '0h' });
  const [refreshKey, setRefreshKey] = useState(0);
  const addToast = useToastStore(state => state.addToast);

  const now = useMemo(() => new Date(), []);
  const { start: defaultStart, end: defaultEnd } = useMemo(
    () => getMonthBoundaries(now.getFullYear(), now.getMonth() + 1),
    [now]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const historyRes = await attendanceService.getMyAttendance({ startDate: defaultStart, endDate: defaultEnd });
        if (cancelled) return;
        const data: AttendanceRecord[] = (historyRes?.data || []) as AttendanceRecord[];
        setHistory(data);

        const todayStr = formatDateOnly(now);
        const todayRec = data.find((r) => r.date?.startsWith(todayStr));
        if (cancelled) return;
        setTodayRecord(todayRec || null);

        const stats = data.reduce<AttendanceStats>(
          (acc, r) => {
            if (r.status === 'Present' || r.status === 'Half-day') acc.present++;
            else if (r.status === 'Absent') acc.absent++;
            if (r.hoursWorked) acc.hoursWorked += r.hoursWorked;
            return acc;
          },
          { present: 0, absent: 0, hoursWorked: 0 }
        );
        const avg = stats.present > 0 ? (stats.hoursWorked / stats.present) : 0;
        if (cancelled) return;
        setSummaryStats({
          present: stats.present,
          absent: stats.absent,
          avgHours: `${avg.toFixed(1)}h`
        });
      } catch {
        if (!cancelled) addToast('Failed to load attendance data', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [refreshKey, now, addToast, defaultStart, defaultEnd]);

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
          <button className="btn-secondary sm" onClick={() => {
            attendanceService.exportCsv({ startDate: defaultStart, endDate: defaultEnd });
          }}>
            <Download size={16} /> Export CSV
          </button>
        </div>

        <div className="history-table-container">
          {loading ? (
            <div className="loading-state">Loading history...</div>
          ) : (
            <Table 
              columns={columns} 
              data={history} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAttendance;
