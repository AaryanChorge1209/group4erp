import { useState, useEffect } from 'react';
import { User, Lock, Save, Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getRoleLabel, getRoleBadgeClass } from '../../lib/utils';
import toast from 'react-hot-toast';
import api from '../../lib/api';

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwErrors, setPwErrors] = useState({});

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/admin/users/${user.id}`, { name });
      updateUser({ name });
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update');
    } finally { setSaving(false); }
  };

  const handleChangePw = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!pwForm.current) errs.current = 'Current password required';
    if (!pwForm.newPw || pwForm.newPw.length < 8) errs.newPw = 'Min 8 characters';
    if (pwForm.newPw !== pwForm.confirm) errs.confirm = 'Passwords do not match';
    setPwErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setPwSaving(true);
    try {
      await api.put('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      toast.success('Password changed successfully!');
      setPwForm({ current: '', newPw: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally { setPwSaving(false); }
  };

  const initials = user?.name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="page-title">My Profile</h1>

      {/* Profile Info */}
      <div className="card p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
            <span className="text-white text-3xl font-bold">{initials}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{user?.name}</h2>
            <p className="text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className={`mt-2 ${getRoleBadgeClass(user?.role)}`}>{getRoleLabel(user?.role)}</span>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="label">Full Name</label>
            <input className="input" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email Address</label>
            <input className="input opacity-60 cursor-not-allowed" value={user?.email} disabled />
            <p className="text-xs text-gray-400 mt-1">Email cannot be changed. Contact admin.</p>
          </div>
          <div>
            <label className="label">Role</label>
            <input className="input opacity-60 cursor-not-allowed" value={getRoleLabel(user?.role)} disabled />
          </div>
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Profile
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-5">
          <Lock className="w-5 h-5 text-gray-400" /> Change Password
        </h3>
        <form onSubmit={handleChangePw} className="space-y-4" noValidate>
          <div>
            <label className="label">Current Password *</label>
            <input type="password" className={`input ${pwErrors.current ? 'border-red-500' : ''}`} value={pwForm.current} onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} />
            {pwErrors.current && <p className="form-error">{pwErrors.current}</p>}
          </div>
          <div>
            <label className="label">New Password *</label>
            <input type="password" className={`input ${pwErrors.newPw ? 'border-red-500' : ''}`} value={pwForm.newPw} onChange={e => setPwForm(f => ({ ...f, newPw: e.target.value }))} />
            {pwErrors.newPw && <p className="form-error">{pwErrors.newPw}</p>}
          </div>
          <div>
            <label className="label">Confirm New Password *</label>
            <input type="password" className={`input ${pwErrors.confirm ? 'border-red-500' : ''}`} value={pwForm.confirm} onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} />
            {pwErrors.confirm && <p className="form-error">{pwErrors.confirm}</p>}
          </div>
          <button type="submit" disabled={pwSaving} className="btn-primary">
            {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            Change Password
          </button>
        </form>
      </div>
    </div>
  );
}
