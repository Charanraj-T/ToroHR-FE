import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import CompanySettingsPage from './CompanySettings';
import Holidays from './Holidays';
import PayrollSettingsForm from '../payroll/components/PayrollSettingsForm';
import './Settings.css';

type SettingsTab = 'company' | 'holidays' | 'payroll';

const ALL_TABS = [
  { key: 'company' as const, label: 'Company' },
  { key: 'holidays' as const, label: 'Holidays' },
  { key: 'payroll' as const, label: 'Payroll' },
];

const Settings = () => {
  const [searchParams] = useSearchParams();
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'Admin';
  const [activeTab, setActiveTab] = useState<SettingsTab>('company');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'payroll') setActiveTab('payroll');
  }, [searchParams]);

  const tabs = isAdmin ? ALL_TABS : ALL_TABS.filter((t) => t.key !== 'payroll');

  return (
    <div className="settings-module-container animate-fade-in">
      <div className="settings-tabs-header">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            className={`settings-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="settings-tab-content">
        {activeTab === 'company' && <CompanySettingsPage />}
        {activeTab === 'holidays' && <Holidays />}
        {activeTab === 'payroll' && isAdmin && <PayrollSettingsForm />}
      </div>
    </div>
  );
};

export default Settings;
