import { Bell } from 'lucide-react';
import './Header.css';

const Header = () => {
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
          <img 
            src="https://ui-avatars.com/api/?name=User&background=063946&color=fff" 
            alt="User Profile" 
            className="avatar"
          />
        </div>
      </div>
    </header>
  );
};

export default Header;
