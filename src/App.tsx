import { Routes, Route } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout.tsx';
import Login from './pages/Login.tsx';
import Dashboard from './pages/Dashboard.tsx';
import EmployeeList from './pages/employees/EmployeeList.tsx';
import AddEmployee from './pages/employees/AddEmployee.tsx';
import EditEmployee from './pages/employees/EditEmployee.tsx';
import EmployeeDetails from './pages/employees/EmployeeDetails.tsx';

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
            <Route index element={<Dashboard />} />
            <Route element={<ProtectedRoute allowedRoles={['Admin', 'Manager']} />}>
              <Route path="employees" element={<EmployeeList />} />
              <Route path="employees/add" element={<AddEmployee />} />
              <Route path="employees/edit/:id" element={<EditEmployee />} />
            </Route>
            <Route path="employees/:id" element={<EmployeeDetails />} />
            <Route path="*" element={<Dashboard />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
