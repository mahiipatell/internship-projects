import React, { useEffect, useState } from 'react';
import { menuApi, categoryApi } from '../../api/endpoints';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import EmptyState from '../../components/common/EmptyState';
import ErrorBanner from '../../components/common/ErrorBanner';
import Modal from '../../components/common/Modal';

const emptyForm = { category_id: '', name: '', description: '', price: '', is_available: true, image_url: '' };

export default function Menu() {
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const load = () => {
    setLoading(true);
    Promise.all([
      menuApi.list({ search: search || undefined, categoryId: categoryFilter || undefined }),
      categoryApi.list(),
    ])
      .then(([menuRes, catRes]) => {
        setItems(menuRes.data.data);
        setCategories(catRes.data.data);
      })
      .catch((err) => setError(err.response?.data?.message || 'Failed to load menu'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [search, categoryFilter]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setFormError('');
    setModalOpen(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setForm({
      category_id: item.category_id,
      name: item.name,
      description: item.description || '',
      price: item.price,
      is_available: item.is_available,
      image_url: item.image_url || '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      const payload = { ...form, category_id: Number(form.category_id), price: Number(form.price) };
      if (editing) {
        await menuApi.update(editing.id, payload);
      } else {
        await menuApi.create(payload);
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save menu item');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm(`Delete "${item.name}"?`)) return;
    try {
      await menuApi.remove(item.id);
      load();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete menu item');
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-semibold text-gray-900">Menu</h1>
        {isAdmin && <button className="btn-primary" onClick={openCreate}>+ New Item</button>}
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <input
          className="input max-w-xs"
          placeholder="Search menu items..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select className="input max-w-xs" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <ErrorBanner message={error} />

      {loading ? (
        <LoadingSpinner />
      ) : items.length === 0 ? (
        <EmptyState title="No menu items found" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="card flex flex-col">
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-gray-900">{item.name}</h3>
                <span className={`badge ${item.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {item.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <p className="mt-1 text-xs text-gray-400">{item.category_name}</p>
              {item.description && <p className="mt-2 text-sm text-gray-500">{item.description}</p>}
              <p className="mt-3 text-lg font-bold text-primary-600">₹{Number(item.price).toFixed(2)}</p>
              {isAdmin && (
                <div className="mt-3 flex gap-3 text-sm">
                  <button className="text-primary-600 hover:underline" onClick={() => openEdit(item)}>Edit</button>
                  <button className="text-red-600 hover:underline" onClick={() => handleDelete(item)}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Menu Item' : 'New Menu Item'}>
        <form onSubmit={handleSave} className="space-y-4">
          <ErrorBanner message={formError} />
          <div>
            <label className="label">Category</label>
            <select className="input" value={form.category_id} onChange={(e) => setForm({ ...form, category_id: e.target.value })} required>
              <option value="">Select category</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div>
            <label className="label">Price (₹)</label>
            <input type="number" step="0.01" min="0" className="input" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.is_available} onChange={(e) => setForm({ ...form, is_available: e.target.checked })} />
            Available
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
