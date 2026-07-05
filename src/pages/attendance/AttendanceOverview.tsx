import React, { useState, useEffect, useRef } from 'react';
import {
  UserCheck, 
  UserMinus, 
  Calendar, 
  Download, 
  UserPlus,
  Search
} from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import StatsCard from '../../components/ui/StatsCard';
import AttendanceTable from './components/AttendanceTable';
import AttendanceModal from './components/AttendanceModal';
import type { AttendanceFormData } from './components/AttendanceModal';
import Pagination from '../../components/ui/Pagination';
import attendanceService, { type AttendanceRecord } from '../../services/attendance.service';
import employeeService from '../../services/employee.service';
import holidayService from '../../services/holiday.service';
import { useToastStore } from '../../store/toastStore';
import { useAuthStore } from '../../store/authStore';
import { formatDateOnly, buildDateStr, isWeekend, getMonthBoundaries, getCurrentYearMonth, toISTTime, getTodayIST } from '../../lib/date';
import './AttendanceOverview.css';

interface EmployeeAttendance {
  id: string;
  fullName: string;
  employeeId: string;
  avatar: string | null;
  attendance: Record<string, string>;
}

interface ModalRecord {
  employee: {
    id: string;
    fullName: string;
    employeeId: string;
    attendance: Record<string, string>;
  };
  day: number;
  dateString: string;
  attendance: {
    status: string;
    id: string | null;
    checkInTime: string;
    checkOutTime: string;
  };
}

const AttendanceOverview: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<ModalRecord | null>(null);
  const [stats, setStats] = useState({
    presentToday: 0,
    onLeave: 0,
    absentCount: 0
  });
  const [attendanceData, setAttendanceData] = useState<EmployeeAttendance[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const { year, month } = getCurrentYearMonth();
  const boundaries = getMonthBoundaries(year, month);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
  const { year: todayY, month: todayM, day: todayD } = getTodayIST();
  const isCurrentMonth = startY === todayY && startM === todayM;
  const currentDate = (isCurrentMonth && todayD >= startDay && todayD <= endDay) ? todayD : 0;

  const workingDays = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i).filter(day => {
    if (isWeekend(startY, startM, day)) return false;
    const dateStr = buildDateStr(startY, startM, day);
    return !holidayDates.has(dateStr);
  }).length;

  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      setSearch(searchInput);
      setFilters(prev => ({ ...prev, page: 1 }));
    }, 400);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const apiFilters: Record<string, unknown> = {
          page: filters.page,
          limit: filters.limit,
          startDate: filters.startDate,
          endDate: filters.endDate,
        };
        if (search.trim()) apiFilters.search = search.trim();

        const [summaryRes, listRes, empRes, holidayRes] = await Promise.all([
          attendanceService.getSummary(),
          attendanceService.getAttendance(apiFilters),
          employeeService.getEmployees({
            limit: 100,
            page: filters.page,
            search: search.trim() || undefined,
            manager: user?.role === 'Manager' ? user.employeeId : undefined
          }),
          holidayService.getCurrentYearHolidays().catch(() => []),
        ]);
        if (cancelled) return;

        const holidaySet = new Set<string>();
        (holidayRes as { date: string }[] || []).forEach((h) => {
          holidaySet.add(formatDateOnly(h.date));
        });
        setHolidayDates(holidaySet);

        setStats({
          presentToday: summaryRes.present || 0,
          onLeave: summaryRes.onLeave || 0,
          absentCount: summaryRes.absent || 0
        });

        const records: AttendanceRecord[] = (listRes.data || []);
        const employees = empRes.data || [];

        if (listRes.pagination) {
          setPagination({
            totalPages: listRes.pagination.pages,
            totalItems: listRes.pagination.total
          });
        }

        const employeeMap: Record<string, EmployeeAttendance> = {};

        employees.forEach((emp: { id: string; fullName: string; employeeId: string; avatar?: string | null }) => {
          employeeMap[emp.id] = {
            id: emp.id,
            fullName: emp.fullName,
            employeeId: emp.employeeId,
            avatar: emp.avatar || null,
            attendance: {}
          };
        });

        records.forEach((record) => {
          const empId = (typeof record.employeeId === 'object' && record.employeeId?._id) || record.employeeId;
          if (typeof empId === 'string' && employeeMap[empId]) {
            const day = new Date(record.date).getUTCDate();
            employeeMap[empId].attendance[day] = record.status;
            employeeMap[empId].attendance[`${day}_id`] = record.id;
          }
        });

        if (cancelled) return;
        setAttendanceData(Object.values(employeeMap));
      } catch {
        if (!cancelled) addToast('Failed to load attendance data', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filters, refreshKey, user?.employeeId, user?.role, addToast, search]);

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const handleSelfMark = async () => {
    if (!user?.employeeId) return;
    const { year, month, day } = getTodayIST();
    const dateStr = buildDateStr(year, month, day);

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
        id: user.employeeId,
        fullName: user.name || 'Self',
        employeeId: user.employeeId,
        attendance: {}
      },
      day: todayD,
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

  const handleUpdate = async (employee: EmployeeAttendance, day: number) => {
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

  const handleModalSubmit = async (data: AttendanceFormData) => {
    if (!selectedRecord) return;
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
      setRefreshKey((k) => k + 1);
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
          <div className="filter-search">
            <Search size={18} className="filter-search-icon" />
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
          <div className="filter-date-range">
            <div className="filter-date">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                title="Start Date"
              />
            </div>
            <span className="filter-date-sep">to</span>
            <div className="filter-date">
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                title="End Date"
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
