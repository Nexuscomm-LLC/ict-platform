import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  FolderKanban,
  Package,
  AlertTriangle,
  TrendingUp,
  Users,
  CheckCircle,
  PlayCircle,
} from 'lucide-react';
import { useAppSelector } from '../hooks';
import { apiHelpers } from '../services/api';
import type { DashboardStats } from '../types';

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const { isOnline } = useAppSelector((state) => state.ui);
  const { actions } = useAppSelector((state) => state.offline);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await apiHelpers.getDashboardStats();
        setStats(response.data);
      } catch (err) {
        console.error('Failed to load dashboard stats:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadStats();
  }, []);

  const StatCard = ({
    icon: Icon,
    label,
    value,
    color,
    link,
  }: {
    icon: typeof Clock;
    label: string;
    value: number | string;
    color: string;
    link?: string;
  }) => {
    const content = (
      <div className={`stat-card ${color}`}>
        <div className="stat-icon">
          <Icon size={24} />
        </div>
        <div className="stat-content">
          <span className="stat-value">{value}</span>
          <span className="stat-label">{label}</span>
        </div>
      </div>
    );
    return link ? <Link to={link}>{content}</Link> : content;
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name?.split(' ')[0] || 'User'}</h1>
          <p className="text-muted">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
        {!isOnline && (
          <div className="offline-badge">
            <AlertTriangle size={16} />
            Offline Mode
          </div>
        )}
      </header>

      {actions.length > 0 && (
        <div className="sync-pending-banner">
          <Clock size={16} />
          {actions.length} action{actions.length !== 1 ? 's' : ''} pending sync
        </div>
      )}

      <div className="quick-actions">
        <Link to="/time-tracking" className="quick-action primary">
          <PlayCircle size={20} />
          Clock In
        </Link>
        <Link to="/projects/new" className="quick-action">
          <FolderKanban size={20} />
          New Project
        </Link>
        <Link to="/inventory/scan" className="quick-action">
          <Package size={20} />
          Scan Item
        </Link>
      </div>

      {isLoading ? (
        <div className="loading-spinner" />
      ) : (
        <div className="stats-grid">
          <StatCard
            icon={FolderKanban}
            label="Active Projects"
            value={stats?.activeProjects ?? 0}
            color="blue"
            link="/projects?status=in_progress"
          />
          <StatCard
            icon={CheckCircle}
            label="Completed This Month"
            value={stats?.completedThisMonth ?? 0}
            color="green"
          />
          <StatCard
            icon={Clock}
            label="Hours Today"
            value={stats?.totalHoursToday?.toFixed(1) ?? '0.0'}
            color="purple"
            link="/time-tracking"
          />
          <StatCard
            icon={Users}
            label="Pending Approvals"
            value={stats?.pendingApprovals ?? 0}
            color="orange"
          />
          <StatCard
            icon={AlertTriangle}
            label="Low Stock Items"
            value={stats?.lowStockItems ?? 0}
            color="red"
            link="/inventory?low_stock=true"
          />
          <StatCard
            icon={TrendingUp}
            label="Upcoming Tasks"
            value={stats?.upcomingTasks ?? 0}
            color="teal"
          />
        </div>
      )}

      <style>{`
        .dashboard { padding: 24px; max-width: 1200px; margin: 0 auto; }
        .dashboard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .dashboard-header h1 { font-size: 28px; font-weight: 600; margin: 0 0 4px; }
        .text-muted { color: var(--text-muted); }
        .offline-badge {
          display: flex; align-items: center; gap: 8px;
          background: #fef3c7; color: #92400e;
          padding: 8px 16px; border-radius: 8px; font-size: 14px;
        }
        .sync-pending-banner {
          display: flex; align-items: center; gap: 8px;
          background: #dbeafe; color: #1e40af;
          padding: 12px 16px; border-radius: 8px; margin-bottom: 24px;
        }
        .quick-actions { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }
        .quick-action {
          display: flex; align-items: center; gap: 8px;
          padding: 12px 24px; border-radius: 8px;
          background: var(--bg-secondary); color: var(--text-primary);
          text-decoration: none; font-weight: 500; transition: all 0.2s;
        }
        .quick-action:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .quick-action.primary { background: var(--primary); color: white; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }
        .stat-card {
          background: var(--bg-primary); border-radius: 12px; padding: 20px;
          display: flex; align-items: center; gap: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); transition: transform 0.2s;
        }
        .stat-card:hover { transform: translateY(-2px); }
        .stat-icon { padding: 12px; border-radius: 10px; }
        .stat-card.blue .stat-icon { background: #dbeafe; color: #2563eb; }
        .stat-card.green .stat-icon { background: #dcfce7; color: #16a34a; }
        .stat-card.purple .stat-icon { background: #f3e8ff; color: #9333ea; }
        .stat-card.orange .stat-icon { background: #ffedd5; color: #ea580c; }
        .stat-card.red .stat-icon { background: #fee2e2; color: #dc2626; }
        .stat-card.teal .stat-icon { background: #ccfbf1; color: #0d9488; }
        .stat-value { font-size: 28px; font-weight: 700; display: block; }
        .stat-label { color: var(--text-muted); font-size: 14px; }
        .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--bg-secondary); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 40px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
        a { text-decoration: none; color: inherit; }
      `}</style>
    </div>
  );
}
