import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { getInitials, getAvatarColor, formatDate, getErrorMessage } from '../utils/helpers';
import './ProfilePage.css';

const ProfilePage = () => {
  const { user, updateUser, logout } = useAuth();
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const handleProfileSave = async (e) => {
    e.preventDefault();
    if (!profileForm.name.trim()) return toast.error('Name is required');
    setSavingProfile(true);
    try {
      const res = await authAPI.updateProfile({ name: profileForm.name.trim() });
      updateUser(res.data.user);
      toast.success('Profile updated');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.currentPassword) errs.currentPassword = 'Required';
    if (!pwForm.newPassword) errs.newPassword = 'Required';
    else if (pwForm.newPassword.length < 6) errs.newPassword = 'At least 6 characters';
    if (pwForm.newPassword !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    if (Object.keys(errs).length) return setPwErrors(errs);

    setSavingPw(true);
    try {
      await authAPI.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirm: '' });
      setPwErrors({});
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSavingPw(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account settings</p>
      </div>

      <div className="profile-grid">
        <div className="card profile-card">
          <div className="profile-avatar-section">
            <span
              className="avatar avatar-xl"
              style={{ background: getAvatarColor(user?.name || '') }}
            >
              {getInitials(user?.name || '')}
            </span>
            <div>
              <h2 className="profile-name">{user?.name}</h2>
              <p className="profile-email">{user?.email}</p>
              <p className="profile-joined">Joined {formatDate(user?.createdAt)}</p>
            </div>
          </div>
        </div>

        <div className="card profile-form-card">
          <h3 className="profile-section-title">Personal Information</h3>
          <form onSubmit={handleProfileSave} className="profile-form">
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                className="form-input"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ name: e.target.value })}
                placeholder="Your full name"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                className="form-input"
                value={user?.email}
                disabled
                style={{ background: 'var(--gray-50)', color: 'var(--gray-400)' }}
              />
              <span className="form-hint-text">Email cannot be changed</span>
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingProfile}>
              {savingProfile ? <><span className="loading-spinner" />Saving...</> : 'Save Changes'}
            </button>
          </form>
        </div>

        <div className="card profile-form-card">
          <h3 className="profile-section-title">Change Password</h3>
          <form onSubmit={handlePasswordSave} className="profile-form">
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <input
                type="password"
                className={`form-input ${pwErrors.currentPassword ? 'error' : ''}`}
                value={pwForm.currentPassword}
                onChange={(e) => { setPwForm(f => ({ ...f, currentPassword: e.target.value })); setPwErrors(e2 => ({ ...e2, currentPassword: '' })); }}
                placeholder="••••••••"
              />
              {pwErrors.currentPassword && <span className="form-error">{pwErrors.currentPassword}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">New Password</label>
              <input
                type="password"
                className={`form-input ${pwErrors.newPassword ? 'error' : ''}`}
                value={pwForm.newPassword}
                onChange={(e) => { setPwForm(f => ({ ...f, newPassword: e.target.value })); setPwErrors(e2 => ({ ...e2, newPassword: '' })); }}
                placeholder="At least 6 characters"
              />
              {pwErrors.newPassword && <span className="form-error">{pwErrors.newPassword}</span>}
            </div>
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <input
                type="password"
                className={`form-input ${pwErrors.confirm ? 'error' : ''}`}
                value={pwForm.confirm}
                onChange={(e) => { setPwForm(f => ({ ...f, confirm: e.target.value })); setPwErrors(e2 => ({ ...e2, confirm: '' })); }}
                placeholder="Repeat new password"
              />
              {pwErrors.confirm && <span className="form-error">{pwErrors.confirm}</span>}
            </div>
            <button type="submit" className="btn btn-primary" disabled={savingPw}>
              {savingPw ? <><span className="loading-spinner" />Updating...</> : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
