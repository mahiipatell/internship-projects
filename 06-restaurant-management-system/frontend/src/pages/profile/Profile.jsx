import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { userApi } from '../../api/endpoints';
import ErrorBanner from '../../components/common/ErrorBanner';

export default function Profile() {
  const { user } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await userApi.changeOwnPassword(newPassword);
      setMessage('Password updated successfully');
      setNewPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">Profile</h1>

      <div className="card mb-6">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Account Details</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between"><dt className="text-gray-500">Name</dt><dd className="font-medium">{user?.name}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Email</dt><dd className="font-medium">{user?.email}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Role</dt><dd className="font-medium capitalize">{user?.role}</dd></div>
          <div className="flex justify-between"><dt className="text-gray-500">Phone</dt><dd className="font-medium">{user?.phone || '—'}</dd></div>
        </dl>
      </div>

      <div className="card">
        <h2 className="mb-3 text-sm font-semibold text-gray-700">Change Password</h2>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <ErrorBanner message={error} />
          {message && <div className="mb-2 rounded-md border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">{message}</div>}
          <div>
            <label className="label">New Password</label>
            <input type="password" className="input" minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Updating...' : 'Update Password'}</button>
        </form>
      </div>
    </div>
  );
}
