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
import Claims from './pages/claims/Claims.tsx';
import PayrollOverview from './pages/payroll/PayrollOverview.tsx';
import SalaryStructure from './pages/payroll/SalaryStructure.tsx';
import MyPayslips from './pages/payroll/MyPayslips.tsx';
import Tenants from './pages/tenants/Tenants.tsx';
import Settings from './pages/settings/Settings.tsx';
import { ToastContainer } from './components/ui/Toast';
import ProtectedRoute from './components/layout/ProtectedRoute.tsx';
import { useAuthStore } from './store/authStore.ts';

const RoleRedirect = () => {
  const role = useAuthStore.getState().user?.role;
  if (role === 'SuperAdmin') return <Navigate to="/tenants" replace />;
  if (role === 'Employee') return <Navigate to="/attendance/me" replace />;
  return <Navigate to="/attendance" replace />;
};

const PayrollRedirectPage = () => {
  const role = useAuthStore((state) => state.user?.role);
  if (role === 'Employee') return <MyPayslips />;
  return <PayrollOverview />;
};

const MyPayslipsRedirectPage = () => {
  const role = useAuthStore((state) => state.user?.role);
  if (role === 'Admin') return <Navigate to="/payroll" replace />;
  return <MyPayslips />;
};

function App() {
  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<MainLayout />}>
            <Route index element={<RoleRedirect />} />
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
            <Route path="claims" element={<Claims />} />
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager', 'Employee']} />}>
              <Route path="payroll" element={<PayrollRedirectPage />} />
              <Route path="payroll/my-payslips" element={<MyPayslipsRedirectPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
              <Route path="payroll/salary-structure" element={<SalaryStructure />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['SuperAdmin']} />}>
              <Route path="tenants" element={<Tenants />} />
            </Route>
            <Route path="employees/:id" element={<EmployeeDetails />} />
            <Route path="*" element={<RoleRedirect />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
