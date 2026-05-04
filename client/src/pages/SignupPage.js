import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import './AuthPage.css';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState('user'); // 'user' | 'admin'
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirm: '', adminSecret: '',
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showSecret, setShowSecret] = useState(false);

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters required';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
    if (role === 'admin' && !form.adminSecret.trim())
      errs.adminSecret = 'Admin secret key is required';
    return errs;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
  };

  const handleRoleSelect = (r) => {
    setRole(r);
    setErrors({});
    if (r !== 'admin') setForm((f) => ({ ...f, adminSecret: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const user = await signup(
        form.name.trim(),
        form.email,
        form.password,
        role === 'admin' ? form.adminSecret.trim() : undefined
      );
      toast.success(
        user?.role === 'admin'
          ? 'Admin account created! Welcome.'
          : 'Account created! Welcome aboard.'
      );
      navigate(user?.role === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        {/* Logo */}
        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 44, height: 44 }}>
            <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="logo-text" style={{ fontSize: 22 }}>TeamFlow</span>
        </div>

        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Choose your role to get started</p>

        {/* ── Role Selector ────────────────────────────────── */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-option ${role === 'user' ? 'active user' : ''}`}
            onClick={() => handleRoleSelect('user')}
          >
            <div className="role-option-icon user-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div className="role-option-info">
              <span className="role-option-title">Member</span>
              <span className="role-option-desc">Join projects & manage tasks</span>
            </div>
            {role === 'user' && (
              <svg className="role-check" width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke="#0ea5e9" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>

          <button
            type="button"
            className={`role-option ${role === 'admin' ? 'active admin' : ''}`}
            onClick={() => handleRoleSelect('admin')}
          >
            <div className="role-option-icon admin-icon">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div className="role-option-info">
              <span className="role-option-title">Admin</span>
              <span className="role-option-desc">Full control of the system</span>
            </div>
            {role === 'admin' && (
              <svg className="role-check" width="16" height="16" fill="none" viewBox="0 0 24 24"
                stroke="#7c3aed" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        </div>

        {/* ── Form ─────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input
              name="name"
              type="text"
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              autoComplete="name"
            />
            {errors.name && <span className="form-error">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              name="email"
              type="email"
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="you@example.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
            {errors.email && <span className="form-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              name="password"
              type="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="At least 6 characters"
              value={form.password}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              name="confirm"
              type="password"
              className={`form-input ${errors.confirm ? 'error' : ''}`}
              placeholder="Repeat your password"
              value={form.confirm}
              onChange={handleChange}
              autoComplete="new-password"
            />
            {errors.confirm && <span className="form-error">{errors.confirm}</span>}
          </div>

          {/* Admin secret — only shown when Admin role is selected */}
          {role === 'admin' && (
            <div className="form-group admin-secret-field">
              <label className="form-label">
                Admin Secret Key
                <span className="secret-badge">Required for Admin</span>
              </label>
              <div className="secret-input-wrap">
                <input
                  name="adminSecret"
                  type={showSecret ? 'text' : 'password'}
                  className={`form-input ${errors.adminSecret ? 'error' : ''}`}
                  placeholder="Enter the admin secret key"
                  value={form.adminSecret}
                  onChange={handleChange}
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="secret-toggle"
                  onClick={() => setShowSecret((s) => !s)}
                  tabIndex={-1}
                >
                  {showSecret ? (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {errors.adminSecret && <span className="form-error">{errors.adminSecret}</span>}
              <p className="secret-hint">
                Default key: <code>TeamFlowAdmin@2024</code>
              </p>
            </div>
          )}

          <button
            type="submit"
            className={`btn auth-submit ${role === 'admin' ? 'btn-admin' : 'btn-primary'}`}
            disabled={loading}
          >
            {loading
              ? <><span className="loading-spinner" />Creating account...</>
              : `Create ${role === 'admin' ? 'Admin' : 'Member'} Account`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account?{' '}
          <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;
