import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import holidayService, { type Holiday } from '../../../services/holiday.service';
import Modal from '../../../components/ui/Modal';
import './HolidayViewModal.css';

interface HolidayViewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const groupByMonth = (holidays: Holiday[]) => {
  const groups: Record<string, Holiday[]> = {};
  for (const h of holidays) {
    const d = new Date(h.date);
    const key = d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(h);
  }
  return groups;
};

const formatDay = (dateStr: string) => new Date(dateStr).getUTCDate();

const formatWeekday = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', timeZone: 'UTC' });

const HolidayViewModal = ({ isOpen, onClose }: HolidayViewModalProps) => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'current' | 'upcoming'>('current');

  useEffect(() => {
    if (!isOpen) return;

    const fetch = async () => {
      setLoading(true);
      try {
        const data =
          view === 'current'
            ? await holidayService.getCurrentYearHolidays()
            : await holidayService.getUpcomingHolidays();
        setHolidays(data);
      } catch {
        setHolidays([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [isOpen, view]);

  const grouped = groupByMonth(holidays);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Holidays">
      <div className="hvm-tabs">
        <button
          className={`hvm-tab ${view === 'current' ? 'active' : ''}`}
          onClick={() => setView('current')}
        >
          Current Year
        </button>
        <button
          className={`hvm-tab ${view === 'upcoming' ? 'active' : ''}`}
          onClick={() => setView('upcoming')}
        >
          Upcoming
        </button>
      </div>

      <div className="hvm-body">
        {loading ? (
          <div className="hvm-loading">
            <Loader2 size={24} className="spin" />
            <span>Loading holidays...</span>
          </div>
        ) : holidays.length === 0 ? (
          <div className="hvm-empty">
            <p>No holidays found for this period.</p>
          </div>
        ) : (
          <div className="hvm-list">
            {Object.entries(grouped).map(([month, items]) => (
              <div key={month} className="hvm-month-group">
                <h4 className="hvm-month-title">{month}</h4>
                <div className="hvm-month-items">
                  {items.map((h) => (
                    <div key={h.id} className="hvm-item">
                      <div className="hvm-item-date">
                        <span className="hvm-day">{formatDay(h.date)}</span>
                        <span className="hvm-weekday">{formatWeekday(h.date)}</span>
                      </div>
                      <div className="hvm-item-info">
                        <span className="hvm-item-name">{h.name}</span>
                        {h.description && (
                          <span className="hvm-item-desc">{h.description}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};

export default HolidayViewModal;
