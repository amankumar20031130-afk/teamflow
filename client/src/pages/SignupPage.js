import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/helpers';
import './AuthPage.css';

const SignupPage = () => {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required';
    else if (form.name.trim().length < 2) errs.name = 'Name must be at least 2 characters';
    if (!form.email) errs.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Enter a valid email';
    if (!form.password) errs.password = 'Password is required';
    else if (form.password.length < 6) errs.password = 'At least 6 characters required';
    if (form.password !== form.confirm) errs.confirm = 'Passwords do not match';
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
      await signup(form.name.trim(), form.email, form.password);
      toast.success('Account created! Welcome aboard.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card card">
        <div className="auth-logo">
          <div className="logo-icon" style={{ width: 44, height: 44 }}>
            <svg width="22" height="22" fill="white" viewBox="0 0 24 24">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="logo-text" style={{ fontSize: 22 }}>TeamFlow</span>
        </div>
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">Start managing your team's work</p>

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
          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <><span className="loading-spinner" />Creating account...</> : 'Create Account'}
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
