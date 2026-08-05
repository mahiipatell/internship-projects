import { extractTransactionsFromText } from './baseParser';

export const id = 'bob';
export const label = 'Bank of Baroda';
export const detectionKeywords = ['bank of baroda', 'baroda bank'];

export function parse(text) {
  return extractTransactionsFromText(text, {
    noisePatterns: [/bank of baroda/i, /instrument id/i],
  });
}
