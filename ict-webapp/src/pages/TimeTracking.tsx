import { useEffect, useState, useCallback } from 'react';
import {
  Play,
  Square,
  Coffee,
  MapPin,
  Clock,
  Calendar,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAppDispatch, useAppSelector, useGeolocation } from '../hooks';
import {
  fetchTimeEntries,
  clockIn,
  clockOut,
  updateElapsed,
  startBreak,
  endBreak,
} from '../store/slices/timeEntriesSlice';
import { addToast } from '../store/slices/uiSlice';
import { addAction } from '../store/slices/offlineSlice';
import { format, formatDistanceStrict, startOfWeek, addDays } from 'date-fns';

export default function TimeTracking() {
  const dispatch = useAppDispatch();
  const { entries, activeEntry, timer, isLoading } = useAppSelector((state) => state.timeEntries);
  const { isOnline } = useAppSelector((state) => state.ui);
  const { latitude, longitude, getCurrentPosition } = useGeolocation();
  const [selectedProject, setSelectedProject] = useState<number | undefined>();
  const [notes, setNotes] = useState('');
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [breakStart, setBreakStart] = useState<Date | null>(null);

  useEffect(() => {
    dispatch(fetchTimeEntries());
  }, [dispatch]);

  // Timer effect
  useEffect(() => {
    if (!timer.isRunning || !timer.startTime) return;

    const interval = setInterval(() => {
      const start = new Date(timer.startTime!).getTime();
      const now = Date.now();
      const elapsed = Math.floor((now - start) / 1000) - timer.breakMinutes * 60;
      dispatch(updateElapsed(elapsed));
    }, 1000);

    return () => clearInterval(interval);
  }, [timer.isRunning, timer.startTime, timer.breakMinutes, dispatch]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleClockIn = useCallback(async () => {
    try {
      await getCurrentPosition();
    } catch {
      // Continue without location
    }

    const data = {
      project_id: selectedProject,
      notes,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    };

    if (isOnline) {
      await dispatch(clockIn(data)).unwrap();
      dispatch(addToast({ type: 'success', message: 'Clocked in successfully' }));
    } else {
      dispatch(addAction({ type: 'time_entry', action: 'create', payload: { ...data, clock_in: new Date().toISOString() } }));
      dispatch(addToast({ type: 'info', message: 'Clock in saved offline. Will sync when online.' }));
    }
    setNotes('');
  }, [dispatch, selectedProject, notes, latitude, longitude, isOnline, getCurrentPosition]);

  const handleClockOut = useCallback(async () => {
    try {
      await getCurrentPosition();
    } catch {
      // Continue without location
    }

    const data = {
      notes,
      latitude: latitude ?? undefined,
      longitude: longitude ?? undefined,
    };

    if (isOnline) {
      await dispatch(clockOut(data)).unwrap();
      dispatch(addToast({ type: 'success', message: 'Clocked out successfully' }));
    } else {
      dispatch(addAction({ type: 'time_entry', action: 'update', payload: { ...data, clock_out: new Date().toISOString() } }));
      dispatch(addToast({ type: 'info', message: 'Clock out saved offline. Will sync when online.' }));
    }
    setNotes('');
  }, [dispatch, notes, latitude, longitude, isOnline, getCurrentPosition]);

  const handleBreak = () => {
    if (timer.isOnBreak) {
      const breakDuration = breakStart ? Math.floor((Date.now() - breakStart.getTime()) / 60000) : 0;
      dispatch(endBreak(breakDuration));
      setBreakStart(null);
    } else {
      dispatch(startBreak());
      setBreakStart(new Date());
    }
  };

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weeklyTotal = entries
    .filter((e) => {
      const entryDate = new Date(e.clock_in);
      return entryDate >= weekStart && entryDate < addDays(weekStart, 7);
    })
    .reduce((total, e) => {
      if (!e.clock_out) return total;
      const hours = (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000;
      return total + hours - (e.break_minutes || 0) / 60;
    }, 0);

  return (
    <div className="time-tracking">
      <h1>Time Tracking</h1>

      {/* Timer Section */}
      <div className="timer-card">
        <div className="timer-display">
          <span className={`timer-value ${timer.isOnBreak ? 'on-break' : ''}`}>
            {formatTime(timer.elapsed)}
          </span>
          {timer.isOnBreak && <span className="break-badge">On Break</span>}
        </div>

        {activeEntry ? (
          <div className="timer-info">
            <p>
              <Clock size={16} />
              Started at {format(new Date(activeEntry.clock_in), 'h:mm a')}
            </p>
            {(latitude && longitude) && (
              <p>
                <MapPin size={16} />
                Location captured
              </p>
            )}
          </div>
        ) : (
          <div className="clock-in-form">
            <select
              value={selectedProject || ''}
              onChange={(e) => setSelectedProject(e.target.value ? Number(e.target.value) : undefined)}
            >
              <option value="">Select project (optional)</option>
              {/* Projects would be loaded here */}
            </select>
            <textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>
        )}

        <div className="timer-actions">
          {activeEntry ? (
            <>
              <button className="btn-break" onClick={handleBreak}>
                <Coffee size={20} />
                {timer.isOnBreak ? 'End Break' : 'Take Break'}
              </button>
              <button className="btn-stop" onClick={handleClockOut}>
                <Square size={20} />
                Clock Out
              </button>
            </>
          ) : (
            <button className="btn-start" onClick={handleClockIn}>
              <Play size={20} />
              Clock In
            </button>
          )}
        </div>
      </div>

      {/* Weekly View */}
      <div className="weekly-view">
        <div className="week-nav">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))}>
            <ChevronLeft size={20} />
          </button>
          <span>
            {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
          </span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))}>
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="week-summary">
          <span className="weekly-total">{weeklyTotal.toFixed(1)} hrs</span>
          <span className="weekly-label">this week</span>
        </div>

        <div className="week-grid">
          {weekDays.map((day) => {
            const dayEntries = entries.filter(
              (e) => format(new Date(e.clock_in), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
            );
            const dayHours = dayEntries.reduce((total, e) => {
              if (!e.clock_out) return total;
              return total + (new Date(e.clock_out).getTime() - new Date(e.clock_in).getTime()) / 3600000;
            }, 0);

            return (
              <div key={day.toISOString()} className="week-day">
                <span className="day-name">{format(day, 'EEE')}</span>
                <span className="day-date">{format(day, 'd')}</span>
                <span className="day-hours">{dayHours.toFixed(1)}h</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Entries */}
      <div className="recent-entries">
        <h2>Recent Entries</h2>
        {isLoading ? (
          <div className="loading-spinner" />
        ) : entries.length === 0 ? (
          <p className="no-entries">No time entries yet</p>
        ) : (
          <div className="entries-list">
            {entries.slice(0, 10).map((entry) => (
              <div key={entry.id} className="entry-item">
                <div className="entry-date">
                  <Calendar size={16} />
                  {format(new Date(entry.clock_in), 'MMM d, yyyy')}
                </div>
                <div className="entry-time">
                  {format(new Date(entry.clock_in), 'h:mm a')}
                  {entry.clock_out && ` - ${format(new Date(entry.clock_out), 'h:mm a')}`}
                </div>
                <div className="entry-duration">
                  {entry.clock_out
                    ? formatDistanceStrict(new Date(entry.clock_in), new Date(entry.clock_out))
                    : 'In progress'}
                </div>
                {!entry.synced && <span className="sync-badge">Pending sync</span>}
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        .time-tracking { padding: 24px; max-width: 800px; margin: 0 auto; }
        .time-tracking h1 { font-size: 24px; margin-bottom: 24px; }
        .timer-card {
          background: var(--bg-primary); border-radius: 16px; padding: 32px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-bottom: 24px; text-align: center;
        }
        .timer-display { margin-bottom: 24px; }
        .timer-value {
          font-size: 64px; font-weight: 700; font-variant-numeric: tabular-nums;
          color: var(--text-primary);
        }
        .timer-value.on-break { color: #f59e0b; }
        .break-badge {
          display: inline-block; background: #fef3c7; color: #92400e;
          padding: 4px 12px; border-radius: 16px; font-size: 14px; margin-left: 16px;
        }
        .timer-info { display: flex; justify-content: center; gap: 24px; margin-bottom: 24px; color: var(--text-muted); }
        .timer-info p { display: flex; align-items: center; gap: 8px; }
        .clock-in-form { max-width: 400px; margin: 0 auto 24px; }
        .clock-in-form select, .clock-in-form textarea {
          width: 100%; padding: 12px; border: 1px solid var(--border-color);
          border-radius: 8px; margin-bottom: 12px; font-size: 16px;
          background: var(--bg-secondary);
        }
        .timer-actions { display: flex; justify-content: center; gap: 16px; }
        .timer-actions button {
          display: flex; align-items: center; gap: 8px; padding: 16px 32px;
          border: none; border-radius: 12px; font-size: 16px; font-weight: 600;
          cursor: pointer; transition: all 0.2s;
        }
        .btn-start { background: #22c55e; color: white; }
        .btn-start:hover { background: #16a34a; }
        .btn-stop { background: #ef4444; color: white; }
        .btn-stop:hover { background: #dc2626; }
        .btn-break { background: var(--bg-secondary); color: var(--text-primary); }
        .btn-break:hover { background: var(--bg-tertiary); }
        .weekly-view {
          background: var(--bg-primary); border-radius: 16px; padding: 24px;
          margin-bottom: 24px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .week-nav {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 16px;
        }
        .week-nav button {
          background: none; border: none; cursor: pointer; padding: 8px;
          border-radius: 8px; color: var(--text-muted);
        }
        .week-nav button:hover { background: var(--bg-secondary); }
        .week-summary { text-align: center; margin-bottom: 16px; }
        .weekly-total { font-size: 32px; font-weight: 700; color: var(--primary); }
        .weekly-label { display: block; color: var(--text-muted); }
        .week-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 8px; }
        .week-day {
          text-align: center; padding: 12px 8px; border-radius: 8px;
          background: var(--bg-secondary);
        }
        .day-name { display: block; font-size: 12px; color: var(--text-muted); }
        .day-date { display: block; font-size: 18px; font-weight: 600; margin: 4px 0; }
        .day-hours { display: block; font-size: 14px; color: var(--primary); }
        .recent-entries { background: var(--bg-primary); border-radius: 16px; padding: 24px; }
        .recent-entries h2 { font-size: 18px; margin-bottom: 16px; }
        .entries-list { display: flex; flex-direction: column; gap: 12px; }
        .entry-item {
          display: flex; align-items: center; gap: 16px; padding: 16px;
          background: var(--bg-secondary); border-radius: 8px;
        }
        .entry-date { display: flex; align-items: center; gap: 8px; color: var(--text-muted); min-width: 120px; }
        .entry-time { flex: 1; }
        .entry-duration { font-weight: 600; color: var(--primary); }
        .sync-badge {
          font-size: 12px; background: #fef3c7; color: #92400e;
          padding: 4px 8px; border-radius: 4px;
        }
        .no-entries { text-align: center; color: var(--text-muted); padding: 32px; }
        .loading-spinner { width: 32px; height: 32px; border: 3px solid var(--bg-secondary); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 32px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
