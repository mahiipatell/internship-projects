import { useAuth } from '../context/AuthContext';

const BASE = 'http://localhost:5000/api/tasks/report';

export function useReportGenerator() {
  const { token } = useAuth();

  const fetchReportData = async (filters) => {
    const params = new URLSearchParams(
      Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null))
    );
    const res  = await fetch(`${BASE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error('Failed to fetch report data');
    return res.json();
  };

  // ── CSV Export ─────────────────────────────────────────────────────────────
  const downloadCSV = async (filters) => {
    const data = await fetchReportData(filters);
    const { tasks, stats, user, generated_at } = data;

    const fmt = (v) => (v == null ? '' : String(v).replace(/,/g, ';').replace(/\n/g, ' '));
    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '';

    const rows = [
      [`TaskFlow Report — ${user.name}`],
      [`Generated: ${new Date(generated_at).toLocaleString('en-IN')}`],
      [`Total: ${stats.total}`, `Completed: ${stats.completed}`, `Pending: ${stats.pending}`, `Overdue: ${stats.overdue}`, `Completion: ${stats.completion_pct}%`],
      [],
      ['#', 'Title', 'Description', 'Priority', 'Status', 'Category', 'Due Date', 'Created'],
      ...tasks.map((t, i) => [
        i + 1,
        fmt(t.title),
        fmt(t.description),
        t.priority,
        t.status,
        t.category,
        fmtDate(t.due_date),
        fmtDate(t.created_at),
      ]),
    ];

    const csv  = rows.map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `taskflow-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── PDF via print window ───────────────────────────────────────────────────
  const downloadPDF = async (filters) => {
    const data = await fetchReportData(filters);
    const { tasks, stats, user, generated_at, filters: appliedFilters } = data;

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—';
    const fmtDateTime = (d) => d ? new Date(d).toLocaleString('en-IN', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '—';

    const priorityColor = { High:'#ff6b6b', Medium:'#fcc419', Low:'#51cf66' };
    const statusColor   = { 'Pending':'#7b7e96', 'In Progress':'#339af0', 'Completed':'#51cf66' };
    const categoryColor = { Work:'#6c63ff', Study:'#339af0', Personal:'#f06595', Shopping:'#fcc419', Others:'#7b7e96' };

    const badge = (text, color) =>
      `<span style="display:inline-block;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:600;color:${color};background:${color}22;border:1px solid ${color}44">${text}</span>`;

    const filterSummary = Object.entries(appliedFilters)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}: <strong>${v}</strong>`)
      .join(' &nbsp;|&nbsp; ');

    const taskRows = tasks.map((t, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9faff' : '#ffffff'}">
        <td style="padding:10px 12px;color:#666;font-size:12px">${i + 1}</td>
        <td style="padding:10px 12px">
          <div style="font-weight:600;font-size:13px;color:#1a1d27;margin-bottom:3px">${t.title}</div>
          ${t.description ? `<div style="font-size:11px;color:#888;line-height:1.4">${t.description.slice(0, 80)}${t.description.length > 80 ? '…' : ''}</div>` : ''}
        </td>
        <td style="padding:10px 12px">${badge(t.priority, priorityColor[t.priority] || '#888')}</td>
        <td style="padding:10px 12px">${badge(t.status, statusColor[t.status] || '#888')}</td>
        <td style="padding:10px 12px">${badge(t.category, categoryColor[t.category] || '#888')}</td>
        <td style="padding:10px 12px;font-size:12px;color:${t.due_date && new Date(t.due_date) < new Date() && t.status !== 'Completed' ? '#ff6b6b' : '#666'}">${fmtDate(t.due_date)}</td>
        <td style="padding:10px 12px;font-size:12px;color:#666">${fmtDate(t.created_at)}</td>
      </tr>
    `).join('');

    const byPriorityBars = Object.entries(stats.by_priority).map(([p, count]) => {
      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600;color:${priorityColor[p]}">${p}</span>
            <span style="font-size:12px;color:#666">${count} (${pct}%)</span>
          </div>
          <div style="background:#eee;border-radius:100px;height:7px">
            <div style="background:${priorityColor[p]};width:${pct}%;height:7px;border-radius:100px"></div>
          </div>
        </div>`;
    }).join('');

    const byCategoryBars = Object.entries(stats.by_category).map(([c, count]) => {
      const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
      return `
        <div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px">
            <span style="font-size:12px;font-weight:600;color:${categoryColor[c]}">${c}</span>
            <span style="font-size:12px;color:#666">${count} (${pct}%)</span>
          </div>
          <div style="background:#eee;border-radius:100px;height:7px">
            <div style="background:${categoryColor[c]};width:${pct}%;height:7px;border-radius:100px"></div>
          </div>
        </div>`;
    }).join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>TaskFlow Report — ${user.name}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; color: #1a1d27; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      .no-print { display: none; }
      .page-break { page-break-before: always; }
    }
    .page { max-width: 900px; margin: 0 auto; padding: 40px 48px; }
  </style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div style="display:flex;align-items:center;justify-content:space-between;padding-bottom:24px;border-bottom:3px solid #6c63ff;margin-bottom:32px">
    <div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px">
        <span style="font-size:28px;color:#6c63ff">⬡</span>
        <span style="font-family:'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:700;color:#1a1d27;letter-spacing:-0.5px">TaskFlow</span>
      </div>
      <p style="font-size:13px;color:#888">Task Management Report Card</p>
    </div>
    <div style="text-align:right">
      <p style="font-size:15px;font-weight:600;color:#1a1d27">${user.name}</p>
      <p style="font-size:12px;color:#888;margin-top:2px">${user.email}</p>
      <p style="font-size:11px;color:#aaa;margin-top:4px">Generated: ${fmtDateTime(generated_at)}</p>
    </div>
  </div>

  ${filterSummary ? `<div style="background:#f5f4ff;border:1px solid #d4d0ff;border-radius:8px;padding:10px 16px;margin-bottom:24px;font-size:12px;color:#555">Filters applied: ${filterSummary}</div>` : ''}

  <!-- Summary stats -->
  <h2 style="font-size:16px;font-weight:700;color:#1a1d27;margin-bottom:16px">Summary</h2>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:12px;margin-bottom:32px">
    ${[
      { label:'Total Tasks',    value:stats.total,          color:'#6c63ff' },
      { label:'Completed',      value:stats.completed,      color:'#51cf66' },
      { label:'In Progress',    value:stats.in_progress,    color:'#339af0' },
      { label:'Pending',        value:stats.pending,        color:'#7b7e96' },
      { label:'Overdue',        value:stats.overdue,        color:'#ff6b6b' },
    ].map(s => `
      <div style="background:#f9faff;border:1px solid #e8e9f0;border-radius:10px;padding:14px 12px;text-align:center">
        <div style="font-size:26px;font-weight:700;color:${s.color};margin-bottom:4px">${s.value}</div>
        <div style="font-size:11px;color:#888;font-weight:500">${s.label}</div>
      </div>`).join('')}
  </div>

  <!-- Completion bar -->
  <div style="background:#f9faff;border:1px solid #e8e9f0;border-radius:10px;padding:18px 20px;margin-bottom:32px">
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
      <span style="font-size:13px;font-weight:600;color:#1a1d27">Overall Completion Rate</span>
      <span style="font-size:20px;font-weight:700;color:#6c63ff">${stats.completion_pct}%</span>
    </div>
    <div style="background:#e0e0e0;border-radius:100px;height:10px">
      <div style="background:linear-gradient(90deg,#6c63ff,#a78bfa);width:${stats.completion_pct}%;height:10px;border-radius:100px;min-width:${stats.completion_pct > 0 ? '6px' : '0'}"></div>
    </div>
    <p style="font-size:11px;color:#aaa;margin-top:8px">${stats.completed} of ${stats.total} tasks completed</p>
  </div>

  <!-- Breakdown charts -->
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:32px">
    <div style="background:#f9faff;border:1px solid #e8e9f0;border-radius:10px;padding:18px 20px">
      <h3 style="font-size:13px;font-weight:700;color:#1a1d27;margin-bottom:16px">By Priority</h3>
      ${byPriorityBars}
    </div>
    <div style="background:#f9faff;border:1px solid #e8e9f0;border-radius:10px;padding:18px 20px">
      <h3 style="font-size:13px;font-weight:700;color:#1a1d27;margin-bottom:16px">By Category</h3>
      ${byCategoryBars}
    </div>
  </div>

  <!-- Task list -->
  <div class="page-break">
    <h2 style="font-size:16px;font-weight:700;color:#1a1d27;margin-bottom:16px">
      All Tasks <span style="font-size:13px;font-weight:400;color:#888">(${tasks.length} total)</span>
    </h2>
    ${tasks.length === 0 ? '<p style="color:#888;font-size:13px;padding:20px 0">No tasks found for the selected filters.</p>' : `
    <table style="width:100%;border-collapse:collapse;border:1px solid #e8e9f0;border-radius:10px;overflow:hidden">
      <thead>
        <tr style="background:#6c63ff">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;white-space:nowrap">#</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff">Task</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff">Priority</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff">Status</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff">Category</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;white-space:nowrap">Due Date</th>
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#fff;white-space:nowrap">Created</th>
        </tr>
      </thead>
      <tbody>${taskRows}</tbody>
    </table>`}
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e8e9f0;display:flex;justify-content:space-between;align-items:center">
    <span style="font-size:11px;color:#aaa">⬡ TaskFlow — Task Management System</span>
    <span style="font-size:11px;color:#aaa">${fmtDateTime(generated_at)}</span>
  </div>

</div>

<script>
  window.onload = function() { window.print(); };
</script>
</body>
</html>`;

    const win = window.open('', '_blank');
    win.document.write(html);
    win.document.close();
  };

  return { downloadPDF, downloadCSV };
}
