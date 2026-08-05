import { extractTransactionsFromText } from './baseParser';

export const id = 'hdfc';
export const label = 'HDFC Bank';
export const detectionKeywords = ['hdfc bank', 'hdfc bank ltd', 'housing development finance'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/hdfc bank limited/i, /statement summary/i, /cheque no/i],
  });
}
