import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import MyClaims from './MyClaims';
import TeamClaimsManagement from './TeamClaimsManagement';

const Claims = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'my' | 'team'>('my');

  if (user?.role === 'Employee') {
    return <MyClaims />;
  }

  if (user?.role === 'Admin') {
    return <TeamClaimsManagement />;
  }

  return (
    <div className="claims-page animate-fade-in">
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'my' ? 'active' : ''}`}
          onClick={() => setActiveTab('my')}
        >
          My Claims
        </button>
        <button
          className={`tab-btn ${activeTab === 'team' ? 'active' : ''}`}
          onClick={() => setActiveTab('team')}
        >
          Team Claims
        </button>
      </div>

      <div className="tab-content">
        {activeTab === 'my' ? <MyClaims /> : <TeamClaimsManagement />}
      </div>
    </div>
  );
};

export default Claims;
