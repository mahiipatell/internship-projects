// Column-header aliases we recognize across common Indian bank/credit-card
// and UPI export (Google Pay/PhonePe/Paytm/BHIM) CSV formats. Adding a new
// source later is usually just adding aliases here.
const COLUMN_ALIASES = {
  date: ['date', 'txn date', 'transaction date', 'value date', 'posting date', 'date & time', 'transaction date & time'],
  description: [
    'narration',
    'description',
    'particulars',
    'transaction remarks',
    'remarks',
    'details',
    'merchant',
    'payee',
    'payer',
    'to / from',
    'to/from',
    'paid to',
    'received from',
    'name',
  ],
  debit: ['debit', 'withdrawal', 'withdrawal amt', 'withdrawal amount', 'dr'],
  credit: ['credit', 'deposit', 'deposit amt', 'deposit amount', 'cr'],
  amount: ['amount', 'txn amount', 'transaction amount'],
  // Single-column "direction" indicators used by most UPI app exports
  // instead of separate debit/credit columns (e.g. "DEBIT"/"CREDIT" or
  // "Paid"/"Received").
  txnType: ['transaction type', 'type', 'txn type', 'debit/credit'],
  reference: ['reference number', 'ref no', 'ref number', 'cheque no', 'chq no', 'upi ref no', 'upi ref number'],
  transactionId: ['transaction id', 'txn id', 'utr', 'utr number', 'order id', 'google transaction id', 'wallet transaction id'],
  balance: ['balance', 'closing balance', 'available balance'],
};

export function normalizeHeader(header) {
  return header.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Maps a CSV's raw headers to our canonical field names. Returns
 * { date: 'Txn Date', debit: 'Withdrawal Amt', ... } — unknown columns are
 * simply left out of the map (and therefore ignored downstream).
 */
export function detectColumns(headers) {
  const map = {};
  const normalized = headers.map((h) => ({ raw: h, normalized: normalizeHeader(h) }));

  Object.entries(COLUMN_ALIASES).forEach(([field, aliases]) => {
    const match = normalized.find((h) => aliases.includes(h.normalized));
    if (match) map[field] = match.raw;
  });

  return map;
}

export function validateColumnMap(columnMap) {
  const hasDate = !!columnMap.date;
  const hasAmountInfo = !!columnMap.amount || !!columnMap.debit || !!columnMap.credit;
  const hasDescription = !!columnMap.description;

  if (!hasDate || !hasAmountInfo) {
    return {
      valid: false,
      message:
        "We couldn't detect the required columns (Date and Amount/Debit/Credit) in this file.",
    };
  }
  if (!hasDescription) {
    return {
      valid: true,
      warning: "No description column detected — imported rows will use a generic title.",
    };
  }
  return { valid: true };
}

// Canonical fields the importer understands, used both internally and by
// the manual column mapper when auto-detection can't find a match.
export const CANONICAL_FIELDS = [
  { key: 'date', label: 'Date', required: true },
  { key: 'description', label: 'Description / Merchant', required: false },
  { key: 'amount', label: 'Amount (single column)', required: false },
  { key: 'debit', label: 'Debit / Withdrawal', required: false },
  { key: 'credit', label: 'Credit / Deposit', required: false },
  { key: 'txnType', label: 'Transaction Type (Debit/Credit label)', required: false },
];

function inferTypeFromLabel(label) {
  if (!label) return null;
  const lower = String(label).toLowerCase();
  if (/(debit|paid|sent|withdraw|dr\b)/.test(lower)) return 'expense';
  if (/(credit|received|deposit|cr\b)/.test(lower)) return 'income';
  return null;
}

function parseAmount(value) {
  if (!value) return 0;
  const cleaned = String(value).replace(/[,₹\s]/g, '');
  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? Math.abs(num) : 0;
}

function parseDate(value) {
  if (!value) return null;
  const trimmed = String(value).trim();

  // Try DD/MM/YYYY or DD-MM-YYYY first (most common in Indian bank exports)
  const dmy = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmy) {
    let [, d, m, y] = dmy;
    if (y.length === 2) y = `20${y}`;
    const iso = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    if (!isNaN(new Date(iso).getTime())) return iso;
  }

  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];

  return null;
}

