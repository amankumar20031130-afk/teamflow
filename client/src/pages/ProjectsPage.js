import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { projectAPI } from '../utils/api';
import { formatDate, getProjectStatusLabel, getErrorMessage, truncate } from '../utils/helpers';
import './ProjectsPage.css';

const CreateProjectModal = ({ onClose, onCreate }) => {
  const [form, setForm] = useState({ name: '', description: '', dueDate: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return setError('Project name is required');
    setLoading(true);
    try {
      const res = await projectAPI.create(form);
      onCreate(res.data.project);
      toast.success('Project created!');
      onClose();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">New Project</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>
            <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">Project Name *</label>
              <input
                className={`form-input ${error ? 'error' : ''}`}
                placeholder="e.g. Website Redesign"
                value={form.name}
                onChange={(e) => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
                autoFocus
              />
              {error && <span className="form-error">{error}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea
                className="form-input"
                placeholder="What is this project about?"
                rows={3}
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
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
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <><span className="loading-spinner" />Creating...</> : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const ProjectCard = ({ project }) => {
  const statusClass = `badge badge-${project.status}`;
  const memberCount = (project.members?.length ?? 0) + 1;

  return (
    <Link to={`/projects/${project._id}`} className="project-card card">
      <div className="project-card-header">
        <span className={statusClass}>{getProjectStatusLabel(project.status)}</span>
        <span className="project-date">{formatDate(project.createdAt)}</span>
      </div>
      <h3 className="project-name">{project.name}</h3>
      {project.description && (
        <p className="project-desc">{truncate(project.description, 90)}</p>
      )}
      <div className="project-footer">
        <div className="project-members">
          <svg width="13" height="13" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-5-4M9 20H4v-2a4 4 0 015-4m0 0a4 4 0 118 0m-8 0a4 4 0 008 0" />
          </svg>
          <span>{memberCount} member{memberCount !== 1 ? 's' : ''}</span>
        </div>
        {project.dueDate && (
          <span className="project-due">
            <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {formatDate(project.dueDate)}
          </span>
        )}
      </div>
    </Link>
  );
};

const ProjectsPage = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    projectAPI.getAll()
      .then((res) => setProjects(res.data.projects))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-loading">
        <span className="loading-spinner" style={{ width: 36, height: 36, borderWidth: 3 }} />
      </div>
    );
  }

  return (
    <div className="projects-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Projects</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          New Project
        </button>
      </div>

      {projects.length > 0 && (
        <div className="projects-search">
          <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            className="search-input"
            placeholder="Search projects..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          <svg width="52" height="52" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" />
          </svg>
          <h3>{search ? 'No projects match your search' : 'No projects yet'}</h3>
          <p>{search ? 'Try a different search term' : 'Create your first project to get started'}</p>
          {!search && (
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="projects-grid">
          {filtered.map((p) => <ProjectCard key={p._id} project={p} />)}
        </div>
      )}

      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreate={(p) => setProjects((prev) => [p, ...prev])}
        />
      )}
    </div>
  );
};

export default ProjectsPage;
