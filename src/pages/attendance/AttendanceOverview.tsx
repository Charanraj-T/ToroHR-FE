import React, { useState, useEffect, useCallback } from 'react';
import { 
  UserCheck, 
  UserMinus, 
  Calendar, 
  Download, 
  UserPlus,
  CheckCircle2
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import AttendanceTable from './components/AttendanceTable';
import AttendanceModal from './components/AttendanceModal';
import Pagination from '../../components/ui/Pagination';
import attendanceService from '../../services/attendance.service';
import employeeService from '../../services/employee.service';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import './AttendanceOverview.css';

const AttendanceOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [stats, setStats] = useState({
    presentToday: 0,
    onLeave: 0,
    attendanceRate: 0,
    absentCount: 0
  });
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth();
  const monthStart = `${y}-${String(m + 1).padStart(2, '0')}-01`;
  const monthEndDate = new Date(y, m + 1, 0);
  const monthEnd = `${monthEndDate.getFullYear()}-${String(monthEndDate.getMonth() + 1).padStart(2, '0')}-${String(monthEndDate.getDate()).padStart(2, '0')}`;

  const [filters, setFilters] = useState({
    startDate: monthStart,
    endDate: monthEnd,
    page: 1,
    limit: 20
  });

  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0
  });
  const addToast = useToastStore(state => state.addToast);
  const { user } = useAuthStore();

  const dateForMonth = filters.startDate ? new Date(filters.startDate) : new Date();
  const daysInMonth = new Date(dateForMonth.getFullYear(), dateForMonth.getMonth() + 1, 0).getDate();
  const [startY, startM, startD] = (filters.startDate || '').split('-').map(Number);
  const [endY, endM, endD] = (filters.endDate || '').split('-').map(Number);
  const sameMonth = startY === endY && startM === endM;
  const startDay = sameMonth ? startD : 1;
  const endDay = sameMonth ? endD : daysInMonth;
  const isCurrentMonth = dateForMonth.getMonth() === new Date().getMonth() && 
                         dateForMonth.getFullYear() === new Date().getFullYear();
  const todayDateNum = new Date().getDate();
  const currentDate = (isCurrentMonth && todayDateNum >= startDay && todayDateNum <= endDay) ? todayDateNum : 0;

  const fetchData = useCallback(async (overrideFilters?: typeof filters) => {
    setLoading(true);
    try {
      const activeFilters = overrideFilters || filters;
      const [summaryRes, listRes, empRes] = await Promise.all([
        attendanceService.getSummary(),
        attendanceService.getAttendance(activeFilters),
        employeeService.getEmployees({ 
          limit: 100,
          page: activeFilters.page,
          manager: user?.role === 'Manager' ? user.employeeId : undefined
        })
      ]);
      
      setStats({
        presentToday: summaryRes.present || 0,
        onLeave: summaryRes.onLeave || 0,
        attendanceRate: summaryRes.total > 0 ? Math.round((summaryRes.present / summaryRes.total) * 100) : 0,
        absentCount: summaryRes.absent || 0
      });

      const records = listRes.data || [];
      const employees = empRes.data || [];
      
      if (listRes.pagination) {
        setPagination({
          totalPages: listRes.pagination.pages,
          totalItems: listRes.pagination.total
        });
      }
      
      const employeeMap: { [key: string]: any } = {};

      employees.forEach((emp: any) => {
        employeeMap[emp.id] = {
          id: emp.id,
          fullName: emp.fullName,
          employeeId: emp.employeeId,
          avatar: emp.avatar || null,
          attendance: {}
        };
      });

      records.forEach((record: any) => {
        const empId = record.employeeId?._id || record.employeeId;
        if (employeeMap[empId]) {
          const day = new Date(record.date).getDate();
          employeeMap[empId].attendance[day] = record.status;
          employeeMap[empId].attendance[`${day}_id`] = record.id || record._id;
        }
      });

      setAttendanceData(Object.values(employeeMap) as any);
    } catch (error) {
      addToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filters, user, addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelfMark = async () => {
    const today = new Date();
    const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

    let recordData = {
      status: 'Present',
      id: null,
      checkInTime: '',
      checkOutTime: ''
    };

    try {
      const existingRes = await attendanceService.getMyAttendance({ startDate: dateStr, endDate: dateStr });
      const existing = existingRes?.data?.[0];
      if (existing) {
        recordData = {
          status: existing.status || 'Present',
          id: existing.id || existing._id || null,
          checkInTime: existing.checkInTime ? new Date(existing.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false }) : '',
          checkOutTime: existing.checkOutTime ? new Date(existing.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false }) : ''
        };
      }
    } catch {
      // No existing record, use defaults
    }

    setSelectedRecord({
      employee: {
        id: user?.employeeId,
        fullName: user?.name || 'Self',
        employeeId: user?.employeeId,
        attendance: {}
      },
      day: today.getDate(),
      dateString: dateStr,
      attendance: recordData
    });
    setModalOpen(true);
  };

  const handleExport = async () => {
    try {
      await attendanceService.exportCsv(filters);
      addToast('Report exported successfully', 'success');
    } catch {
      addToast('Failed to export report', 'error');
    }
  };

  const handleUpdate = async (employee: any, day: number) => {
    const dateStr = `${dateForMonth.getFullYear()}-${String(dateForMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    let recordData = {
      status: employee.attendance?.[day] || 'Present',
      id: employee.attendance?.[`${day}_id`] || null,
      checkInTime: '',
      checkOutTime: ''
    };

    if (recordData.id) {
      try {
        const record = await attendanceService.getAttendanceById(recordData.id);
        const checkInTimeStr = record.data.checkInTime ? new Date(record.data.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false }) : '';
        const checkOutTimeStr = record.data.checkOutTime ? new Date(record.data.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Kolkata', hour12: false }) : '';
        
        recordData = {
          ...recordData,
          checkInTime: checkInTimeStr,
          checkOutTime: checkOutTimeStr
        };
      } catch {
        addToast('Failed to load attendance record details', 'error');
      }
    }

    setSelectedRecord({
      employee,
      day,
      dateString: dateStr,
      attendance: recordData
    });
    setModalOpen(true);
  };

  const handleModalSubmit = async (data: any) => {
    try {
      if (selectedRecord.attendance?.id) {
        await attendanceService.updateAttendance(selectedRecord.attendance.id, data);
      } else {
        await attendanceService.markManualAttendance({
          employeeId: selectedRecord.employee.id,
          date: selectedRecord.dateString,
          ...data
        });
      }
      setModalOpen(false);
      addToast('Attendance updated successfully', 'success');
      fetchData();
    } catch {
      addToast('Failed to update attendance', 'error');
    }
  };

  return (
    <div className="attendance-page">
      <PageHeader 
        title="Attendance Overview" 
        subtitle="Monitor and manage organization-wide attendance"
      />

      <div className="stats-grid">
        <StatsCard 
          title="Present Today" 
          value={stats.presentToday} 
          icon={<UserCheck />} 
          variant="green" 
        />
        <StatsCard 
          title="On Leave" 
          value={stats.onLeave} 
          icon={<Calendar />} 
          variant="blue" 
        />
        <StatsCard 
          title="Attendance Rate" 
          value={`${stats.attendanceRate}%`} 
          icon={<CheckCircle2 />} 
          variant="dark" 
        />
        <StatsCard 
          title="Absent Count" 
          value={stats.absentCount} 
          icon={<UserMinus />} 
          variant="red" 
        />
      </div>

      <div className="attendance-main-card">
        <div className="card-header-actions">
          <div className="attendance-legend">
            <div className="legend-item">
              <span className="dot present" aria-hidden="true"></span> Present
            </div>
            <div className="legend-item">
              <span className="dot absent" aria-hidden="true"></span> Absent
            </div>
            <div className="legend-item">
              <span className="dot leave" aria-hidden="true"></span> Leave
            </div>
          </div>
          <div className="button-group">
            {user?.role !== 'Admin' && (
              <button className="btn-primary" onClick={handleSelfMark}>
                <UserPlus size={18} /> Self Mark Attendance
              </button>
            )}
            <button className="btn-secondary" onClick={handleExport}>
              <Download size={18} /> Export Report
            </button>
          </div>
        </div>

        <div className="attendance-filters-row">
          <div className="date-filter-group">
            <div className="date-input-wrapper">
              <label htmlFor="filter-start-date">From:</label>
              <input 
                id="filter-start-date"
                type="date" 
                value={filters.startDate} 
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="date-input"
              />
            </div>
            <div className="date-input-wrapper">
              <label htmlFor="filter-end-date">To:</label>
              <input 
                id="filter-end-date"
                type="date" 
                value={filters.endDate} 
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="date-input"
              />
            </div>
          </div>
          <button className="btn-link" onClick={handleApplyFilters}>Apply Filter</button>
        </div>

        <div className="attendance-table-section">
          {loading ? (
            <div className="loading-state">Loading attendance data...</div>
          ) : (
            <>
              <AttendanceTable 
                data={attendanceData} 
                startDay={startDay}
                endDay={endDay}
                currentDate={currentDate}
                onUpdate={handleUpdate}
                startDate={filters.startDate}
              />
              <Pagination 
                currentPage={filters.page}
                totalPages={pagination.totalPages}
                totalItems={pagination.totalItems}
                itemsPerPage={filters.limit}
                onPageChange={(page) => handlePageChange(page)}
              />
            </>
          )}
        </div>
      </div>

      {modalOpen && selectedRecord && (
        <AttendanceModal 
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleModalSubmit}
          employeeName={selectedRecord.employee.fullName}
          date={selectedRecord.dateString}
          initialData={selectedRecord.attendance}
        />
      )}
    </div>
  );
};

export default AttendanceOverview;
