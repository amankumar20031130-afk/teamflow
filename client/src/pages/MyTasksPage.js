import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { taskAPI } from '../utils/api';
import { formatDate, getStatusLabel, getPriorityLabel, isOverdue } from '../utils/helpers';
import './MyTasksPage.css';

const MyTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    taskAPI.getMyTasks()
      .then((res) => setTasks(res.data.tasks))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = tasks.filter((t) => {
    if (filter === 'overdue') return isOverdue(t.dueDate, t.status);
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const counts = {
    all: tasks.length,
    todo: tasks.filter((t) => t.status === 'todo').length,
    'in-progress': tasks.filter((t) => t.status === 'in-progress').length,
    'in-review': tasks.filter((t) => t.status === 'in-review').length,
    done: tasks.filter((t) => t.status === 'done').length,
    overdue: tasks.filter((t) => isOverdue(t.dueDate, t.status)).length,
  };

  if (loading) {
    return (
      <div className="page-loading">
        <span className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="my-tasks-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">My Tasks</h1>
          <p className="page-subtitle">Tasks assigned to you across all projects</p>
        </div>
      </div>

      <div className="my-tasks-filters">
        {[
          { key: 'all', label: 'All' },
          { key: 'todo', label: 'To Do' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'in-review', label: 'In Review' },
          { key: 'done', label: 'Done' },
          { key: 'overdue', label: 'Overdue' },
        ].map(({ key, label }) => (
          <button
            key={key}
            className={`filter-btn ${filter === key ? 'active' : ''} ${key === 'overdue' ? 'overdue' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            {counts[key] > 0 && <span className="filter-count">{counts[key]}</span>}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
          <h3>{filter === 'all' ? 'No tasks assigned to you' : `No ${filter === 'overdue' ? 'overdue' : filter} tasks`}</h3>
          <p>
            {filter === 'all'
              ? 'Tasks assigned to you will appear here'
              : 'Switch to another filter to see tasks'}
          </p>
        </div>
      ) : (
        <div className="my-tasks-list card">
          {filtered.map((task) => {
            const over = isOverdue(task.dueDate, task.status);
            return (
              <Link key={task._id} to={`/tasks/${task._id}`} className="my-task-row">
                <div className="my-task-main">
                  <div className="my-task-top">
                    <span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span>
                    <span className={`badge badge-${task.priority}`}>{getPriorityLabel(task.priority)}</span>
                    {over && <span className="badge badge-overdue">Overdue</span>}
                  </div>
                  <h3 className="my-task-title">{task.title}</h3>
                  <span className="my-task-project">
                    <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
                    </svg>
                    {task.project?.name}
                  </span>
                </div>
                <div className="my-task-meta">
                  {task.dueDate && (
                    <span className={`my-task-due ${over ? 'overdue' : ''}`}>
                      <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {formatDate(task.dueDate)}
                    </span>
                  )}
                  <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--gray-300)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyTasksPage;
