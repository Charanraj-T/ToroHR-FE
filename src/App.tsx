import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.tsx';
import Login from './pages/Login.tsx';
import EmployeeList from './pages/employees/EmployeeList.tsx';
import AddEmployee from './pages/employees/AddEmployee.tsx';
import EditEmployee from './pages/employees/EditEmployee.tsx';
import EmployeeDetails from './pages/employees/EmployeeDetails.tsx';
import AttendanceOverview from './pages/attendance/AttendanceOverview.tsx';
import MyAttendance from './pages/attendance/MyAttendance.tsx';
import Leave from './pages/leave/Leave.tsx';
import Settings from './pages/settings/Settings.tsx';
import { ToastContainer } from './components/ui/Toast';
import ProtectedRoute from './components/layout/ProtectedRoute.tsx';

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Navigate to="/attendance" replace />} />
            <Route element={<ProtectedRoute allowedRoles={['Employee']} />}>
              <Route path="attendance/me" element={<MyAttendance />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="attendance" element={<AttendanceOverview />} />
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/add" element={<AddEmployee />} />
              <Route path="employees/edit/:id" element={<EditEmployee />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="leave" element={<Leave />} />
            <Route path="employees/:id" element={<EmployeeDetails />} />
            <Route path="*" element={<Navigate to="/attendance" replace />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
