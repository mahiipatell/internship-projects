import React, { useEffect, useState } from 'react';
import { tableApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Modal from '../../components/common/Modal';
import StatusBadge from '../../components/common/StatusBadge';

const emptyForm = { table_number: '', capacity: '', status: 'available' };

export default function Tables() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    tableApi.list().then(({ data }) => setTables(data.data))
      .catch((err) => setError(err.response?.data?.message || 'Failed to load tables'))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (t) => {
    setEditing(t);
    setForm({ table_number: t.table_number, capacity: t.capacity, status: t.status });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, capacity: Number(form.capacity) };
      if (editing) {
        await tableApi.update(editing.id, payload);
      } else {
        await tableApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save table');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`Delete table "${t.table_number}"?`)) return;
    try {
      await tableApi.remove(t.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete table');
    }
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Tables</h1>
        {isAdmin && <button className="btn-primary" onClick={openCreate}>+ New Table</button>}
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : tables.length === 0 ? (
        <EmptyState title="No tables configured" />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {tables.map((t) => (
            <div key={t.id} className="card text-center">
              <p className="text-lg font-bold text-gray-900">{t.table_number}</p>
              <p className="text-xs text-gray-400">Seats {t.capacity}</p>
              <div className="mt-2"><StatusBadge status={t.status} /></div>
              {isAdmin && (
                <div className="mt-3 flex justify-center gap-3 text-xs">
                  <button className="text-primary-600 hover:underline" onClick={() => openEdit(t)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(t)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Table' : 'New Table'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorBanner message={formError} />
          <div>
            <label className="label">Table Number</label>
            <input className="input" value={form.table_number} onChange={(e) => setForm({ ...form, table_number: e.target.value })} required />
          </div>
          <div>
            <label className="label">Capacity</label>
            <input type="number" min="1" className="input" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} required />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="reserved">Reserved</option>
            </select>
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
