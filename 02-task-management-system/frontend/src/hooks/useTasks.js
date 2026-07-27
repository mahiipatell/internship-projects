import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const BASE = 'http://localhost:5000/api/tasks';

export function useTasks(filters) {
  const { token } = useAuth();
  const [tasks, setTasks]     = useState([]);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');
  const abortRef = useRef(null);

  const hdrs = useCallback(() => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  }), [token]);

  const fetchTasks = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true); setError('');
    try {
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([,v]) => v !== '' && v != null))
      );
      const res  = await fetch(`${BASE}?${params}`, { headers: hdrs(), signal: ctrl.signal });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(data.tasks); setTotal(data.total);
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message || 'Failed to load tasks');
    } finally { setLoading(false); }
  }, [JSON.stringify(filters), token]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const createTask = async (fields) => {
    const res  = await fetch(BASE, { method:'POST', headers:hdrs(), body:JSON.stringify(fields) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    await fetchTasks();
    return data.task;
  };

  const updateTask = async (id, fields) => {
    const res  = await fetch(`${BASE}/${id}`, { method:'PUT', headers:hdrs(), body:JSON.stringify(fields) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setTasks(p => p.map(t => t.id === id ? data.task : t));
    return data.task;
  };

  const updateStatus = async (id, status) => {
    setTasks(p => p.map(t => t.id === id ? { ...t, status } : t));
    try {
      const res  = await fetch(`${BASE}/${id}/status`, { method:'PATCH', headers:hdrs(), body:JSON.stringify({ status }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTasks(p => p.map(t => t.id === id ? data.task : t));
    } catch (err) { await fetchTasks(); throw err; }
  };

  const deleteTask = async (id) => {
    setTasks(p => p.filter(t => t.id !== id));
    try {
      const res = await fetch(`${BASE}/${id}`, { method:'DELETE', headers:hdrs() });
      if (!res.ok) { const d = await res.json(); throw new Error(d.error); }
    } catch (err) { await fetchTasks(); throw err; }
  };

  return { tasks, total, loading, error, refetch:fetchTasks, createTask, updateTask, updateStatus, deleteTask };
}

export function useTaskStats() {
  const { token } = useAuth();
  const [stats, setStats]       = useState(null);
  const [recent, setRecent]     = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading]   = useState(true);

  const fetchStats = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res  = await fetch(`${BASE}/stats`, { headers:{ Authorization:`Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setStats(data.stats); setRecent(data.recent_activity); setUpcoming(data.upcoming_tasks); }
    } catch {}
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchStats(); }, [fetchStats]);
  return { stats, recent, upcoming, loading, refetch:fetchStats };
}
