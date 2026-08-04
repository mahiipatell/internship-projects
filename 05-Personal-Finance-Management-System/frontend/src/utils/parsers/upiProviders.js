import { normalizeHeader } from '../importUtils';

/**
 * UPI export "providers" — each just describes the header fingerprints
 * that identify it. Detection is used only to show a friendly label
 * ("Detected: Google Pay export") and could later drive provider-specific
 * quirks; the actual column mapping still goes through the same
 * detectColumns() pipeline used by every other import type. Adding a new
 * provider is just adding an entry here.
 */
const UPI_PROVIDERS = [
  {
    id: 'googlepay',
    label: 'Google Pay',
    headerHints: ['google transaction id', 'payee', 'payer', 'transaction type'],
  },
  {
    id: 'phonepe',
    label: 'PhonePe',
    headerHints: ['transaction id', 'utr no', 'to / from', 'type'],
  },
  {
    id: 'paytm',
    label: 'Paytm',
    headerHints: ['order id', 'wallet transaction id', 'source', 'status'],
  },
  {
    id: 'bhim',
    label: 'BHIM',
    headerHints: ['upi ref no', 'vpa', 'remarks'],
  },
];

export function detectUpiProvider(headers) {
  const normalized = headers.map((h) => normalizeHeader(h));

  let best = null;
  let bestScore = 0;

  UPI_PROVIDERS.forEach((provider) => {
    const score = provider.headerHints.filter((hint) => normalized.includes(hint)).length;
    if (score > bestScore) {
      bestScore = score;
      best = provider;
    }
  });

  // Require at least 2 matching hints before we're confident enough to
  // label it — otherwise leave it unidentified rather than guess wrong.
  return bestScore >= 2 ? best : null;
}
