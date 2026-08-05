import Select from '../ui/Select';
import Button from '../ui/Button';
import { PDF_BANK_PARSERS } from '../../utils/parsers/pdfParsers/parserFactory';

/**
 * Shown when automatic bank detection on a PDF statement fails. Lets the
 * user manually pick their bank (or a generic fallback) instead of a
 * dead end.
 */
function BankSelector({ value, onChange, onConfirm, onCancel }) {
  return (
    <div className="rounded-2xl border border-olive-900/10 bg-cream p-6 space-y-4">
      <div>
        <h3 className="font-semibold text-olive-900">We couldn't detect your bank</h3>
        <p className="text-sm text-olive-600/70 mt-1">
          Select your bank so we can read your statement correctly.
        </p>
      </div>

      <Select label="Bank" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Generic (try best-effort parsing)</option>
        {PDF_BANK_PARSERS.map((p) => (
          <option key={p.id} value={p.id}>{p.label}</option>
        ))}
      </Select>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel}>Back</Button>
        <Button onClick={onConfirm}>Continue</Button>
      </div>
    </div>
  );
}

export default BankSelector;
