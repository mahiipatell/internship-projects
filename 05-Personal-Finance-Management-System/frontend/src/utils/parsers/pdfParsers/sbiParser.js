import { extractTransactionsFromText } from './baseParser';

export const id = 'sbi';
export const label = 'State Bank of India';
export const detectionKeywords = ['state bank of india', 'sbi ', ' sbi'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/state bank of india/i, /account statement/i, /txn date/i],
  });
}
