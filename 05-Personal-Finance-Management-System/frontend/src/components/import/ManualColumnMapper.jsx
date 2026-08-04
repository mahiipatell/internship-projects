import { useState } from 'react';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { CANONICAL_FIELDS, validateColumnMap } from '../../utils/importUtils';

/**
 * Shown when automatic column detection can't confidently map a file's
 * headers. Lets the user manually pair each canonical field (Date,
 * Description, Amount, Debit, Credit...) with one of the file's actual
 * column headers.
 */
function ManualColumnMapper({ headers, onConfirm, onCancel }) {
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState('');

  const handleConfirm = () => {
    const columnMap = {};
    Object.entries(mapping).forEach(([field, header]) => {
      if (header) columnMap[field] = header;
    });

    const validation = validateColumnMap(columnMap);
    if (!validation.valid) {
      setError(validation.message);
      return;
    }
    onConfirm(columnMap);
  };

  return (
    <div className="rounded-2xl border border-olive-900/10 bg-cream p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-olive-900">We couldn't auto-detect your columns</h3>
        <p className="text-sm text-olive-600/70 mt-1">
          Match each field below to the matching column in your file.
        </p>
      </div>

      {error && (
        <div className="text-sm text-expense bg-expense/10 rounded-xl px-4 py-2.5">{error}</div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {CANONICAL_FIELDS.map(({ key, label, required }) => (
          <Select
            key={key}
            label={`${label}${required ? ' *' : ''}`}
            value={mapping[key] || ''}
            onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
          >
            <option value="">Not in this file</option>
            {headers.map((h) => (
              <option key={h} value={h}>
                {h}
              </option>
            ))}
          </Select>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>
          Back
        </Button>
        <Button onClick={handleConfirm}>Use This Mapping</Button>
      </div>
    </div>
  );
}

export default ManualColumnMapper;
