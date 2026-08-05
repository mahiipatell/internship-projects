/**
 * Shared line-scanning transaction extractor used by every bank-specific
 * parser. Bank statement text layouts vary, but most Indian bank PDF
 * statements share the same shape once extracted to plain text: a date at
 * the start of a line, a description in the middle, and one or more
 * trailing amount columns (Withdrawal / Deposit / Balance, or a single
 * Amount + Dr/Cr marker).
 *
 * Bank-specific parser files just supply a `config` (extra noise-line
 * patterns to ignore, e.g. that bank's boilerplate header/footer text) and
 * delegate the actual parsing here — so adding a new bank is a small file,
 * not a new extraction engine.
 *
 * IMPORTANT: this is a heuristic, best-effort text parser, not a true
 * table/column parser — real-world statements vary enough that some rows
 * may be missed or need correcting in the Review step, same as any other
 * import source.
 *
 * Output shape matches what parseCsvFile/parseExcelFile already produce
 * ({ headers, rows }), so the exact same detectColumns/normalizeRows/
 * duplicate-detection pipeline used by CSV, Excel, and UPI imports runs
 * unchanged on PDF-derived rows too.
 */

const DATE_PATTERNS = [/^(\d{2}\/\d{2}\/\d{4})/, /^(\d{2}-\d{2}-\d{4})/, /^(\d{2}-[A-Za-z]{3}-\d{2,4})/];

const DEFAULT_NOISE_PATTERNS = [
  /statement of account/i,
  /page \d+ of \d+/i,
  /account number/i,
  /account no/i,
  /ifsc/i,
  /micr/i,
  /opening balance/i,
  /closing balance/i,
  /^date\s+(narration|description|particulars)/i,
  /generated on/i,
  /this is a computer generated/i,
];

function matchDate(line) {
  for (const pattern of DATE_PATTERNS) {
    const match = line.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractAmountTokens(line) {
  return line.match(/[\d,]+\.\d{2}/g) || [];
}

export function extractTransactionsFromText(text, config = {}) {
  const noisePatterns = [...DEFAULT_NOISE_PATTERNS, ...(config.noisePatterns || [])];
  const lines = text
    .split('\n')
    .flatMap((l) => l.split(/(?=\d{2}[/-]\d{2}[/-]\d{2,4})/)) // some PDFs run rows together
    .map((l) => l.trim())
    .filter(Boolean);

  const rows = [];

  for (const line of lines) {
    if (noisePatterns.some((p) => p.test(line))) continue;

    const dateStr = matchDate(line);
    if (!dateStr) continue;

    const amounts = extractAmountTokens(line);
    if (amounts.length === 0) continue;

    const afterDate = line.slice(line.indexOf(dateStr) + dateStr.length).trim();
    const firstAmountIdx = afterDate.search(/[\d,]+\.\d{2}/);
    const description = (firstAmountIdx > 0 ? afterDate.slice(0, firstAmountIdx) : afterDate)
      .replace(/\s{2,}/g, ' ')
      .trim();

    const isCredit = /\b(cr|credit|deposit|received)\b/i.test(line) && !/\b(dr|debit)\b/i.test(line);

    const row = { Date: dateStr, Narration: description || 'Transaction' };

    if (amounts.length >= 2) {
      // Treat the last number as the running balance, and the remaining
      // non-zero one as the transaction amount.
      const txnAmount = amounts.slice(0, -1).find((a) => parseFloat(a.replace(/,/g, '')) > 0) || amounts[0];
      row.Withdrawal = isCredit ? '' : txnAmount;
      row.Deposit = isCredit ? txnAmount : '';
      row.Balance = amounts[amounts.length - 1];
    } else {
      row.Withdrawal = isCredit ? '' : amounts[0];
      row.Deposit = isCredit ? amounts[0] : '';
    }

    rows.push(row);
  }

  return { headers: ['Date', 'Narration', 'Withdrawal', 'Deposit', 'Balance'], rows };
}
