import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  UserMinus, 
  Calendar, 
  Download, 
  UserPlus
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import AttendanceTable from './components/AttendanceTable';
import AttendanceModal from './components/AttendanceModal';
import Pagination from '../../components/ui/Pagination';
import attendanceService from '../../services/attendance.service';
import employeeService from '../../services/employee.service';
import holidayService from '../../services/holiday.service';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateOnly, buildDateStr, isWeekend, getMonthBoundaries, getCurrentYearMonth, toISTTime } from '../../lib/date';
import './AttendanceOverview.css';

const AttendanceOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [stats, setStats] = useState({
    presentToday: 0,
    onLeave: 0,
    absentCount: 0
  });
  const [attendanceData, setAttendanceData] = useState<any[]>([]);
  const { year, month } = getCurrentYearMonth();
  const boundaries = getMonthBoundaries(year, month);

  const [filters, setFilters] = useState({
    startDate: boundaries.start,
    endDate: boundaries.end,
    page: 1,
    limit: 20
  });

  const [pagination, setPagination] = useState({
    totalPages: 1,
    totalItems: 0
  });
  const addToast = useToastStore(state => state.addToast);
  const { user } = useAuthStore();

  const [holidayDates, setHolidayDates] = useState<Set<string>>(new Set());

  const [startY, startM, startD] = (filters.startDate || '').split('-').map(Number);
  const [endY, endM, endD] = (filters.endDate || '').split('-').map(Number);
  const sameMonth = startY === endY && startM === endM;
  const daysInMonth = new Date(Date.UTC(startY, startM, 0)).getUTCDate();
  const startDay = sameMonth ? startD : 1;
  const endDay = sameMonth ? endD : daysInMonth;
  const now = new Date();
  const todayUTC = formatDateOnly(now);
  const [todayY, todayM, todayD] = todayUTC.split('-').map(Number);
  const isCurrentMonth = startY === todayY && startM === todayM;
  const todayDateNum = todayD;
  const currentDate = (isCurrentMonth && todayDateNum >= startDay && todayDateNum <= endDay) ? todayDateNum : 0;

  const workingDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i).filter(day => {
    if (isWeekend(startY, startM, day)) return false;
    const dateStr = buildDateStr(startY, startM, day);
    return !holidayDates.has(dateStr);
  }).length;

  const loadAttendanceData = async (overrideFilters?: typeof filters) => {
    setLoading(true);
    try {
      const activeFilters = overrideFilters || filters;
      const [summaryRes, listRes, empRes, holidayRes] = await Promise.all([
        attendanceService.getSummary(),
        attendanceService.getAttendance(activeFilters),
        employeeService.getEmployees({ 
          limit: 100,
          page: activeFilters.page,
          manager: user?.role === 'Manager' ? user.employeeId : undefined
        }),
        holidayService.getCurrentYearHolidays().catch(() => []),
      ]);

      const holidaySet = new Set<string>();
      (holidayRes || []).forEach((h: any) => {
        const ds = formatDateOnly(h.date);
        holidaySet.add(ds);
      });
      setHolidayDates(holidaySet);
      
      setStats({
        presentToday: summaryRes.present || 0,
        onLeave: summaryRes.onLeave || 0,
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
          const day = new Date(record.date).getUTCDate();
          employeeMap[empId].attendance[day] = record.status;
          employeeMap[empId].attendance[`${day}_id`] = record.id || record._id;
        }
      });

      setAttendanceData(Object.values(employeeMap) as any);
    } catch {
      addToast('Failed to load attendance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAttendanceData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page, filters.startDate, filters.endDate, filters.limit, user?.employeeId, user?.role]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelfMark = async () => {
    const dateStr = formatDateOnly(new Date());

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
          checkInTime: existing.checkInTime ? toISTTime(existing.checkInTime) : '',
          checkOutTime: existing.checkOutTime ? toISTTime(existing.checkOutTime) : ''
        };
      }
    } catch {
      addToast('Failed to load existing attendance record', 'error');
    }

    setSelectedRecord({
      employee: {
        id: user?.employeeId,
        fullName: user?.name || 'Self',
        employeeId: user?.employeeId,
        attendance: {}
      },
      day: todayDateNum,
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
    const dateStr = buildDateStr(startY, startM, day);
    
    let recordData = {
      status: employee.attendance?.[day] || 'Present',
      id: employee.attendance?.[`${day}_id`] || null,
      checkInTime: '',
      checkOutTime: ''
    };

    if (recordData.id) {
      try {
        const record = await attendanceService.getAttendanceById(recordData.id);
        const checkInTimeStr = record.data.checkInTime ? toISTTime(record.data.checkInTime) : '';
        const checkOutTimeStr = record.data.checkOutTime ? toISTTime(record.data.checkOutTime) : '';
        
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
      loadAttendanceData();
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

      <div className="summary-grid">
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
              <div className="legend-item">
                <span className="dot holiday" aria-hidden="true">H</span> Holiday
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
          <span className="working-days-label">{workingDays} Working Days</span>
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
                holidayDates={holidayDates}
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
