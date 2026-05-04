import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../utils/api';
import { formatDate, isOverdue, getStatusLabel, getInitials, getAvatarColor } from '../utils/helpers';
import './DashboardPage.css';

const StatCard = ({ label, value, icon, color, sub }) => (
  <div className="stat-card card">
    <div className="stat-icon" style={{ background: color + '18', color }}>
      {icon}
    </div>
    <div className="stat-info">
      <span className="stat-value">{value}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  </div>
);

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI.getDashboardStats()
      .then((res) => setStats(res.data.stats))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="page-loading">
        <span className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  const completion = stats?.totalTasks
    ? Math.round((stats.tasksByStatus.done / stats.totalTasks) * 100)
    : 0;

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Here's what's happening across your projects</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          label="Total Projects"
          value={stats?.totalProjects ?? 0}
          color="#6366f1"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
            </svg>
          }
          sub={`${stats?.activeProjects ?? 0} active`}
        />
        <StatCard
          label="Total Tasks"
          value={stats?.totalTasks ?? 0}
          color="#0ea5e9"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
          sub={`${completion}% complete`}
        />
        <StatCard
          label="In Progress"
          value={stats?.tasksByStatus?.inProgress ?? 0}
          color="#f59e0b"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />
        <StatCard
          label="Overdue"
          value={stats?.overdueTasks ?? 0}
          color="#ef4444"
          icon={
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          }
        />
      </div>

      <div className="dashboard-grid">
        <div className="card dashboard-section">
          <div className="section-header">
            <h2 className="section-title">Task Overview</h2>
          </div>
          <div className="task-overview">
            {[
              { key: 'todo', label: 'To Do', color: '#6b7280' },
              { key: 'inProgress', label: 'In Progress', color: '#3b82f6' },
              { key: 'inReview', label: 'In Review', color: '#f59e0b' },
              { key: 'done', label: 'Done', color: '#22c55e' },
            ].map(({ key, label, color }) => {
              const count = stats?.tasksByStatus?.[key] ?? 0;
              const pct = stats?.totalTasks ? Math.round((count / stats.totalTasks) * 100) : 0;
              return (
                <div key={key} className="overview-row">
                  <div className="overview-label">
                    <span className="overview-dot" style={{ background: color }} />
                    <span>{label}</span>
                  </div>
                  <div className="overview-bar">
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${pct}%`, background: color }} />
                    </div>
                  </div>
                  <span className="overview-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card dashboard-section">
          <div className="section-header">
            <h2 className="section-title">My Assigned Tasks</h2>
            <Link to="/my-tasks" className="section-link">View all</Link>
          </div>
          {!stats?.myTasks?.length ? (
            <div className="empty-state" style={{ padding: '32px 0' }}>
              <p>No tasks assigned to you</p>
            </div>
          ) : (
            <div className="task-list">
              {stats.myTasks.slice(0, 6).map((task) => (
                <Link key={task._id} to={`/tasks/${task._id}`} className="task-row">
                  <div className="task-row-info">
                    <span className="task-row-title">{task.title}</span>
                    <span className="task-row-project">{task.project?.name}</span>
                  </div>
                  <div className="task-row-meta">
                    <span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span>
                    {task.dueDate && (
                      <span className={`task-row-due ${isOverdue(task.dueDate, task.status) ? 'overdue' : ''}`}>
                        {formatDate(task.dueDate)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {stats?.recentOverdue?.length > 0 && (
          <div className="card dashboard-section overdue-section">
            <div className="section-header">
              <h2 className="section-title overdue-title">
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="#ef4444" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Overdue Tasks
              </h2>
            </div>
            <div className="task-list">
              {stats.recentOverdue.map((task) => (
                <Link key={task._id} to={`/tasks/${task._id}`} className="task-row">
                  <div className="task-row-info">
                    <span className="task-row-title">{task.title}</span>
                    <span className="task-row-project">{task.project?.name}</span>
                  </div>
                  <div className="task-row-meta">
                    {task.assignee && (
                      <span
                        className="avatar avatar-sm"
                        style={{ background: getAvatarColor(task.assignee.name) }}
                        title={task.assignee.name}
                      >
                        {getInitials(task.assignee.name)}
                      </span>
                    )}
                    <span className="badge badge-overdue">Overdue · {formatDate(task.dueDate)}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
