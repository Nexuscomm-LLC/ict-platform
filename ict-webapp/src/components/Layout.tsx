import { Link, useLocation, Outlet, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  FolderKanban,
  Package,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Sun,
  Moon,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar, setTheme, toggleGlobalSearch } from '../store/slices/uiSlice';
import { useEffect } from 'react';

const NAV_ITEMS = [
  { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/time-tracking', icon: Clock, label: 'Time Tracking' },
  { path: '/projects', icon: FolderKanban, label: 'Projects' },
  { path: '/inventory', icon: Package, label: 'Inventory' },
  { path: '/settings', icon: Settings, label: 'Settings' },
];

export default function Layout() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { theme, sidebarOpen, isOnline } = useAppSelector((state) => state.ui);
  const { actions } = useAppSelector((state) => state.offline);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = theme === 'dark' || (theme === 'system' && prefersDark);

    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  // Global search keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        dispatch(toggleGlobalSearch());
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [dispatch]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    dispatch(logout());
  };

  const cycleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light';
    dispatch(setTheme(nextTheme));
  };

  return (
    <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="logo-text">ICT</span>
          <button className="close-sidebar" onClick={() => dispatch(toggleSidebar())}>
            <X size={20} />
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ path, icon: Icon, label }) => (
            <Link
              key={path}
              to={path}
              className={`nav-item ${location.pathname === path ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">
              {user?.name?.charAt(0) || 'U'}
            </div>
            <div className="user-details">
              <span className="user-name">{user?.name || 'User'}</span>
              <span className="user-role">{user?.role?.replace('_', ' ') || 'User'}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="top-bar">
          <button className="menu-btn" onClick={() => dispatch(toggleSidebar())}>
            <Menu size={24} />
          </button>

          <button className="search-btn" onClick={() => dispatch(toggleGlobalSearch())}>
            <Search size={20} />
            <span>Search...</span>
            <kbd>⌘K</kbd>
          </button>

          <div className="top-bar-actions">
            {!isOnline && (
              <div className="offline-indicator">
                <WifiOff size={18} />
              </div>
            )}

            {actions.length > 0 && (
              <div className="sync-badge">{actions.length}</div>
            )}

            <button className="theme-btn" onClick={cycleTheme}>
              {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button className="notifications-btn">
              <Bell size={20} />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="main-content">
          <Outlet />
        </main>
      </div>

      {/* Overlay for mobile */}
      <div className="sidebar-overlay" onClick={() => dispatch(toggleSidebar())} />

      <style>{`
        :root {
          --primary: #3b82f6;
          --bg-primary: #ffffff;
          --bg-secondary: #f1f5f9;
          --bg-tertiary: #e2e8f0;
          --text-primary: #1e293b;
          --text-muted: #64748b;
          --border-color: #e2e8f0;
          --sidebar-width: 260px;
        }
        .dark {
          --primary: #60a5fa;
          --bg-primary: #1e293b;
          --bg-secondary: #334155;
          --bg-tertiary: #475569;
          --text-primary: #f1f5f9;
          --text-muted: #94a3b8;
          --border-color: #475569;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: var(--bg-secondary);
          color: var(--text-primary);
        }
        .app-layout { display: flex; min-height: 100vh; }
        .sidebar {
          width: var(--sidebar-width); background: var(--bg-primary);
          border-right: 1px solid var(--border-color);
          display: flex; flex-direction: column;
          position: fixed; left: 0; top: 0; bottom: 0; z-index: 50;
          transform: translateX(-100%); transition: transform 0.3s;
        }
        .sidebar-open .sidebar { transform: translateX(0); }
        @media (min-width: 1024px) {
          .sidebar { transform: translateX(0); }
          .main-wrapper { margin-left: var(--sidebar-width); }
          .sidebar-overlay { display: none; }
          .menu-btn { display: none; }
        }
        .sidebar-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 20px; border-bottom: 1px solid var(--border-color);
        }
        .logo-text {
          font-size: 24px; font-weight: 700; color: var(--primary);
        }
        .close-sidebar {
          background: none; border: none; cursor: pointer; color: var(--text-muted);
          display: block;
        }
        @media (min-width: 1024px) { .close-sidebar { display: none; } }
        .sidebar-nav { flex: 1; padding: 16px; display: flex; flex-direction: column; gap: 4px; }
        .nav-item {
          display: flex; align-items: center; gap: 12px; padding: 12px 16px;
          border-radius: 8px; color: var(--text-muted); text-decoration: none;
          transition: all 0.2s;
        }
        .nav-item:hover { background: var(--bg-secondary); color: var(--text-primary); }
        .nav-item.active { background: var(--primary); color: white; }
        .sidebar-footer {
          padding: 16px; border-top: 1px solid var(--border-color);
          display: flex; align-items: center; gap: 12px;
        }
        .user-info { display: flex; align-items: center; gap: 12px; flex: 1; }
        .user-avatar {
          width: 40px; height: 40px; border-radius: 10px;
          background: var(--primary); color: white;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600;
        }
        .user-name { display: block; font-weight: 600; font-size: 14px; }
        .user-role { display: block; font-size: 12px; color: var(--text-muted); text-transform: capitalize; }
        .logout-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 8px;
        }
        .logout-btn:hover { color: #ef4444; }
        .main-wrapper { flex: 1; display: flex; flex-direction: column; }
        .top-bar {
          background: var(--bg-primary); border-bottom: 1px solid var(--border-color);
          padding: 12px 24px; display: flex; align-items: center; gap: 16px;
          position: sticky; top: 0; z-index: 40;
        }
        .menu-btn {
          background: none; border: none; cursor: pointer; color: var(--text-primary);
          padding: 8px;
        }
        .search-btn {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-secondary); border: 1px solid var(--border-color);
          padding: 10px 16px; border-radius: 8px; cursor: pointer;
          color: var(--text-muted); flex: 1; max-width: 400px;
        }
        .search-btn kbd {
          background: var(--bg-primary); padding: 2px 6px;
          border-radius: 4px; font-size: 12px; margin-left: auto;
        }
        .top-bar-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
        .offline-indicator {
          background: #fef3c7; color: #92400e;
          padding: 8px; border-radius: 8px;
        }
        .sync-badge {
          background: var(--primary); color: white;
          width: 24px; height: 24px; border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-size: 12px; font-weight: 600;
        }
        .theme-btn, .notifications-btn {
          background: none; border: none; cursor: pointer;
          color: var(--text-muted); padding: 8px; border-radius: 8px;
        }
        .theme-btn:hover, .notifications-btn:hover { background: var(--bg-secondary); }
        .main-content { flex: 1; }
        .sidebar-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5);
          z-index: 40; opacity: 0; pointer-events: none; transition: opacity 0.3s;
        }
        .sidebar-open .sidebar-overlay { opacity: 1; pointer-events: auto; }
      `}</style>
    </div>
  );
}
