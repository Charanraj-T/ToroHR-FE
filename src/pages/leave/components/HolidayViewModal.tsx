import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import Modal from '../../../components/ui/Modal';
import holidayService, { type Holiday } from '../../../services/holiday.service';
import { formatDateOnly, parseDateParts } from '../../../lib/date';
import { useToastStore } from '../../../store/toastStore';
import './HolidayViewModal.css';

interface HolidayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const HolidayViewModal = ({ isOpen, onClose }: HolidayViewModalProps) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await holidayService.getCurrentYearHolidays();
        setHolidays(data);
      } catch {
        useToastStore.getState().addToast('Failed to load holidays', 'error');
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [isOpen]);

  const grouped = holidays.reduce<Record<string, Holiday[]>>((acc, h) => {
    const dateOnly = formatDateOnly(h.date);
    const month = dateOnly.substring(0, 7);
    if (!acc[month]) acc[month] = [];
    acc[month].push(h);
    return acc;
  }, {});

  const sortedMonths = Object.keys(grouped).sort();

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Holidays This Year">
      <div className="holiday-view-content">
        {loading ? (
          <div className="holiday-view-loading">Loading holidays...</div>
        ) : sortedMonths.length === 0 ? (
          <div className="holiday-view-empty">
            <Calendar size={32} />
            <p>No holidays found for this year.</p>
          </div>
        ) : (
          sortedMonths.map((monthKey) => {
            const [y, m] = monthKey.split('-').map(Number);
            return (
              <div key={monthKey} className="holiday-month-group">
                <h4 className="holiday-month-title">{MONTHS[m - 1]} {y}</h4>
                <ul className="holiday-list">
                  {grouped[monthKey].map((h) => {
                    const { day } = parseDateParts(h.date);
                    return (
                      <li key={h.id} className="holiday-item">
                        <span className="holiday-date">{day}</span>
                        <div className="holiday-info">
                          <span className="holiday-name">{h.name}</span>
                          {h.description && <span className="holiday-desc">{h.description}</span>}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })
        )}
      </div>
    </Modal>
  );
};

export default HolidayViewModal;
