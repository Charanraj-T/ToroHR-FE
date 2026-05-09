import { Bell } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import './Header.css';

const Header = () => {
  const user = useAuthStore((state) => state.user);

  return (
    <header className="header">
      <div className="header-left">
      </div>
      
      <div className="header-right">
        <button className="notification-btn">
          <Bell size={20} />
          <span className="notification-badge"></span>
        </button>
        
        <div className="user-profile">
          <div className="avatar">
            {(user?.name || 'User').substring(0, 2)}
          </div>
          <div className="user-info">
            <span className="user-name">{user?.name || 'User'}</span>
            <span className="user-role">{user?.role || 'Guest'}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
