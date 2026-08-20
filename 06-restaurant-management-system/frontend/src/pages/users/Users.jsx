import React, { useEffect, useState } from 'react';
import { userApi } from '../../api/endpoints';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

const emptyForm = { name: '', email: '', password: '', role: 'waiter', phone: '' };

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    userApi.list().then(({ data }) => setUsers(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load users'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editing) {
        await userApi.update(editing.id, { name: form.name, role: form.role, phone: form.phone });
      } else {
        await userApi.create(form);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (u) => {
    try {
      await userApi.update(u.id, { is_active: !u.is_active });
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user');
    }
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete user "${u.name}"?`)) return;
    try {
      await userApi.remove(u.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Users</h1>
        <button className="btn-primary" onClick={openCreate}>+ New User</button>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : users.length === 0 ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="card overflow-x-auto p-0">
          <table className="table-base">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th className="text-right">Actions</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td className="font-medium">{u.name}</td>
                  <td>{u.email}</td>
                  <td className="capitalize">{u.role}</td>
                  <td>{u.phone || '—'}</td>
                  <td><StatusBadge status={u.is_active ? 'available' : 'cancelled'} /></td>
                  <td className="text-right space-x-2">
                    <button className="text-primary-600 hover:underline" onClick={() => openEdit(u)}>Edit</button>
                    <button className="text-yellow-600 hover:underline" onClick={() => toggleActive(u)}>
                      {u.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button className="text-red-600 hover:underline" onClick={() => handleDelete(u)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit User' : 'New User'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorBanner message={formError} />
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Email</label>
            <input type="email" className="input" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          {!editing && (
            <div>
              <label className="label">Password</label>
              <input type="password" className="input" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
            </div>
          )}
          <div>
            <label className="label">Role</label>
            <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
              <option value="admin">Admin</option>
              <option value="cashier">Cashier</option>
              <option value="waiter">Waiter</option>
            </select>
          </div>
          <div>
            <label className="label">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
