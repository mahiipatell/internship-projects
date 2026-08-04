import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import Select from '../ui/Select';
import Input from '../ui/Input';
import { formatCurrency } from '../../utils/formatCurrency';

function StatusBadge({ row }) {
  if (!row.isValid) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-expense bg-expense/10 rounded-full px-2.5 py-1">
        <AlertTriangle size={12} /> Invalid
      </span>
    );
  }
  if (row.isDuplicate) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-700 bg-primary-100 rounded-full px-2.5 py-1">
        <AlertTriangle size={12} /> Duplicate
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-income bg-income/10 rounded-full px-2.5 py-1">
      <CheckCircle2 size={12} /> Ready
    </span>
  );
}

function ImportTransactionTable({ rows, editable, categories, onRowChange }) {
  const update = (tempId, patch) => {
    onRowChange(rows.map((r) => (r.tempId === tempId ? { ...r, ...patch } : r)));
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-olive-900/5">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-olive-600/70 bg-cream border-b border-olive-900/5">
            {editable && <th className="py-3 px-3 font-medium w-8"></th>}
            <th className="py-3 px-3 font-medium">Date</th>
            <th className="py-3 px-3 font-medium">Description</th>
            <th className="py-3 px-3 font-medium text-right">Amount</th>
            <th className="py-3 px-3 font-medium">Type</th>
            <th className="py-3 px-3 font-medium">Category</th>
            <th className="py-3 px-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-olive-900/5 bg-white">
          {rows.map((row) => (
            <tr key={row.tempId} className={!row.include ? 'opacity-40' : ''}>
              {editable && (
                <td className="py-2.5 px-3">
                  <input
                    type="checkbox"
                    checked={row.include}
                    onChange={(e) => update(row.tempId, { include: e.target.checked })}
                    className="rounded border-olive-900/20 text-primary-600 focus:ring-primary-400"
                  />
                </td>
              )}
              <td className="py-2.5 px-3 whitespace-nowrap">
                {editable ? (
                  <Input
                    type="date"
                    value={row.date || ''}
                    onChange={(e) => update(row.tempId, { date: e.target.value })}
                    className="!py-1.5 !text-xs"
                  />
                ) : (
                  row.date || '—'
                )}
              </td>
              <td className="py-2.5 px-3 max-w-[220px] truncate">
                {editable ? (
                  <Input
                    value={row.title}
                    onChange={(e) => update(row.tempId, { title: e.target.value })}
                    className="!py-1.5 !text-xs"
                  />
                ) : (
                  row.title
                )}
              </td>
              <td className="py-2.5 px-3 text-right font-medium whitespace-nowrap">
                {editable ? (
                  <Input
                    type="number"
                    step="0.01"
                    value={row.amount}
                    onChange={(e) => update(row.tempId, { amount: Number(e.target.value) })}
                    className="!py-1.5 !text-xs text-right"
                  />
                ) : (
                  formatCurrency(row.amount)
                )}
              </td>
              <td className="py-2.5 px-3">
                {editable ? (
                  <Select
                    value={row.type || ''}
                    onChange={(e) => update(row.tempId, { type: e.target.value })}
                    className="!py-1.5 !text-xs"
                  >
                    <option value="">Select</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                  </Select>
                ) : (
                  <span className={row.type === 'income' ? 'text-income' : 'text-expense'}>
                    {row.type || 'Unknown'}
                  </span>
                )}
              </td>
              <td className="py-2.5 px-3">
                {editable ? (
                  <Select
                    value={row.categoryName}
                    onChange={(e) => update(row.tempId, { categoryName: e.target.value })}
                    className="!py-1.5 !text-xs"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                    {!categories.some((c) => c.name === row.categoryName) && (
                      <option value={row.categoryName}>{row.categoryName}</option>
                    )}
                  </Select>
                ) : (
                  row.categoryName
                )}
              </td>
              <td className="py-2.5 px-3">
                <div className="flex items-center gap-2">
                  <StatusBadge row={row} />
                  {editable && row.isDuplicate && (
                    <Select
                      value={row.duplicateAction}
                      onChange={(e) => update(row.tempId, { duplicateAction: e.target.value })}
                      className="!py-1.5 !text-xs !w-28"
                    >
                      <option value="skip">Skip</option>
                      <option value="import">Import anyway</option>
                    </Select>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default ImportTransactionTable;
