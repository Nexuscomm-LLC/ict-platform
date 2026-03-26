import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Search,
  Filter,
  FolderKanban,
  Calendar,
  DollarSign,
  MoreVertical,
  MapPin,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../hooks';
import { fetchProjects, setFilters } from '../store/slices/projectsSlice';
import { format } from 'date-fns';
import type { Project } from '../types';

const STATUS_COLORS = {
  pending: { bg: '#fef3c7', text: '#92400e' },
  in_progress: { bg: '#dbeafe', text: '#1e40af' },
  completed: { bg: '#dcfce7', text: '#166534' },
  on_hold: { bg: '#f3e8ff', text: '#7c3aed' },
};

export default function Projects() {
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, isLoading, filters } = useAppSelector((state) => state.projects);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    dispatch(setFilters({ status, search }));
    dispatch(fetchProjects({ status: status || undefined, search }));
  }, [dispatch, searchParams]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams);
    if (value) params.set('search', value);
    else params.delete('search');
    setSearchParams(params);
  };

  const handleStatusFilter = (status: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (status) params.set('status', status);
    else params.delete('status');
    setSearchParams(params);
    setShowFilters(false);
  };

  const ProjectCard = ({ project }: { project: Project }) => {
    const statusStyle = STATUS_COLORS[project.status] || STATUS_COLORS.pending;

    return (
      <Link to={`/projects/${project.id}`} className="project-card">
        <div className="project-header">
          <span className="project-number">{project.project_number}</span>
          <span
            className="project-status"
            style={{ background: statusStyle.bg, color: statusStyle.text }}
          >
            {project.status.replace('_', ' ')}
          </span>
        </div>

        <h3 className="project-name">{project.name}</h3>
        <p className="project-client">{project.client_name}</p>

        <div className="project-meta">
          <span>
            <Calendar size={14} />
            {format(new Date(project.start_date), 'MMM d, yyyy')}
          </span>
          {project.budget && (
            <span>
              <DollarSign size={14} />
              {project.budget.toLocaleString()}
            </span>
          )}
          {project.address && (
            <span>
              <MapPin size={14} />
              {project.address.split(',')[0]}
            </span>
          )}
        </div>

        <div className="project-progress">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${project.progress}%` }} />
          </div>
          <span className="progress-text">{project.progress}%</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="projects-page">
      <header className="page-header">
        <h1>Projects</h1>
        <Link to="/projects/new" className="btn-primary">
          <Plus size={20} />
          New Project
        </Link>
      </header>

      <div className="toolbar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search projects..."
            value={filters.search}
            onChange={handleSearch}
          />
        </div>

        <div className="filter-dropdown">
          <button className="btn-filter" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={20} />
            {filters.status ? filters.status.replace('_', ' ') : 'All Status'}
          </button>
          {showFilters && (
            <div className="filter-menu">
              <button onClick={() => handleStatusFilter(null)}>All Status</button>
              <button onClick={() => handleStatusFilter('pending')}>Pending</button>
              <button onClick={() => handleStatusFilter('in_progress')}>In Progress</button>
              <button onClick={() => handleStatusFilter('completed')}>Completed</button>
              <button onClick={() => handleStatusFilter('on_hold')}>On Hold</button>
            </div>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="loading-spinner" />
      ) : items.length === 0 ? (
        <div className="empty-state">
          <FolderKanban size={48} />
          <h3>No projects found</h3>
          <p>Create your first project to get started</p>
          <Link to="/projects/new" className="btn-primary">
            <Plus size={20} />
            Create Project
          </Link>
        </div>
      ) : (
        <div className="projects-grid">
          {items.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}

      <style>{`
        .projects-page { padding: 24px; max-width: 1400px; margin: 0 auto; }
        .page-header {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 24px;
        }
        .page-header h1 { font-size: 24px; margin: 0; }
        .btn-primary {
          display: flex; align-items: center; gap: 8px;
          background: var(--primary); color: white;
          padding: 12px 20px; border-radius: 8px; border: none;
          font-weight: 600; cursor: pointer; text-decoration: none;
        }
        .btn-primary:hover { opacity: 0.9; }
        .toolbar { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }
        .search-box {
          display: flex; align-items: center; gap: 12px;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          border-radius: 8px; padding: 0 16px; flex: 1; min-width: 250px;
        }
        .search-box input {
          border: none; background: none; padding: 12px 0;
          font-size: 16px; width: 100%; outline: none;
        }
        .filter-dropdown { position: relative; }
        .btn-filter {
          display: flex; align-items: center; gap: 8px;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          padding: 12px 16px; border-radius: 8px; cursor: pointer;
          font-size: 14px; text-transform: capitalize;
        }
        .filter-menu {
          position: absolute; top: 100%; right: 0; margin-top: 8px;
          background: var(--bg-primary); border: 1px solid var(--border-color);
          border-radius: 8px; overflow: hidden; min-width: 150px; z-index: 10;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        }
        .filter-menu button {
          display: block; width: 100%; padding: 12px 16px;
          text-align: left; border: none; background: none;
          cursor: pointer; text-transform: capitalize;
        }
        .filter-menu button:hover { background: var(--bg-secondary); }
        .projects-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }
        .project-card {
          background: var(--bg-primary); border-radius: 12px; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1); text-decoration: none;
          color: inherit; transition: transform 0.2s, box-shadow 0.2s;
        }
        .project-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .project-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .project-number { font-size: 12px; color: var(--text-muted); font-weight: 500; }
        .project-status {
          font-size: 12px; padding: 4px 10px; border-radius: 12px;
          font-weight: 500; text-transform: capitalize;
        }
        .project-name { font-size: 18px; font-weight: 600; margin: 0 0 4px; }
        .project-client { color: var(--text-muted); margin: 0 0 16px; }
        .project-meta {
          display: flex; gap: 16px; font-size: 13px; color: var(--text-muted);
          margin-bottom: 16px; flex-wrap: wrap;
        }
        .project-meta span { display: flex; align-items: center; gap: 4px; }
        .project-progress { display: flex; align-items: center; gap: 12px; }
        .progress-bar {
          flex: 1; height: 6px; background: var(--bg-secondary);
          border-radius: 3px; overflow: hidden;
        }
        .progress-fill { height: 100%; background: var(--primary); transition: width 0.3s; }
        .progress-text { font-size: 14px; font-weight: 600; color: var(--primary); }
        .empty-state {
          text-align: center; padding: 64px 24px;
          background: var(--bg-primary); border-radius: 16px;
        }
        .empty-state svg { color: var(--text-muted); margin-bottom: 16px; }
        .empty-state h3 { margin: 0 0 8px; }
        .empty-state p { color: var(--text-muted); margin: 0 0 24px; }
        .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--bg-secondary); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; margin: 64px auto; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
