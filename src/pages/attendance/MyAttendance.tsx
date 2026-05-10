import React, { useState, useEffect } from 'react';
import { Download } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import AttendanceCard from './components/AttendanceCard';
import Table from '../../components/ui/Table';
import StatusBadge from '../../components/ui/StatusBadge';
import attendanceService from '../../services/attendance.service';
import { useToastStore } from '../../store/toastStore';
import './MyAttendance.css';

const MyAttendance: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [summaryStats, setSummaryStats] = useState({ present: 0, absent: 0, avgHours: '0h' });
  const addToast = useToastStore(state => state.addToast);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const today = new Date();
      const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, '0')}-${String(monthEndDate.getDate()).padStart(2, '0')}`;
      const historyRes = await attendanceService.getMyAttendance({ startDate: monthStart, endDate: monthEnd });
      const data = historyRes?.data || [];
      setHistory(data);
      
      const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const todayRec = data.find((r: any) => r.date?.startsWith(todayStr));
      setTodayRecord(todayRec || null);

      const stats = data.reduce((acc: any, r: any) => {
        if (r.status === 'Present' || r.status === 'Half-day') acc.present++;
        else if (r.status === 'Absent') acc.absent++;
        if (r.hoursWorked) acc.hoursWorked += r.hoursWorked;
        return acc;
      }, { present: 0, absent: 0, hoursWorked: 0 });
      const avg = stats.present > 0 ? (stats.hoursWorked / stats.present) : 0;
      setSummaryStats({
        present: stats.present,
        absent: stats.absent,
        avgHours: `${avg.toFixed(1)}h`
      });
    } catch {
      addToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await attendanceService.checkIn();
      addToast('Checked in successfully!', 'success');
      fetchData();
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
      fetchData();
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
    return new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' });
  };

  const columns = [
    { 
      header: 'Date', 
      accessor: (item: any) => new Date(item.date).toLocaleDateString('en-IN', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }) 
    },
    { 
      header: 'Check In', 
      accessor: (item: any) => item.checkInTime ? new Date(item.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '--:--' 
    },
    { 
      header: 'Check Out', 
      accessor: (item: any) => item.checkOutTime ? new Date(item.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata' }) : '--:--' 
    },
    { header: 'Work Hours', accessor: (item: any) => item.hoursWorked ? `${item.hoursWorked.toFixed(1)}h` : '0h' },
    { 
      header: 'Status', 
      accessor: (item: any) => <StatusBadge status={item.status} /> 
    }
  ];

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
            const today = new Date();
            const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
            const monthEndDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
            const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, '0')}-${String(monthEndDate.getDate()).padStart(2, '0')}`;
            attendanceService.exportCsv({ startDate: monthStart, endDate: monthEnd });
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
