// Format registry — adding a future parser (PDF Statements, Google
// Takeout, Apple Wallet Export, etc.) is just adding an entry here with
// its own `fileAccept`/`parserId`; the wizard UI needs no redesign.
export const IMPORT_FORMATS = [
  {
    id: 'bank-csv',
    label: 'Bank Statement (.csv)',
    emoji: '🏦',
    description: 'Savings or current account CSV export',
    fileAccept: '.csv',
    parserId: 'csv',
  },
  {
    id: 'credit-card-csv',
    label: 'Credit Card Statement (.csv)',
    emoji: '💳',
    description: 'Credit card CSV export',
    fileAccept: '.csv',
    parserId: 'csv',
  },
  {
    id: 'excel',
    label: 'Excel Statement (.xlsx)',
    emoji: '📊',
    description: 'Any bank or card export saved as Excel',
    fileAccept: '.xlsx',
    parserId: 'excel',
  },
  {
    id: 'upi-csv',
    label: 'UPI Export (.csv)',
    emoji: '📱',
    description: 'Exported history from Google Pay, PhonePe, Paytm, or BHIM',
    fileAccept: '.csv',
    parserId: 'upi',
  },
];

function ImportFormatSelector({ selected, onSelect }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {IMPORT_FORMATS.map((format) => {
        const isSelected = selected === format.id;
        return (
          <button
            key={format.id}
            type="button"
            onClick={() => onSelect(format.id)}
            className={`text-left rounded-2xl border p-5 transition-all duration-200
              ${
                isSelected
                  ? 'border-primary-500 bg-primary-50 shadow-soft -translate-y-0.5'
                  : 'border-olive-900/10 bg-white hover:border-primary-300 hover:-translate-y-0.5'
              }`}
          >
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center mb-3 text-lg">
              {format.emoji}
            </div>
            <p className="font-semibold text-sm text-olive-900">{format.label}</p>
            <p className="text-xs text-olive-600/60 mt-0.5">{format.description}</p>
          </button>
        );
      })}
    </div>
  );
}

export default ImportFormatSelector;
