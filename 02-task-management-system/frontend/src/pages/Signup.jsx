import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import styles from './Auth.module.css';

export default function Signup() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name:'', email:'', password:'' });
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw]   = useState(false);

  const set = (f) => (e) => { setForm(p=>({...p,[f]:e.target.value})); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return; }
    setLoading(true); setError('');
    try {
      const res  = await fetch('http://localhost:5000/api/auth/signup', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error||'Signup failed'); return; }
      login(data.user, data.token);
      navigate('/dashboard');
    } catch { setError('Unable to connect. Is the server running?'); }
    finally { setLoading(false); }
  };

  return (
    <div className={styles.page}>
      <div className={styles.glow}/>
      <div className={styles.card}>
        <div className={styles.header}>
          <div className={styles.logo}>⬡</div>
          <h1 className={styles.title}>Create an account</h1>
          <p className={styles.subtitle}>Get started with TaskFlow</p>
        </div>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <label className={styles.label}>Full name</label>
            <input type="text" className={styles.input} placeholder="Arav Sharma" value={form.name} onChange={set('name')} autoComplete="name" required/>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input type="email" className={styles.input} placeholder="you@example.com" value={form.email} onChange={set('email')} autoComplete="email" required/>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Password</label>
            <div className={styles.pwWrap}>
              <input type={showPw?'text':'password'} className={styles.input} placeholder="Min. 6 characters" value={form.password} onChange={set('password')} autoComplete="new-password" required/>
              <button type="button" className={styles.eyeBtn} onClick={()=>setShowPw(p=>!p)}>{showPw?'🙈':'👁'}</button>
            </div>
          </div>
          {error && <div className={styles.error}>⚠ {error}</div>}
          <button type="submit" className={styles.btn} disabled={loading}>
            {loading ? <span className="spinner"/> : 'Create account'}
          </button>
        </form>
        <p className={styles.switch}>Already have an account? <Link to="/login" className={styles.link}>Sign in</Link></p>
      </div>
    </div>
  );
}
