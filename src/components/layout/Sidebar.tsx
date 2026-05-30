import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { 
  Users, 
  CalendarClock, 
  CalendarMinus, 
  Receipt,
  Banknote,
  Building2,
  Settings, 
  LogOut,
  X
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.ts';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    onClose();
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-logo">
        <h1>ToroHR</h1>
        <button className="mobile-close" onClick={onClose}>
          <X size={24} />
        </button>
      </div>
      
      <div className="sidebar-menu">
        {user?.role === 'SuperAdmin' && (
          <NavLink to="/tenants" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
            <Building2 size={20} />
            <span>Tenants</span>
          </NavLink>
        )}
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <>
            <NavLink to="/attendance" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <CalendarClock size={20} />
              <span>Attendance</span>
            </NavLink>
            <NavLink to="/employees" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <Users size={20} />
              <span>Employees</span>
            </NavLink>
          </>
        )}
        
        {user?.role === 'Employee' && (
          <>
            <NavLink to="/attendance/me" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
              <CalendarClock size={20} />
              <span>My Attendance</span>
            </NavLink>
            {user?.employeeId && (
              <NavLink to={`/employees/${user.employeeId}`} className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
                <Users size={20} />
                <span>My Profile</span>
              </NavLink>
            )}
          </>
        )}
        
        <NavLink to="/leave" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
          <CalendarMinus size={20} />
          <span>Leave</span>
        </NavLink>

        <NavLink to="/claims" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
          <Receipt size={20} />
          <span>Claims</span>
        </NavLink>

        <NavLink to="/payroll" className={({ isActive }) => `menu-item ${isActive ? 'active' : ''}`}>
          <Banknote size={20} />
          <span>Payroll</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        {(user?.role === 'Admin' || user?.role === 'Manager') && (
          <NavLink to="/settings" className="menu-item">
            <Settings size={20} />
            <span>Settings</span>
          </NavLink>
        )}
        
        <button className="menu-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
