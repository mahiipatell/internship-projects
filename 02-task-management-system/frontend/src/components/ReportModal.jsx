import { useState } from 'react';
import { useReportGenerator } from '../hooks/useReportGenerator';
import { useToast } from '../context/ToastContext';
import { PRIORITIES, STATUSES, CATEGORIES } from './Badges';
import styles from './ReportModal.module.css';

export default function ReportModal({ onClose }) {
  const { downloadPDF, downloadCSV } = useReportGenerator();
  const toast = useToast();

  const [loading, setLoading] = useState(false);
  const [format, setFormat]   = useState('pdf');
  const [filters, setFilters] = useState({
    from: '', to: '', status: '', priority: '', category: '',
  });

  const set = (f) => (e) => setFilters(p => ({ ...p, [f]: e.target.value }));

  const handleGenerate = async () => {
    setLoading(true);
    try {
      if (format === 'pdf') {
        await downloadPDF(filters);
        toast.success('Report opened in new tab — use Print to save as PDF');
      } else {
        await downloadCSV(filters);
        toast.success('CSV downloaded successfully');
      }
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const selStyle = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)', padding: '9px 12px',
    color: 'var(--text)', fontSize: 13, fontFamily: 'var(--font-body)',
    outline: 'none', width: '100%', cursor: 'pointer',
  };

  const inputStyle = {
    ...selStyle,
    cursor: 'text',
  };

  const labelStyle = {
    fontSize: 11.5, fontWeight: 500, color: 'var(--muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em',
    display: 'block', marginBottom: 6,
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <div>
            <h2 className={styles.title}>Download Report</h2>
            <p className={styles.subtitle}>Generate a report card of your tasks</p>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.body}>

          {/* Format picker */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Report Format</p>
            <div className={styles.formatRow}>
              <button
                className={`${styles.formatBtn} ${format === 'pdf' ? styles.formatActive : ''}`}
                onClick={() => setFormat('pdf')}
              >
                <span className={styles.formatIcon}>📄</span>
                <span className={styles.formatName}>PDF Report</span>
                <span className={styles.formatDesc}>Full report card with charts, stats, and task list</span>
              </button>
              <button
                className={`${styles.formatBtn} ${format === 'csv' ? styles.formatActive : ''}`}
                onClick={() => setFormat('csv')}
              >
                <span className={styles.formatIcon}>📊</span>
                <span className={styles.formatName}>CSV Spreadsheet</span>
                <span className={styles.formatDesc}>Raw task data, importable into Excel or Sheets</span>
              </button>
            </div>
          </div>

          {/* Date range */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Date Range <span style={{ textTransform:'none', fontWeight:400 }}>(optional — filters by creation date)</span></p>
            <div className={styles.row2}>
              <div>
                <label style={labelStyle}>From</label>
                <input type="date" style={inputStyle} value={filters.from} onChange={set('from')} />
              </div>
              <div>
                <label style={labelStyle}>To</label>
                <input type="date" style={inputStyle} value={filters.to} onChange={set('to')} />
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={styles.section}>
            <p className={styles.sectionLabel}>Filter Tasks <span style={{ textTransform:'none', fontWeight:400 }}>(optional — leave blank for all)</span></p>
            <div className={styles.row3}>
              <div>
                <label style={labelStyle}>Status</label>
                <select style={selStyle} value={filters.status} onChange={set('status')}>
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Priority</label>
                <select style={selStyle} value={filters.priority} onChange={set('priority')}>
                  <option value="">All Priorities</option>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Category</label>
                <select style={selStyle} value={filters.category} onChange={set('category')}>
                  <option value="">All Categories</option>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* PDF info box */}
          {format === 'pdf' && (
            <div className={styles.infoBox}>
              <span style={{ fontSize: 16 }}>💡</span>
              <p>The PDF report will open in a new tab and the print dialog will appear automatically. Choose <strong>"Save as PDF"</strong> as the destination to download it.</p>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
          <button className={styles.generateBtn} onClick={handleGenerate} disabled={loading}>
            {loading
              ? <><span className="spinner" style={{ width: 15, height: 15 }}/> Generating…</>
              : `⬇ Download ${format.toUpperCase()}`}
          </button>
        </div>

      </div>
    </div>
  );
}
