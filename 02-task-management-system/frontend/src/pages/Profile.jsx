import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AppLayout from '../components/AppLayout';
import styles from './Profile.module.css';

const COLORS = ['#6c63ff','#e05c97','#f59e0b','#10b981','#3b82f6','#ef4444','#8b5cf6','#06b6d4'];

export default function Profile() {
  const { user, token, updateUser } = useAuth();
  const toast = useToast();

  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({ name:'', bio:'', phone:'', location:'', avatar_color:'#6c63ff' });

  const [showPw,       setShowPw]       = useState(false);
  const [pwSaving,     setPwSaving]     = useState(false);
  const [showCurrent,  setShowCurrent]  = useState(false);
  const [showNew,      setShowNew]      = useState(false);
  const [pwForm, setPwForm] = useState({ currentPassword:'', newPassword:'', confirmPassword:'' });

  useEffect(() => {
    if (user) setForm({ name:user.name||'', bio:user.bio||'', phone:user.phone||'', location:user.location||'', avatar_color:user.avatar_color||'#6c63ff' });
  }, [user]);

  const hdrs = { 'Content-Type':'application/json', Authorization:`Bearer ${token}` };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name cannot be empty'); return; }
    setSaving(true);
    try {
      const res  = await fetch('http://localhost:5000/api/users/profile', { method:'PATCH', headers:hdrs, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error||'Failed to save'); return; }
      updateUser(data.user);
      toast.success('Profile updated successfully');
      setEditing(false);
    } catch { toast.error('Unable to connect to server'); }
    finally { setSaving(false); }
  };

  const handleCancelEdit = () => {
    setForm({ name:user.name||'', bio:user.bio||'', phone:user.phone||'', location:user.location||'', avatar_color:user.avatar_color||'#6c63ff' });
    setEditing(false);
  };

  const handleChangePw = async () => {
    if (!pwForm.currentPassword||!pwForm.newPassword||!pwForm.confirmPassword) { toast.error('All fields required'); return; }
    if (pwForm.newPassword.length < 6) { toast.error('Min 6 characters'); return; }
    if (pwForm.newPassword !== pwForm.confirmPassword) { toast.error('Passwords do not match'); return; }
    setPwSaving(true);
    try {
      const res  = await fetch('http://localhost:5000/api/users/change-password', { method:'PATCH', headers:hdrs, body:JSON.stringify({ currentPassword:pwForm.currentPassword, newPassword:pwForm.newPassword }) });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error||'Failed'); return; }
      toast.success('Password changed successfully');
      setPwForm({ currentPassword:'', newPassword:'', confirmPassword:'' });
      setShowPw(false);
    } catch { toast.error('Unable to connect to server'); }
    finally { setPwSaving(false); }
  };

  const initials     = user?.name ? user.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2) : '?';
  const memberSince  = user?.created_at ? new Date(user.created_at).toLocaleDateString('en-IN',{year:'numeric',month:'long',day:'numeric'}) : '—';
  const taskStats    = user?.task_stats;
  const displayColor = editing ? form.avatar_color : (user?.avatar_color||'#6c63ff');

  return (
    <AppLayout>
      <div className={styles.page}>
        <div className={styles.container}>
          <div className={styles.pageHeader}>
            <h1 className={styles.pageTitle}>Profile</h1>
            <p className={styles.pageSub}>Manage your account and security settings</p>
          </div>

          <div className={styles.grid}>
            {/* LEFT */}
            <div className={styles.leftCol}>

              {/* Avatar card */}
              <div className={styles.card}>
                <div className={styles.avatarRow}>
                  <div className={styles.avatarBig} style={{ background:displayColor }}>{initials}</div>
                  <div>
                    <p className={styles.userName}>{user?.name}</p>
                    <p className={styles.userEmail}>{user?.email}</p>
                    <p className={styles.memberSince}>Since {memberSince}</p>
                  </div>
                </div>
                {editing && (
                  <div className={styles.colorSection}>
                    <p className={styles.label}>Avatar color</p>
                    <div className={styles.colorGrid}>
                      {COLORS.map(color => (
                        <button key={color}
                          className={`${styles.swatch} ${form.avatar_color===color?styles.swatchActive:''}`}
                          style={{ background:color }}
                          onClick={() => setForm(f=>({...f,avatar_color:color}))}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats card */}
              {taskStats && (
                <div className={styles.card}>
                  <h3 className={styles.cardTitle}>Productivity</h3>
                  <div className={styles.statsGrid}>
                    <StatBox label="Tasks Created"  value={taskStats.total_tasks}      color="var(--accent)"  />
                    <StatBox label="Completed"      value={taskStats.completed_tasks}  color="var(--success)" />
                    <StatBox label="Pending"        value={taskStats.pending_tasks}    color="var(--warning)" />
                    <StatBox label="Productivity"   value={`${taskStats.productivity_pct}%`} color="var(--info)" />
                  </div>
                  <div>
                    <div className={styles.barLabel}>
                      <span className={styles.label}>Completion rate</span>
                      <span style={{fontSize:13,fontWeight:600,color:'var(--accent)'}}>{taskStats.productivity_pct}%</span>
                    </div>
                    <div className={styles.barTrack}>
                      <div className={styles.barFill} style={{width:`${taskStats.productivity_pct}%`}}/>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* RIGHT */}
            <div className={styles.rightCol}>

              {/* Account details */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <h3 className={styles.cardTitle}>Account Details</h3>
                  {!editing
                    ? <button className={styles.editBtn} onClick={()=>setEditing(true)}>Edit Profile</button>
                    : <div style={{display:'flex',gap:8}}>
                        <button className={styles.cancelBtn} onClick={handleCancelEdit}>Cancel</button>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
                          {saving ? <span className="spinner"/> : 'Save Changes'}
                        </button>
                      </div>
                  }
                </div>
                <div className={styles.fields}>
                  <Field label="Full Name"     value={editing?form.name:user?.name}         editing={editing} onChange={v=>setForm(f=>({...f,name:v}))}     placeholder="Your full name"/>
                  <Field label="Email Address" value={user?.email}                           editing={false}   hint="Cannot be changed"/>
                  <Field label="Bio"           value={editing?form.bio:user?.bio}            editing={editing} onChange={v=>setForm(f=>({...f,bio:v}))}      placeholder="A short bio…" multiline/>
                  <div className={styles.row2}>
                    <Field label="Phone"    value={editing?form.phone:user?.phone}       editing={editing} onChange={v=>setForm(f=>({...f,phone:v}))}    placeholder="+91 98765 43210"/>
                    <Field label="Location" value={editing?form.location:user?.location} editing={editing} onChange={v=>setForm(f=>({...f,location:v}))} placeholder="City, Country"/>
                  </div>
                </div>
              </div>

              {/* Security */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <h3 className={styles.cardTitle}>Security</h3>
                    {!showPw && <p className={styles.secHint}>Keep your account secure with a strong password.</p>}
                  </div>
                  <button className={styles.editBtn} onClick={()=>{ setShowPw(p=>!p); setPwForm({currentPassword:'',newPassword:'',confirmPassword:''}); }}>
                    {showPw ? 'Cancel' : 'Change Password'}
                  </button>
                </div>
                {showPw && (
                  <div className={styles.fields}>
                    <PwField label="Current Password" value={pwForm.currentPassword} show={showCurrent} onToggle={()=>setShowCurrent(p=>!p)} onChange={v=>setPwForm(f=>({...f,currentPassword:v}))}/>
                    <PwField label="New Password"     value={pwForm.newPassword}     show={showNew}     onToggle={()=>setShowNew(p=>!p)}     onChange={v=>setPwForm(f=>({...f,newPassword:v}))} placeholder="Min. 6 characters"/>
                    <div className={styles.field}>
                      <span className={styles.label}>Confirm New Password</span>
                      <input type="password" className={styles.input} placeholder="Repeat new password"
                        value={pwForm.confirmPassword} onChange={e=>setPwForm(f=>({...f,confirmPassword:e.target.value}))}/>
                    </div>
                    <div style={{display:'flex',justifyContent:'flex-end'}}>
                      <button className={styles.saveBtn} onClick={handleChangePw} disabled={pwSaving}>
                        {pwSaving ? <span className="spinner"/> : 'Update Password'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatBox({ label, value, color }) {
  return (
    <div style={{background:'var(--bg)',border:'1px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'14px 16px',textAlign:'center'}}>
      <p style={{fontFamily:'var(--font-display)',fontSize:22,fontWeight:700,color,marginBottom:3}}>{value}</p>
      <p style={{fontSize:11.5,color:'var(--muted)',fontWeight:500}}>{label}</p>
    </div>
  );
}

function Field({ label, value, editing, onChange, placeholder, multiline, hint }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}{hint && <span style={{textTransform:'none',fontWeight:400,fontStyle:'italic',letterSpacing:0}}> · {hint}</span>}</span>
      {editing && onChange
        ? multiline
          ? <textarea className={`${styles.input} ${styles.textarea}`} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={3}/>
          : <input type="text" className={styles.input} value={value||''} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
        : <span className={`${styles.fieldVal} ${!value?styles.fieldEmpty:''}`}>{value||'—'}</span>
      }
    </div>
  );
}

function PwField({ label, value, show, onToggle, onChange, placeholder='••••••••' }) {
  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.pwWrap}>
        <input type={show?'text':'password'} className={styles.input} placeholder={placeholder}
          value={value} onChange={e=>onChange(e.target.value)} style={{paddingRight:44}}/>
        <button type="button" className={styles.eyeBtn} onClick={onToggle}>{show?'🙈':'👁'}</button>
      </div>
    </div>
  );
}
