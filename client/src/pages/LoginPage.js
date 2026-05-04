import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import './AuthPage.css';

const DEMO_ACCOUNTS = [
  {
    type: 'admin',
    label: 'Admin',
    email: 'admin@teamflow.com',
    password: 'Admin@123',
    description: 'Full system control',
    color: '#7c3aed',
    bg: '#ede9fe',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
  },
  {
    type: 'user',
    label: 'Member',
    email: 'user@teamflow.com',
    password: 'User@123',
    description: 'Standard workspace access',
    color: '#0ea5e9',
    bg: '#e0f2fe',
    icon: (
      <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round"
          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(null); // 'admin' | 'user' | null
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    return errs;
  };

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors((e2) => ({ ...e2, [e.target.name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (account) => {
    setDemoLoading(account.type);
    try {
      await login(account.email, account.password);
      toast.success(`Signed in as ${account.label}!`);
      navigate(account.type === 'admin' ? '/admin' : '/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDemoLoading(null);
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

        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to your workspace</p>

        {/* ── Quick Demo Login ───────────────────────────────── */}
        <div className="demo-section">
          <div className="demo-label">
            <span className="demo-label-line" />
            <span className="demo-label-text">Quick Demo Login</span>
            <span className="demo-label-line" />
          </div>
          <div className="demo-cards">
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.type}
                className="demo-card"
                style={{ '--demo-color': acc.color, '--demo-bg': acc.bg }}
                onClick={() => handleDemoLogin(acc)}
                disabled={demoLoading !== null || loading}
              >
                <div className="demo-card-icon" style={{ background: acc.bg, color: acc.color }}>
                  {demoLoading === acc.type
                    ? <span className="loading-spinner" style={{ borderTopColor: acc.color }} />
                    : acc.icon}
                </div>
                <div className="demo-card-info">
                  <span className="demo-card-role" style={{ color: acc.color }}>
                    Login as {acc.label}
                  </span>
                  <span className="demo-card-desc">{acc.description}</span>
                  <span className="demo-card-creds">{acc.email}</span>
                </div>
                <svg className="demo-card-arrow" width="16" height="16" fill="none"
                  viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} style={{ color: acc.color }}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* ── Divider ────────────────────────────────────────── */}
        <div className="demo-label" style={{ margin: '4px 0 20px' }}>
          <span className="demo-label-line" />
          <span className="demo-label-text">Or sign in manually</span>
          <span className="demo-label-line" />
        </div>

        {/* ── Manual Login Form ──────────────────────────────── */}
        <form onSubmit={handleSubmit} className="auth-form">
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
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>
          <button
            type="submit"
            className="btn btn-primary auth-submit"
            disabled={loading || demoLoading !== null}
          >
            {loading ? <><span className="loading-spinner" />Signing in...</> : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/signup" className="auth-link">Create one</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
