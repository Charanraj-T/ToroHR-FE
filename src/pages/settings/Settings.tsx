import { useState } from 'react';
import Holidays from './Holidays';
import './Settings.css';

type SettingsTab = 'holidays';

const SETTINGS_TABS = [
  { key: 'holidays' as const, label: 'Holidays' },
];

const Settings = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('holidays');

  return (
    <div className="settings-module-container animate-fade-in">
      <div className="settings-tabs-header">
        {SETTINGS_TABS.map((tab) => (
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
        {activeTab === 'holidays' && <Holidays />}
      </div>
    </div>
  );
};

export default Settings;
