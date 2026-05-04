import React, { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { adminAPI } from '../utils/api';
import { formatDate, formatRelativeTime, getInitials, getAvatarColor,
  getStatusLabel, getPriorityLabel, getProjectStatusLabel, getErrorMessage } from '../utils/helpers';
import './AdminPage.css';

/* ─── tiny reusable pieces ─────────────────────────────── */
const StatCard = ({ label, value, sub, color, icon }) => (
  <div className="admin-stat-card card">
    <div className="admin-stat-icon" style={{ background: color + '18', color }}>{icon}</div>
    <div className="admin-stat-body">
      <span className="admin-stat-value">{value ?? '—'}</span>
      <span className="admin-stat-label">{label}</span>
      {sub && <span className="admin-stat-sub">{sub}</span>}
    </div>
  </div>
);

const SearchBar = ({ value, onChange, placeholder }) => (
  <div className="admin-search">
    <svg width="15" height="15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
    <input className="admin-search-input" placeholder={placeholder} value={value}
      onChange={(e) => onChange(e.target.value)} />
  </div>
);

const Pagination = ({ page, pages, onPage }) => {
  if (pages <= 1) return null;
  return (
    <div className="admin-pagination">
      <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>← Prev</button>
      <span className="admin-page-info">Page {page} of {pages}</span>
      <button className="btn btn-outline btn-sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next →</button>
    </div>
  );
};

/* ─── STATS TAB ─────────────────────────────────────────── */
const StatsTab = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminAPI.getStats()
      .then((r) => setStats(r.data.stats))
      .catch(() => toast.error('Failed to load stats'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="page-loading"><span className="loading-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} /></div>;
  if (!stats) return null;

  const s = stats;
  return (
    <div className="admin-stats-view">
      <div className="admin-stats-grid">
        <StatCard label="Total Users" value={s.users.total} sub={`+${s.users.recentSignups} this week`} color="#6366f1"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 015-4m0 0a4 4 0 118 0m-8 0a4 4 0 008 0" /></svg>} />
        <StatCard label="Admins" value={s.users.admins} color="#8b5cf6"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>} />
        <StatCard label="Total Projects" value={s.projects.total} sub={`${s.projects.active} active`} color="#0ea5e9"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" /></svg>} />
        <StatCard label="Total Tasks" value={s.tasks.total} sub={`${s.tasks.completionRate}% complete`} color="#22c55e"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>} />
        <StatCard label="Done Tasks" value={s.tasks.done} color="#22c55e"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>} />
        <StatCard label="Overdue Tasks" value={s.tasks.overdue} color="#ef4444"
          icon={<svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>} />
      </div>

      <div className="admin-breakdown-grid">
        <div className="card admin-breakdown-card">
          <h3 className="admin-breakdown-title">Tasks by Status</h3>
          {[
            { key: 'todo', label: 'To Do', color: '#6b7280' },
            { key: 'in-progress', label: 'In Progress', color: '#3b82f6' },
            { key: 'in-review', label: 'In Review', color: '#f59e0b' },
            { key: 'done', label: 'Done', color: '#22c55e' },
          ].map(({ key, label, color }) => {
            const count = s.tasks.byStatus?.[key] || 0;
            const pct = s.tasks.total ? Math.round((count / s.tasks.total) * 100) : 0;
            return (
              <div key={key} className="breakdown-row">
                <div className="breakdown-label"><span className="breakdown-dot" style={{ background: color }} />{label}</div>
                <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${pct}%`, background: color }} /></div>
                <span className="breakdown-count">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="card admin-breakdown-card">
          <h3 className="admin-breakdown-title">Tasks by Priority</h3>
          {[
            { key: 'critical', label: 'Critical', color: '#b91c1c' },
            { key: 'high', label: 'High', color: '#ef4444' },
            { key: 'medium', label: 'Medium', color: '#f59e0b' },
            { key: 'low', label: 'Low', color: '#22c55e' },
          ].map(({ key, label, color }) => {
            const count = s.tasks.byPriority?.[key] || 0;
            const pct = s.tasks.total ? Math.round((count / s.tasks.total) * 100) : 0;
            return (
              <div key={key} className="breakdown-row">
                <div className="breakdown-label"><span className="breakdown-dot" style={{ background: color }} />{label}</div>
                <div className="progress-bar" style={{ flex: 1 }}><div className="progress-fill" style={{ width: `${pct}%`, background: color }} /></div>
                <span className="breakdown-count">{count}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

/* ─── USERS TAB ─────────────────────────────────────────── */
const UsersTab = () => {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchUsers = useCallback(() => {
    setLoading(true);
    adminAPI.getUsers({ search, role: roleFilter, page, limit: 15 })
      .then((r) => { setUsers(r.data.users); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [search, roleFilter, page]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleRoleChange = async (userId, newRole) => {
    setActionId(userId);
    try {
      const res = await adminAPI.updateUserRole(userId, newRole);
      setUsers((prev) => prev.map((u) => u._id === userId ? res.data.user : u));
      toast.success(`Role changed to ${newRole}`);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionId(null); }
  };

  const handleToggleActive = async (userId) => {
    setActionId(userId);
    try {
      const res = await adminAPI.toggleUserActive(userId);
      setUsers((prev) => prev.map((u) => u._id === userId ? res.data.user : u));
      toast.success(res.data.message);
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionId(null); }
  };

  const handleDelete = async (userId, name) => {
    if (!window.confirm(`Permanently delete user "${name}"? This cannot be undone.`)) return;
    setActionId(userId);
    try {
      await adminAPI.deleteUser(userId);
      setUsers((prev) => prev.filter((u) => u._id !== userId));
      setTotal((t) => t - 1);
      toast.success('User deleted');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionId(null); }
  };

  return (
    <div className="admin-tab-view">
      <div className="admin-tab-toolbar">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search by name or email…" />
        <select className="form-input admin-filter-select" value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}>
          <option value="">All Roles</option>
          <option value="user">Members</option>
          <option value="admin">Admins</option>
        </select>
        <span className="admin-total-badge">{total} user{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="page-loading" style={{ height: 200 }}><span className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
      ) : users.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}><h3>No users found</h3></div>
      ) : (
        <div className="card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} className={!u.isActive ? 'row-inactive' : ''}>
                  <td>
                    <div className="admin-user-cell">
                      <span className="avatar avatar-sm" style={{ background: getAvatarColor(u.name) }}>{getInitials(u.name)}</span>
                      <div>
                        <span className="admin-user-name">{u.name}</span>
                        <span className="admin-user-email">{u.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`admin-role-select badge ${u.role === 'admin' ? 'badge-admin' : 'badge-member'}`}
                      value={u.role}
                      onChange={(e) => handleRoleChange(u._id, e.target.value)}
                      disabled={actionId === u._id}
                    >
                      <option value="user">Member</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-active' : 'badge-archived'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="admin-td-muted">{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="admin-row-actions">
                      <button
                        className={`btn btn-sm ${u.isActive ? 'btn-secondary' : 'btn-outline'}`}
                        onClick={() => handleToggleActive(u._id)}
                        disabled={actionId === u._id}
                        title={u.isActive ? 'Deactivate user' : 'Activate user'}
                      >
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(u._id, u.name)}
                        disabled={actionId === u._id}
                        title="Delete user permanently"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  );
};

/* ─── PROJECTS TAB ──────────────────────────────────────── */
const ProjectsTab = () => {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchProjects = useCallback(() => {
    setLoading(true);
    adminAPI.getProjects({ search, status: statusFilter, page, limit: 15 })
      .then((r) => { setProjects(r.data.projects); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));
  }, [search, statusFilter, page]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete project "${name}" and ALL its tasks? This cannot be undone.`)) return;
    setActionId(id);
    try {
      await adminAPI.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p._id !== id));
      setTotal((t) => t - 1);
      toast.success('Project deleted');
    } catch (err) { toast.error(getErrorMessage(err)); }
    finally { setActionId(null); }
  };

  return (
    <div className="admin-tab-view">
      <div className="admin-tab-toolbar">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search projects…" />
        <select className="form-input admin-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
          <option value="archived">Archived</option>
        </select>
        <span className="admin-total-badge">{total} project{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="page-loading" style={{ height: 200 }}><span className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
      ) : projects.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}><h3>No projects found</h3></div>
      ) : (
        <div className="card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Project</th>
                <th>Owner</th>
                <th>Status</th>
                <th>Members</th>
                <th>Tasks</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id}>
                  <td>
                    <div>
                      <span className="admin-user-name">{p.name}</span>
                      {p.description && <span className="admin-user-email">{p.description.slice(0, 50)}{p.description.length > 50 ? '…' : ''}</span>}
                    </div>
                  </td>
                  <td>
                    <div className="admin-user-cell">
                      <span className="avatar avatar-sm" style={{ background: getAvatarColor(p.owner?.name || '') }}>{getInitials(p.owner?.name || '')}</span>
                      <span className="admin-user-name">{p.owner?.name}</span>
                    </div>
                  </td>
                  <td><span className={`badge badge-${p.status}`}>{getProjectStatusLabel(p.status)}</span></td>
                  <td className="admin-td-center">{p.memberCount}</td>
                  <td className="admin-td-center">{p.taskCount}</td>
                  <td className="admin-td-muted">{formatDate(p.createdAt)}</td>
                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p._id, p.name)}
                      disabled={actionId === p._id}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  );
};