// Merchant keyword → default category name. Matching is case-insensitive
// substring matching against the transaction description.
const MERCHANT_CATEGORY_MAP = [
  { keywords: ['swiggy', 'zomato'], category: 'Food' },
  { keywords: ['uber', 'ola', 'rapido'], category: 'Travel' },
  { keywords: ['amazon', 'flipkart', 'myntra', 'ajio'], category: 'Shopping' },
  { keywords: ['dmart', 'reliance fresh', 'bigbasket', 'grofers', 'blinkit'], category: 'Groceries' },
  { keywords: ['cult.fit', 'cultfit', 'cult fit'], category: 'Gym & Sports' },
  { keywords: ['decathlon'], category: 'Gym & Sports' },
  { keywords: ['apollo', 'pharmeasy', 'netmeds', 'hospital', 'clinic'], category: 'Medical' },
  { keywords: ['netflix', 'spotify', 'hotstar', 'prime video', 'bookmyshow'], category: 'Entertainment' },
  { keywords: ['salary', 'payroll'], category: 'Salary' },
  { keywords: ['electricity', 'water bill', 'broadband', 'wifi', 'gas bill', 'rent'], category: 'Bills' },
  { keywords: ['school', 'college', 'tuition', 'course', 'udemy', 'coursera'], category: 'Education' },
];

export function suggestCategory(description) {
  if (!description) return 'Other';
  const lower = description.toLowerCase();
  const match = MERCHANT_CATEGORY_MAP.find((entry) =>
    entry.keywords.some((keyword) => lower.includes(keyword))
  );
  return match ? match.category : 'Other';
}

// Default categories are seeded without an `icon` (only custom/allocation
// categories get one) — this fallback lets the Import Summary snapshot
// still show a friendly emoji next to a category or merchant name.
const CATEGORY_EMOJI_FALLBACK = {
  Food: '🍔',
  Groceries: '🛒',
  Bills: '🏠',
  Shopping: '🛍️',
  Travel: '✈️',
  Entertainment: '🎬',
  'Gym & Sports': '💪',
  Education: '📚',
  Medical: '💊',
  Other: '🏷️',
  Salary: '💰',
  Investments: '📈',
};

export function getCategoryEmoji(categoryName, icon) {
  if (icon) return icon;
  return CATEGORY_EMOJI_FALLBACK[categoryName] || '🏷️';
}

/**
 * Transforms raw parsed CSV rows into normalized transaction candidates
 * using the detected column map.
 */
export function normalizeRows(rows, columnMap) {
  return rows
    .map((row, index) => {
      const date = parseDate(row[columnMap.date]);
      const description = columnMap.description
        ? String(row[columnMap.description] || '').trim()
        : 'Imported transaction';

      let type = null;
      let amount = 0;

      if (columnMap.debit || columnMap.credit) {
        const debitVal = parseAmount(row[columnMap.debit]);
        const creditVal = parseAmount(row[columnMap.credit]);
        if (debitVal > 0) {
          type = 'expense';
          amount = debitVal;
        } else if (creditVal > 0) {
          type = 'income';
          amount = creditVal;
        }
      } else if (columnMap.amount) {
        const raw = String(row[columnMap.amount] || '');
        amount = parseAmount(raw);
        if (raw.trim().startsWith('-')) {
          type = 'expense';
        } else if (columnMap.txnType) {
          type = inferTypeFromLabel(row[columnMap.txnType]);
        } else {
          type = null;
        }
      }

      return {
        tempId: `row-${index}`,
        date,
        title: description || 'Imported transaction',
        amount,
        type, // null means "couldn't determine — needs manual selection"
        categoryName: suggestCategory(description),
        reference: columnMap.reference ? row[columnMap.reference] : null,
        include: true,
        isDuplicate: false,
        duplicateAction: 'skip', // 'skip' | 'import'
        isValid: !!date && amount > 0,
      };
    })
    .filter((row) => row.date || row.amount > 0); // drop fully-blank trailing rows
}
