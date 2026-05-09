import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  CalendarClock, 
  CalendarMinus, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore.ts';
import './Sidebar.css';

const Sidebar = () => {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <h1>ToroHR</h1>
      </div>
      
      <div className="sidebar-menu">
        <NavLink 
          to="/" 
          className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
          end
        >
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        {(user?.role === 'Admin' || user?.role === 'Manager') ? (
          <NavLink 
            to="/employees" 
            className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
          >
            <Users size={20} />
            <span>Employees</span>
          </NavLink>
        ) : (
          user?.employeeId && (
            <NavLink 
              to={`/employees/${user.employeeId}`} 
              className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
            >
              <Users size={20} />
              <span>My Profile</span>
            </NavLink>
          )
        )}
        
        <NavLink 
          to="/attendance" 
          className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
        >
          <CalendarClock size={20} />
          <span>Attendance</span>
        </NavLink>
        
        <NavLink 
          to="/leave" 
          className={({ isActive }) => isActive ? 'menu-item active' : 'menu-item'}
        >
          <CalendarMinus size={20} />
          <span>Leave</span>
        </NavLink>
      </div>

      <div className="sidebar-footer">
        <NavLink to="/settings" className="menu-item">
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
        
        <button className="menu-item logout" onClick={handleLogout}>
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
