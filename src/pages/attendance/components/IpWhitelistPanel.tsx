import React, { useState, useEffect } from 'react';
import { Shield, Plus, X, Loader2, HelpCircle } from 'lucide-react';
import attendanceService from '../../../services/attendance.service';
import { useToastStore } from '../../../store/toastStore';
import Modal from '../../../components/ui/Modal';
import Table from '../../../components/ui/Table';
import type { Column } from '../../../components/ui/Table';
import './IpWhitelistPanel.css';

interface WhitelistEntry {
  _id: string;
  ipRange: string;
  label: string;
  id: string;
}

const CIDR_HELP = [
  { cidr: '192.168.1.0/24', range: '192.168.1.0 – 192.168.1.255', use: 'Single subnet' },
  { cidr: '10.0.0.0/8', range: '10.0.0.0 – 10.255.255.255', use: 'Entire class A private block' },
  { cidr: '203.0.113.42/32', range: 'Exactly 203.0.113.42', use: 'Single IP only' },
  { cidr: '0.0.0.0/0', range: 'Every IP (any network)', use: 'Effectively disables restriction' },
];

const IpWhitelistPanel: React.FC = () => {
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [newIpRange, setNewIpRange] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const addToast = useToastStore(state => state.addToast);

  const fetchEntries = async () => {
    setLoading(true);
    try {
      const data = await attendanceService.getAllowedIps();
      setEntries((data || []).map((e: WhitelistEntry) => ({ ...e, id: e._id })));
    } catch {
      addToast('Failed to load IP whitelist', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const handleAdd = async () => {
    const trimmed = newIpRange.trim();
    if (!trimmed) {
      addToast('IP range is required', 'error');
      return;
    }

    setAdding(true);
    try {
      await attendanceService.addIpRange(trimmed, newLabel.trim());
      addToast('IP range added successfully', 'success');
      setNewIpRange('');
      setNewLabel('');
      fetchEntries();
    } catch {
      addToast('Failed to add IP range', 'error');
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await attendanceService.removeIpRange(id);
      addToast('IP range removed', 'success');
      setEntries((prev) => prev.filter((e) => e._id !== id));
    } catch {
      addToast('Failed to remove IP range', 'error');
    }
  };

  const columns: Column<WhitelistEntry>[] = [
    { header: 'IP Range', accessor: 'ipRange' },
    {
      header: 'Label',
      accessor: (item) => item.label || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>—</span>,
    },
    {
      header: '',
      width: '60px',
      accessor: (item) => (
        <button
          type="button"
          className="ip-whitelist-remove-btn"
          onClick={() => handleRemove(item._id)}
          title="Remove"
        >
          <X size={14} />
        </button>
      ),
    },
  ];

  return (
    <div className="ip-whitelist-panel">
      <div className="ip-whitelist-header">
        <Shield size={18} />
        <h3>Office Network Whitelist</h3>
        <button className="ip-whitelist-help-btn" onClick={() => setShowHelp(true)} title="CIDR reference">
          <HelpCircle size={16} />
        </button>
      </div>
      <p className="ip-whitelist-hint">
        Employees can only check in from these IP ranges. If no ranges are configured, check-in is blocked from all networks.
      </p>

      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="CIDR Range Reference">
        <table className="cidr-help-table">
          <thead>
            <tr>
              <th>CIDR</th>
              <th>Range</th>
              <th>Use case</th>
            </tr>
          </thead>
          <tbody>
            {CIDR_HELP.map((row) => (
              <tr key={row.cidr}>
                <td><code>{row.cidr}</code></td>
                <td>{row.range}</td>
                <td>{row.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>

      <div className="ip-whitelist-form">
        <input
          type="text"
          className="form-input"
          placeholder="e.g. 192.168.1.0/24"
          value={newIpRange}
          onChange={(e) => setNewIpRange(e.target.value)}
          disabled={adding}
        />
        <input
          type="text"
          className="form-input"
          placeholder="Label (optional)"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          disabled={adding}
        />
        <button className="btn-primary" onClick={handleAdd} disabled={adding || !newIpRange.trim()}>
          {adding ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
          Add
        </button>
      </div>

      <Table
        columns={columns}
        data={entries}
        loading={loading}
      />
    </div>
  );
};

export default IpWhitelistPanel;
