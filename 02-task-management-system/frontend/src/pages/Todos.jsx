import { useState } from 'react';
import Navbar from '../components/Navbar';
import TodoInput from '../components/TodoInput';
import TodoItem from '../components/TodoItem';
import { useTodos } from '../hooks/useTodos';
import styles from './Todos.module.css';

const FILTERS = ['all', 'active', 'completed'];

export default function Todos() {
  const [filter, setFilter] = useState('all');
  const [addError, setAddError] = useState('');

  const {
    todos, loading, error,
    addTodo, toggleTodo, updateTodo, deleteTodo, clearCompleted,
  } = useTodos(filter);

  const handleAdd = async (title, priority) => {
    setAddError('');
    try {
      await addTodo(title, priority);
    } catch (err) {
      setAddError(err.message);
    }
  };

  const activeCount = todos.filter((t) => !t.completed).length;
  const completedCount = todos.filter((t) => t.completed).length;

  return (
    <div className={styles.pageWrap}>
      <Navbar />
      <div className={styles.page}>
        <div className={styles.container}>

          {/* ── Header ── */}
          <div className={styles.header}>
            <div>
              <h1 className={styles.title}>My Tasks</h1>
              <p className={styles.subtitle}>
                {activeCount === 0
                  ? 'Nothing left to do 🎉'
                  : `${activeCount} task${activeCount !== 1 ? 's' : ''} remaining`}
              </p>
            </div>
            {completedCount > 0 && (
              <button
                className={styles.clearBtn}
                onClick={clearCompleted}
                title="Delete all completed tasks"
              >
                Clear completed ({completedCount})
              </button>
            )}
          </div>

          {/* ── Add input ── */}
          <TodoInput onAdd={handleAdd} error={addError} />

          {/* ── Filter tabs ── */}
          <div className={styles.filters}>
            {FILTERS.map((f) => (
              <button
                key={f}
                className={`${styles.filterBtn} ${filter === f ? styles.filterActive : ''}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Todo list ── */}
          {loading ? (
            <div className={styles.state}>
              <div className={styles.loadingDots}>
                <span /><span /><span />
              </div>
              <p>Loading your tasks...</p>
            </div>
          ) : error ? (
            <div className={styles.stateError}>⚠ {error}</div>
          ) : todos.length === 0 ? (
            <EmptyState filter={filter} />
          ) : (
            <ul className={styles.list}>
              {todos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onToggle={toggleTodo}
                  onUpdate={updateTodo}
                  onDelete={deleteTodo}
                />
              ))}
            </ul>
          )}

        </div>
      </div>
    </div>
  );
}

function EmptyState({ filter }) {
  const messages = {
    all: { icon: '✅', text: 'No tasks yet. Add one above!' },
    active: { icon: '🎉', text: 'No active tasks. You\'re all caught up!' },
    completed: { icon: '📋', text: 'No completed tasks yet.' },
  };
  const { icon, text } = messages[filter];
  return (
    <div className={styles.state}>
      <span className={styles.stateIcon}>{icon}</span>
      <p>{text}</p>
    </div>
  );
}
