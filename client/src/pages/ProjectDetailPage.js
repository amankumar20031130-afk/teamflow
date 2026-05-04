import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI, taskAPI, userAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  formatDate, getStatusLabel, getPriorityLabel, getProjectStatusLabel,
  getInitials, getAvatarColor, isOverdue, getErrorMessage, truncate,
} from '../utils/helpers';
import './ProjectDetailPage.css';

const TaskCard = ({ task, onUpdate }) => {
  const over = isOverdue(task.dueDate, task.status);

  return (
    <Link to={`/tasks/${task._id}`} className="task-card">
      <div className="task-card-top">
        <span className={`badge badge-${task.priority}`}>{getPriorityLabel(task.priority)}</span>
        {over && <span className="badge badge-overdue">Overdue</span>}
      </div>
      <p className="task-card-title">{task.title}</p>
      {task.description && (
        <p className="task-card-desc">{truncate(task.description, 70)}</p>
      )}
      <div className="task-card-footer">
        {task.assignee ? (
          <span
            className="avatar avatar-sm"
            style={{ background: getAvatarColor(task.assignee.name) }}
            title={task.assignee.name}
          >
            {getInitials(task.assignee.name)}
          </span>
        ) : (
          <span className="task-unassigned">Unassigned</span>
        )}
        {task.dueDate && (
          <span className={`task-card-due ${over ? 'overdue' : ''}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
};

const KanbanColumn = ({ status, label, tasks, color, onCreate }) => (
  <div className="kanban-col">
    <div className="kanban-col-header" style={{ borderTopColor: color }}>
      <div className="kanban-col-title">
        <span style={{ color }}>{label}</span>
        <span className="kanban-col-count">{tasks.length}</span>
      </div>
      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => onCreate(status)} title="Add task">
        <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>
    <div className="kanban-col-body">
      {tasks.map((t) => <TaskCard key={t._id} task={t} />)}
      {tasks.length === 0 && (
        <div className="kanban-empty">No tasks</div>
      )}
    </div>
  </div>
);

const CreateTaskModal = ({ project, defaultStatus, onClose, onCreate }) => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    title: '', description: '', status: defaultStatus || 'todo',
    priority: 'medium', assignee: '', dueDate: '', tags: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const allMembers = [
    { user: project.owner, role: 'admin' },
    ...(project.members || []),
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) return setError('Title is required');
    setLoading(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignee: form.assignee || undefined,
        dueDate: form.dueDate || undefined,
      };
      const res = await taskAPI.create(project._id, payload);
      onCreate(res.data.task);
      toast.success('Task created!');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Task</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="Task title"
                value={form.title}
                onChange={(e) => { setForm(f => ({ ...f, title: e.target.value })); setError(''); }}
                autoFocus
              />
              {error && <span className="form-error">{error}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="What needs to be done?"
                rows={3}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Status</label>
                <select
                  className="form-input"
                  value={form.status}
                  onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}
                >
                  <option value="todo">To Do</option>
                  <option value="in-progress">In Progress</option>
                  <option value="in-review">In Review</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select
                  className="form-input"
                  value={form.priority}
                  onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Assignee</label>
                <select
                  className="form-input"
                  value={form.assignee}
                  onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))}
                >
                  <option value="">Unassigned</option>
                  {allMembers.map((m) => (
                    <option key={m.user._id} value={m.user._id}>
                      {m.user.name}{m.user._id === user?._id ? ' (You)' : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Due Date</label>
                <input
                  type="date"
                  className="form-input"
                  value={form.dueDate}
                  onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Tags <span className="form-hint">(comma-separated)</span></label>
              <input
                className="form-input"
                placeholder="design, frontend, bug"
                value={form.tags}
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))}
              />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner" />Creating...</> : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddMemberModal = ({ project, onClose, onUpdate }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [role, setRole] = useState('member');
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const searchTimer = useRef(null);

  // IDs already in the project (owner + members) — exclude from suggestions
  const existingIds = new Set([
    project.owner?._id || project.owner,
    ...(project.members || []).map((m) => m.user?._id || m.user),
  ].map(String));

  useEffect(() => {
    clearTimeout(searchTimer.current);
    setResults([]);
    if (!query.trim()) return;
    searchTimer.current = setTimeout(() => {
      setSearching(true);
      userAPI.search(query)
        .then((r) => {
          const filtered = (r.data.users || []).filter((u) => !existingIds.has(String(u._id)));
          setResults(filtered);
        })
        .catch(() => {})
        .finally(() => setSearching(false));
    }, 300);
    return () => clearTimeout(searchTimer.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const handleSelect = (user) => {
    setSelected(user);
    setQuery('');
    setResults([]);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected) return setError('Please select a user to add');
    setLoading(true);
    try {
      const res = await projectAPI.addMember(project._id, { userId: selected._id, role });
      onUpdate(res.data.project);
      toast.success(`${selected.name} added to the project!`);
      onClose();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Member</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">

            {/* Search input */}
            <div className="form-group" style={{ position: 'relative' }}>
              <label className="form-label">Search by name *</label>
              <div className={`member-search-box ${error && !selected ? 'error' : ''}`}>
                <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: 'var(--gray-400)', flexShrink: 0 }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  className="member-search-input"
                  placeholder="Type a name to search…"
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setError(''); }}
                  autoFocus
                  autoComplete="off"
                />
                {searching && <span className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2, flexShrink: 0 }} />}
              </div>
              {error && !selected && <span className="form-error">{error}</span>}

              {/* Dropdown suggestions */}
              {results.length > 0 && (
                <div className="member-suggestions">
                  {results.map((u) => (
                    <button
                      key={u._id}
                      type="button"
                      className="member-suggestion-row"
                      onClick={() => handleSelect(u)}
                    >
                      <span
                        className="avatar avatar-sm"
                        style={{ background: getAvatarColor(u.name) }}
                      >
                        {getInitials(u.name)}
                      </span>
                      <div className="member-suggestion-info">
                        <span className="member-suggestion-name">{u.name}</span>
                        <span className="member-suggestion-email">{u.email}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results hint */}
              {query.trim().length >= 2 && !searching && results.length === 0 && (
                <div className="member-no-results">No users found for "{query}"</div>
              )}
            </div>

            {/* Selected user chip */}
            {selected && (
              <div className="member-selected-chip">
                <span className="avatar avatar-sm" style={{ background: getAvatarColor(selected.name) }}>
                  {getInitials(selected.name)}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span className="member-suggestion-name">{selected.name}</span>
                  <span className="member-suggestion-email">{selected.email}</span>
                </div>
                <button
                  type="button"
                  className="btn btn-ghost btn-icon btn-sm"
                  onClick={() => setSelected(null)}
                  title="Remove selection"
                  style={{ color: 'var(--gray-400)' }}
                >
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )}

            {/* Role */}
            <div className="form-group">
              <label className="form-label">Role</label>
              <select className="form-input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="member">Member — can view and work on tasks</option>
                <option value="admin">Admin — can also manage project settings</option>
              </select>
            </div>

          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading || !selected}>
              {loading ? <><span className="loading-spinner" />Adding...</> : 'Add Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const COLUMNS = [
  { status: 'todo', label: 'To Do', color: '#6b7280' },
  { status: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { status: 'in-review', label: 'In Review', color: '#f59e0b' },
  { status: 'done', label: 'Done', color: '#22c55e' },
];

const ProjectDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('board');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [createTaskStatus, setCreateTaskStatus] = useState('todo');
  const [showAddMember, setShowAddMember] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [projRes, tasksRes, statsRes] = await Promise.all([
        projectAPI.getOne(id),
        taskAPI.getByProject(id),
        projectAPI.getStats(id),
      ]);
      setProject(projRes.data.project);
      setTasks(tasksRes.data.tasks);
      setStats(statsRes.data.stats);
    } catch (err) {
      toast.error('Failed to load project');
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const isAdmin = project?.isAdmin?.(user?._id) ||
    project?.owner?._id === user?._id ||
    project?.members?.find(m => m.user._id === user?._id)?.role === 'admin';

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await projectAPI.delete(id);
      toast.success('Project deleted');
      navigate('/projects');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Remove this member from the project?')) return;
    try {
      const res = await projectAPI.removeMember(id, userId);
      setProject(res.data.project);
      toast.success('Member removed');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      const res = await projectAPI.update(id, { status });
      setProject(res.data.project);
      toast.success('Status updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <span className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col.status] = tasks.filter((t) => t.status === col.status);
    return acc;
  }, {});

  const allMembers = [
    { user: project.owner, role: 'owner' },
    ...(project.members || []),
  ];

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <div className="project-header-left">
          <Link to="/projects" className="back-link">
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Projects
          </Link>
          <div className="project-header-info">
            <h1 className="project-detail-title">{project.name}</h1>
            <div className="project-header-meta">
              <span className={`badge badge-${project.status}`}>{getProjectStatusLabel(project.status)}</span>
              {project.dueDate && <span className="project-header-due">Due {formatDate(project.dueDate)}</span>}
            </div>
          </div>
        </div>
        <div className="project-header-actions">
          {isAdmin && (
            <>
              <select
                className="form-input"
                style={{ width: 'auto', padding: '7px 12px', fontSize: 13 }}
                value={project.status}
                onChange={(e) => handleUpdateStatus(e.target.value)}
              >
                <option value="active">Active</option>
                <option value="on-hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
              </select>
              <button className="btn btn-primary btn-sm" onClick={() => { setCreateTaskStatus('todo'); setShowCreateTask(true); }}>
                <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add Task
              </button>
            </>
          )}
          {!isAdmin && (
            <button className="btn btn-primary btn-sm" onClick={() => { setCreateTaskStatus('todo'); setShowCreateTask(true); }}>
              <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          )}
        </div>
      </div>

      {project.description && (
        <p className="project-detail-desc">{project.description}</p>
      )}

      {stats && (
        <div className="project-stats-bar">
          {[
            { label: 'Total', value: stats.total, color: '#6b7280' },
            { label: 'To Do', value: stats.todo, color: '#6b7280' },
            { label: 'In Progress', value: stats.inProgress, color: '#3b82f6' },
            { label: 'In Review', value: stats.inReview, color: '#f59e0b' },
            { label: 'Done', value: stats.done, color: '#22c55e' },
            { label: 'Overdue', value: stats.overdue, color: '#ef4444' },
          ].map(({ label, value, color }) => (
            <div key={label} className="project-stat-item">
              <span className="project-stat-value" style={{ color }}>{value}</span>
              <span className="project-stat-label">{label}</span>
            </div>
          ))}
          {stats.total > 0 && (
            <div className="project-stat-progress">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.round((stats.done / stats.total) * 100)}%` }}
                />
              </div>
              <span className="progress-label">
                {Math.round((stats.done / stats.total) * 100)}% complete
              </span>
            </div>
          )}
        </div>
      )}

      <div className="project-tabs">
        {['board', 'list', 'team'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'board' && (
        <div className="kanban-board">
          {COLUMNS.map((col) => (
            <KanbanColumn
              key={col.status}
              {...col}
              tasks={tasksByStatus[col.status]}
              onCreate={(status) => { setCreateTaskStatus(status); setShowCreateTask(true); }}
            />
          ))}
        </div>
      )}

      {activeTab === 'list' && (
        <div className="card task-list-view">
          {tasks.length === 0 ? (
            <div className="empty-state">
              <h3>No tasks yet</h3>
              <p>Create your first task to get started</p>
            </div>
          ) : (
            <table className="tasks-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assignee</th>
                  <th>Due Date</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id} onClick={() => navigate(`/tasks/${task._id}`)} className="task-table-row">
                    <td>
                      <span className="task-table-title">{task.title}</span>
                      {task.tags?.map((tag) => (
                        <span key={tag} className="tag" style={{ marginLeft: 6 }}>{tag}</span>
                      ))}
                    </td>
                    <td><span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span></td>
                    <td><span className={`badge badge-${task.priority}`}>{getPriorityLabel(task.priority)}</span></td>
                    <td>
                      {task.assignee ? (
                        <div className="table-assignee">
                          <span
                            className="avatar avatar-sm"
                            style={{ background: getAvatarColor(task.assignee.name) }}
                          >
                            {getInitials(task.assignee.name)}
                          </span>
                          <span>{task.assignee.name}</span>
                        </div>
                      ) : <span className="task-unassigned">—</span>}
                    </td>
                    <td>
                      <span className={isOverdue(task.dueDate, task.status) ? 'text-danger' : ''}>
                        {formatDate(task.dueDate)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'team' && (
        <div className="team-view">
          <div className="card team-members-card">
            <div className="team-header">
              <h3 className="section-title">Team Members</h3>
              {isAdmin && (
                <button className="btn btn-primary btn-sm" onClick={() => setShowAddMember(true)}>
                  <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                  </svg>
                  Add Member
                </button>
              )}
            </div>
            <div className="members-list">
              {allMembers.map((m) => (
                <div key={m.user._id} className="member-row">
                  <span
                    className="avatar avatar-md"
                    style={{ background: getAvatarColor(m.user.name) }}
                  >
                    {getInitials(m.user.name)}
                  </span>
                  <div className="member-info">
                    <span className="member-name">{m.user.name}</span>
                    <span className="member-email">{m.user.email}</span>
                  </div>
                  <span className={`badge badge-${m.role}`}>{m.role}</span>
                  {isAdmin && m.role !== 'owner' && m.user._id !== user?._id && (
                    <button
                      className="btn btn-ghost btn-icon btn-sm"
                      onClick={() => handleRemoveMember(m.user._id)}
                      title="Remove member"
                      style={{ color: 'var(--danger)' }}
                    >
                      <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
          {isAdmin && project.owner._id === user?._id && (
            <div className="danger-zone card">
              <h3 className="danger-zone-title">Danger Zone</h3>
              <p className="danger-zone-desc">
                Deleting this project will permanently remove all tasks and data associated with it.
              </p>
              <button className="btn btn-danger btn-sm" onClick={handleDeleteProject}>
                Delete Project
              </button>
            </div>
          )}
        </div>
      )}

      {showCreateTask && (
        <CreateTaskModal
          project={project}
          defaultStatus={createTaskStatus}
          onClose={() => setShowCreateTask(false)}
          onCreate={(task) => setTasks((prev) => [task, ...prev])}
        />
      )}

      {showAddMember && (
        <AddMemberModal
          project={project}
          onClose={() => setShowAddMember(false)}
          onUpdate={setProject}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
