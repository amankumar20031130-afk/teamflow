import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { taskAPI, projectAPI } from '../utils/api';
import { useAuth } from '../context/AuthContext';
import {
  formatDate, formatRelativeTime, getStatusLabel, getPriorityLabel,
  getInitials, getAvatarColor, isOverdue, getErrorMessage,
} from '../utils/helpers';
import './TaskDetailPage.css';

const TaskDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [task, setTask] = useState(null);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  useEffect(() => {
    taskAPI.getOne(id)
      .then(async (res) => {
        const t = res.data.task;
        setTask(t);
        setForm({
          title: t.title,
          description: t.description || '',
          status: t.status,
          priority: t.priority,
          assignee: t.assignee?._id || '',
          dueDate: t.dueDate ? t.dueDate.split('T')[0] : '',
          tags: t.tags?.join(', ') || '',
        });
        const projRes = await projectAPI.getOne(t.project._id || t.project);
        setProject(projRes.data.project);
      })
      .catch(() => navigate(-1))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        assignee: form.assignee || null,
        dueDate: form.dueDate || null,
      };
      const res = await taskAPI.update(id, payload);
      setTask(res.data.task);
      setEditing(false);
      toast.success('Task updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(id);
      toast.success('Task deleted');
      navigate(`/projects/${task.project._id || task.project}`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const res = await taskAPI.addComment(id, { text: comment.trim() });
      setTask((t) => ({ ...t, comments: res.data.comments }));
      setComment('');
      toast.success('Comment added');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCommenting(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      const res = await taskAPI.update(id, { status });
      setTask(res.data.task);
      setForm(f => ({ ...f, status }));
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

  const over = isOverdue(task.dueDate, task.status);
  const projectId = task.project?._id || task.project;
  const allMembers = project ? [
    { user: project.owner, role: 'owner' },
    ...(project.members || []),
  ] : [];

  const canEdit = user?._id === task.createdBy?._id ||
    project?.members?.find(m => m.user._id === user?._id)?.role === 'admin' ||
    project?.owner?._id === user?._id;

  return (
    <div className="task-detail">
      <div className="task-detail-nav">
        <Link to={`/projects/${projectId}`} className="back-link">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {task.project?.name || 'Project'}
        </Link>
      </div>

      <div className="task-detail-layout">
        <div className="task-detail-main">
          <div className="card task-detail-card">
            {editing ? (
              <div className="task-edit-form">
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input
                    className="form-input"
                    value={form.title}
                    onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
                    autoFocus
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-input"
                    rows={5}
                    value={form.description}
                    onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Task description..."
                  />
                </div>
                <div className="form-row-3">
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-input" value={form.status} onChange={(e) => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="todo">To Do</option>
                      <option value="in-progress">In Progress</option>
                      <option value="in-review">In Review</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Priority</label>
                    <select className="form-input" value={form.priority} onChange={(e) => setForm(f => ({ ...f, priority: e.target.value }))}>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Assignee</label>
                    <select className="form-input" value={form.assignee} onChange={(e) => setForm(f => ({ ...f, assignee: e.target.value }))}>
                      <option value="">Unassigned</option>
                      {allMembers.map((m) => (
                        <option key={m.user._id} value={m.user._id}>{m.user.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Due Date</label>
                    <input type="date" className="form-input" value={form.dueDate} onChange={(e) => setForm(f => ({ ...f, dueDate: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tags <span className="form-hint">(comma-separated)</span></label>
                    <input className="form-input" placeholder="tag1, tag2" value={form.tags} onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} />
                  </div>
                </div>
                <div className="task-edit-actions">
                  <button className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>
                  <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
                    {saving ? <><span className="loading-spinner" />Saving...</> : 'Save Changes'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="task-view">
                <div className="task-view-header">
                  <div className="task-badges">
                    <span className={`badge badge-${task.status}`}>{getStatusLabel(task.status)}</span>
                    <span className={`badge badge-${task.priority}`}>{getPriorityLabel(task.priority)}</span>
                    {over && <span className="badge badge-overdue">Overdue</span>}
                  </div>
                  {canEdit && (
                    <div className="task-actions">
                      <button className="btn btn-outline btn-sm" onClick={() => setEditing(true)}>Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete</button>
                    </div>
                  )}
                </div>
                <h1 className="task-detail-title">{task.title}</h1>
                {task.description && (
                  <p className="task-detail-desc">{task.description}</p>
                )}
                {task.tags?.length > 0 && (
                  <div className="task-tags">
                    {task.tags.map((tag) => <span key={tag} className="tag">{tag}</span>)}
                  </div>
                )}

                <div className="task-quick-status">
                  <span className="qs-label">Move to:</span>
                  {['todo', 'in-progress', 'in-review', 'done']
                    .filter((s) => s !== task.status)
                    .map((s) => (
                      <button
                        key={s}
                        className="btn btn-outline btn-sm"
                        onClick={() => handleStatusChange(s)}
                      >
                        {getStatusLabel(s)}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>

          <div className="card comments-card">
            <h3 className="section-title" style={{ marginBottom: 16 }}>
              Comments {task.comments?.length > 0 && `(${task.comments.length})`}
            </h3>
            <form onSubmit={handleComment} className="comment-form">
              <span
                className="avatar avatar-sm"
                style={{ background: getAvatarColor(user?.name || ''), flexShrink: 0, marginTop: 2 }}
              >
                {getInitials(user?.name || '')}
              </span>
              <div style={{ flex: 1 }}>
                <textarea
                  className="form-input"
                  rows={2}
                  placeholder="Add a comment..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  style={{ marginTop: 8 }}
                  disabled={!comment.trim() || commenting}
                >
                  {commenting ? <><span className="loading-spinner" />Posting...</> : 'Post'}
                </button>
              </div>
            </form>
            {task.comments?.length > 0 ? (
              <div className="comments-list">
                {task.comments.map((c, i) => (
                  <div key={c._id || i} className="comment-item">
                    <span
                      className="avatar avatar-sm"
                      style={{ background: getAvatarColor(c.user?.name || ''), flexShrink: 0 }}
                    >
                      {getInitials(c.user?.name || '?')}
                    </span>
                    <div className="comment-content">
                      <div className="comment-meta">
                        <span className="comment-author">{c.user?.name}</span>
                        <span className="comment-time">{formatRelativeTime(c.createdAt)}</span>
                      </div>
                      <p className="comment-text">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-comments">No comments yet. Start the conversation!</p>
            )}
          </div>
        </div>

        <div className="task-detail-sidebar">
          <div className="card task-sidebar-card">
            <h3 className="sidebar-section-title">Details</h3>

            <div className="sidebar-row">
              <span className="sidebar-label">Project</span>
              <Link to={`/projects/${projectId}`} className="sidebar-link">
                {task.project?.name}
              </Link>
            </div>

            <div className="sidebar-row">
              <span className="sidebar-label">Assignee</span>
              {task.assignee ? (
                <div className="sidebar-assignee">
                  <span
                    className="avatar avatar-sm"
                    style={{ background: getAvatarColor(task.assignee.name) }}
                  >
                    {getInitials(task.assignee.name)}
                  </span>
                  <span>{task.assignee.name}</span>
                </div>
              ) : (
                <span className="sidebar-empty">Unassigned</span>
              )}
            </div>

            <div className="sidebar-row">
              <span className="sidebar-label">Due Date</span>
              <span className={over ? 'text-danger' : 'sidebar-value'}>
                {task.dueDate ? formatDate(task.dueDate) : '—'}
              </span>
            </div>

            <div className="sidebar-row">
              <span className="sidebar-label">Created by</span>
              <div className="sidebar-assignee">
                <span
                  className="avatar avatar-sm"
                  style={{ background: getAvatarColor(task.createdBy?.name || '') }}
                >
                  {getInitials(task.createdBy?.name || '')}
                </span>
                <span>{task.createdBy?.name}</span>
              </div>
            </div>

            <div className="sidebar-row">
              <span className="sidebar-label">Created</span>
              <span className="sidebar-value">{formatRelativeTime(task.createdAt)}</span>
            </div>

            <div className="sidebar-row">
              <span className="sidebar-label">Updated</span>
              <span className="sidebar-value">{formatRelativeTime(task.updatedAt)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailPage;
