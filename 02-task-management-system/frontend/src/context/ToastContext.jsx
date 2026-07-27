import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);
let _id = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++_id;
    setToasts(p => [...p, { id, message, type, exiting: false }]);
    setTimeout(() => {
      setToasts(p => p.map(t => t.id === id ? { ...t, exiting: true } : t));
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 350);
    }, duration);
  }, []);

  const toast = {
    success: (m, d) => addToast(m, 'success', d),
    error:   (m, d) => addToast(m, 'error', d),
    info:    (m, d) => addToast(m, 'info', d),
    warning: (m, d) => addToast(m, 'warning', d),
  };

  const icons  = { success:'✓', error:'✕', info:'ℹ', warning:'⚠' };
  const colors = {
    success: { bg:'var(--success-dim)', border:'var(--success)', text:'var(--success)' },
    error:   { bg:'var(--error-dim)',   border:'var(--error)',   text:'var(--error)'   },
    info:    { bg:'var(--info-dim)',    border:'var(--info)',    text:'var(--info)'    },
    warning: { bg:'var(--warning-dim)', border:'var(--warning)',text:'var(--warning)' },
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div style={{ position:'fixed',bottom:24,right:24,display:'flex',flexDirection:'column',gap:10,zIndex:9999,pointerEvents:'none' }}>
        {toasts.map(t => {
          const c = colors[t.type] || colors.info;
          return (
            <div key={t.id} style={{
              display:'flex',alignItems:'center',gap:10,
              background:'var(--surface)',
              border:`1px solid ${c.border}`,
              borderLeft:`4px solid ${c.border}`,
              borderRadius:'var(--radius-sm)',
              padding:'12px 16px',minWidth:260,maxWidth:380,
              boxShadow:'var(--shadow-md)',pointerEvents:'all',
              animation: t.exiting ? 'slideOut 0.3s ease forwards' : 'slideIn 0.3s ease forwards',
            }}>
              <span style={{ width:22,height:22,borderRadius:'50%',background:c.bg,color:c.text,display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0 }}>
                {icons[t.type]}
              </span>
              <span style={{ fontSize:13.5,color:'var(--text)',lineHeight:1.4,flex:1 }}>{t.message}</span>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
