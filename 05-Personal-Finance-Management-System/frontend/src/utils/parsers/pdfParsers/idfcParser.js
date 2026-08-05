import { extractTransactionsFromText } from './baseParser';

export const id = 'idfc';
export const label = 'IDFC FIRST Bank';
export const detectionKeywords = ['idfc first bank', 'idfc bank'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/idfc first bank/i, /value date/i],
  });
}
