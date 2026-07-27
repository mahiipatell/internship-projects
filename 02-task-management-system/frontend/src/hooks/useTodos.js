import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';

export function useTodos(filter) {
  const { token } = useAuth();
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchTodos = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`http://localhost:5000/api/todos?filter=${filter}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTodos(data.todos);
    } catch (err) {
      setError(err.message || 'Failed to load todos');
    } finally {
      setLoading(false);
    }
  }, [filter, token]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const addTodo = async (title, priority) => {
    const res = await fetch('http://localhost:5000/api/todos', {
      method: 'POST',
      headers,
      body: JSON.stringify({ title, priority }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setTodos((prev) => [data.todo, ...prev]);
    return data.todo;
  };

  const toggleTodo = async (id, completed) => {
    // Optimistic update
    setTodos((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed } : t))
    );
    try {
      const res = await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ completed }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTodos((prev) => prev.map((t) => (t.id === id ? data.todo : t)));
    } catch {
      // Revert on failure
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !completed } : t))
      );
    }
  };

  const updateTodo = async (id, fields) => {
    const res = await fetch(`http://localhost:5000/api/todos/${id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(fields),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    setTodos((prev) => prev.map((t) => (t.id === id ? data.todo : t)));
    return data.todo;
  };

  const deleteTodo = async (id) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    try {
      const res = await fetch(`http://localhost:5000/api/todos/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error);
      }
    } catch {
      fetchTodos(); // Revert on failure
    }
  };

  const clearCompleted = async () => {
    const res = await fetch('http://localhost:5000/api/todos/completed/clear', {
      method: 'DELETE',
      headers,
    });
    if (!res.ok) throw new Error('Failed to clear');
    setTodos((prev) => prev.filter((t) => !t.completed));
  };

  return { todos, loading, error, addTodo, toggleTodo, updateTodo, deleteTodo, clearCompleted, refetch: fetchTodos };
}
