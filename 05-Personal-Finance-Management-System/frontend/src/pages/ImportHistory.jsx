import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Eye, Trash2, RefreshCw, History as HistoryIcon } from 'lucide-react';
import Card from '../components/ui/Card';
import Select from '../components/ui/Select';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import Spinner from '../components/ui/Spinner';
import importHistoryService from '../services/importHistory.service';
import { formatDate } from '../utils/formatDate';
import { IMPORT_FORMATS } from '../components/import/ImportFormatSelector';

const STATUS_STYLES = {
  success: 'bg-income/10 text-income',
  partial: 'bg-primary-100 text-primary-700',
  failed: 'bg-expense/10 text-expense',
};

function typeLabel(type) {
  return IMPORT_FORMATS.find((f) => f.id === type)?.label || type;
}

function ImportHistory() {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewing, setViewing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    importHistoryService
      .getHistory({ search, importType: typeFilter, status: statusFilter, sortBy, sortOrder })
      .then((data) => {
        setRecords(data);
        setLoading(false);
      });
  }, [search, typeFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    load();
  }, [load]);

  const confirmDelete = async () => {
    await importHistoryService.deleteRecord(deleting.id);
    setDeleting(null);
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-olive-900 dark:text-gray-100">Import History</h1>
        <p className="text-sm text-olive-600/70">Every import you've run, with details on what happened.</p>
      </div>

      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-5">
          <div className="relative sm:col-span-2">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-olive-600/40" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by file name..."
              className="w-full rounded-xl border border-olive-900/10 bg-white pl-9 pr-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
            />
          </div>
          <Select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="">All Types</option>
            {IMPORT_FORMATS.map((f) => (
              <option key={f.id} value={f.id}>{f.label}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Statuses</option>
            <option value="success">Success</option>
            <option value="partial">Partial</option>
            <option value="failed">Failed</option>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <Spinner size={28} />
          </div>
        ) : records.length === 0 ? (
          <EmptyState
            emoji="📜"
            title="No imports yet"
            description="Once you import transactions, they'll show up here with full details."
            action={<Button onClick={() => navigate('/import')}>Go to Import Center</Button>}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-olive-600/70 border-b border-olive-900/5">
                  <th
                    className="py-3 font-medium cursor-pointer"
                    onClick={() => { setSortBy('created_at'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  >
                    Date
                  </th>
                  <th
                    className="py-3 font-medium cursor-pointer"
                    onClick={() => { setSortBy('file_name'); setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc'); }}
                  >
                    File Name
                  </th>
                  <th className="py-3 font-medium">Type</th>
                  <th className="py-3 font-medium text-right">Imported</th>
                  <th className="py-3 font-medium text-right">Duplicates</th>
                  <th className="py-3 font-medium">Status</th>
                  <th className="py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-olive-900/5">
                {records.map((r) => (
                  <tr key={r.id}>
                    <td className="py-3 text-olive-600/70 whitespace-nowrap">{formatDate(r.created_at)}</td>
                    <td className="py-3 font-medium text-olive-900 max-w-[200px] truncate">{r.file_name}</td>
                    <td className="py-3 text-olive-600/70">{typeLabel(r.import_type)}</td>
                    <td className="py-3 text-right font-semibold text-income">{r.transactions_imported}</td>
                    <td className="py-3 text-right text-olive-600/70">{r.duplicates_skipped}</td>
                    <td className="py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => setViewing(r)} className="p-1.5 rounded-lg hover:bg-cream text-olive-600">
                          <Eye size={15} />
                        </button>
                        <button onClick={() => navigate('/import')} title="Import Again" className="p-1.5 rounded-lg hover:bg-cream text-olive-600">
                          <RefreshCw size={15} />
                        </button>
                        <button onClick={() => setDeleting(r)} className="p-1.5 rounded-lg hover:bg-expense/10 text-expense">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal isOpen={!!viewing} onClose={() => setViewing(null)} title="Import Details" maxWidth="max-w-lg">
        {viewing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 rounded-xl bg-cream p-4">
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-600 flex items-center justify-center">
                <HistoryIcon size={18} />
              </div>
              <div>
                <p className="font-semibold text-olive-900">{viewing.file_name}</p>
                <p className="text-xs text-olive-600/60">{formatDate(viewing.created_at)} • {typeLabel(viewing.import_type)}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] uppercase text-olive-600/60">Detected Bank</p>
                <p className="font-semibold text-olive-900">{viewing.detected_bank || '—'}</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] uppercase text-olive-600/60">Parser Used</p>
                <p className="font-semibold text-olive-900">{viewing.parser_used || '—'}</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] uppercase text-olive-600/60">Total Rows</p>
                <p className="font-semibold text-olive-900">{viewing.total_rows}</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] uppercase text-olive-600/60">Import Duration</p>
                <p className="font-semibold text-olive-900">
                  {viewing.import_duration_ms ? `${(viewing.import_duration_ms / 1000).toFixed(1)}s` : '—'}
                </p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] uppercase text-olive-600/60">Imported</p>
                <p className="font-semibold text-income">{viewing.transactions_imported}</p>
              </div>
              <div className="rounded-xl bg-cream p-3">
                <p className="text-[11px] uppercase text-olive-600/60">Duplicates Skipped</p>
                <p className="font-semibold text-primary-700">{viewing.duplicates_skipped}</p>
              </div>
              <div className="rounded-xl bg-cream p-3 col-span-2">
                <p className="text-[11px] uppercase text-olive-600/60">Failed Rows</p>
                <p className="font-semibold text-expense">{viewing.failed_rows}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <Modal isOpen={!!deleting} onClose={() => setDeleting(null)} title="Delete Import Record" maxWidth="max-w-sm">
        <p className="text-sm text-olive-700 mb-6">
          Delete this history record for "{deleting?.file_name}"? The transactions it created won't be affected.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setDeleting(null)}>Cancel</Button>
          <Button variant="danger" onClick={confirmDelete}>Delete</Button>
        </div>
      </Modal>
    </div>
  );
}

export default ImportHistory;