/* ─── TASKS TAB ─────────────────────────────────────────── */
const TasksTab = () => {
  const [tasks, setTasks] = useState([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTasks = useCallback(() => {
    setLoading(true);
    adminAPI.getTasks({ search, status: statusFilter, priority: priorityFilter, page, limit: 15 })
      .then((r) => { setTasks(r.data.tasks); setTotal(r.data.total); setPages(r.data.pages); })
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  }, [search, statusFilter, priorityFilter, page]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  return (
    <div className="admin-tab-view">
      <div className="admin-tab-toolbar">
        <SearchBar value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Search tasks…" />
        <select className="form-input admin-filter-select" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="in-review">In Review</option>
          <option value="done">Done</option>
        </select>
        <select className="form-input admin-filter-select" value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setPage(1); }}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <span className="admin-total-badge">{total} task{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="page-loading" style={{ height: 200 }}><span className="loading-spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /></div>
      ) : tasks.length === 0 ? (
        <div className="empty-state" style={{ padding: '40px 0' }}><h3>No tasks found</h3></div>
      ) : (
        <div className="card admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Status</th>
                <th>Priority</th>
                <th>Assignee</th>
                <th>Created by</th>
                <th>Due</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((t) => (
                <tr key={t._id}>
                  <td>
                    <span className="admin-user-name">{t.title}</span>
                  </td>
                  <td className="admin-td-muted">{t.project?.name || '—'}</td>
                  <td><span className={`badge badge-${t.status}`}>{getStatusLabel(t.status)}</span></td>
                  <td><span className={`badge badge-${t.priority}`}>{getPriorityLabel(t.priority)}</span></td>
                  <td>
                    {t.assignee ? (
                      <div className="admin-user-cell">
                        <span className="avatar avatar-sm" style={{ background: getAvatarColor(t.assignee.name) }}>{getInitials(t.assignee.name)}</span>
                        <span className="admin-user-name">{t.assignee.name}</span>
                      </div>
                    ) : <span className="admin-td-muted">—</span>}
                  </td>
                  <td className="admin-td-muted">{t.createdBy?.name || '—'}</td>
                  <td className={`admin-td-muted ${t.isOverdue ? 'text-danger' : ''}`}>
                    {t.dueDate ? formatDate(t.dueDate) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={pages} onPage={setPage} />
        </div>
      )}
    </div>
  );
};

/* ─── MAIN PAGE ─────────────────────────────────────────── */
const TABS = [
  { key: 'stats', label: 'Overview' },
  { key: 'users', label: 'Users' },
  { key: 'projects', label: 'Projects' },
  { key: 'tasks', label: 'Tasks' },
];

const AdminPage = () => {
  const [activeTab, setActiveTab] = useState('stats');

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <div className="admin-title-row">
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="#8b5cf6" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <h1 className="page-title">Admin Panel</h1>
          </div>
          <p className="page-subtitle">Manage all users, projects, and tasks across the platform</p>
        </div>
      </div>

      <div className="admin-tabs">
        {TABS.map(({ key, label }) => (
          <button key={key} className={`tab-btn ${activeTab === key ? 'active' : ''}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'stats' && <StatsTab />}
      {activeTab === 'users' && <UsersTab />}
      {activeTab === 'projects' && <ProjectsTab />}
      {activeTab === 'tasks' && <TasksTab />}
    </div>
  );
};

export default AdminPage;
