import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import MyLeave from './MyLeave';
import TeamLeaveManagement from './TeamLeaveManagement';
import './Leave.css';

const Leave = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');

  if (user?.role === 'Employee') {
    return <MyLeave />;
  }

  if (user?.role === 'Admin') {
    return <TeamLeaveManagement />;
  }

  return (
    <div className="leave-module-container">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My Leaves
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team Leaves
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'my' ? <MyLeave /> : <TeamLeaveManagement />}
      </div>
    </div>
  );
};

export default Leave;
